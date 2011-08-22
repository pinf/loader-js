
module.declare(["./lib/module1"], function(require, exports, module)
{
    var MODULE1 = require("./lib/module1");

    exports.main = function()
    {
        module.print(MODULE1.announce() + "\n");
        module.print("OK");
    }
});
