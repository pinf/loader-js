// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

exports.boot = function(options)
{
    const VERSION = "v0.1dev";
    var timers = {
        start: new Date().getTime(),
        loadAdditional: 0
    };

    try
    {

    options = options || {};


    // ######################################################################
    // # Adapter
    // ######################################################################

    // Before we can do anything we need to have a basic file and
    // system API available. Since this loader can be run in various
    // host environments we need to decide which adapter to load.

    var adapter;
    
    // TODO: Bypass the adapter selection if an option is provided

    if (typeof this.window == "undefined" || ""+this.window == "undefined")
    {
        // We are running on a server

        // Test for NodeJS
        if (typeof process != "undefined" &&
            typeof require('http').Server != "undefined")
          adapter = "nodejs";
    }
    else
    {
        // We are most likely running in a browser
    }
    if (!adapter)
        throw new Error("Cannot select platform adapter. Unable to identify host JavaSvript platform.");

    var API = require("./api");

    API.DEBUG.enabled = options.debug;

    require("./adapter/" + adapter).init(API);

    API.PINF_LOADER = require("./modules/pinf/loader");


    // ######################################################################
    // # CLI
    // ######################################################################

    // Setup colored printing

    var TERM = require("./term"),
        writer = {
            write: function()
            {
                API.SYSTEM.print.apply(null, arguments);
                return writer;
            },
            flush: function() {}
        };
    var termStream = API.DEBUG.termStream = new TERM.Stream({
        stdout: writer,
        stderr: writer
    });

    // Now that we have a basic file and system API available we can proceed
    
    // Setup command line options

    API.OPT_PARSE = require('./optparse');
    var optParser = new API.OPT_PARSE.OptionParser([
            ['-v', '--verbose', "Enables progress messages"],
//            ['-t', '--test', "Runs tests instead"],
            ['--clean', "Removes all downloaded packages first"],
            ['--terminate', "Asks program to terminate if it was going to deamonize"],
            ['-h', '--help', "Shows this help screen"]
        ]),
        optPrintUsage = false,
        optFirstArg = "";
    optParser.banner = "\n" + "\0magenta(\0bold(PINF Loader "+VERSION+"  ~  https://github.com/pinf/loader-js/\0)\0)" + "\n\n" +
                       "Usage: [commonjs] pinf-loader [options] .../[program.json]";
    optParser.on(0, function(value)
    {
        optFirstArg = value;
    });
    if (typeof API.DEBUG.enabled == "undefined")
        optParser.on('verbose', function()
        {
            API.DEBUG.enabled = true;
        });
    optParser.on('terminate', function()
    {
        API.ENV.mustTerminate = true;
    });
    optParser.on('clean', function()
    {
        API.ENV.mustClean = true;
    });
    optParser.on('help', function()
    {
        optPrintUsage = true;
    });

    optParser.parse(API.SYSTEM.args);

    if (optPrintUsage)
    {
        termStream.print(optParser.toString() + "\n");
        return;
    }

    API.DEBUG.print("\0magenta(----------------------------------------------------------------------------");
    API.DEBUG.print("\0bold(|  PINF Loader " + VERSION + "  ~  https://github.com/pinf/loader-js/\0)");
    API.DEBUG.print("----------------------------------------------------------------------------\0)");

    API.DEBUG.print("Loaded adapter: " + API.ENV.platform);


    // ######################################################################
    // # Locate Program Descriptor
    // ######################################################################

    if (optFirstArg.charAt(0) != "/")
        optFirstArg = API.SYSTEM.pwd + "/" + optFirstArg;
    var path = optFirstArg.split("/");
    if (!path[path.length-1] || path[path.length-1] != "program.json") {
        API.DEBUG.print("No descriptor URI argument. Assuming: './program.json'");
        path.push("program.json");
    }
    path = API.FILE.realpath(path.join("/"));

    API.DEBUG.print("Loading program descriptor from: " + path);

    if (!API.FILE.isFile(path))
        throw new Error("No program descriptor found at: " + path);


    // ######################################################################
    // # Assembly
    // ######################################################################

    var assembler = new (require("./assembler").Assembler)({
        basePath: path.substring(0, path.length-13)
    });

    // Assemble the program (making all code available on disk) by downloading all it's dependencies

    assembler.assembleProgram(path, function(program)
    {


        // ######################################################################
        // # BravoJS
        // ######################################################################

        var request = function() {};
        request.prototype.open = function(method, url)
        {
            this.url = url;
        }
        request.prototype.send = function()
        {
            var m = this.url.match(/^memory:\/(.*)$/);
            try
            {
                this.responseText = API.FILE.read(m[1]);
                this.status = 200;
            }
            catch(e)
            {
                this.status = 404;
            }
        }
    
        var loader = {
            mainModuleDir: API.FILE.dirname(path) + "/",
            platform: API.ENV.platform,
            api: {
                system: API.SYSTEM,
                errorReporter: function(e)
                {
                    API.SYSTEM.print("[BravoJS] " + e + "\n" + e.stack);
                }
            }
        };
    
        require("./bravojs/bravo").BravoJS(loader);
    
        var loading;
    
        loader.module.constructor.prototype.load = function pinf_loader_load(moduleIdentifier, callback)
        {
            if (typeof moduleIdentifier == "object")
            {
                if (API.DEBUG.enabled)
                    termStream.write("\0)\0)\0magenta(\0:blue(<=====\0:)\0)\n");

                var t = new Date().getTime();

                // Load an extra package into the program including all its dependencies
                // and start with the main module
                assembler.addPackageToProgram(program, moduleIdentifier, function(pkg)
                {
                    loader.module.constructor.prototype.load(pkg.getMainId(moduleIdentifier), function(moduleIdentifier)
                    {
                        if (API.DEBUG.enabled)
                            termStream.write("\0magenta(\0:blue(=====>\0:)\0)\0green(\0bold(", false, true);
                        
                        timers.loadAdditional += new Date().getTime() - t;

                        callback(moduleIdentifier);
                    });
                })
                return;
            }
            else
            if (moduleIdentifier.charAt(0)==".")
            {
                throw new Error("Relative IDs '" + moduleIdentifier + "' to module.load() not supported at this time.");
            }
            else
            {
                // Load an extra module into the program
                moduleIdentifier = loader.require.id(moduleIdentifier);
            }
            
            // See if package requests for its modules to be treated as native
            try
            {
                if (program.packageForId(moduleIdentifier).getIsNative() === true)
                {
                    loader.requireMemo[moduleIdentifier] = require(moduleIdentifier.replace(/\/*!?\/+/g, "\/"));
                    callback();
                    return;
                }
            }
            catch(e)
            {
                // If this throws the moduleIdentifier was likely a non-packaged module ID
                // We only throw if we should have found a package
                if (moduleIdentifier.indexOf("!/") != -1)
                    throw e;
            }

            var URL = loader.require.canonicalize(moduleIdentifier),
                m = URL.match(/^memory:\/(.*)$/),
                path = m[1];

            var data = API.FILE.read(path);

            loading = {
                id: moduleIdentifier,
                callback: function()
                {
                    callback(moduleIdentifier);
                }
             };
    
            if (module.constructor.prototype.load.modules11 === false || data.match(/(^|[\r\n])\s*module.declare\s*\(/))
                eval("loader." + data.replace(/^\s\s*/g, ""));
            else
                eval("loader.module.declare([" + API.UTIL.scrapeDeps(data).join(',') + "], function(require, exports, module) {\n" + data + "\n})"); // Modules/1.1
        }
        
        loader.module.constructor.prototype.declare = function pinf_loader_declare(dependencies, moduleFactory)
        {
            var id    = loading.id;
            var callback  = loading.callback;
            var deps  = [], i, label;
    
            loading = void 0;

            if (typeof dependencies === "function")
            {
              moduleFactory = dependencies;
              dependencies = [];
            }
        
            loader.require.memoize(id, dependencies, moduleFactory);
        
            /* Build a list of dependencies suitable for module.provide; this
             * means no labeled dependencies. 
             */
            function addDep(dependency)
            {
                // If it is a relative ID resolve it differently
                var dep;
                if (dependency.charAt(0)==".")
                {
                    dep = API.FILE.realpath(API.FILE.dirname(id) + "/" + dependency);
                }
                else
                {
                    dep = loader.require.id(dependency);
                }
                if (loader.require.isMemoized(dep) || deps.indexOf(dep) !== -1)
                    return;
                deps.push(dep);
            }
        
            for (i=0; i < dependencies.length; i++)
            {
                if (typeof dependencies[i] === "string")
                    addDep(dependencies[i]);
                else
                {
                    for (label in dependencies[i])
                      addDep(dependencies[i][label])
                }
            }

//console.log(deps);
//console.log(loader.normalizeDependencyArray(dependencies, id?id:loader.mainModuleDir+"/"));

            loader.module.provide(deps, callback);
        }
    
        // Register a bravojs core plugin to resolve package mappings to top-level package IDs
    
        var Plugin = function() {}
        Plugin.prototype.requireModule = function(id)
        {
            // If id contains a package delimiter we are not interested
            if (!id || id.indexOf("!/") !== -1)
                return;

            var path = id + ".js";

            // If file does not exist on disk where the loader expects it we look to find the
            // module in our ./modules directory and lastly let the platform's require handle it 
            if (!API.FILE.exists(path))
            {
                var id = id.substring(loader.mainModuleDir.length);
                if (id == "pinf/loader")
                {
                    return API.PINF_LOADER;
                }
                path = API.ENV.loaderRoot + "/modules/" + id + ".js";
                if (!API.FILE.exists(path))
                {
                    // Use platform require
                    return require(id);
                }
                // Use module from ./modules
                bravojs.initializeModule(id);
                return true;
            }
        }
        Plugin.prototype.contextForId = function(id)
        {
            if (!id) return;
            try
            {
                return program.packageForId(id).path + "/";
            }
            catch(e)
            {
                // If this throws the ID was likely a non-packaged module ID
                // We only throw if we should have found a package
                if (id.indexOf("!/") !== -1)
                    throw new Error("Unable to find package for ID: " + id);
            }
        }
        Plugin.prototype.resolvePackageMapping = function(packageMapping)
        {
/*            
            if (typeof packageMapping.catalog != "undefined")
            {
                var m = packageMapping.catalog.match(/^https?:\/\/(.*)$/),
                    id = m[1] + "/" + packageMapping.name + "/";
                return id;
            }
            else
            if (typeof packageMapping.archive != "undefined")
            {
                throw new Error("Archive-based mappings should no longer be present. They should have been normalized already!");
            }
*/            
        }
        Plugin.prototype.loadPackageDescriptor = function(id)
        {
            return program.packageForId(id).normalizedDescriptor.toJSONObject();          
        }
        loader.registerPlugin(new Plugin());


        // ######################################################################
        // # Booting
        // ######################################################################

        var dependencies = program.getBootPackages();

        if (API.DEBUG.enabled) {
            API.DEBUG.print("Loading program's main packages:");
            for (var i=0, ic=dependencies.length ; i<ic ; i++ )
            {
                if (typeof dependencies[i]["_package-" + i] != "undefined")
                    API.DEBUG.print("  " + dependencies[i]["_package-" + i].location);
            }
        }

        timers.load = new Date().getTime()

        loader.module.declare(dependencies, function(require, exports, module)
        {
            timers.run = new Date().getTime()

            API.DEBUG.print("Booting program. Output for each boot package follows in green between ==> ... <==");

            // Run the program by calling main() on each packages' main module
            var pkg,
                hl;
            for (var i=0, ic=dependencies.length ; i<ic ; i++ )
            {
                var pkg = require("_package-" + i);
    
                if (typeof pkg.main === "undefined")
                    throw new Error("Package's main module does not export main() in package: " + dependencies[i]["_package-" + i].location);
                
                if (API.DEBUG.enabled)
                {
                    var h = "----- " + dependencies[i]["_package-" + i].location + " -> [package.json].main -> main() -----";
                    hl = h.length;
                    API.DEBUG.print("\0magenta(\0:blue(" + h + "\0:)");
                    termStream.write("\0:blue(=====>\0:)\0)\0green(\0bold(", false, true);
                }
    
                pkg.main();
    
                if (API.DEBUG.enabled)
                {
                    termStream.write("\0)\0)\0magenta(\0:blue(<=====\0:)\0)\n");
                    var f = "";
                    for (var i=0 ; i<hl-8 ; i++) f += "-";
                    API.DEBUG.print("\0magenta(\0:blue(----- ^ " + f + "\0:)\0)");
                }
            }

            timers.end = new Date().getTime()

            API.DEBUG.print("Program Booted  ~  Timing (Assembly: "+(timers.load-timers.start)/1000+", Load: "+(timers.run-timers.load)/1000+", Boot: "+(timers.end-timers.run-timers.loadAdditional)/1000+", Additional Load: "+(timers.loadAdditional)/1000+")");
            var f = "";
            for (var i=0 ; i<hl ; i++) f += "|";
            API.DEBUG.print("\0magenta(\0:blue(----- | Program stdout & stderr follows (if not already terminated) ====>\0:)");
        });
    });


    }
    catch(e)
    {
        if (typeof API.SYSTEM.print != "undefined")
            API.SYSTEM.print("[pinf-loader] " + e + "\n\n  " + (e.stack || "").split("\n").join("\n  ") + "\n\n");
        else
        if (typeof console != "undefined")
            console.log("[pinf-loader] " + e);
        else
        if( typeof print != "undefined")
            print("[pinf-loader] " + e + "\n");
    }
}
