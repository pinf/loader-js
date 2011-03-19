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

var Assembler = exports.Assembler = function(downloader)
{
    this.downloader = downloader;
    this.cleaned = [];
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
        if (uri.charAt(0) == "/")
            path = uri;
    
        var programDescriptor = new DESCRIPTORS.Program(path);
        
        var program = new PROGRAM.Program(programDescriptor);

        if (typeof programCallback != "undefined")
        {
            if (programCallback(program) === false)
                return;
        }

        sandbox.setProgram(program);
        sandbox.sourceDescriptors = options.sourceDescriptors || void 0;

        program.assembler = self;

        // This will download all packages and make them available on disk
        program.discoverPackages(function assembler_assembleProgram_lambda_discoverPackages_packageForLocator(locator, callback)
        {
            program.resolveLocator(self, locator, function(resolvedLocator)
            {
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
                if (typeof resolvedLocator.location == "undefined")
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
                if (!FILE.exists(resolvedLocator.location))
                {
                    throw new Error("This should not happen");
                }
                else
                {
                    callback(sandbox.ensurePackageForLocator(resolvedLocator, options), resolvedLocator);
                }
            });
            
        }, function assembler_assembleProgram_lambda_addPackageToProgram_done()
        {
            DEBUG.indent(di);
            for (var key in resolvedLocator)
                locator[key] = resolvedLocator[key];
            self.finalizeProgram(sandbox, program);
            callback(pkg);
        });
    });
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

Assembler.prototype.provisonProgramForURL = function(url, callback)
{
    var self = this;

    var di = DEBUG.indent();
    DEBUG.print("Provision program package:").indent(di+1);

    function provisonProgram()
    {
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
