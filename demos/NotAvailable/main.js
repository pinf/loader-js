
module.declare(["amd/module3", "./lib/module1", "./lib/module2", "./lib/module3", "./lib/module4"], function(require, exports, module)
{
    exports.main = function()
    {
        var msg;

        try {
            msg = require("./lib/module1").announce();
        }
        catch(e)
        {
            try {
                msg = require("./lib/module2").announce();
            }
            catch(e)
            {
                try {
                    msg = require("./lib/module3").announce();
                }
                catch(e)
                {
                    msg = require("./lib/module4").announce();
                }
            }
        }
        
        module.print(msg + "\n");
        
        if (msg == "HelloWorld from NotAvailable!")
            module.print("OK");
        else
            module.print("FAIL");
    }
});
