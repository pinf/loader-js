
module.declare([
    "jsgi/jsgi-node",
    "jsgi/promise",
    "paperboy/paperboy",
    "pinf/loader",
    "nodejs/path",
    "nodejs/fs",
    "pinf/program-server"
], function(require, exports, module)
{
    var JSGI = require("jsgi/jsgi-node"),
        PROMISE = require("jsgi/promise"),
        PAPERBOY = require("paperboy/paperboy"),
        PINF_LOADER = require("pinf/loader"),
        PATH = require("nodejs/path"),
        FS = require("nodejs/fs"),
        PROGRAM_SERVER = require("pinf/program-server");

    var port = 8003;

    exports.main = function()
    {
        module.print("Hello World from ProgramServer!\n");

        if (!PINF_LOADER.mustTerminate())
        {
            module.print("Starting program server at: http://localhost:" + port + "/\n");

            // NOTE: This is not intended for production use as-is but fine for single-user development.
            //       If used in production the different URIs (program and extra module and package load)
            //       must be primed in the correct order and response stored for a proxy server to send.
            //       This is important as the server keeps a representation of the program it sends to the
            //       client and will only send what the client does not have when extra modules are requested.
            //       This process may break down if multiple clients access URIs at random. The solution
            //       is to 'build' the programs prior to deployment.
            // NOTE: Setting reload="force" below mitigates these effects and should always deliver a 
            //       consistent set of modules.

            var jsgiServer = new PROGRAM_SERVER.JSGI({
                api: {
                    PROMISE: PROMISE
                },
                map: {
                    "/HelloWorld.js": {
                        programPath: PATH.dirname(PATH.dirname(module.id)) + "/HelloWorld/program.json"
                    },
                    "/LoadExtraCode.js": {
                        programPath: PATH.dirname(PATH.dirname(module.id)) + "/LoadExtraCode/program.json",
                        // Fix paths that go above program directory
                        // NOTE: If mapped path above is only one segment we can only go up 1 segment!
                        rewritePaths: [
                            [PATH.dirname(PATH.dirname(module.id)) + "/CommonJSModules2/", "/../CommonJSModules2/"]
                        ]
                    }
                },
                reload: "force"
            });
            
            var staticApp = function(request)
            {
                var path = PATH.dirname(module.id) + "/www" + request.pathInfo;
                
                if (path.charAt(path.length-1) == "/")
                    path += "index.html";
                
                try
                {
                    // NOTE: This could be more efficient and ASYNC but fine for this demo

                    var contents = FS.readFileSync(path, "utf-8"),
                        ext = PATH.extname(path).substring(1);

                    return {
                        status: 200,
                        headers: {
                            "content-type": PAPERBOY.contentTypes[ext] || "text/plain",
                            "content-length": contents.length
                        },
                        body: [
                            contents
                        ]
                    };
                }
                catch(e)
                {
                    return {
                        status: 404,
                        headers: {
                            "content-type": "text/plain"
                        },
                        body: [
                            "File not found!"
                        ]
                    };
                }
            }

            JSGI.start(jsgiServer.responder(staticApp), {
                port: port
            });
        }

        module.print("OK");
    }
});
