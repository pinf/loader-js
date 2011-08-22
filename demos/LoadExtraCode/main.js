
module.declare([], function(require, exports, module)
{
    var extraLoaded = 0;
    
    exports.main = function()
    {
        module.print("Hello World from LoadExtraCode!\n");

        module.print("Now loading extra code:\n");

        var count = 2;
        
        function checkFinished()
        {
            if (count==0)
                module.print("OK");
        }

        // Load an extra module (and it's dependencies) into the running program
        // The module ID is top-level and will match against the default path set by the loader
        module.load(require.paths[0] + "/../CommonJSModules2/lib/module", function(id) {

            // NOTE: We supply a computed value to require() so it is not caught
            //       when require scraping. This is important as the module we want to
            //       load would otherwise be made available before calling this
            //       module to begin with.
            // NOTE: Require scraping is not used for this module as module.declare([])
            //       is used above vs no wrapper as in Modules 1.1.1

            var loadedModule = require(id);
            
            module.print("  Loaded module said: " + loadedModule.getMessage() + "\n");

            count--;
            checkFinished();
        });

        // Load an extra package (and it's dependencies) into the running program

        module.load({
            // The path is relative to the bravojs.mainModuleDir 
            "location": require.paths[0] + "/../HelloWorld/"
            // The package descriptor for this package does specify a main module
        }, function(id) {

            var loadedProgramMainModule = require(id);

            module.print("  Loaded package said: ");

            loadedProgramMainModule.main();

            count--;
            checkFinished();
        });
    }
});
