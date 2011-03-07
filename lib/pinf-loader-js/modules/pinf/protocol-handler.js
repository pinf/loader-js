
var PROTOCOL;
if (typeof __require__ != "undefined")
    PROTOCOL = __require__("platform/" + __require__.platform + "/protocol");
else
    PROTOCOL = require("../../platform/" + require.platform + "/protocol");


/**
 * @see http://wiki.commonjs.org/wiki/JSGI/Level0/A/Draft2
 * @see http://mail.python.org/pipermail/web-sig/2007-January/002475.html
 * @see http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
 */
var JSGI = exports.JSGI = function(options)
{
    // TODO: Ensure only one protocol handler per scheme

    var protocolHandler = PROTOCOL.Handler(
    {
        onRequest: function(upstreamRequest, upstreamResponse)
        {
            try {
                // jedi://hostname:80/path/to/file.ext?query=string&another=one
                var uriParts = upstreamRequest.uri.match(/^([^:]*):\/\/(([^\/:]*)(:([^\/]*))?)((\/[^\?]*)(\?(.*))?)?$/);
                // uriParts[0] - jedi://hostname/path/to/file.ext?query=string&another=one
                // uriParts[1] - jedi
                // uriParts[2] - hostname:80
                // uriParts[3] - hostname
                // uriParts[4] - :80
                // uriParts[5] - 80
                // uriParts[6] - /path/to/file.ext?query=string&another=one
                // uriParts[7] - /path/to/file.ext
                // uriParts[8] - ?query=string&another=one
                // uriParts[9] - query=string&another=one
                if (!uriParts)
                    throw new Error("Could not parse URI '" + upstreamRequest.uri + "'!");

                var request = {
                    method: "GET",
                    scriptName: "",
                    pathInfo: uriParts[7],
                    queryString: uriParts[9] || "",
                    host: uriParts[3],
                    port: uriParts[5] || 80,
                    scheme: uriParts[1],
                    input: null,
                    headers: {},
                    jsgi: {
                        version: [0,3],
                        errors: void 0,
                        multithread: true,  // ?
                        multiprocess: true, // ?
                        runOnce: false,
                        cgi: false,
                        ext: {}
                    },
                    env: {}
                };

                var response = options.app(request);

                if (!response)
                    throw new Error("Empty response object!");
                if (typeof response != "object")
                    throw new Error("Response is not an object!");
                if (typeof response.status == "undefined")
                    throw new Error("Response object does not contain a 'status' property!");
                if (typeof response.headers == "undefined")
                    throw new Error("Response object does not contain a 'headers' property!");
                if (typeof response.headers != "object")
                    throw new Error("'headers' property in response object is not an object!");
                if (typeof response.body == "undefined")
                    throw new Error("Response object does not contain a 'body' property!");

                var contentType,
                    contentLength;
                
                for (var name in response.headers)
                {
                    name = name.toLowerCase();
                    if (name == "status")
                        throw new Error("'status' response header not allowed! Use the 'status' response property.");
                    if (name.charAt(name.length-1) == "-" || name.charAt(name.length-1) == "_")
                        throw new Error("Response header names may not end in '-' or '_'!");
                    // TODO: It MUST contain keys that consist of letters, digits, `_` or `-` and start with a letter.
                    //       Header values MUST NOT contain characters below 037.
                    if (name == "content-type")
                        contentType = response.headers[name];
                    if (name == "content-length")
                        contentLength = response.headers[name];
                }

                // Informational 1xx
                if (response.status >= 100 && response.status <= 199)
                {
                    if (typeof contentType != "undefined")
                        throw new Error("'content-type' response header not allowed when status is: " + response.status);
                    if (typeof contentType == "undefined")
                        throw new Error("'content-type' response header not set!");
                    if (typeof contentLength != "undefined")
                        throw new Error("'content-length' response header not allowed when status is: " + response.status);
//                    if (typeof contentLength == "undefined")
//                        throw new Error("'content-length' response header not set!");
                }
                else
                // Successful 2xx
                if (response.status >= 200 && response.status <= 299)
                {
                    if (typeof contentType != "undefined" && response.status == 204)
                        throw new Error("'content-type' response header not allowed when status is: " + response.status);
                    if (typeof contentType == "undefined")
                        throw new Error("'content-type' response header not set!");
                    if (typeof contentLength != "undefined" && response.status == 204)
                        throw new Error("'content-length' response header not allowed when status is: " + response.status);
//                    if (typeof contentLength == "undefined")
//                        throw new Error("'content-length' response header not set!");
                    
                }
                else
                // Redirection 3xx
                if (response.status >= 300 && response.status <= 399)
                {
                    if (typeof contentType != "undefined" && response.status == 304)
                        throw new Error("'content-type' response header not allowed when status is: " + response.status);
                    if (typeof contentType == "undefined")
                        throw new Error("'content-type' response header not set!");
                    if (typeof contentLength != "undefined" && response.status == 304)
                        throw new Error("'content-length' response header not allowed when status is: " + response.status);
//                    if (typeof contentLength == "undefined")
//                        throw new Error("'content-length' response header not set!");
                    
                }
                else
                // Client Error 4xx
                if (response.status >= 400 && response.status <= 499)
                {
                    if (typeof contentType == "undefined")
                        throw new Error("'content-type' response header not set!");
//                    if (typeof contentLength == "undefined")
//                        throw new Error("'content-length' response header not set!");
                    
                }
                else
                // Server Error 5xx
                if (response.status >= 500 && response.status <= 599)
                {
                    if (typeof contentType == "undefined")
                        throw new Error("'content-type' response header not set!");
//                    if (typeof contentLength == "undefined")
//                        throw new Error("'content-length' response header not set!");
                    
                }
                else
                    throw new Error("Status code '" + response.status + "' must be between 1xx and 5xx.");


                upstreamResponse.contentType = contentType;
                upstreamResponse.content = [];

                if (typeof response.body == "object" && typeof response.body.forEach != "undefined")
                {
                    response.body.forEach(function(str)
                    {
                        upstreamResponse.content.push(str);
                    });
                }
                else
                if (Array.isArray(response.body))
                {
                    upstreamResponse.content = response.body;
                }
                else
                    throw new Error("'body' property in response object not a forEach()able object nor array!");

                upstreamResponse.content = upstreamResponse.content.join("");
            }
            catch(e)
            {
                upstreamResponse.content = "[Internal Error] " + e.message + "\n\n" + e.stack;
                upstreamResponse.contentType = 'text/plain';
                return;
            }
        }
    });

    protocolHandler.listen({
        scheme: options.scheme
    });
}
