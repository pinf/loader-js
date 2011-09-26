// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api"),
    UTIL = require("./util"),
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
    API.UTIL.keys(self).forEach(function (key) {
        if (self.hasOwnProperty(key))
        {
            if (key == "json")
                descriptor[key] = API.UTIL.deepCopy(self[key]);
            else
                descriptor[key] = self[key];
        }
    });

    return descriptor;
}

Descriptor.prototype.load = function(path, create, options, callback)
{
    options = options || {};

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

    try {
        this.json = JSON.parse(FILE.read(this.path));
    } catch(e) {
        throw new Error("Error parsing JSON file '" + this.path + "': " + e);
    }
    
    var localPath = this.path.replace(/\.json$/, ".local.json");
    if (FILE.exists(localPath)) {
        try {
            this.json = API.UTIL.deepMerge(this.json, JSON.parse(FILE.read(localPath)));
        } catch(e) {
            throw new Error("Error parsing JSON file '" + this.path + "': " + e);
        }
    }

    canonicalizePaths(this.json, API.FILE.dirname(this.path));
    
    var self = this;

    function mergeExtended(extendsLocator, doneMergingCallback)
    {
        // TODO: More generic locator resolving
        if (!extendsLocator.location)
            throw new Error("Extends locator must contain 'location' property in: " + self.path);

        if (options.sourceDescriptors)
        {
        	var found = false;
        	options.sourceDescriptors.forEach(function(descriptor)
        	{
        		if (found) return;
        		var ret = descriptor.augmentLocator(extendsLocator);
        		if (ret) {
        			extendsLocator = ret;
        			found = true;
        		}
        	});
        }
        
        var path = extendsLocator.location;

        if (path.charAt(0) == ".")
            path = API.FILE.realpath(API.FILE.dirname(self.path) + "/" + path);

        function doMergeExtended(path)
        {
            if (!API.FILE.exists(path))
                throw new Error("File '" + path + "' not found; referenced by 'extends.location' property in: " + self.path);
    
            delete self.json["extends"];
    
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
            self.json = API.UTIL.deepMerge(json, self.json);
            
            if (typeof self.json["extends"] != "undefined")
            {
    			traverseExtends(self.json["extends"], function()
    			{
    				doneMergingCallback();
    			});
                
            } else {
                doneMergingCallback();
            }
        }

        if (/^\w*:\/\//.test(path)) {
            API.ENV.assembler.downloader.getFileForURL(/* url */ path, function(path)
            {
            	// TODO: Ensure remote file does not have relative links or load relative links if applicable
                doMergeExtended(path);
            });
        } else {
            doMergeExtended(path);
        }
    }
    
    function traverseExtends(locators, traverseExtendsCallback)
    {
    	if (UTIL.isArrayLike(locators))
    	{
    		var mc = locators.length;
    		locators.forEach(function(locator)
    		{
                mergeExtended(locator, function()
                {
        			mc--;
                    if (mc === 0 && typeof traverseExtendsCallback === "function")
                    	traverseExtendsCallback();
                });
    		});
    	}
    	else
    	{
            mergeExtended(locators, function()
            {
                if (typeof traverseExtendsCallback === "function")
                	traverseExtendsCallback();
            });
    	}
    }
    
    function mergeFinal()
    {
        if (typeof self.json["extends"] != "undefined")
        {
			traverseExtends(self.json["extends"], function()
			{
	            if (typeof callback === "function")
	                callback();
			});

        } else {
            if (typeof callback === "function")
                callback();
        }
    }
    
    if (typeof options.extendsDescriptorJSON === "object") {
        this.json = API.UTIL.deepMerge(this.json, options.extendsDescriptorJSON);
    }

    // TODO: Rename options.extendsProgramDescriptorPath to options.extendsDescriptorPath
    if (options.extendsProgramDescriptorPath)
    {
        var previousExtends = this.json["extends"];
        // NOTE: options.extendsProgramDescriptorPath may NOT be a URL (must be absolute local path)
        //       If it is a URL the mergeExtended for the original "extends" may fails due to a race condition
        mergeExtended({
            location: options.extendsProgramDescriptorPath
        }, function()
        {
            if (typeof previousExtends !== "undefined") {
                self.json["extends"] = previousExtends;
            }
            mergeFinal();
        });
    } else {
        mergeFinal();
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

    if (locator.location)
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

var Program = exports.Program = function(path, options, callback)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Program;
    this.filename = "program.json";
    var self = this;
    this.load(path, false, options, function()
    {
        if (typeof self.json.uid != "undefined")
        {
            if (!self.json.uid.match(/^https?:\/\/(.*)\/$/))
                throw this.validationError("Value (" + self.json.uid + ") for property 'uid' is not a valid HTTP(s) URL");
        }
        
        if (self.json.packages)
        {
        	for (var id in self.json.packages)
        	{
        		if (self.json.packages[id].locator && self.json.packages[id].locator.pm)
        		{
        			if (self.json.packages[id].locator.pm === "npm" && API.ENV.platform === "node")
        			{
        				if (!self.json.packages[id].descriptor)
        					self.json.packages[id].descriptor = {};
        				self.json.packages[id].descriptor.uid = "http://" + id;
        				self.json.packages[id].descriptor.native = true;
        			}
        		}
        	}
        }

        if (typeof callback === "function")
            callback(self);
    });
}
Program.prototype = new Descriptor();

Program.prototype.walkBoot = function(callback)
{
    if (typeof this.json.boot == "undefined")
        throw this.validationError("Property 'boot' is not defined");
    if (typeof this.json.boot == "boolean") {
    	if (this.json.boot !== false)
            throw this.validationError("Property 'boot' must be set to a string or `false`");
        callback(false);
    } else
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
        callback(id, API.UTIL.deepCopy(this.json.packages[id]));
}

Program.prototype._validateBoot = function(id)
{
    if (typeof this.json.packages == "undefined")
        throw this.validationError("Property 'packages' is not defined");
    if (typeof this.json.packages[id] == "undefined")
        throw this.validationError("Value (" + id + ") for property 'boot' not found as key in property 'packages'");
    return id;
}

Program.prototype.locatorForId = function(id, options)
{
    if (typeof this.json.packages == "undefined")
        throw this.validationError("Property 'packages' is not defined");
    if (typeof this.json.packages[id] == "undefined")
        throw this.validationError("Value (" + id + ") not found as key in property 'packages'");
    if (typeof this.json.packages[id].locator == "undefined")
        throw this.validationError("Package for id '" + id + "' does not specify a 'locator' property");
//    return this._normalizeLocator(UTIL.deepCopy(this.json.packages[id].locator));
    return this.augmentLocator({
        id: id
    }, options);
}

/**
 * Given a package locator we add or override any info we find for it.
 */
Program.prototype.augmentLocator = function(locator, options)
{
    if (typeof this.json.packages == "undefined")
        throw this.validationError("Property 'packages' is not defined");

    options = options || {};

    locator = API.UTIL.deepCopy(locator);

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
        // We also do not throw if the package is marked as not available
    	// We also do not throw if the locator points to a catalog as the catalog may not be downloaded yet or not mapped by the catalog ID
        if (enforce && (typeof locator.available === "undefined" || locator.available !== false) && typeof locator.catalog === "undefined")
        {
            if (typeof options["discover-packages"] != "undefined" && options["discover-packages"])
            {
                // We are being asked to add the package
                this.json.packages[ids[0]] = {};
                foundId = ids[0];
                this.save();
            }
            else
                throw this.validationError("Derived package IDs '"+ids+"' for locator '"+API.UTIL.locatorToString(locator)+"' not found as key in property 'packages': " + Object.keys(this.json.packages));
        }
        else
            return finalize(locator);
    }

    if (typeof locator.id == "undefined")
        locator.id = foundId;

    if (typeof found.provider != "undefined")
    {
        return finalize(API.UTIL.deepMerge(locator, {"provider": found.provider}));
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

        return finalize(this._normalizeLocator(API.UTIL.deepMerge(locator, found.locator)));
    }
}


