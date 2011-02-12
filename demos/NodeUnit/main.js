
module.declare(["nodeunit/nodeunit"], function(require, exports, module)
{
    if (require.platform != "nodejs")
        throw new Error("This program only runs on http://nodejs.org/");

    var PATH = require("path");

    exports.main = function()
    {
        module.print("Hello World from NodeUnit!\n");

        var reporter = require("nodeunit/nodeunit").reporters["default"];

        process.chdir(PATH.dirname(PATH.dirname(module.id)) + "/tests");

        reporter.run(['test.js']);
    }
});
