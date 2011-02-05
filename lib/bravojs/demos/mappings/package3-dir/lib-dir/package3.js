module.declare(["package2/package2"], function(require, exports, module) {

    var PACKAGE2 = require("package2/package2");

    exports.announceNext = function(messages) {
    
        messages.push("package-3(" + (exports.runTests()?"OK":"FAIL") + ")");
    
        PACKAGE2.announcePrevious(messages);
    
    }

    exports.runTests = function() {

        var ok = true,
            // We get some options to obtain mainModuleDir.
            // We could use bravojs.mainModuleDir but that is not interoperable!
            // We fetch the module by UID!/modulePath as the package is not mapped for this package
            // NOTE: The module ID here is a *path relative to package root* and *not* a simple ID
            options = require("http://registry/hostname/path/package1/!/lib/main").getOptions();

        if(module.id != options.mainModuleDir + "/package3-dir/!/lib-dir/package3")
            ok = false;

        // Same as above: UID!/modulePath
        if(require.id("http://registry/hostname/path/package1/!/lib/main") != options.mainModuleDir + "/package1-dir/!/lib/main")
            ok = false;

        if(require.id("package2/package2") != options.mainModuleDir + "/package2-dir/!/lib/package2")
            ok = false;

        if(module.dependencies[0] != "package2/package2")
            ok = false;

        if(module.pkgId != options.mainModuleDir + "/package3-dir/")  
            ok = false;

        if(module.mappings["package2"] != options.mainModuleDir + "/package2-dir/")  
            ok = false;

        return ok;
    }

});