
module.declare(["./submodule"], function(require, exports, module)
{
    exports.getMessage = function() {
    
        return require("./submodule").getMessage();
    
    }
});
