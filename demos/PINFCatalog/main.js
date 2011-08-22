
module.declare(["util/uuid"], function(require, exports, module)
{
    var UUID = require("util/uuid");

    exports.main = function()
    {
        module.print("Hello World from PINFCatalog!\n");

        var uuid = UUID.uuid();

        module.print("UUID: " + uuid + "\n");

        module.print("OK");
    }
});
