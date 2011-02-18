
module.declare(["paperboy/paperboy", "pinf/loader"], function(require, exports, module)
{
    if (require.platform != "nodejs")
        throw new Error("This program only runs on http://nodejs.org/");
    
    var PAPERBOY = require("paperboy/paperboy"),
        PATH = require('path'),
        HTTP = require('http'),
        PINF_LOADER = require("pinf/loader");

    // Config options
    
    var port = 8003,
        docroot = PATH.dirname(PATH.dirname(module.id));

    exports.main = function()
    {
        module.print("Hello World from GithubArchiveDependency!\n");

        if (!PINF_LOADER.mustTerminate())
        {
            module.print("Starting node-paperboy at 'http://localhost:" + port + "/' for: " + docroot + "\n");
    
            module.print("Try browsing to:  'http://localhost:" + port + "/main.js'\n");
    
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
