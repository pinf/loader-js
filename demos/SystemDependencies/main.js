
module.declare([], function(require, exports, module)
{
    exports.main = function()
    {
        module.print("Hello World from SystemDependencies!\n");

        var NATIVE_MAIN = require("native/main");

        if (NATIVE_MAIN.test())
            module.print("OK");
        else
            module.print("FAIL");
    }
});
