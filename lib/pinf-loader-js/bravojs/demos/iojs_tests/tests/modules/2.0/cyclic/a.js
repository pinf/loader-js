module.declare(["b"], function(require, exports, module) {
exports.a = function () {
    return b;
};
var b = require('b');
})
