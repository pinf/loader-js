
var PROTOCOL_HANDLER = require("pinf/protocol-handler");

var LOADER = require("pinf/loader");

var Cc = require("jetpack/chrome").Cc;
var Ci = require("jetpack/chrome").Ci;

var IO_SERVICE = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
var RESOURCE_PROTOCOL = IO_SERVICE.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);

var OBSERVER_SERVICE = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);

var UNLOAD = require("jetpack/unload");
var URL = require("jetpack/url");
var SELF = require("jetpack/self");


function MozFile(path) {
    var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
    file.initWithPath(path);
    return file;
}

exports.main = function()
{
    module.print("Hello World from ChromeURL-JSGI!\n");
    module.print("Try browsing to: " + "jedi://hostname:80/path/to/file.ext?var1=val1&another=one" + "\n");

    var jsgiHandler = new PROTOCOL_HANDLER.JSGI(
    {
        scheme: "jedi",
        app: function(request)
        {
            var html = [];
            for (var key in request)
                html.push(key + ": " + request[key] + "\n");

            return {
                status: 200,
                headers: {
                    "content-type": "text/plain"
                },
                body: html
            };
        }
    });

    RESOURCE_PROTOCOL.setSubstitution("test-i-files", IO_SERVICE.newURI("jar:" + IO_SERVICE.newFileURI(MozFile(URL.toFilename(SELF.data.url("files.jar")))).spec + "!/", null, null));      

    module.print("Try browsing to: " + "resource://test-i-files/files/firefox-32.png" + "\n");

    UNLOAD.when(function()
    {
        RESOURCE_PROTOCOL.setSubstitution("test-i-files", null);

        OBSERVER_SERVICE.notifyObservers(MozFile(URL.toFilename(SELF.data.url("files.jar"))), "flush-cache-entry", null);
    });
}
