
module.declare(["narwhal/narwhal"], function(require, exports, module)
{
    var NARWHAL = require("narwhal/narwhal");

    exports.main = function()
    {
        module.print("Hello World from Narwhal!\n");

        module.print(NARWHAL.LEFT);

        module.print("OK");
    }
});
