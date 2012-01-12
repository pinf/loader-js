// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// TODO: This module's API and implementation needs an overhaul with a clear concept of
//		 where it fits into the PINF loader ecosystem.

var API = require("../../api"),
    LOADER = require("../../loader"),
    SANDBOX = require("../../sandbox");

exports.getAPI = function()
{
    return API;
}


exports.setConsole = API.CONSOLE.setConsole;
exports.setErrorLogPath = API.CONSOLE.setErrorLogPath;


exports.getPlatformRequire = function()
{
    return API.ENV.platformRequire;
}

exports.mustTerminate = function()
{
    return API.ENV.mustTerminate;
}

function getPINFBasePath()
{
	// TODO: Get "/pinf" path from ENV var if exists
	if (API.ENV.ignoreGlobalPINF === true || !API.FILE.exists("/pinf"))
	{
		return API.SYSTEM.pwd + "/.pinf";
	}
	else
	{
		return "/pinf";
	}
}

exports.getTmpPathForScope = function(scopes)
{
	scopes = scopes || [];

	var path = getPINFBasePath() + "/tmp";
	
	if (!API.FILE.exists(path) && API.FILE.exists(API.FILE.dirname(path))) {
		API.FILE.mkdirs(path, parseInt("0775"));
	}
	
	if (!API.FILE.exists(path))
		throw new Error("Cache base path does not exist: " + path);
	
	scopes.forEach(function(scope)
	{
		path = path.replace(/\/$/, "") + "/" + scope.replace(/\//, "+");
	});
	
	return API.FILE.realpath(path);
}

exports.getRunPathForScope = function(scopes)
{
	scopes = scopes || [];

	var path = getPINFBasePath() + "/run";
	
	if (!API.FILE.exists(path) && API.FILE.exists(API.FILE.dirname(path))) {
		API.FILE.mkdirs(path, parseInt("0775"));
	}
	
	if (!API.FILE.exists(path))
		throw new Error("Cache base path does not exist: " + path);
	
	scopes.forEach(function(scope)
	{
		path = path.replace(/\/$/, "") + "/" + scope;
	});
	
	return API.FILE.realpath(path);
}

exports.getDataPathForScope = function(scopes)
{
	scopes = scopes || [];

	var path = getPINFBasePath() + "/data";

	if (!API.FILE.exists(path) && API.FILE.exists(API.FILE.dirname(path))) {
		API.FILE.mkdirs(path, parseInt("0775"));
	}

	if (!API.FILE.exists(path))
		throw new Error("Data base path does not exist: " + path);
	
	scopes.forEach(function(scope)
	{
		path = path.replace(/\/$/, "") + "/" + scope;
	});
	
	return API.FILE.realpath(path);
}

exports.getLogPathForScope = function(scopes)
{
	scopes = scopes || [];

	var path = getPINFBasePath() + "/logs";

	if (!API.FILE.exists(path) && API.FILE.exists(API.FILE.dirname(path))) {
		API.FILE.mkdirs(path, parseInt("0775"));
	}

	if (!API.FILE.exists(path))
		throw new Error("Log base path does not exist: " + path);
	
	scopes.forEach(function(scope)
	{
		path = path.replace(/\/$/, "") + "/" + scope;
	});
	
	return API.FILE.realpath(path);
}

exports.getCachePathForScope = function(scopes)
{
	scopes = scopes || [];

	var path = getPINFBasePath() + "/cache";

	if (!API.FILE.exists(path) && API.FILE.exists(API.FILE.dirname(path))) {
		API.FILE.mkdirs(path, parseInt("0775"));
	}

	if (!API.FILE.exists(path))
		throw new Error("Cache base path does not exist: " + path);
	
	scopes.forEach(function(scope)
	{
		path = path.replace(/\/$/, "") + "/" + scope;
	});
	
	return API.FILE.realpath(path);
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

// NOTE: This will always be the first
exports.getSandbox = function()
{
    return API.ENV.sandbox;
}

// NOTE: This returns the last created sandbox which may not exist any more.
// TODO: The sandbox management needs to be overhauled.
exports.getLastSandbox = function()
{
	if(!API.ENV.sandboxes) return exports.getSandbox();
    return API.ENV.sandboxes[API.ENV.sandboxes.length-1];
}

var Sandbox = exports.Sandbox = function Sandbox(options, callback)
{
    var self = this;

    options = options || {};


    function createSandbox(programPath)
    {
        if (!API.FILE.exists(programPath))
            throw new Error("Program path '" + programPath + "' does not exist!");

        var sandbox = new API.SANDBOX.Sandbox({
            mainModuleDir: API.FILE.dirname(programPath) + "/",
            platform: options.platform || API.ENV.platform
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
                if (typeof sandbox.packages[packageId].getHashId === "function" &&
                    sandbox.packages[packageId].getHashId() == packageHash)
                {
                    return sandbox.packages[packageId];
                }
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

        var bootModule = false,
            sandboxRequire = false;

        self.boot = function(callback, options)
        {
            sandbox.env = {
        		programDescriptorPath: sandbox.program.descriptor.path,
    			bootPackagePath: sandbox.program.getBootPackages()[0]["_package-0"].location.replace(/\/$/, "")
            };

            var module = sandboxRequire('_package-0');
            if (typeof module.main === "undefined") {
                throw new Error("Program's '" + programPath + "' main module does not export 'main()'!");
            }
            var ret = module.main(options || {});
            callback(module, ret);
        }

        // TODO: Need a way to get current parent sandbox instead of using stack
        var descriptorSandbox;
        if (typeof API.ENV.sandboxes !== "undefined") {
            descriptorSandbox = API.ENV.sandboxes[API.ENV.sandboxes.length-1];
        } else {
            descriptorSandbox = API.ENV.sandbox;
        }
        // Inherit source descriptors from program
        var sourceDescriptors = API.ENV.loadSourceDescriptorsForProgram(programPath, descriptorSandbox.sourceDescriptors);

        API.ENV.assembler.assembleProgram(sandbox, programPath, function() {}, function(program)
        {
            self.program = program;

            var dependencies = program.getBootPackages();

            if (dependencies.length === 1) {
                bootModule = dependencies[0];
            }

            // Declare program boot packages but do not call main() on them
            sandbox.declare(dependencies, function(require, exports, module)
            {            
                sandboxRequire = require;
                callback(self, require);
            });
        },
        {
            sourceDescriptors: sourceDescriptors,
            extendsProgramDescriptorPath: options.extendsProgramDescriptorPath || false
        });

        // NOTE: This helps somewhat to conserve memory in the program-server
        // TODO: Figure out why old sandboxes are not garbage collected
        self.destroy = function()
        {
            if (typeof API.ENV.sandboxes !== "undefined") {
                for (var i=API.ENV.sandboxes.length-1 ; i>=0 ; i--) {
                    if (API.ENV.sandboxes[i] === sandbox) {
                        API.ENV.sandboxes.splice(i, 1);
                    }
                }
            }
        }

        // TODO: Don't just use a stack here as it will fail when destroying and re-creating child sandboxes
        if (typeof API.ENV.sandboxes === "undefined") {
            API.ENV.sandboxes = [API.ENV.sandbox];
        }
        API.ENV.sandboxes.push(sandbox);            
    }    

    
    if (typeof options.program != "undefined")
    {
        options.callback = function(sandbox, require)
        {
            callback(self, require);
        }
        LOADER.boot(options);
    }
    else
    if (typeof options.locator != "undefined")
    {
        // Create a fresh sandbox for the program
    	
        if (typeof callback == "undefined")
            throw new Error("Callback must be supplied when creating sandbox for program!");

		if (!options.locator.archive)
			throw new Error("'archive' property not set for locator!");

        // TODO: Need a way to get current parent sandbox instead of using stack
        var descriptorSandbox;
        if (typeof API.ENV.sandboxes !== "undefined") {
            descriptorSandbox = API.ENV.sandboxes[API.ENV.sandboxes.length-1];
        } else {
            descriptorSandbox = API.ENV.sandbox;
        }
		
        API.ENV.assembler.provisonProgramForURL(options.locator.archive, function(path)
        {
        	path = path.replace(/\/(program.json)?$/, "");
        	
        	if (options.locator.path) {
        		path += "/" + options.locator.path;
        	}
        	
            createSandbox(path + "/program.json");
        }, {
        	sourceDescriptors: descriptorSandbox.sourceDescriptors
        });
    }
    else
    if (typeof options.programPath != "undefined")
    {
        // Create a fresh sandbox for the program

        if (typeof callback == "undefined")
            throw new Error("Callback must be supplied when creating sandbox for program!");

        if (/\/program.json$/.test())
            throw new Error("Program path '" + options.programPath + "' must end in '/program.json'");

        // TODO: Use 'API.ENV.assembler.provisonProgramForURL' instead
        if (/^\w*:\/\//.test(options.programPath)) {
            var m;
            // TODO: Put this in a plugin
            if (m = options.programPath.match(/^https?:\/\/github.com\/([^\/]*)\/([^\/]*)\/?$/))
            {
                options.programPath = "https://github.com/" + m[1] + "/" + m[2] + "/zipball/master";
            }
            API.ENV.assembler.downloader.getForArchive(/* url */ options.programPath, function(path)
            {
                createSandbox(path + "/program.json");
            });
        } else {
            createSandbox(options.programPath);
        }
    }
    else
    {
        // Create a child sandbox by cloning our existing sandbox.
        // The child sandbox will hold all existing modules initially and allow
        // for loading of extra modules that are memoized only to the child sandbox.

        // TODO: Need a way to get current parent sandbox instead of using stack
        var sandbox;
        if (typeof options.originalSandbox !== "undefined") {
            sandbox = options.originalSandbox.clone();
        } else
        if (typeof API.ENV.sandboxes !== "undefined") {
            sandbox = API.ENV.sandboxes[API.ENV.sandboxes.length-1].clone();
        } else {
            sandbox = API.ENV.sandbox.clone();
        }

        this.declare = function(dependencies, moduleFactory)
        {
            var cbt = new API.UTIL.CallbackTracker(function()
            {
                sandbox.declare(dependencies, moduleFactory);
            });
            for (var i=0,ic=dependencies.length ; i<ic ; i++)
                API.ENV.assembler.addPackageToProgram(sandbox, sandbox.program, dependencies[i][Object.keys(dependencies[i])[0]], cbt.add(), {
                    sourceDescriptors: API.ENV.loadSourceDescriptorsForProgram(sandbox.program.descriptor.path)
                });
            
            cbt.done();
        }
        
        this.load = function(moduleIdentifier, callback)
        {
            var parts = moduleIdentifier.split("@/");

            self.declare([{
                "app": {
                    "location": parts[0],
                    "module": parts[1]
                }
            }], function(require, exports, module)
            {
                module.load(moduleIdentifier, function(id)
                {
                    callback(id, require, exports, module);
                });
            });
        }
    }
}
