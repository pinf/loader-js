
module.declare(["./lib/hello"], function(require, exports, module)
{
    if (require.platform != "nodejs")
        throw new Error("This program only runs on http://nodejs.org/");

    exports.main = function()
    {
        require("./lib/hello").announce();

        module.print("OK");
    }
});
