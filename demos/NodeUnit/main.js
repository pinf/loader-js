
module.declare(["nodeunit/nodeunit", "nodejs/path"], function(require, exports, module)
{
    var PATH = require("nodejs/path"),
        PINF_LOADER = require("pinf/loader");

    exports.main = function()
    {
        module.print("Hello World from NodeUnit!\n");

        var reporter = require("nodeunit/nodeunit").reporters["default"];

        process.chdir((PATH.dirname(module.id) + "/tests").replace(/@\//g, "\/"));

        // The reporter exits the process when the tests are done (we skip running tests if we should not exit).
        // TODO: Patch nodeunit to optionally not exit.
        if (PINF_LOADER.canExit())
        {
            reporter.run(['test.js']);
        }
        else
            module.print("OK");
    }
});
