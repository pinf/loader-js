module.declare(["./package1"], function(require, exports, module) {

    var options,
        messages;
    
    exports.main = function(ops) {

        options = ops;

        messages = [];
            
        var PACKAGE1 = require("./package1");
        
        PACKAGE1.announceNext(messages);
    
    }
    
    exports.getMessages = function() {
        return messages;
    }
    
    exports.getOptions = function() {
        return options;
    }

});