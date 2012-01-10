// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api"),
    ENV = API.ENV,
    DEBUG = API.DEBUG,
    UTIL = API.UTIL,
    FILE = API.FILE,
    SYSTEM = API.SYSTEM,
    DESCRIPTORS = require("./descriptors"),
    PROGRAM = require("./program");

var rootProgramPath = false;


var Assembler = exports.Assembler = function(downloader)
{
    this.downloader = downloader;
    this.cleaned = [];
}

Assembler.prototype.pmLocatorResolver = function(program, locator, callback)
{
	if (locator.pm === "npm")
	{
		// Get NPM to install the package for this program

		// NOTE: If multiple programs are loaded into the sandbox this path will change so we keep the first one
		//		 and store all packages in there. This will ensure all programs will get the same modules and instances
		//		 can be shared across programs.
		if (!rootProgramPath)
		{
			rootProgramPath = FILE.dirname(program.descriptor.path);
		}
		
		var localPckage = false;
		
		// If no `name` is specified we set it if we have a `location` set.
		if (typeof locator.name === "undefined")
		{
			if (typeof locator.location === "undefined")
				throw new Error("Must specify `name` or `location` for locator: " + UTIL.locatorToString(locator));

			var descriptor;
			try {
				descriptor = API.JSON.parse(API.FILE.read(locator.location + "/package.json"));
			} catch(e) {
				throw new Error("Error '" + e + "' parsing descriptor: " + locator.location + "/package.json");
			}
			if (!descriptor.name)
				throw new Error("No `name` set in: " + locator.location + "/package.json");

			locator.name = descriptor.name;
			localPckage = true;
		}		

		var sandboxPath = FILE.realpath(this.downloader.basePath + "/registry.npmjs.org/pinf-loader-js~sandboxes/" + rootProgramPath + ((program.descriptor.json.version)?"/"+program.descriptor.json.version:"")),
			pkgPath = sandboxPath + "/node_modules/" + locator.name;
		if (!FILE.exists(sandboxPath + "/node_modules"))
			FILE.mkdirs(sandboxPath + "/node_modules", 0775);

		// TODO: If --clean flag supplied clear sandbox once first
		
		var uri = locator.name + ((typeof locator.version !== "undefined")?"@" + locator.version:"");
		if (localPckage) {
			uri = locator.location;
		}

		locator.location = pkgPath;
		
		// check if already installed
		if (FILE.exists(pkgPath + "/package.json"))
		{
			try {
				// TODO: Revise to check if installed version >= desired version
//				if (typeof locator.version === "undefined" || API.JSON.parse(FILE.read(pkgPath + "/package.json")).version == locator.version)
//				{
					// already exists
					callback(locator);
					return;
//				}
			} catch(e) {
				console.log("Error '" + e + "' parsing package.json from package installed via npm. Forcing re-install.", e.stack);
			}
		}
		
		var command = "npm --verbose install -f " + uri;

		// Get NPM to install the package for this program
		DEBUG.print("Installing package via NPM [\0cyan(" + command + "\0)]:");

		SYSTEM.exec(command, {
			cwd: sandboxPath + "/node_modules"
		}, function(stdout, stderr, error)
        {
			DEBUG.print(stdout);
			DEBUG.print(stderr);
			if (!/\nnpm info ok\n/.test(stderr))
			{
				console.error("ERROR while installing package via NPM [\0cyan(" + command + "\0)]:", stderr, stdout, error);
			}
			callback(locator);
        });
	}
	else
		throw new Error("Package manager '" + locator.pm + "' not supported for 'pm' locator property.");
}

