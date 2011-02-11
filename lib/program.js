
var API = require("./api"),
    UTIL = API.UTIL,
    FILE = API.FILE,
    DEBUG = API.DEBUG,
    DESCRIPTORS = require("./descriptors"),
    PACKAGE = require("./package");

var Program = exports.Program = function(descriptor)
{
    this.descriptor = descriptor;
    this.packages = {};
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

            pkg.discoverMappings(self, fetcher, cbt.add());
        }));
    });

    cbt.done();
}

/**
 * Create or get existing package for path
 */
Program.prototype.ensurePackageForLocator = function(locator)
{
    var path = locator.location;
    if (typeof this.packages[path] == "undefined")
    {
        this.packages[path] = new PACKAGE.Package(new DESCRIPTORS.Package(path));

        // If package has a UID set we also index our packages by it
        // TODO: Add version to key if applicable
        if (typeof this.packages[path].uid != "undefined")
        {
            locator.uid = this.packages[path].uid;
            this.packages[this.packages[path].uid] = this.packages[path];
        }

        // If locator has an ID set we also index our packages by it
        if (typeof locator.id != "undefined")
            this.packages[locator.id] = this.packages[path];

        // Merge descriptor information from the locator onto the package descriptor if applicable
        // We first ask the program descriptor to augment to locator with any additional info
        locator = this.descriptor.augmentLocator(locator);
        if (typeof locator.descriptor != "undefined")
        {
            UTIL.deepMerge(this.packages[path].normalizedDescriptor.json, locator.descriptor);
        }
    }
    return this.packages[path];
}

/**
 * Get an existing package for id
 */
Program.prototype.packageForId = function(id)
{
    if (!id)
        throw new Error("Empty ID!");
    var m = id.match(/^(\/?)(.*?)\/([^!\/]*)(!\/(.*))?$/),
        lookupId;
    // m[1] - '/' prefix
    // m[2] - path
    // m[3] - name
    // m[4] -
    // m[5] - after !/

    if (!m[1] && m[2] && !m[3])         // <packageUID>/ no version/revision
        lookupId = m[2] + "/";
    else
    if (m[1] == "/" && m[2] && !m[3])   // /<packagePath>/ no version/revision
        lookupId = m[1] + m[2] + "/";

    if (typeof this.packages[lookupId] == "undefined")
        throw new Error("Package for id '" + id + "' not found via lookup ID: " + lookupId);

    return this.packages[lookupId];
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
