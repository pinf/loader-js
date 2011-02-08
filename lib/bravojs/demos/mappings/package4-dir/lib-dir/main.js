
module.declare(["package1/main"], function(require, exports, module) {

    var package1 = require("package1/main");

    exports.main = package1.main;
    exports.getMessages = package1.getMessages;

    exports.loadSubModule = function(callback) {

        var options = package1.getOptions();

        // Lazy-load an extra module (and it's dependencies) into the running program
        // The module ID is top-level and will match against the default path set by the loader
        module.load(options.mainModuleDir + "/modules/submodule", function(id) {

            // NOTE: We supply a computed value to require() so it is not caught
            //       when require scraping. This is important as the module we want to
            //       lazy-load would otherwise be made available before calling this
            //       module to begin with.
            // NOTE: Require scraping is not used for this module as module.declare([])
            //       is used above vs no wrapper as in Modules 1.1.1

            callback(require(id));
        });
    }

    exports.loadSubPackage = function(callback) {

        var options = package1.getOptions();

        module.load({
            // The path is relative to the bravojs.mainModuleDir 
            "location": options.mainModuleDir + "/package5-dir/"
            // The package descriptor for this package does specify a main module
        }, function(id) {
            callback(require(id));
        });
    }

});