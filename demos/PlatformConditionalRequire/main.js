
module.declare(["./lib/platform/{platform}/main"], function(require, exports, module)
{
    var MAIN = require("./lib/platform/{platform}/main");
    
    exports.main = function()
    {
        if (MAIN.platform() == require.platform)
            module.print("OK");
        else
            module.print("FAIL");
    }
});
