
module.declare(["jsgi/jsgi-node", "jsgi/promise", "pinf/loader"], function(require, exports, module)
{
    var JSGI = require("jsgi/jsgi-node"),
        PROMISE = require("jsgi/promise"),
        PINF_LOADER = require("pinf/loader");

    var port = 8003,
        sampleProgramURL = "https://gist.github.com/859578";

    exports.main = function(env)
    {
        if (env.args.length == 0)
            throw new Error("First argument is not a program URL! Try: " + sampleProgramURL);

        var programURL = env.args[0];

        module.print("Starting jsgi program '" + programURL + "' at: http://localhost:" + port + "/\n");

        module.print("Try browsing to it and refresh a few times to increment the counter.\n");

        module.print("To reload program call: " + "http://localhost:" + port + "/post-commit" + "\n");

        var provisioning = true,
            app;

        JSGI.start(function(request)
        {
            var deferred = PROMISE.defer(),
                response;

            module.print("Request: " + request.pathInfo + "\n");

            if (/^\/favicon.ico$/.test(request.pathInfo))
            {
                return {
                    status: 404,
                    headers: {
                        "content-type": "text/plain"
                    },
                    body: [
                        "Not found!"
                    ]
                };
            }

            if (/^\/post-commit$/.test(request.pathInfo))
            {
                app = void 0;
                module.print("Trigger program reload.\n");
            }

            if (typeof app == "undefined")
            {
                module.print("Load and boot program.\n");

                new PINF_LOADER.Sandbox({
                    program: programURL,
                    clean: true,
                    debug: true
                },
                function(sandbox, require)
                {
                    app = require("_package-0").app();

                    provisioning = false;

                    deferred.resolve(app(request));
                });
            }
            else
            if (provisioning)
            {
                return {
                    status: 503,
                    headers: {
                        "content-type": "text/plain"
                    },
                    body: [
                        "Provisioning program. Will be online in a moment!"
                    ]
                };
            }
            else
            {
                deferred.resolve(app(request));
            }

            return deferred.promise;
        }, {
            port: port
        });
    }
});
