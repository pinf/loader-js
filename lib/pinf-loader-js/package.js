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



var Package = exports.Package = function(descriptor, options)
{
    options = options || {};
    options.platform = options.platform || API.ENV.platform;
    this.descriptor = descriptor;
    this.path = FILE.dirname(this.descriptor.path);
    this.discovering = false;
    this.normalizedDescriptor = this.descriptor.clone();
    if (typeof this.descriptor.json.overlay != "undefined")
    {
        if (typeof this.descriptor.json.overlay["pinf:" + options.platform] != "undefined")
        {
            this.normalizedDescriptor.json = API.UTIL.deepMerge(this.normalizedDescriptor.json, this.descriptor.json.overlay["pinf:" + options.platform]);
        }
    }
    if (typeof this.normalizedDescriptor.json.uid != "undefined")
    {
        this.uid = this.normalizedDescriptor.json.uid.match(/^\w*:\/\/(.*)\/$/)[1] + "/";
    }
    this.preloaders = null;
    if (typeof this.normalizedDescriptor.json.engine != "undefined")
    {
        if (this.normalizedDescriptor.json.engine.indexOf(API.ENV.platform) === -1)
            throw new Error("Cannot run package '"+this.path+"' (supporting engines '"+this.normalizedDescriptor.json.engine+"') on platform '" + API.ENV.platform + "'");
    }
    if (typeof this.descriptor.json.scripts != "undefined")
    {
        this.normalizedDescriptor.json.scripts = {};
        for (var script in this.descriptor.json.scripts)
        {
            if (typeof this.descriptor.json.scripts[script] == "object")
            {
                var locator = this.descriptor.json.scripts[script];
                if (locator.location)
                {
                    if (locator.location.charAt(0) == ".")
                    {
                        locator.location = FILE.realpath(this.path + "/" + locator.location);
                    }
                }
                this.normalizedDescriptor.json.scripts[script] = locator;
            }
            else
                this.normalizedDescriptor.json.scripts[script] = this.descriptor.json.scripts[script];
        }
    }
}

Package.prototype.getHashId = function()
{
    if (!this.hashId) {
        if (this.uid) {
            this.hashId = require("./md5").md5(this.uid);
        } else {
            this.hashId = require("./md5").md5(this.path);
        }
        this.hashId = this.hashId.toUpperCase();
    }
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
                if (typeof pkg.getHashId == "function")
                    DEBUG.indent(di+1).print("HashID: \0cyan(" + pkg.getHashId() + "\0)");

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
    if (locator && typeof locator != "undefined" && typeof locator.module != "undefined")
    {
        if (locator.module.charAt(0) == "/")
        {
            id = this.path + "@" + locator.module;
        }
        else
            throw new Error("NYI");
    }
    else
    if (locator && typeof locator != "undefined" && typeof locator.descriptor != "undefined" && typeof locator.descriptor.main != "undefined")
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
    else
    {
        id = this.path + "@/" + this.normalizedDescriptor.json.main;
    }
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

Package.prototype.getResourcesDir = function(locator)
{
    if (typeof locator != "undefined" &&
        typeof locator.descriptor != "undefined" &&
        typeof locator.descriptor.directories != "undefined" &&
        typeof locator.descriptor.directories.resources != "undefined")
    {
        return locator.descriptor.directories.resources;
    }
    if (this.normalizedDescriptor.json.directories && this.normalizedDescriptor.json.directories.resources)
        return this.normalizedDescriptor.json.directories.resources;
    return "resources";
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
    if (API.FILE.exists(path))
        return true;
//    if (!/\/[^\.]*\.[\w\d]*$/.test(path)) // will not match 'history.html4' which should yield 'history.html4.js'
    if (!/\.js$/.test(path))
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
//    if (!/\/[^\.]*\.[\w\d]*$/.test(path)) // will not match 'history.html4' which should yield 'history.html4.js'
    if (!/\.js$/.test(path))
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
            if (!API.FILE.exists(context.resourcePath))
                throw new Error("Error loading resource URI '" + resourceURI + "' from resource PATH '" + context.resourcePath + "'. File not found");
            data = API.FILE.read(context.resourcePath);
        }
        catch(e)
        {
            throw new Error("Error loading resource URI '" + resourceURI + "' from resource PATH '" + context.resourcePath + "'. Error: " + e + "\n" + e.stack);
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
