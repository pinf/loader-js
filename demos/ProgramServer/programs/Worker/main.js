
module.declare(["extra-code/main"], function(require, exports, module)
{
    exports.main = function()
    {
        module.print("Hello World from Worker!\n");

        var extraCode = require("extra-code/main");
        
        extraCode.main();
    }
});
