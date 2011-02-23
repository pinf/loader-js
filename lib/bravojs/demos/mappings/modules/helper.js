
module.declare([], function(require, exports, module) {
    
    exports.populate = function(object) {

        // We fetch the package by its UID as it is not mapped
        // for this require context (i.e. we are in the default packageless context)
        var package1 = require(require.pkg("registry/hostname/path/package1/").id("main", true));

        object.main = package1.main;
        object.getMessages = package1.getMessages;
    }

});
