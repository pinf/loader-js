// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api"),
    UTIL = API.UTIL,
    FILE = API.FILE,
    DEBUG = API.DEBUG;



/**
 * A special kind of package that calls handlers for various module tasks vs using native handlers
 */
var ProviderPackage = exports.ProviderPackage = function(id, info)
{
    this.descriptor = null;
    this.path = id;
    this.discovering = true;
    this.normalizedDescriptor = {
        toJSONObject: function()
        {
            return {
                "directories": {
                    "lib": ""
                }
            };
        }
    };
    this.uid = id;
    this.isProviderPackage = true;
    this.providerId = info.provider;
}
ProviderPackage.prototype.getIsNative = function()
{
    return false;
}
ProviderPackage.prototype.requireModule = function(id)
{
    id = id.split("@/").pop();
    if (typeof API.ENV.packageProviders == "undefined")
        throw new Error("API.ENV.packageProviders not set. Needed by provider package '"+this.uid+"' for provider '"+this.providerId+"' for module '"+id+"'.");
    if (typeof API.ENV.packageProviders[this.providerId] == "undefined")
        throw new Error("API.ENV.packageProviders not set for id '"+this.providerId+"' needed for module '"+id+"'.");

    return API.ENV.packageProviders[this.providerId].requireModule(id);
}

ProviderPackage.prototype.getModuleSource = function(sandbox, resourceURI, callback)
{
    var id = resourceURI.split("@/").pop();
    if (typeof API.ENV.packageProviders == "undefined")
        throw new Error("API.ENV.packageProviders not set. Needed by provider package '"+this.uid+"' for provider '"+this.providerId+"' for module '"+id+"'.");
    if (typeof API.ENV.packageProviders[this.providerId] == "undefined")
        throw new Error("API.ENV.packageProviders not set for id '"+this.providerId+"' needed for module '"+id+"'.");

    return API.ENV.packageProviders[this.providerId].getModuleSource(sandbox, resourceURI, callback);
}



var Package = exports.Package = function(descriptor)
{
    this.descriptor = descriptor;
    this.path = FILE.dirname(this.descriptor.path);
    this.discovering = false;
    this.normalizedDescriptor = this.descriptor.clone();
    if (typeof this.normalizedDescriptor.json.uid != "undefined")
    {
        this.uid = this.normalizedDescriptor.json.uid.match(/^https?:\/\/(.*)\/$/)[1] + "/";
    }
    this.preloaders = null;
    if (typeof this.normalizedDescriptor.json.engine != "undefined")
    {
        if (this.normalizedDescriptor.json.engine.indexOf(API.ENV.platform) === -1)
            throw new Error("Cannot run package '"+this.path+"' (supporting engines '"+this.normalizedDescriptor.json.engine+"') on platform '" + API.ENV.platform + "'");
    }
}

Package.prototype.getHashId = function()
{
    if (!this.hashId)
        this.hashId = require("./sha1").hex_sha1(this.path);
    return this.hashId;
}

