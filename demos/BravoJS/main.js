
module.declare(["paperboy/paperboy", "nodejs/path", "nodejs/http", "pinf/loader"], function(require, exports, module)
{    
    var PAPERBOY = require("paperboy/paperboy"),
        PATH = require("nodejs/path"),
        HTTP = require("nodejs/http"),
        PINF_LOADER = require("pinf/loader");

    // Config options

    var port = 8003,
        docroot = PATH.dirname(PATH.dirname(PATH.dirname(module.id))) + "/lib/bravojs";

    exports.main = function()
    {
        if (!PINF_LOADER.mustTerminate())
        {
            module.print("Starting node-paperboy at 'http://localhost:" + port + "/' for: " + docroot + "\n");

            module.print("To run BravoJS demos browse to: http://localhost:" + port + "/demos/\n");

            HTTP.createServer(function(request, response)
            {
                var ip = request.connection.remoteAddress;
      
                PAPERBOY
                    .deliver(docroot, request, response)
                    .addHeader("Expires", 300)
                    .addHeader("X-PaperRoute", "Node")
                    .after(function(statusCode)
                    {
                        log(statusCode, request.url, ip);
                    })
                    .error(function(statusCode, msg)
                    {
                        response.writeHead(statusCode, {"Content-Type": "text/plain"});
                        response.end("Error " + statCode);
                        log(statCode, request.url, ip, msg);
                    })
                    .otherwise(function(error) {
                        response.writeHead(404, {"Content-Type": "text/plain"});
                        response.end("Error 404: File not found");
                        log(404, request.url, ip, error);
                    });
            }).listen(port);
        }

        module.print("OK");
    }

    function log(statusCode, url, ip, err)
    {
        module.print(statusCode + " - " + url + " - " + ip + ((err)?" - " + err:"") + "\n");
    }
});
