
module.declare(["./lib/hello"], function(require, exports, module)
{
    exports.main = function()
    {
        require("./lib/hello").announce();

        module.print("OK");
    }
});