// ######################################################################
// # Package Descriptor
// ######################################################################

var Package = exports.Package = function(path, options)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Package;
    this.filename = "package.json";
    var self = this;
    this.load(path, false, options, function()
    {
        if (typeof self.json.uid != "undefined")
        {
            if (!self.json.uid.match(/^\w*:\/\/(.*)\/$/))
                throw self.validationError("Value (" + self.json.uid + ") for property 'uid' is not a valid URI!");
        }
    });
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

var Dummy = exports.Dummy = function(path, options)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Dummy;
    this.path = path;
    this.json = {};
    if (typeof options.extendsDescriptorJSON === "object") {
        this.json = API.UTIL.deepMerge(this.json, options.extendsDescriptorJSON);
    }
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
        throw new Error("Catalog-based locator does not specify 'name' property: " + API.UTIL.locatorToString(locator));

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

            var newLocator = API.UTIL.deepCopy(locator);

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
	if (typeof locator.location !== "undefined" &&
		typeof this.json.locations === "object" &&
    	typeof this.json.locations[locator.location] === "object" &&
    	typeof this.json.locations[locator.location].source === "object")
	{
	    if (!this.json.locations[locator.location].source.location)
	        throw new Error("Source locator for location '" + locator.location + "' must specify 'location' property in: " + this.path);
	    
	    locator = API.UTIL.deepCopy(locator);
	    locator.location = this.json.locations[locator.location].source.location;
	    return locator;
	}

    if (typeof this.json.packages != "object" ||
        typeof locator.id == "undefined" ||
        typeof this.json.packages[locator.id] == "undefined" ||
        typeof this.json.packages[locator.id].source == "undefined")
        return false;
    if (!this.json.packages[locator.id].source.location)
        throw new Error("Source locator for package '" + locator.id + "' must specify 'location' property in: " + this.path);

    if (this.json.packages[locator.id].source.location.charAt(0) != "/" &&
        !/^resource:\/\//.test(this.json.packages[locator.id].source.location))
        throw new Error("'location' property for source locator for package '" + locator.id + "' must be an absolute path (start with '/') in: " + this.path);

    locator = API.UTIL.deepCopy(locator);
    locator.location = this.json.packages[locator.id].source.location;
    if (!/\/$/.test(locator.location))
        locator.location += "/";
    if (typeof this.json.packages[locator.id].source.path !== "undefined")
    	locator.path = this.json.packages[locator.id].source.path;
    return locator;
}


var WorkspaceSources = exports.WorkspaceSources = function(basePath)
{
    this.basePath = basePath;
}

WorkspaceSources.prototype.augmentLocator = function(locator)
{
	if (typeof locator !== "object" || typeof locator.id === "undefined")
		return locator;

	// TODO: check against branch directories if applicable

	if (API.FILE.exists(this.basePath + "/" + locator.id))
	{
	    locator = API.UTIL.deepCopy(locator);
	    locator.location = (this.basePath + "/" + locator.id).replace(/\/$/, "");
		return locator;
	}

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
