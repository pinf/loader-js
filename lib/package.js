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
}

Package.prototype.discoverMappings = function(fetcher, callback)
{
    this.discovering = true;

    if (!this.descriptor.hasMappings())
    {
        DEBUG.print("Mappings: None");
        callback();
        return;
    }
    
    DEBUG.print("Mappings:");
    var di = DEBUG.indent() + 1;

    var cbt = new UTIL.CallbackTracker(callback);

    var self = this;

    self.descriptor.walkMappings(function(alias, locator)
    {
        DEBUG.indent(di).print("\0yellow(" + alias + "\0) <- " + UTIL.locatorToString(locator)).indent(di+1);

        fetcher(locator, cbt.add(function(pkg)
        {
            // This should only happen if locator points to a provider
//            if(!pkg)
//                return;

            DEBUG.indent(di+1).print("Path: \0cyan(" + pkg.path + "\0)");

            // Update the mapping locator to be absolute path location-based
            self.normalizedDescriptor.json.mappings[alias] = {
                "location": pkg.path // + "/"
            };

            if (pkg.discovering)
            {
                DEBUG.indent(di+1).print("... skip second pass ...");
                return;
            }

            pkg.discoverMappings(fetcher, cbt.add());
        }));
    });

    cbt.done();
}

Package.prototype.getMainId = function(locator)
{
    if (typeof locator.descriptor != "undefined" && typeof locator.descriptor.main != "undefined")
    {
        return this.path + "/@/" + locator.descriptor.main;
    }
    if (typeof this.normalizedDescriptor.json.main == "undefined")
        throw new Error("Package at path '" + this.path + "' does not have the 'main' property set in its package descriptor.");
    return this.path + "/@/" + this.normalizedDescriptor.json.main;
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


/**
 * Get the source code of a module calling all preloaders if applicable.
 */
Package.prototype.getModuleSource = function(sandbox, resourceURI, callback)
{
    var modulePath = resourceURI,
        parts = resourceURI.split("@/");
    if (parts.length == 2)
    {
        if (parts[0].replace(/\/$/, "") != this.path)
            throw new Error("Cannot require module '" + resourceURI + "' from package '" + this.path + "'");
        modulePath = parts[1];
    }

    var context = {
        pkgPath: this.path,
        resourcePath: this.path + "/" + modulePath + ((/\.js$/.test(modulePath))?"":".js"),
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
        callback(API.FILE.read(context.resourcePath));
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
