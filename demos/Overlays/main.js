
module.declare(["p/main"], function(require, exports, module)
{
    var MAIN = require("p/main");
    
    exports.main = function()
    {
        if (MAIN.platform() == require.platform)
            module.print("OK");
        else
            module.print("FAIL");
    }
});
