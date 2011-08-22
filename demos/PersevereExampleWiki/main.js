
module.declare(["example-wiki/index"], function(require, exports, module)
{
    exports.main = function()
    {
        module.print("Hello World from PersevereExampleWiki!\n");
        
        require("example-wiki/index");
    }
});
