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
            // We fetch the package by its UID as it is not mapped for this package
            options = require(require.pkg("registry/hostname/path/package1/").id("main", true)).getOptions();

        if(module.id != options.mainModuleDir + "/package3-dir/lib-dir/package3")
            ok = false;

        if(module.pkgId != options.mainModuleDir + "/package3-dir")
            ok = false;

        if(require.pkg("registry/hostname/path/package1/").id("main") != options.mainModuleDir + "/package1-dir/lib/main")
            ok = false;

        if(require.pkg("package2").id() != options.mainModuleDir + "/package2-dir")
            ok = false;

        if(require.id("package2/package2") != options.mainModuleDir + "/package2-dir/lib/package2")
            ok = false;

        if(module.dependencies[0] != "package2/package2")
            ok = false;

        if(module.mappings["package2"] != options.mainModuleDir + "/package2-dir")
            ok = false;

        return ok;
    }

});