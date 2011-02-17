module.declare(["packageA/package1", "packageB/package3"], function(require, exports, module) {
    
    var PACKAGE1 = require("packageA/package1");
    var PACKAGE3 = require("packageB/package3");
    
    exports.announceNext = function(messages) {
    
        messages.push("package-2(" + (exports.runTests()?"OK":"FAIL") + ")");
    
        PACKAGE3.announceNext(messages);
    
    }
    
    exports.announcePrevious = function(messages) {
    
        messages.push("package-2");
    
        PACKAGE1.announcePrevious(messages);
    
    }

    exports.runTests = function() {

        var ok = true,
            // We get some options to obtain mainModuleDir.
            // We could use bravojs.mainModuleDir but that is not interoperable!
            options = require("packageA/main").getOptions();

        if(module.id != options.mainModuleDir + "/package2-dir/@/lib/package2")
            ok = false;

        if(require.id("packageA/main") != options.mainModuleDir + "/package1-dir/@/lib/main")
            ok = false;

        if(require.id("packageB/package3") != options.mainModuleDir + "/package3-dir/@/lib-dir/package3")
            ok = false;

        if(module.dependencies[0] != "packageA/package1")
            ok = false;

        if(module.dependencies[1] != "packageB/package3")
            ok = false;

        if(module.pkgId != options.mainModuleDir + "/package2-dir/")  
            ok = false;

        if(module.mappings["packageA"] != options.mainModuleDir + "/package1-dir/")  
            ok = false;

        if(module.mappings["packageB"] != options.mainModuleDir + "/package3-dir/")  
            ok = false;

        return ok;
    }
});