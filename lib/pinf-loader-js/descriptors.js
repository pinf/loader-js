// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api"),
    UTIL = API.UTIL,
    FILE = API.FILE,
    JSON = API.JSON;


// ######################################################################
// # Descriptor
// ######################################################################

var Descriptor = exports.Descriptor = function() {}

Descriptor.prototype.clone = function()
{
    // TODO: Make this more generic by using narwhals complete UTIL module?

    var self = this,
        descriptor = new self.cloneConstructor();
    UTIL.keys(self).forEach(function (key) {
        if (self.hasOwnProperty(key))
        {
            if (key == "json")
                descriptor[key] = UTIL.deepCopy(self[key]);
            else
                descriptor[key] = self[key];
        }
    });

    return descriptor;
}

Descriptor.prototype.load = function(path, create)
{
    if (this.filename && FILE.basename(path) != this.filename)
    {
        if (!/\/$/.test(path))
            path += "/";
        path += this.filename;
    }

    if (!/\.json$/.test(path))
        throw new Error("Descriptor file path does not end in '.json': " + path);

    this.path = path;
    if (create === true && !API.FILE.exists(this.path))
    {
        this.json = {};
        this.save(true);
    }

    function canonicalizePaths(json, path)
    {
        if (typeof json == "object")
        {
            for (var key in json)
            {
                if (typeof json[key] == "object")
                {
                    canonicalizePaths(json[key], path);
                }
                else
                if (typeof json[key] == "string")
                {
                    if (key == "location")
                    {
                        if (/^\.\.?\//.test(json[key]))
                        {
                            json[key] = API.FILE.realpath(path + "/" + json[key]);
                        }
                    }
                }
            }
        }
    }

    try
    {
        this.json = JSON.parse(FILE.read(this.path));
        canonicalizePaths(this.json, API.FILE.dirname(this.path));
    }
    catch(e)
    {
        throw new Error("Error parsing JSON file '" + this.path + "': " + e);
    }

    while(true)
    {
        if (typeof this.json["extends"] != "undefined")
        {
            // TODO: More generic locator resolving
            if (typeof this.json["extends"].location == "undefined")
                throw new Error("Extends locator must contain 'location' property in: " + this.path);

            var path = this.json["extends"].location;

            if (path.charAt(0) == ".")
                path = API.FILE.realpath(API.FILE.dirname(this.path) + "/" + path);

            if (!API.FILE.exists(path))
                throw new Error("File '" + path + "' not found; referenced by 'extends.location' property in: " + this.path);

            delete this.json["extends"];

            var json;
            try
            {
                json = JSON.parse(FILE.read(path));
            }
            catch(e)
            {
                throw new Error("Error parsing JSON file '" + path + "': " + e);
            }

            canonicalizePaths(json, API.FILE.dirname(path));

            // NOTE: This merge is not ideal in that it replaces arrays instead of merging them.
            this.json = API.UTIL.deepMerge(this.json, json);
        }
        else
            break;
    }
}

Descriptor.prototype.save = function(create)
{
    if (!(create === true) && !FILE.exists(this.path))
        throw new Error("Error saving descriptor. File does not exist: " + this.path);
    try
    {
        FILE.write(this.path, JSON.stringify(this.json, null, 4));
    }
    catch(e)
    {
        throw new Error("Error writing JSON file '" + this.path + "': " + e);
    }
}

Descriptor.prototype.validationError = function(message)
{
    return new Error("Validation Error (in " + this.path + "): " + message);
}

Descriptor.prototype._normalizeLocator = function(locator)
{
    if (typeof locator == "string")
    {
        // If a mapping locator is a simple string we need to determine if it is a
        // path, archive or ID
        if (/^(jar:)?https?:\/\//.test(locator))
        {
            locator = {
                "archive": locator
            };
        }
        else
        if (/^\.?\//.test(locator))
        {
            locator = {
                "location": locator
            };
        }
        else
        {
            locator = {
                "id": locator
            };
        }
    }

    if (typeof locator.location != "undefined")
    {
        if (locator.location.charAt(0) == ".")
            locator.location = FILE.realpath(FILE.dirname(this.path) + "/" + locator.location) + "/";
    }
    return locator;
}

Descriptor.prototype.toJSONObject = function()
{
    return this.json;
}



// ######################################################################
// # Program Descriptor
// ######################################################################

var Program = exports.Program = function(path)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Program;
    this.filename = "program.json";
    this.load(path);
    if (typeof this.json.uid != "undefined")
    {
        if (!this.json.uid.match(/^https?:\/\/(.*)\/$/))
            throw this.validationError("Value (" + this.json.uid + ") for property 'uid' is not a valid HTTP(s) URL");
    }
}
Program.prototype = new Descriptor();

Program.prototype.walkBoot = function(callback)
{
    if (typeof this.json.boot == "undefined")
        throw this.validationError("Property 'boot' is not defined");
    if (typeof this.json.boot == "string")
        callback(this._validateBoot(this.json.boot));
    else
    if (typeof this.json.boot == "array")
    {
        for (var i=0,ic=this.json.boot.length ; i<ic ; i++)
            callback(this._validateBoot(this.json.boot[i]));
    }
    else
        throw this.validationError("Property 'boot' must be a string or array of strings");
}

Program.prototype.walkPackages = function(callback)
{
    if (typeof this.json.packages == "undefined")
        return;
    if (typeof this.json.packages != "object")
        throw this.validationError("Property 'packages' must be an object");
    for (var id in this.json.packages)
        callback(id, UTIL.deepCopy(this.json.packages[id]));
}

Program.prototype._validateBoot = function(id)
{
    if (typeof this.json.packages == "undefined")
        throw this.validationError("Property 'packages' is not defined");
    if (typeof this.json.packages[id] == "undefined")
        throw this.validationError("Value (" + id + ") for property 'boot' not found as key in property 'packages'");
    return id;
}

Program.prototype.locatorForId = function(id)
{
    if (typeof this.json.packages == "undefined")
        throw this.validationError("Property 'packages' is not defined");
    if (typeof this.json.packages[id] == "undefined")
        throw this.validationError("Value (" + id + ") not found as key in property 'packages'");
    if (typeof this.json.packages[id].locator == "undefined")
        throw this.validationError("Package for id '" + id + "' does not specify a 'locator' property");
    return this._normalizeLocator(UTIL.deepCopy(this.json.packages[id].locator));
}

/**
 * Given a package locator we add or override any info we find for it.
 */
Program.prototype.augmentLocator = function(locator, options)
{
    if (typeof this.json.packages == "undefined")
        throw this.validationError("Property 'packages' is not defined");

    options = options || {};

    locator = UTIL.deepCopy(locator);

    var ids = [],
        enforce = false;

    function finalize(locator)
    {
        if (typeof options.sourceDescriptors != "undefined" && options.sourceDescriptors.length > 0)
        {
            for (var i=0, ic=options.sourceDescriptors.length, ret ; i<ic ; i++)
            {
                if (ret = options.sourceDescriptors[i].augmentLocator(locator))
                {
                    locator = ret;
                    break;
                }
            }
        }
        return locator;
    }        

    // First check if an ID matches exactly
    if (typeof locator.id != "undefined")
    {
        ids.push(locator.id);
        if (/\/$/.test(locator.id))
            ids.push(locator.id.substring(0, locator.id.length-1));
        enforce = true;
    }
    if (typeof locator.uid != "undefined")
    {
        ids.push(locator.uid);
        enforce = true;
    }
    if (typeof locator.catalog != "undefined")
    {
        var m;
        if (!(m = locator.catalog.match(/^https?:\/\/(.*)\.json$/)))
            throw new Error("Invalid catalog URL: "+ locator.catalog);
        var id = m[1] + ".json/" + locator.name + "/";
        if (typeof locator.revision != "undefined")
        {
            ids.push(id + locator.revision);
        }
        ids.push(id);
        enforce = true;
    }

    var found = false,
        foundId;
    for (var i=0,ic=ids.length ; i<ic ; i++ )
    {
        if (typeof this.json.packages[ids[i]] != "undefined")
        {
            foundId = ids[i];
            found = this.json.packages[foundId];
            break;
        }
    }

    if (!found)
    {
        // We only throw if package not found if we had a locator from which we could derive an ID
        // e.g. If we had a location only based locator we do not throw as we cannot find packages by path only
        if (enforce)
        {
            if (typeof options["discover-packages"] != "undefined" && options["discover-packages"])
            {
                // We are being asked to add the package
                this.json.packages[ids[0]] = {};
                foundId = ids[0];
                this.save();
            }
            else
                throw this.validationError("Derived package IDs '"+ids+"' for locator '"+UTIL.locatorToString(locator)+"' not found as key in property 'packages'");
        }
        else
            return finalize(locator);
    }

    if (typeof locator.id == "undefined")
        locator.id = foundId;

    if (typeof found.provider != "undefined")
    {
        return finalize(UTIL.deepMerge(locator, {"provider": found.provider}));
    }
    else
    {
        if (typeof found.descriptor != "undefined")
        {
            if (typeof found.locator == "undefined")
                found.locator = {};
            found.locator.descriptor = found.descriptor;
        }
        if (typeof found.locator == "undefined")
            return finalize(locator);

        return finalize(this._normalizeLocator(UTIL.deepMerge(locator, found.locator)));
    }
}


// ######################################################################
// # Package Descriptor
// ######################################################################

var Package = exports.Package = function(path)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Package;
    this.filename = "package.json";
    this.load(path);
    if (typeof this.json.uid != "undefined")
    {
        if (!this.json.uid.match(/^https?:\/\/(.*)\/$/))
            throw this.validationError("Value (" + this.json.uid + ") for property 'uid' is not a valid HTTP(s) URL");
    }
}
Package.prototype = new Descriptor();

Package.prototype.hasMappings = function()
{
    if (typeof this.json.mappings == "undefined")
        return false;
    return true;
}

Package.prototype.walkMappings = function(callback)
{
    if (typeof this.json.mappings == "undefined")
        return;
    if (typeof this.json.mappings != "object")
        throw this.validationError("Property 'mappings' must be an object");
    for (var alias in this.json.mappings)
        callback(alias, this._normalizeLocator(this.json.mappings[alias]));
}

Package.prototype.hasDependencies = function()
{
    if (typeof this.json.dependencies == "undefined" ||
        !Array.isArray(this.json.dependencies) ||
        this.json.dependencies.length == 0)
        return false;
    return true;
}

Package.prototype.walkDependencies = function(callback)
{
    if (typeof this.json.dependencies == "undefined")
        return;
    if (!Array.isArray(this.json.dependencies))
        throw this.validationError("Property 'dependencies' must be an array");
    if (this.json.dependencies.length == 0)
        return;
    for (var i=0,ic=this.json.dependencies.length ; i<ic ; i++)
    {
        if (typeof this.json.dependencies[i] == "object")
            callback(i, this._normalizeLocator(this.json.dependencies[i]));
    }
}

Package.prototype.moduleIdToLibPath = function(moduleId)
{
    var libDir = this.json.directories && this.json.directories.lib;
    if (typeof libDir != "string")
        libDir = "lib";
    return ((libDir)?libDir+"/":"") + moduleId;
}


// ######################################################################
// # Dummy Descriptor - used for resource packages that are not CommonJS packages
// ######################################################################

var Dummy = exports.Dummy = function(path)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Dummy;
    this.path = path;
    this.json = {};
}
Dummy.prototype = new Package();