Package.prototype.discoverPackages = function(fetcher, callback)
{
    this.discovering = true;
    var self = this;

    var cbt = new UTIL.CallbackTracker(callback);

    var di = DEBUG.indent() + 1;

    if (!this.normalizedDescriptor.hasMappings())
    {
        DEBUG.indent(di-1).print("Mappings: None");
    }
    else
    {
        DEBUG.indent(di-1).print("Mappings:");
        
        self.normalizedDescriptor.walkMappings(function(alias, locator)
        {
            DEBUG.indent(di).print("\0yellow(" + alias + "\0) <- " + UTIL.locatorToString(locator)).indent(di+1);
    
            fetcher(locator, cbt.add(function(pkg, locator)
            {
                // This may happen if locator specifies "available" = false
                if(!pkg)
                    return;
    
                DEBUG.indent(di+1).print("ID: \0cyan(" + locator.id + "\0)");
                DEBUG.indent(di+1).print("Path: \0cyan(" + (locator.location || pkg.path) + "\0)");

                if (typeof self.normalizedDescriptor.json.mappings[alias] != "object")
                    self.normalizedDescriptor.json.mappings[alias] = {};

                // Update the mapping locator to be absolute path location-based
                self.normalizedDescriptor.json.mappings[alias].location = pkg.path;
    
                if (typeof locator.module != "undefined")
                {
                    self.normalizedDescriptor.json.mappings[alias].module = locator.module;
                }
    
                if (pkg.discovering)
                {
                    DEBUG.indent(di+1).print("... skip second pass ...");
                    return;
                }
    
                pkg.discoverPackages(fetcher, cbt.add());
            }));
        });
    }

    if (!this.normalizedDescriptor.hasDependencies())
    {
        DEBUG.indent(di-1).print("Dependencies: None");
    }
    else
    {
        DEBUG.indent(di-1).print("Dependencies:");

        self.normalizedDescriptor.walkDependencies(function(index, locator)
        {
            DEBUG.indent(di).print("\0yellow([" + index + "]\0) <- " + UTIL.locatorToString(locator)).indent(di+1);

            fetcher(locator, cbt.add(function(pkg, locator)
            {
                // This may happen if locator specifies "available" = false
                if(!pkg)
                    return;
    
                DEBUG.indent(di+1).print("ID: \0cyan(" + locator.id + "\0)");
                DEBUG.indent(di+1).print("Path: \0cyan(" + (locator.location || pkg.path) + "\0)");

                if (typeof self.normalizedDescriptor.json.dependencies[index] != "object")
                    self.normalizedDescriptor.json.dependencies[index] = {};

                // Update the mapping locator to be absolute path location-based
                self.normalizedDescriptor.json.dependencies[index].location = pkg.path;

                if (pkg.discovering)
                {
                    DEBUG.indent(di+1).print("... skip second pass ...");
                    return;
                }
                pkg.discoverPackages(fetcher, cbt.add());
            }));
        });
    }

    cbt.done();
}

Package.prototype.getMainId = function(locator, silent)
{
    var id;
    if (typeof locator != "undefined" && typeof locator.descriptor != "undefined" && typeof locator.descriptor.main != "undefined")
    {
        id = this.path + "@/" + locator.descriptor.main;
    }
    else
    if (typeof this.normalizedDescriptor.json.main == "undefined")
    {
        if (silent)
            return false;
        throw new Error("Package at path '" + this.path + "' does not have the 'main' property set in its package descriptor.");
    }
    id = this.path + "@/" + this.normalizedDescriptor.json.main;
    if (!/\.js$/.test(id))
        id += ".js";
    return API.FILE.realpath(id);
}

/**
 * For dependencies that have a main module set and are accessed by name
 * 
 * NOTE: This assumes packages are extracted on a writable filesystem
 */
Package.prototype.ensureMainIdModule = function(locator)
{
    var mainId = this.getMainId(locator, true);
    if (!mainId)
        return;
    var mainPath = mainId.replace("@/", "/");
    if (!API.FILE.exists(mainPath))
        throw new Error("Main module not found at: " + mainPath);
    if (typeof this.normalizedDescriptor.json.name != "string")
        throw new Error("No package name specified (needed for determining package module) for package: " + this.path);
    var pkgModulePath = API.FILE.realpath(this.path + "/" + this.normalizedDescriptor.json.name + ".js");
    if (API.FILE.exists(pkgModulePath))
        return true;
    var relMainPath = "." + mainPath.substring(API.FILE.dirname(pkgModulePath).length);
    // NOTE: This has only been tested with the 'node' platform
    API.FILE.write(pkgModulePath, 'module.exports = require("' + relMainPath + '");');
    return true;
}

Package.prototype.getIsNative = function(locator)
{
    if (typeof locator != "undefined" && typeof locator.descriptor != "undefined" && typeof locator.descriptor["native"] != "undefined")
    {
        throw new Error("NYI");
    }
    if (typeof this.normalizedDescriptor.json["native"] != "undefined")
        return this.normalizedDescriptor.json["native"];
    return false;
}

