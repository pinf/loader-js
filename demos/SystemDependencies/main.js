
module.declare([], function(require, exports, module)
{
    exports.main = function()
    {
        module.print("Hello World from SystemDependencies!\n");

        var MIME = require("mime"),
            NATIVE_MAIN = require("native/main");

        if (MIME.extension("text/html") == "html" && NATIVE_MAIN.test())
            module.print("OK");
        else
            module.print("FAIL");
    }
});
