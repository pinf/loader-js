module.declare(["package1/main"], function(require, exports, module) {

    var package1 = require("package1/main");

    exports.main = package1.main;
    exports.getMessages = package1.getMessages;

});