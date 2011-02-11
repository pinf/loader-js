
module.declare(["jsgi/jsgi-node", "jsgi/promise", "pinf/loader"], function(require, exports, module)
{
    var JSGI = require("jsgi/jsgi-node"),
        PROMISE = require("jsgi/promise"),
        PINF_LOADER = require("pinf/loader");

    var port = 8003;

    exports.main = function()
    {
        module.print("Hello World from ReloadingJSGI!\n");

        if (!PINF_LOADER.mustTerminate())
        {
            module.print("Starting jsgi app at: http://localhost:" + port + "/\n");
    
            module.print("Try browsing to it, editing file '" + require.id("./jsgi/app.js").replace(/\/*!?\/+/g, "\/") + "' and reloading.'\n");

            JSGI.start(function(request)
            {
                var deferred = PROMISE.defer();

                // For each request we boot our jsgi app package

                var sandbox = new PINF_LOADER.Sandbox();

                sandbox.declare([
                    {
                        "app": {
                            "id": "github.com/pinf/loader-js/demos/ReloadingJSGI/jsgi/",
                            "descriptor": {
                                "main": "app.js"
                            }
                        }
                    }
                ], function(require, exports, module) {

                    var jsgiApp = require("app").app();

                    var response = jsgiApp(request);

                    deferred.resolve(response);
                });

                return deferred.promise;
            }, {
                port: port
            });
        }

        module.print("OK");
    }
});