Assembler.prototype.assembleProgram = function(sandbox, uri, programCallback, callback, options)
{
    var self = this;
    if (typeof callback == "undefined")
    {
        callback = programCallback;
        programCallback = void 0;
    }

    var di = DEBUG.indent();
    DEBUG.print("Assembling program:").indent(di+1);

    function assembleProgram()
    {
        DEBUG.print("Program URI: " + uri);

        var path;
//        if (uri.charAt(0) == "/")
            path = uri;

        new DESCRIPTORS.Program(path, {
            extendsProgramDescriptorPath: options.extendsProgramDescriptorPath || false,
            sourceDescriptors: options.sourceDescriptors || false
        }, function(programDescriptor)
        {
            var program = new PROGRAM.Program(programDescriptor);
    
            if (typeof programCallback != "undefined")
            {
                if (programCallback(program) === false)
                    return;
            }
    
            sandbox.setProgram(program);
            sandbox.sourceDescriptors = options.sourceDescriptors || void 0;
    
            program.assembler = self;
            
            options.pmLocatorResolver = function(locator, callback) {
            	self.pmLocatorResolver(program, locator, callback);
            }

            // This will download all packages and make them available on disk
            program.discoverPackages(function assembler_assembleProgram_lambda_discoverPackages_packageForLocator(locator, callback)
            {
                program.resolveLocator(self, locator, function(resolvedLocator)
                {
                    if (resolvedLocator.available === false)
                    {
                        callback(null);
                    }
                    else
                    if (typeof resolvedLocator.available != "undefined" && resolvedLocator.available === false)
                    {
                        callback(null);
                    }
                    else
                    if (typeof resolvedLocator.id != "undefined")
                    {
                        callback(sandbox.ensurePackageForLocator(resolvedLocator, options), resolvedLocator);
                    }
                    else
                    if (!resolvedLocator.location)
                    {
                        throw new Error("No location property found in locator: " + UTIL.locatorToString(resolvedLocator));
                    }
                    else
                    if (!FILE.exists(resolvedLocator.location))
                    {
                        throw new Error("Directory for location property not found in locator: " + UTIL.locatorToString(resolvedLocator));
                    }
    //                else
                    // We do not need to follow locators (in order to discover requires()) that map to providers.
    //                if (typeof locator.provider != "undefined")
    //                    callback(null);
                    else
                    {
                        callback(sandbox.ensurePackageForLocator(resolvedLocator, options), resolvedLocator);
                    }
                }, options);
            }, function assembler_assembleProgram_lambda_discoverPackages_done()
            {
                DEBUG.indent(di);
                self.finalizeProgram(sandbox, program);
                callback(program);
            }, options);            
        });
    }

    if (ENV.mustClean && !this.cleaned[this.downloader.basePath + "/downloads"])
    {
        this.cleaned[this.downloader.basePath + "/downloads"] = true;

        DEBUG.print("Removing downloaded packages from: " + this.downloader.basePath + "/downloads");
        
        SYSTEM.exec("rm -Rf " + this.downloader.basePath + "/downloads", function(stdout, stderr)
        {
            assembleProgram();
        });
    }
    else
        assembleProgram();    
}

/**
 * Load an extra package for the program.
 * 
 * NOTE: The 'locator' argument gets modified!
 * TODO: Refactor so 'locator' argument does not get modified.
 * 
 * @throws If package is not listed (by UID) in program's descriptor
 */
Assembler.prototype.addPackageToProgram = function(sandbox, program, locator, callback, options)
{
    var self = this;
    
    var di = DEBUG.indent();
    DEBUG.print("Load additional package into program:").indent(di+1);
    DEBUG.print("Locator(original): " + UTIL.locatorToString(locator));

    options.pmLocatorResolver = function(locator, callback) {
    	self.pmLocatorResolver(program, locator, callback);
    }
    
    program.resolveLocator(self, locator, function(resolvedLocator)
    {
        DEBUG.print("Locator(resolved): " + UTIL.locatorToString(resolvedLocator));

        var pkg = sandbox.ensurePackageForLocator(resolvedLocator, options);

        if (pkg.discovering)
        {
            DEBUG.indent(di+1).print("... skip second pass ...");
            DEBUG.indent(di);
            for (var key in resolvedLocator)
                locator[key] = resolvedLocator[key];
            self.finalizeProgram(sandbox, program);
            callback(pkg);
            return;
        }

        pkg.discoverPackages(function assembler_assembleProgram_lambda_addPackageToProgram_packageForLocator(locator, callback)
        {
            program.resolveLocator(self, locator, function(resolvedLocator)
            {
                if (typeof resolvedLocator.provider === "undefined" && !FILE.exists(resolvedLocator.location))
                {
                    throw new Error("This should not happen. File does not exist: " + UTIL.locatorToString(resolvedLocator));
                }
                else
                {
                    callback(sandbox.ensurePackageForLocator(resolvedLocator, options), resolvedLocator);
                }
            }, options);
            
        }, function assembler_assembleProgram_lambda_addPackageToProgram_done()
        {
            DEBUG.indent(di);
            for (var key in resolvedLocator)
                locator[key] = resolvedLocator[key];
            self.finalizeProgram(sandbox, program);
            callback(pkg);
        });
    }, options);
}

/**
 * When all packages are loaded we need to resolve some IDs to locations.
 */
