module.declare([ "submodule/a", "b" ], function(require, exports, module) {

exports.foo = function () {
    return require('b');
};

})
