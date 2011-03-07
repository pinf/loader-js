
// Example of a relative dependency
module.declare(["./helper"], function(require, exports, module) {
    
    require("./helper").populate(exports);

});