// ######################################################################
// # Catalog Descriptor
// ######################################################################

var Catalog = exports.Catalog = function(path)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Catalog;
    this.filename = FILE.basename(path);
    this.load(path);
}
Catalog.prototype = new Descriptor();

Catalog.prototype.packageLocatorForLocator = function(locator)
{
    if (typeof locator.name == "undefined")
        throw new Error("Catalog-based locator does not specify 'name' property: " + UTIL.locatorToString(locator));

    if (typeof locator.version != "undefined")
    {
        throw new Error("NYI");
    }
    else
    if (typeof locator.revision != "undefined")
    {
        if (typeof this.json.packages[locator.name] == "undefined")
            throw new Error("Package with name '" + locator.name + "' not found in catalog: " + this.path);

        // First try and match by exact revision (revision == branch in git repo)
        if (typeof this.json.packages[locator.name][locator.revision] != "undefined")
        {
            if (!Array.isArray(this.json.packages[locator.name][locator.revision].repositories))
                throw new Error("'repositories' property not found or not array for package '" + locator.name + "' -> '" + locator.revision + "' in: " + this.path);
            
            var repo = this.json.packages[locator.name][locator.revision].repositories[0];
            if (typeof repo.download == "undefined")
                throw new Error("No 'repositories[0].download' property found for package '" + locator.name + "' -> '" + locator.revision + "' in: " + this.path);

            if (typeof repo.download.url == "undefined")
                throw new Error("No 'repositories[0].download.url' property found for package '" + locator.name + "' -> '" + locator.revision + "' in: " + this.path);

            var newLocator = UTIL.deepCopy(locator);

            newLocator.archive = repo.download.url.replace("{rev}", locator.revision);

            if (typeof repo.path != "undefined")
                newLocator.path = repo.path;

            return newLocator;
        }
        else
            throw new Error("NYI");
    }
    else
        throw new Error("NYI");
}


