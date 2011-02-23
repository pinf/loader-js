
module.declare(["package1/main", "package4/main"], function(require, exports, module)
{
    exports.main = function()
    {
        // Program is booted with all required depdnencies loaded. We can now initialize and execute.
        
        // NOTE: This assumes intimate knowledge about the location of package1 which is fine
        //       since the package we are calling is somewhat special in that is requires packages
        //       as well as modules based on the mainModuleDir.
        //       To make this absolutely generic the package being called should bundle all it's
        //       modules into a package.
        var mainModuleDir = module.mappings["package1"].split("/");
        mainModuleDir.pop();

        var options = {
            mainModuleDir: mainModuleDir.join("/")
        };

        // Require a package's main module simply by using the label provided to the dependency array
        var package1 = require("package1/main");
        package1.main(options);
        module.print(package1.getMessages() + "\n");
    
        var package2 = require("package4/main");
        package2.main(options);
        module.print(package2.getMessages() + "\n");

        var count = 2;

        function checkFinished()
        {
            if (count==0)
                module.print("OK");
        }

        // The function we are calling lazy-loads extra code into the running program - hence the callback
        package2.loadSubModule(function(subModule) {
            subModule.main(options);
            module.print(subModule.getMessages() + "\n");
            count--;
            checkFinished();
        });

        // The function we are calling lazy-loads extra code into the running program - hence the callback
        package2.loadSubPackage(function(package3) {
            package3.main(options);
            module.print(package3.getMessages() + "\n");
            count--;
            checkFinished();
        });
    }
});
