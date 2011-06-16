/**
 * @source https://github.com/Gozala/jetpack-protocol/blob/master/lib/protocol.js
 */

'use strict'

const { Cc, Ci, Cu, Cm } = require("chrome")
  ,   { MatchPattern } = require('match-pattern')
  ,   { Trait } = require("light-traits")
  ,   xpcom = require("xpcom")

  ,   { XPCOMUtils } = Cu.import("resource://gre/modules/XPCOMUtils.jsm")

  ,   IOService = Cc["@mozilla.org/network/io-service;1"].
                  getService(Ci.nsIIOService)
  ,   uuidGenerator = Cc["@mozilla.org/uuid-generator;1"].
                      getService(Ci.nsIUUIDGenerator)
  ,   streamChannel = Cc["@mozilla.org/network/input-stream-channel;1"]
  ,   inputStream = Cc["@mozilla.org/io/string-input-stream;1"]
  ,   SimpleURI = Cc["@mozilla.org/network/simple-uri;1"]
  ,   securityManager = Cc["@mozilla.org/scriptsecuritymanager;1"].
                        getService(Ci.nsIScriptSecurityManager)


function identity(value) value

const TXPCOM = Trait.compose(
  Trait({
    interfaces: Trait.required,
    contractID: Trait.required,
  }),
  {
    QueryInterface: { get: function QueryInterface() {
      Object.defineProperty(this, 'QueryInterface', {
        value: XPCOMUtils.generateQI(this.interfaces),
        configurable: false
      })
      return this.QueryInterface
    }, configurable: true },
    classID: { get: function classID() {
      Object.defineProperty(this, 'classID', {
        value: uuidGenerator.generateUUID(),
        configurable: false
      })
      return this.classID
    }, configurable: true },
    classDescription: { get: function classDescription() {
      Object.defineProperty(this, 'classDescription', {
        value: this.description || "Jetpack generated class",
        configurable: false
      })
      return this.classDescription
    }, configurable: true }
  }
)

/**
 * Function takes `handler` object implementing a protocol, and `uri` from
 * that protocol, performs request operation on handler and returns `response`
 * object that contains `channel` of the requested `uri`.
 * @param {Object} handler
 *    Protocol handler
 * @param {nsIURI|String} uri
 *    Requested URI
 * @param {nsIURI} [baseURI]
 *    Base URI. Necessary when given `uri` is relative.
 */
function request(handler, uri, baseURI, charset) {
  // Creating `request` and `response` objects that are passed to a `handler`'s
  // `onRequest` method. Also note that `response` object inherits from
  // `request`, this way `response`'s properties will fall back to the
  // `request`'s same named properties.
  let channel, request = {}, response = Object.create(request)
  // If `baseURI` is provided then given `uri` is relative to it, there for
  // we set `referer` property on request to allow protocol handler to resolve
  // absolute URI.
  if (baseURI) request.referer = baseURI.spec
  // Stringifying `uri` to a string and setting it as property on `request`.
  request.uri = request.originalURI = uri.spec || uri

  handler.onRequest(request, response)

  // If response contains `content` property it's not a simple redirect. In
  // this case we create channel from the given content.
  if (response.content) {
    // Creating input stream out of the `response.content` and then creating
    // `channel` with that content stream.
    let stream = inputStream.createInstance(Ci.nsIStringInputStream)
    let content = response.content
    stream.setData(content, response.contentLength || content.length)
    channel = streamChannel.createInstance(Ci.nsIInputStreamChannel)
    channel.contentStream = stream
    channel.QueryInterface(Ci.nsIChannel)
    // If `uri.spec` is different form `response.uri` it means that either
    // `request` was just redirected to a different uri from the existing
    // protocol or given `uri` was string, in both cases we need to create
    // `uri` that is `nsIURI` since it has to be set on the `channel`.
    if (uri.spec !== response.uri) {
      uri = SimpleURI.createInstance(Ci.nsIURI)
      uri.spec = response.uri
    }
    // Setting response URI on the channel.
    channel.setURI(uri)
  }
  // Otherwise it's a redirect to an URI from the existing protocol, in such
  // case we just use `nsIIOService` to create `channel` straight out of
  // `response.uri`
  else {
    if (response.uri !== request.uri)
      uri = IOService.newURI(response.uri, null, null)
    channel = IOService.newChannel(response.uri, null, null)
  }


  // Also setting `contentType` and `contentLength` if they were provided to the
  // response.
  if (response.contentType)
    channel.contentType = response.contentType
  if (response.contentLength)
    channel.contentLength = response.contentLength

  return Object.create(response, {
    channel: { value: channel },
    uri: { value: uri }
  })
}

