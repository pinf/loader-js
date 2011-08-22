
module.declare(["./lib/module"], function(require, exports, module)
{
    var MODULE = require("./lib/module");
    
    exports.main = function()
    {
        module.print(MODULE.getMessage() + "\n");
        module.print("OK");
    }
});
