
var API = require("./api"),
    UTIL = API.UTIL,
    FILE = API.FILE,
    DEBUG = API.DEBUG,
    DESCRIPTORS = require("./descriptors"),
    CONTEXTS = require("./contexts");

var Program = exports.Program = function(descriptor)
{
    this.descriptor = descriptor;
    this.sourceDescriptors = [];
}

Program.prototype.discoverPackages = function(fetcher, callback, options)
{
    options = options || {};
    if (options.sourceDescriptors) {
        this.sourceDescriptors = options.sourceDescriptors;
    }

    DEBUG.print("Boot packages:");
    var di = DEBUG.indent() + 1;
    
    var cbt = new UTIL.CallbackTracker(callback);

    var self = this;
    self.descriptor.walkBoot(function(id)
    {
        DEBUG.indent(di).print("ID: " + id).indent(di+1);

        fetcher(self.descriptor.locatorForId(id, options), cbt.add(function(pkg, locator)
        {
            // This should only happen if locator points to a provider
//            if(!pkg)
//                return;

            DEBUG.indent(di+1).print("ID: \0cyan(" + locator.id + "\0)");
            DEBUG.indent(di+1).print("Path: \0cyan(" + (locator.location || pkg.path) + "\0)");
            if (pkg.discovering)
            {
                DEBUG.indent(di+1).print("... skip second pass ...");
                return;
            }

            pkg.discoverPackages(fetcher, cbt.add());
        }));
    });

    cbt.done();
}

Program.prototype.getProviderPackages = function()
{
    var self = this,
        packages =  {};
    self.descriptor.walkPackages(function(id, info)
    {
        if (typeof info.provider != "undefined")
        {
            packages[id] = info;
        }
    });
    return packages;
}

Program.prototype.getEngines = function()
{
    if (typeof this.descriptor.json.engine == "undefined")
        return false;
    return this.descriptor.json.engine;
}

Program.prototype.getBootPackages = function(assembler, callback)
{
    // TODO: Refactor as we will never have more than one boot package.
    var self = this,
        dependencies = [],
        i = 0;
    self.descriptor.walkBoot(function(id)
    {
        var dep = {};
        dep["_package-" + i] = self.descriptor.locatorForId(id, {
            sourceDescriptors: self.sourceDescriptors
        });
        dependencies.push(dep);
        i++;
    });
    if (typeof assembler !== "undefined" && typeof callback !== "undefined")
    {
    	self.resolveLocator(assembler, dependencies[0]["_package-0"], function(locator)
    	{
    		dependencies[0]["_package-0"] = locator;
    		callback(dependencies);
    	});
    }
    return dependencies;
}

Program.prototype.getContexts = function(sandbox)
{
    if (!this.contexts)
        this.contexts = new CONTEXTS.ProgramContext(this, sandbox);
    return this.contexts;
}

/**
 * Given any mappings locator return an absolute path location-based locator.
 */
Program.prototype.resolveLocator = function(assembler, locator, callback, options)
{
    var self = this;
    var descriptor = locator.descriptor;

    function finalize(locator)
    {
        if (locator.available !== false)
        {
            // Make sure location path is always absolute and clean
            if (locator.location)
            {
                if (locator.location.charAt(0) == "/")
                    locator.location = FILE.realpath(locator.location) + "/";
            }
            if ((typeof locator.available == "undefined" || locator.available === true) && typeof locator.provider == "undefined")
            {
            	if (typeof locator.pm !== "undefined")
            	{
            		// Let package manager resolve locator
            		
            		if (typeof options.pmLocatorResolver !== "function")
            			throw new Error("options.pmLocatorResolver not set!");

            		options.pmLocatorResolver(locator, callback);
            		return;
            	}
            	else
            	{
	                // If we do not have an absolute path location-based locator by now we cannot proceed
	                if (!locator.location || !API.FILE.isAbsolute(locator.location))
	                    throw new Error("Resolved locator is not absolute path location-based: " + UTIL.locatorToString(locator));
	    
	                // If locator specifies a path we add it to the location.
	                // This is typically needed to get the paths to packages in a multi-package archive
	                if (typeof locator.path != "undefined")
	                    locator.location = API.FILE.realpath(locator.location + "/" + locator.path) + "/";
	    
	                // Pass through the original descriptor unchanged
	                if (typeof descriptor != "undefined")
	                    locator.descriptor = descriptor;
            	}
            }
        }
        callback(locator);
    }
    
    if (typeof locator.archive != "undefined" && !locator.location)
    {
        var m;

        if (m = locator.archive.match(/^jar:(https?):\/\/([^!]*)!\/(.*?)(\/?)$/))
        {
            locator.id = m[2];
            locator.archive = m[1] + "://" + m[2];
            // Check if we are referring to a module that should be mapped to the alias
            if (/\.js$/.test(m[3]) && !m[4])
            {
                locator.module = "/" + m[3];
            }
            else
                locator.path = m[3]
            locator = this.descriptor.augmentLocator(locator, options);
        }
        else
        if (m = locator.archive.match(/^https?:\/\/(.*)$/))
        {
            if (typeof locator.id == "undefined")
                locator.id = m[1];
        }
        else
            throw new Error("Invalid archive URL: "+ locator.archive);

        assembler.downloader.getForArchive(locator.archive, function(path)
        {
            locator.location = path + "/";

            finalize(locator);
        }, {
            verifyPackageDescriptor: ((locator.resource===true)?false:true)
        });
        return;
    }
    else
    if (typeof locator.id != "undefined")
    {
        locator = this.descriptor.augmentLocator(locator, options);

        if (!locator.location &&
            (typeof locator.archive != "undefined" || typeof locator.catalog != "undefined"))
        {
            this.resolveLocator(assembler, locator, function(locator)
            {
                // Pass through the original descriptor unchanged
                if (typeof descriptor != "undefined")
                    locator.descriptor = descriptor;

                callback(locator);
            }, options);
            return;
        }
    }
    else
    if (typeof locator.catalog != "undefined")
    {
        locator = this.descriptor.augmentLocator(locator, options);

        // Only query catalog if program descriptor does not already set a location for the
        // package referenced by the locator.
        if (!locator.location)
        {
            assembler.downloader.getCatalogForURL(locator.catalog, function(path)
            {
                var catalogDescriptor = new DESCRIPTORS.Catalog(path);
    
                locator = catalogDescriptor.packageLocatorForLocator(locator);
    
                // NOTE: locator now contains an 'archive' property
                if (typeof locator.archive == "undefined")
                    throw new Error("Unable to resolve catalog-based locator.");

                self.resolveLocator(assembler, locator, callback);
            });
            return;
        }
    }
    else
    if (locator.available === false)
    {
        // do nothing
    }
    else
    if (locator.location)
    {
        // do nothing for now
    }
    else
    if (typeof locator.available != "undefined")
    {
        // do nothing for now
    }
    else
        throw new Error("NYI - " + UTIL.locatorToString(locator));

    finalize(locator);
}