const THandler = Trait({
  onRequest: Trait.required,
  listen: function listen(options) {
    let handler
    if (options.about) {
      handler = Object.create(this, { about: { value: options.about } })
      handler = TAboutHandler.create(handler)
    } else {
      handler = Object.create(this, { scheme: { value: options.scheme } })
      handler = TProtocolHandler.create(handler)
    }

    xpcom.register({
      uuid: handler.classID,
      name: handler.classDescription,
      contractID: handler.contractID,
      create: identity.bind(null, handler)
    })
  }
})

const TAboutHandler = Trait.compose(
  TXPCOM,
  Trait({
    about: Trait.required,
    onRequest: Trait.required,
    interfaces: [ Ci.nsIAboutModule ],
    get description() {
      return 'Protocol handler for "about:' + this.about + '"'
    },
    get contractID() {
      return "@mozilla.org/network/protocol/about;1?what=" + this.about
    },
    getURIFlags: function(uri) {
      return Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT
    },
    newChannel: function(uri) {
      return request(this, uri).channel
    }
  })
)

const TProtocolHandler = Trait.compose(
  TXPCOM,
  Trait({
    scheme: Trait.required,
    onRequest: Trait.required,
    interfaces: [ Ci.nsIProtocolHandler ],
    // For more information on what these flags mean,
    // see caps/src/nsScriptSecurityManager.cpp.
    protocolFlags:  Ci.nsIProtocolHandler.URI_IS_UI_RESOURCE |
                    Ci.nsIProtocolHandler.URI_STD |
                    Ci.nsIProtocolHandler.URI_DANGEROUS_TO_LOAD,
    defaultPort: -1,
    allowPort: function allowPort(port, scheme) false,
    newURI: function newURI(relativeURI, charset, baseURI) {
      let response = request(this, relativeURI, baseURI, charset)
      // If handler have not redirected to another protocol we know that
      // `newChannel` method will be called later so we save response so that
      // it will be able to use it and then delete it.
      if (response.uri.scheme == this.scheme)
        (this.responses || (this.responses = {}))[response.uri.spec] = response

      return response.uri
    },
    newChannel: function newChannel(uri) {
      // Taking response for this request (`newURI` saved it) from the responses
      // map and removing it after, since we don't need memory leaks.
      let response = this.responses[uri.spec]
      let channel = response.channel
      delete this.responses[uri.spec]
      // If `originalURI` of the response is different from the `uri` either
      // it means that handler just maps `originalURI`. In such case we set
      // owner of the channel to the same principal as `originalURI` has in
      // order to allow access to the other mapped resources.
      if (response.originalURI !== response.uri) {
        let originalURI = IOService.newURI(response.originalURI, null, null)
        channel.originalURI = originalURI
        channel.owner = securityManager.getCodebasePrincipal(originalURI)
      }
      return channel
    },
    get contractID() {
      return "@mozilla.org/network/protocol;1?name=" + this.scheme
    },
    get description() {
      return 'Protocol handler for "' + this.scheme + ':*"'
    }
  })
)

exports.Handler = function Handler(options) {
  return THandler.create(options)
}
