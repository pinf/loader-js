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
        // We are running on a server or headless environment

        // Test for NodeJS
        var httpId = "http";
        if (typeof process != "undefined" && typeof require(httpId).Server != "undefined")
        {
            adapter = "nodejs";
        }
        else
        
        // Test for Jetpack
        if (typeof __url__ != "undefined" && typeof packaging != "undefined" && typeof memory != "undefined")
        {
            adapter = "jetpack";
        }
    }
    else
    {
        // We are most likely running in a browser
    }
    if (!adapter)
        throw new Error("Cannot select platform adapter. Unable to identify host JavaSvript platform.");

    var API = require("./api");

    API.ENV.timers = timers;
    API.DEBUG.enabled = options.debug || void 0;
    API.SYSTEM.print = options.print || void 0;

    // NOTE: If you modify this line you need to update: ../programs/bundle-loader/lib/bundler.js
    require("./adapter/" + adapter).init(API);
    
    require("./bravojs/global-es5");

    API.PINF_LOADER = require("./modules/pinf/loader");
    API.SANDBOX = require("./sandbox");


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

    API.OPT_PARSE = require("./optparse");
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

    if (typeof options.program != "undefined")
    {
        optParser.parse([options.program]);
    }
    else
    {
        optParser.parse(API.SYSTEM.args);
    }

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

    var downloader = new (require("./downloader").Downloader)({
        // TODO: Look for a better place first
        basePath: API.SYSTEM.pwd + "/.pinf-packages"
    });

    var assembler = API.ENV.assembler = new (require("./assembler").Assembler)(downloader);

    var init = function(path)
    {
        if (path.charAt(0) != "/")
            path = API.SYSTEM.pwd + "/" + path;
        path = path.split("/");

        if (/\.zip$/.test(path[path.length-1]))
        {
            path[path.length-1] += "!/";
        }
        if (!path[path.length-1] || path[path.length-1] != "program.json")
        {
            API.DEBUG.print("No descriptor URI argument. Assuming: './program.json'");
            path.push("program.json");
        }
        path = API.FILE.realpath(path.join("/"));
    
        API.DEBUG.print("Loading program descriptor from: " + path);
    
        downloader.basePath = path.substring(0, path.length-13) + "/.pinf-packages";
    
        API.DEBUG.print("Using program cache directory: " + downloader.basePath);
    
        if (!API.FILE.isFile(path))
            throw new Error("No program descriptor found at: " + path);
    
    
        // ######################################################################
        // # Sandbox
        // ######################################################################
    
        var sandbox = new API.SANDBOX.Sandbox({
            mainModuleDir: API.FILE.dirname(path) + "/"
        });
    
    
        // ######################################################################
        // # Assembly
        // ######################################################################
    
        // Assemble the program (making all code available on disk) by downloading all it's dependencies
    
        assembler.assembleProgram(sandbox, path, function(program)
        {
            API.ENV.booting = false;
    
            API.ENV.program = program;
            API.ENV.sandbox = sandbox;
    
            // ######################################################################
            // # Booting
            // ######################################################################
    
            API.ENV.booting = true;
    
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

            var env = options.env || {};

            sandbox.declare(dependencies, function(require, exports, module)
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
        
                    pkg.main(env);
        
                    if (API.DEBUG.enabled)
                    {
                        termStream.write("\0)\0)\0magenta(\0:blue(<=====\0:)\0)\n");
                        var f = "";
                        for (var i=0 ; i<hl-8 ; i++) f += "-";
                        API.DEBUG.print("\0magenta(\0:blue(----- ^ " + f + "\0:)\0)");
                    }
                }
    
                API.ENV.booting = false;
    
                timers.end = new Date().getTime()
    
                API.DEBUG.print("Program Booted  ~  Timing (Assembly: "+(timers.load-timers.start)/1000+", Load: "+(timers.run-timers.load)/1000+", Boot: "+(timers.end-timers.run-timers.loadAdditional)/1000+", Additional Load: "+(timers.loadAdditional)/1000+")");
                var f = "";
                for (var i=0 ; i<hl ; i++) f += "|";
                API.DEBUG.print("\0magenta(\0:blue(----- | Program stdout & stderr follows (if not already terminated) ====>\0:)");
            });
        });
    } // init()

    if (/^https?:\/\//.test(optFirstArg))
    {
        API.DEBUG.print("Boot cache directory: " + downloader.basePath);

        assembler.provisonProgramForURL(optFirstArg, init);
    }
    else
        init(optFirstArg);

    }
    catch(e)
    {
        if (typeof options.print != "undefined")
            options.print("[pinf-loader] " + e + "\n\n  " + (e.stack || "").split("\n").join("\n  ") + "\n\n");
        else
        if (typeof API != "undefined" && typeof API.SYSTEM != "undefined" && typeof API.SYSTEM.print != "undefined")
            API.SYSTEM.print("[pinf-loader] " + e + "\n\n  " + (e.stack || "").split("\n").join("\n  ") + "\n\n");
        else
        if (typeof console != "undefined")
            console.log("[pinf-loader] " + e);
        else
        if( typeof print != "undefined")
            print("[pinf-loader] " + e + "\n");
    }
}
