
var API = require("./api"),
    UTIL = API.UTIL,
    FILE = API.FILE,
    DEBUG = API.DEBUG,
    DESCRIPTORS = require("./descriptors");

var Program = exports.Program = function(descriptor)
{
    this.descriptor = descriptor;
}

Program.prototype.discoverPackages = function(fetcher, callback)
{
    DEBUG.print("Boot packages:");
    var di = DEBUG.indent() + 1;
    
    var cbt = new UTIL.CallbackTracker(callback);

    var self = this;
    self.descriptor.walkBoot(function(id)
    {
        DEBUG.indent(di).print("ID: " + id).indent(di+1);

        fetcher(self.descriptor.locatorForId(id), cbt.add(function(pkg)
        {
            // This should only happen if locator points to a provider
//            if(!pkg)
//                return;

            DEBUG.indent(di+1).print("Path: \0cyan(" + pkg.path + "\0)");
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

Program.prototype.getBootPackages = function()
{
    var self = this,
        dependencies = [],
        i = 0;
    self.descriptor.walkBoot(function(id)
    {
        var dep = {};
        dep["_package-" + i] = self.descriptor.locatorForId(id);
        dependencies.push(dep);
        i++;
    });
    return dependencies;
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
        // Make sure location path is always absolute and clean
        if (typeof locator.location != "undefined")
        {
            if (locator.location.charAt(0) == "/")
                locator.location = FILE.realpath(locator.location) + "/";
        }
        if ((typeof locator.available == "undefined" || locator.available === true) && typeof locator.provider == "undefined")
        {
            // If we do not have an absolute path location-based locator by now we cannot proceed
            if (typeof locator.location == "undefined" || locator.location.charAt(0) != "/")
                throw new Error("Resolved locator is not absolute path location-based: " + UTIL.locatorToString(locator));

            // If locator specifies a path we add it to the location.
            // This is typically needed to get the paths to packages in a multi-package archive
            if (typeof locator.path != "undefined")
                locator.location = API.FILE.realpath(locator.location + "/" + locator.path) + "/";
    
            // Pass through the original descriptor unchanged
            if (typeof descriptor != "undefined")
                locator.descriptor = descriptor;
        }
        callback(locator);
    }
    
    if (typeof locator.archive != "undefined")
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
        });
        return;
    }
    else
    if (typeof locator.catalog != "undefined")
    {
        locator = this.descriptor.augmentLocator(locator, options);

        // Only query catalog if program descriptor does not already set a location for the
        // package referenced by the locator.
        if (typeof locator.location == "undefined")
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
    if (typeof locator.id != "undefined")
    {
        locator = this.descriptor.augmentLocator(locator, options);

        if (typeof locator.location == "undefined" &&
            (typeof locator.archive != "undefined" || typeof locator.catalog != "undefined"))
        {
            this.resolveLocator(assembler, locator, finalize, options);
            return;
        }
    }
    else
    if (typeof locator.location != "undefined")
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