Assembler.prototype.finalizeProgram = function(sandbox, program)
{
/*
    for (var id in sandbox.packages)
    {
console.log("PACKAGE: " + id);        
console.log(sandbox.packages[id].normalizedDescriptor.json);
    }
*/
/*
NOTE: This should not be here. IDs cannot be resolved this way. Need to use UIDs instead.
    program.descriptor.walkPackages(function(id)
    {
        var pkg = sandbox.packageForId(id);

        if (typeof pkg.normalizedDescriptor != "undefined" && typeof pkg.normalizedDescriptor.walkMappings != "undefined")
        {
            pkg.normalizedDescriptor.walkMappings(function(alias, locator)
            {
                if (typeof locator.location == "undefined" && typeof locator.id != "undefined")
                {
                    var mappedPackage = sandbox.packageForId(locator.id);
                    pkg.normalizedDescriptor.json.mappings[alias].location = mappedPackage.path;
                }
            });
        }
    });
*/
}

Assembler.prototype.provisonProgramForURL = function(url, callback, options)
{
    var self = this;

    var di = DEBUG.indent();
    DEBUG.print("Provision program package:").indent(di+1);

    function provisonProgram()
    {
        if (typeof options.sourceDescriptors !== "undefined" && options.sourceDescriptors.length > 0)
        {
            for (var i=0, ic=options.sourceDescriptors.length, ret ; i<ic ; i++)
            {
                if (ret = options.sourceDescriptors[i].augmentLocator({
                    id: url.replace(/^\w*:\/\//, "").replace(/\/$/, "") + "/"
                }))
                {
                	// If no `ret.location` found the locator could not be resolved/augmented so
                	// we continue below.
                	if (typeof ret.location !== "undefined")
                	{
                        DEBUG.print("URL: \0yellow(" + url +"\0) \0cyan(<- " + ret.location + "\0) (based on source overlay: " + options.sourceDescriptors[i].path + ")");
                        callback(ret.location);
                        return;
                	}

                	if (ret = options.sourceDescriptors[i].augmentLocator({
                    	archive: url
                    }))
                    {
                    	// If no `ret.location` found the locator could not be resolved/augmented so
                    	// we continue below.
                    	if (typeof ret.location !== "undefined")
                    	{
                            DEBUG.print("URL: \0yellow(" + url +"\0) \0cyan(<- " + ret.location + "\0) (based on source overlay: " + options.sourceDescriptors[i].path + ")");
                            callback(ret.location);
                            return;
                    	}
                    }
                }
            }
        }
        
        // Fix some URLs
        // TODO: Put this into a plugin
        var m;
        if (m = url.match(/^https?:\/\/gist.github.com\/(\d*).*$/))
        {
            url = "https://gist.github.com/gists/" + m[1] + "/download";
        }
        else
        if (m = url.match(/^https?:\/\/github.com\/([^\/]*)\/([^\/]*)\/?$/))
        {
            url = "https://github.com/" + m[1] + "/" + m[2] + "/zipball/master";
        }

        DEBUG.print("URL: " + url);

        if (/\.json/.test(url))
        {
            self.downloader.getFileForURL(url, function(path)
            {
                DEBUG.print("Path: " + path);

                DEBUG.indent(di);

                callback(path);
            }, {
                verifyPackageDescriptor: false
            });
        }
        else
        {        
            self.downloader.getForArchive(url, function(path)
            {
                DEBUG.print("Path: " + path);
                
                // Look for program.json file. If it does not exist create a default one
                
                var descriptorPath = path + "/program.json";
                
                if (!API.FILE.exists(descriptorPath))
                {
                    DEBUG.print("Creating program descriptor at: " + descriptorPath);
                    
                    var id = API.FILE.dirname(descriptorPath.substring(self.downloader.basePath.length+1));
                    id = id.substring(0, id.length-8) + "/";
                    
                    var descriptor = {
                        "boot": id,
                        "packages": {}
                    };
                    descriptor.packages[id] = {
                        "locator": {
                            "location": "./"
                        }
                    };

                    API.FILE.write(descriptorPath, API.JSON.stringify(descriptor));
                }

                DEBUG.indent(di);

                callback(descriptorPath);
            }, {
                verifyPackageDescriptor: false
            });
        }
    }

    if (ENV.mustClean && !this.cleaned[this.downloader.basePath + "/downloads"])
    {
        this.cleaned[this.downloader.basePath + "/downloads"] = true;

        DEBUG.print("Removing downloaded packages from: " + this.downloader.basePath + "/downloads");

        SYSTEM.exec("rm -Rf " + this.downloader.basePath + "/downloads", function(stdout, stderr)
        {
            provisonProgram();
        });
    }
    else
        provisonProgram();    
}