Package.prototype.getLibDir = function(locator)
{
    if (typeof locator != "undefined" &&
        typeof locator.descriptor != "undefined" &&
        typeof locator.descriptor.directories != "undefined" &&
        typeof locator.descriptor.directories.lib != "undefined")
    {
        return locator.descriptor.directories.lib;
    }
    if (this.normalizedDescriptor.json.directories && this.normalizedDescriptor.json.directories.lib)
        return this.normalizedDescriptor.json.directories.lib;
    return "lib";
}

Package.prototype.moduleSourceExists = function(resourceURI)
{
    var modulePath = resourceURI,
        parts = resourceURI.split("@/");
    if (parts.length == 2)
    {
        if (parts[0].replace(/\/$/, "") != this.path)
            throw new Error("Cannot require module '" + resourceURI + "' from package '" + this.path + "'");
        modulePath = parts[1];
    }
    var path = this.path + "/" + modulePath;
    if (!/\/[^\.]*\.[\w\d]*$/.test(path))
        path += ".js";
    return API.FILE.exists(path);
}

/**
 * Get the source code of a module calling all preloaders if applicable.
 */
Package.prototype.getModuleSource = function(sandbox, resourceURI, callback)
{
    resourceURI = resourceURI.replace(/^\w*!/, "");

    var modulePath = resourceURI,
        parts = resourceURI.split("@/");
    if (parts.length == 2)
    {
        if (parts[0].replace(/\/$/, "") != this.path)
            throw new Error("Cannot require module '" + resourceURI + "' from package '" + this.path + "'");
        modulePath = parts[1];
    }

    var path = this.path + "/" + modulePath;
    if (!/\/[^\.]*\.[\w\d]*$/.test(path))
        path += ".js";

    var context = {
        pkgPath: this.path,
        resourcePath: path,
        api: {
            file: {
                read: API.FILE.read,
                exists: API.FILE.exists
            }
        }
    };

    var self = this;

    var cbt = new UTIL.CallbackTracker(function()
    {
        if (self.preloaders)
        {
            var ret;
            for (var i=0,ic=self.preloaders.length ; i<ic ; i++ )
            {
                if (typeof self.preloaders[i].getModuleSource != "undefined")
                {
                    ret = self.preloaders[i].getModuleSource(context, modulePath);
                    if (typeof ret != "undefined")
                    {
                        callback(ret);
                        return;
                    }
                }
            }
        }
        var data;
        try {
            data = API.FILE.read(context.resourcePath);
        }
        catch(e)
        {
            throw new Error(e.stack + "\nError loading resource URI '" + resourceURI + "'.");
        }
        callback(data);
    });

    if (!self.preloaders && typeof self.normalizedDescriptor.json.preload != "undefined")
    {
        self.preloaders = [];
        self.normalizedDescriptor.json.preload.forEach(function(moduleId)
        {
            // NOTE: This calls the preload module in the context of the same sandbox
            //       as the program.
            // TODO: Do this in an isolated context?
            self.loadRequireModule(sandbox, moduleId, cbt.add(function(module)
            {
                self.preloaders.push(module.main(context));
            }));
        });
    }

    cbt.done();
}

/**
 * Load the given module (resolving all dependencies) and require() it
 */
Package.prototype.loadRequireModule = function(sandbox, moduleId, callback)
{
    // TODO: Match mappings if applicable

    if (moduleId.charAt(0) == ".")
    {
        if (moduleId.charAt(1) != "/")
            throw new Error("ModuleId must begin with './' if relative to package root.");
        moduleId = moduleId.substring(2);
    }
    else
        moduleId = this.normalizedDescriptor.moduleIdToLibPath(moduleId);

    var self = this;

    sandbox.loader.bravojs.module.load(self.path + "/@/" + moduleId, function(id)
    {
        callback(sandbox.loader.bravojs.require(id));       
    });
}
