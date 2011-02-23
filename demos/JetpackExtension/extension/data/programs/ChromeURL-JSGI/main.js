
module.declare(["pinf/protocol-handler"], function(require, exports, module)
{
    var PROTOCOL_HANDLER = require("pinf/protocol-handler");

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
    }
});
