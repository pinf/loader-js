
module.declare(["amd1", "amd2", "amd3"], function(require, exports, module)
{
    exports.main = function()
    {
        var ok = true,
            msg;

        msg = require("amd1").announce();
        module.print(msg + "\n");
        if (msg != "Hello World from MapModule!")
            ok = false;

        msg = require("amd2").announce();
        module.print(msg + "\n");
        if (msg != "Hello World from MapModule!")
            ok = false;
        
        msg = require("amd3").announce();
        module.print(msg + "\n");
        if (msg != "Hello World from MapModule!")
            ok = false;

        if (ok)
            module.print("OK");
        else
            module.print("FAIL");
    }
});
