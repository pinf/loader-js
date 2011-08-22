module.declare(['a'], function (require, exports, module) {

var a = require('a');
exports.b = function () {
    return a;
};

})
