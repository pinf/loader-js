// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api"),
    ENV = API.ENV,
    DEBUG = API.DEBUG,
    UTIL = API.UTIL,
    FILE = API.FILE,
    SYSTEM = API.SYSTEM,
    DOWNLOADER = require("./downloader"),
    DESCRIPTORS = require("./descriptors"),
    PROGRAM = require("./program");

var Assembler = exports.Assembler = function(options)
{
    this.downloader = new DOWNLOADER.Downloader({
        basePath: options.basePath + "/.pinf-packages"
    });
}

Assembler.prototype.assembleProgram = function(sandbox, uri, callback)
{
    var self = this;

    var di = DEBUG.indent();
    DEBUG.print("Assembling program:").indent(di+1);

    function assembleProgram()
    {
        DEBUG.print("Program URI: " + uri);
    
        var path;
        if (uri.charAt(0) == "/")
            path = uri;
    
        var programDescriptor = new DESCRIPTORS.Program(path);
        
        var program = new PROGRAM.Program(programDescriptor);

        sandbox.setProgram(program);

        program.assembler = self;

        // This will download all packages and make them available on disk
        program.discoverPackages(function assembler_assembleProgram_lambda_discoverPackages_packageForLocator(locator, callback)
        {
            program.resolveLocator(self, locator, function(locator)
            {
                if (!FILE.exists(locator.location))
                    throw new Error("This should not happen");
                else
                    callback(sandbox.ensurePackageForLocator(locator));
            });
        }, function assembler_assembleProgram_lambda_discoverPackages_done()
        {
            DEBUG.indent(di);

            callback(program);
        });
    }
    
    if (ENV.mustClean)
    {
        DEBUG.print("Removing downloaded packages from: " + this.downloader.basePath);
        
        SYSTEM.exec("rm -Rf " + this.downloader.basePath, function(stdout, stderr)
        {
            assembleProgram();
        });
    }
    else
        assembleProgram();    
}

/**
 * Load an extra package for the program.
 * 
 * @throws If package is not listed (by UID) in program's descriptor
 */
Assembler.prototype.addPackageToProgram = function(sandbox, program, locator, callback)
{
    var self = this;

    var di = DEBUG.indent();
    DEBUG.print("Load additional package into program:").indent(di+1);
    DEBUG.print("Locator(original): " + UTIL.locatorToString(locator));

    program.resolveLocator(self, locator, function(locator)
    {
        DEBUG.print("Locator(resolved): " + UTIL.locatorToString(locator));

        var pkg = sandbox.ensurePackageForLocator(locator);

        if (pkg.discovering)
        {
            DEBUG.indent(di+1).print("... skip second pass ...");
            DEBUG.indent(di);
            callback(pkg);
            return;
        }

        pkg.discoverMappings(function assembler_assembleProgram_lambda_addPackageToProgram_packageForLocator(locator, callback)
        {
            program.resolveLocator(self, locator, function(locator)
            {
                if (!FILE.exists(locator.location))
                {
                    throw new Error("This should not happen");
                }
                else
                {
                    callback(sandbox.ensurePackageForLocator(locator));
                }
            });
            
        }, function assembler_assembleProgram_lambda_addPackageToProgram_done()
        {
            DEBUG.indent(di);
            callback(pkg);
        });
    });
}
