
var API = require("./api"),
    UTIL = API.UTIL,
    FILE = API.FILE,
    DEBUG = API.DEBUG;

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
Program.prototype.resolveLocator = function(assembler, locator, callback)
{
    var descriptor = locator.descriptor;
    function finalize(locator)
    {
        // If we do not have an absolute path location-based locator by now we cannot proceed
        if (typeof locator.location == "undefined" || locator.location.charAt(0) != "/")
            throw new Error("Resolved locator is not absolute path location-based: " + UTIL.locatorToString(locator));

        // Pass through the descriptor unchanged
        if (typeof descriptor != "undefined")
            locator.descriptor = descriptor;

        callback(locator);
    }
    
    if (typeof locator.location != "undefined")
    {
        // NOTE: Before a location-based locator can be checked against the packages (in descriptor)
        //       we must have a UID. To get it we look at the given location and load
        //       the package descriptor.
        // TODO: Look at package descriptor to get UID then check against declared packages
        // TODO: Use various resolution techniques if UID not found
        if (locator.location.charAt(0) != "/")
        {
            throw new Error("NYI");
        }
        locator.location = FILE.realpath(locator.location) + "/";
    }
    else
    if (typeof locator.id != "undefined")
    {
        locator = this.descriptor.locatorForId(locator.id);
    }
    else
    if (typeof locator.catalog != "undefined")
    {
        var m;
        if (!(m = locator.catalog.match(/^https?:\/\/(.*)\.json$/)))
            throw new Error("Invalid catalog URL: "+ locator.catalog);
        var id = m[1] + ".json/" + locator.name + "/";
        locator = this.descriptor.locatorForId(id);
    }
    else
    if (typeof locator.archive != "undefined")
    {
        var m;
        if (!(m = locator.archive.match(/^https?:\/\/(.*)$/)))
            throw new Error("Invalid archive URL: "+ locator.archive);

        assembler.downloader.getForArchive(locator.archive, function(path)
        {
            locator.id = m[1];
            locator.location = path + "/";

            finalize(locator);
        });
        return;
    }
    else
        throw new Error("NYI");

    finalize(locator);
}
