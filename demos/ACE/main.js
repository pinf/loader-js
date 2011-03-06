
module.declare([
    "jsgi/jsgi-node",
    "jsgi/promise",
    "promised-io/fs",
    "paperboy/paperboy",
    "pinf/loader",
    "nodejs/path",
    "nodejs/fs",
    "pinf/program-server"
], function(require, exports, module)
{
    var JSGI = require("jsgi/jsgi-node"),
        PROMISE = require("jsgi/promise"),
        PROMISE_FS = require("promised-io/fs"),
        PAPERBOY = require("paperboy/paperboy"),
        PINF_LOADER = require("pinf/loader"),
        PATH = require("nodejs/path"),
        FS = require("nodejs/fs"),
        PROGRAM_SERVER = require("pinf/program-server");

    var port = 8003;

    exports.main = function()
    {
        module.print("Hello World from ACE!\n");

        if (!PINF_LOADER.mustTerminate())
        {
            module.print("Starting program server at: http://localhost:" + port + "/\n");

            var jsgiServer = new PROGRAM_SERVER.JSGI({
                api: {
                    PROMISE: PROMISE
                },
                map: {
                    // replace boot request to load bundled editor
                    "/demo/boot.js": {
                        programPath: PATH.dirname(module.id) + "/editor/program.json"
                    },
                    "/worker.js": {
                        programPath: PATH.dirname(module.id) + "/worker/program.json"
                    }
                }
            });

            var staticApp = function(request)
            {
                // RequireJS is not needed
                if (request.pathInfo == "/demo/require.js")
                {
                    return {
                        status: 200,
                        headers: {
                            "content-type": "application/x-javascript",
                            "content-length": 0
                        },
                        body: [""]
                    };
                }

                var path = module.mappings["ace"] + request.pathInfo;

                if (path.charAt(path.length-1) == "/")
                    path += "index.html";

                try
                {
                    // ensure file exists
                    FS.statSync(path);

                    var ext = PATH.extname(path).substring(1);

                    return {
                        status: 200,
                        headers: {
                            "content-type": PAPERBOY.contentTypes[ext] || "text/plain"
                        },
                        body: PROMISE_FS.open(path, "r")
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
