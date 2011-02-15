// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api"),
    UTIL = API.UTIL,
    FILE = API.FILE,
    DEBUG = API.DEBUG;



/**
 * A special kind of package that calls handlers for various module tasks vs using native handlers
 */
var Package = exports.ProviderPackage = function(id, info)
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
}
Package.prototype.getIsNative = function()
{
    return false;
}
Package.prototype.requireModule = function(id)
{
    id = id.split("!/").pop();
    if (typeof API.ENV.packageProviders == "undefined")
        throw new Error("API.ENV.packageProviders not set. Needed by provider package '"+this.uid+"' for module '"+id+"'.");
    if (typeof API.ENV.packageProviders[this.uid] == "undefined")
        throw new Error("API.ENV.packageProviders not set for package '"+this.uid+"' needed for module '"+id+"'.");

    return API.ENV.packageProviders[this.uid].requireModule(id);
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
                "location": pkg.path + "/"
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
        return this.path + "/!/" + locator.descriptor.main;
    }
    if (typeof this.normalizedDescriptor.json.main == "undefined")
        throw new Error("Package at path '" + this.path + "' does not have the 'main' property set in its package descriptor.");
    return this.path + "/!/" + this.normalizedDescriptor.json.main;
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
