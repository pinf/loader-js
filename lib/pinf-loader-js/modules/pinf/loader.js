// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("../../api"),
    LOADER = require("../../loader");

exports.getPlatformRequire = function()
{
    return API.ENV.platformRequire;
}

exports.mustTerminate = function()
{
    return API.ENV.mustTerminate;
}

exports.canExit = function()
{
    // TODO: Use own flag here
    return !API.ENV.mustTerminate;
}

exports.runProgram = function(options, callback)
{
    if (options.exec)
    {
        var command = API.SYSTEM.preArgs.join(" ") + ((options.options)?" "+options.options.join(" "):"") + " " + options.uri;
        API.SYSTEM.exec(command, callback);
    }
    else
        throw new Error("NYI");
}

var Sandbox = exports.Sandbox = function Sandbox(options, callback)
{
    var self = this;

    options = options || {};

    if (typeof options.program != "undefined")
    {
        options.callback = function(sandbox, require)
        {
            callback(self, require);
        }
        LOADER.boot(options);
    }
    else
    if (typeof options.programPath != "undefined")
    {
        // Create a fresh sandbox for the program

        if (typeof callback == "undefined")
            throw new Error("Callback must be supplied when creating sandbox for program!");

        if (/\/program.json$/.test())
            throw new Error("Program path '" + options.programPath + "' must end in '/program.json'");

        if (!API.FILE.exists(options.programPath))
            throw new Error("Program path '" + options.programPath + "' does not exist!");

        var sandbox = new API.SANDBOX.Sandbox({
            mainModuleDir: API.FILE.dirname(options.programPath) + "/"
        });

        self.getMainModuleDir = function()
        {
            return sandbox.loader.bravojs.mainModuleDir;
        }

        self.packageForId = function(packageId)
        {
            packageId = packageId.replace(/^\w*!/, "");

            if (packageId.charAt(packageId.length-1) != "/")
                packageId += "/";

            return sandbox.packages[packageId];
        }

        self.packageForHash = function(packageHash)
        {
            for (var packageId in sandbox.packages)
            {
                if (sandbox.packages[packageId].getHashId() == packageHash)
                    return sandbox.packages[packageId];
            }
            return null;
        }

        self.forEachPackage = function(callback)
        {
            for (var packageId in sandbox.packages)
            {
                callback(packageId, sandbox.packages[packageId]);
            }
        }

        self.forEachModule = function(callback)
        {
            for (var moduleIdentifier in sandbox.loader.bravojs.pendingModuleDeclarations)
            {
                callback(
                    moduleIdentifier,
                    sandbox.loader.bravojs.pendingModuleDeclarations[moduleIdentifier].dependencies,
                    sandbox.loader.bravojs.pendingModuleDeclarations[moduleIdentifier].moduleFactory
                );
            }
        }

        self.load = function(moduleIdentifier, callback)
        {
            return sandbox.loader.bravojs.module.load(moduleIdentifier, callback);
        }

        API.ENV.assembler.assembleProgram(sandbox, options.programPath, function(program)
        {
            self.program = program;

            var dependencies = program.getBootPackages();

            // Declare program boot packages but do not call main() on them
            sandbox.declare(dependencies, function(require, exports, module)
            {            
                callback(self, require);
            });
        });
    }
    else
    {
        // Create a child sandbox by cloning our existing sandbox.
        // The child sandbox will hold all existing modules initially and allow
        // for loading of extra modules that are memoized only to the child sandbox.

        // TODO: Do not get our sandbox from API.ENV.sandbox as it will have the wrong
        //       one if we are running in a sandboxed program (see above).
        var sandbox = API.ENV.sandbox.clone();

        this.declare = function(dependencies, moduleFactory)
        {
            var cbt = new API.UTIL.CallbackTracker(function()
            {
                sandbox.declare(dependencies, moduleFactory);
            });
            for (var i=0,ic=dependencies.length ; i<ic ; i++)
                API.ENV.assembler.addPackageToProgram(sandbox, sandbox.program, dependencies[i][Object.keys(dependencies[i])[0]], cbt.add());
            
            cbt.done();
        }
    }
}
