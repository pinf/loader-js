
module.declare([], function(require, exports, module) {
    
    exports.populate = function(object) {

        // We fetch the module by <packageUID>!/<modulePath> as the package is not mapped
        // for this require context (i.e. we are in the default packageless context)
        // NOTE: The module ID here is a *path relative to package root* and *not* a simple ID
        var package1 = require("registry/hostname/path/package1/!/lib/main");

        object.main = package1.main;
        object.getMessages = package1.getMessages;
    }

});