// ######################################################################
// # Sources Descriptor
// ######################################################################

var Sources = exports.Sources = function(path)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Sources;
    this.load(path);
}
Sources.prototype = new Descriptor();

Sources.prototype.augmentLocator = function(locator)
{
    if (typeof this.json.packages != "object" ||
        typeof locator.id == "undefined" ||
        typeof this.json.packages[locator.id] == "undefined" ||
        typeof this.json.packages[locator.id].source == "undefined")
        return false;
    if (typeof this.json.packages[locator.id].source.location == "undefined")
        throw new Error("Source locator for package '" + locator.id + "' must specify 'location' property in: " + this.path);

    if (this.json.packages[locator.id].source.location.charAt(0) != "/" &&
        !/^resource:\/\//.test(this.json.packages[locator.id].source.location))
        throw new Error("'location' property for source locator for package '" + locator.id + "' must be an absolute path (start with '/') in: " + this.path);

    locator = API.UTIL.deepCopy(locator);
    locator.location = this.json.packages[locator.id].source.location;
    if (!/\/$/.test(locator.location))
        locator.location += "/";
    return locator;
}



// ######################################################################
// # Routes Descriptor
// ######################################################################

var Routes = exports.Routes = function(path)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Routes;
    this.filename = ".pinf-routes.json";
    this.load(path, true);
}
Routes.prototype = new Descriptor();

Routes.prototype.ensureRoute = function(uri, info)
{
    if (typeof this.json.routes == "undefined")
        this.json.routes = {};
    this.json.routes[uri] = {
        locator: info.locator,
        modules: info.modules
    };
    this.save();
}
