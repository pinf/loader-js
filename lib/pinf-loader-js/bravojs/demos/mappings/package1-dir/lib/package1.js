
module.declare(["package2/package2"], function(require, exports, module) {
    
    var PACKAGE2 = require("package2/package2");
    
    exports.announceNext = function(messages) {
    
        messages.push("package-1(" + (exports.runTests()?"OK":"FAIL") + ")");
    
        PACKAGE2.announceNext(messages);

    }
    
    exports.announcePrevious = function(messages) {
    
        messages.push("package-1");
    
    }

    exports.runTests = function() {

        var ok = true,
            // We get some options to obtain mainModuleDir.
            // We could use bravojs.mainModuleDir but that is not interoperable!
            options = require("./main").getOptions();

        if(module.id != options.mainModuleDir + "/package1-dir/lib/package1")
            ok = false;

        if(module.pkgId != "registry/hostname/path/package1/")
            ok = false;

        if(require.id("./main") != options.mainModuleDir + "/package1-dir/lib/main")
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