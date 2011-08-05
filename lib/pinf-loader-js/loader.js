// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var boot = exports.boot = function(options)
{
    const VERSION = "0.0.2";
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
            adapter = "node";
        }
        else
        
        // Test for Jetpack
        if (typeof __url__ != "undefined" && typeof packaging != "undefined" && typeof memory != "undefined")
        {
            adapter = "jetpack";
        }
        else
        {
            // Test for Narwhal
            try
            {
                var narwhal = "narwhal";
                if (typeof require(narwhal).ensureEngine != "undefined")
                {
                    adapter = "narwhal";
                }
            }
            catch(e) {}
        }
    }
    else
    {
        // We are most likely running in a browser
    }
    if (!adapter)
        throw new Error("Cannot select platform adapter. Unable to identify host JavaScript platform.");

    // Normalize JS environment to ES5
    require("./bravojs/global-es5");

    var API = require("./api");
    API.SANDBOX = require("./sandbox");
    API.CONSOLE = require("./console");

    API.ENV.timers = timers;
    API.DEBUG.enabled = options.debug || void 0;
    API.SYSTEM.print = options.print || void 0;
    API.ENV.platformRequire = options.platformRequire || void 0;
    API.ENV.platformOptions = options.platformOptions || void 0;
    API.ENV.mustClean = options.clean || false;

    // NOTE: If you modify this line you need to update: ../programs/bundle-loader/lib/bundler.js
    require("./adapter/" + adapter).init(API);

    // Now that we have a basic file and system API available we can proceed


    // ######################################################################
    // # CLI
    // ######################################################################

    // Setup command line options

    API.ARGS = require("./args");

    var optParser = new API.ARGS.Parser(),
        cliOptions;

    //command.help('Announce a new release of a package');
    optParser.arg(".../[program.json]").optional();
    optParser.help("Runs the PINF JavaScript Loader.");
    optParser.option("-v", "--verbose").bool().help("Enables progress messages");
    optParser.option("--pidfile").set().help("Write the process ID to the specified file. Remove file on exit. Ensures only one instance at a time.");
    optParser.option("--daemonize").bool().help("Daemonize the process. Requires: npm install daemon");
    optParser.option("--platform").set().help("The platform to use");
    optParser.option("--sources").set().help("The path to a sources.json file to overlay source repositories");
    optParser.option("--script").set().help("Call a script defined in the program boot package");
    optParser.option("--test-platform").set().help("Make sure a platform is working properly");
    optParser.option("--discover-packages").bool().help("Discover all packages and add to program.json");
    optParser.option("--clean").bool().help("Removes all downloaded packages first");
    optParser.option("--terminate").bool().help("Asks program to terminate if it was going to deamonize (primarily used for testing)");
    optParser.option("-h", "--help").bool().help("Display usage information");

    if (typeof options.program != "undefined")
        cliOptions = optParser.parse(["pinf-loader"].concat([options.program]));
    else
        cliOptions = optParser.parse(["pinf-loader"].concat(API.SYSTEM.args));

    if (cliOptions.help === true)
    {
        optParser.printHelp(cliOptions);
        return;
    }
    if (typeof API.DEBUG.enabled == "undefined")
    {
        if (cliOptions.verbose === true)
            API.DEBUG.enabled = true;
    }
    if (cliOptions.terminate === true)
        API.ENV.mustTerminate = true;
    if (cliOptions.clean === true)
        API.ENV.mustClean = true;

    var knownCliPlatforms = [
        "node",
        "narwhal"
    ];

    function spawnForPlatform(platform)
    {
        // A different platform is requested than is running
        // TODO: Get this working with all adapters
        if (API.ENV.platform != "node")
            throw new Error("NYI - Spawning loader for platform '" + platform + "' from platform '" + API.ENV.platform + "'");

        if (knownCliPlatforms.indexOf(platform) === -1)
            throw new Error("Unknown command line platform: " + platform);

        API.SYSTEM.exec("which " + platform, function (stdout, stderr, error) {
            if (!stdout)
                throw new Error("Platform command '" + platform + "' not found via 'which'!");

            API.SYSTEM.spawn(stdout.split("\n").shift(), [API.ENV.loaderRoot + "/pinf-loader.js"].concat(API.SYSTEM.args));
        });
    }

    if (typeof cliOptions["test-platform"] != "undefined")
    {
        if (knownCliPlatforms.indexOf(cliOptions["test-platform"]) === -1)
            throw new Error("Unknown command line platform: " + cliOptions["test-platform"]);

        API.SYSTEM.exec("which " + cliOptions["test-platform"], function (stdout, stderr, error) {
            if (!stdout)
                API.SYSTEM.print("\0red(FAIL: 'which " + cliOptions["test-platform"] + "' did not locate command!\0)");
            else
            {
                var cmd = stdout.split("\n").shift();
                API.SYSTEM.exec(cmd + " -h", function (stdout, stderr, error) {
                    // TODO: This check should be more definitive
                    if (!stdout)
                        API.SYSTEM.print("\0red(FAIL: '" + cmd + " -h' did not yield expected output!\0)");
                    else
                        API.SYSTEM.print("\0green(OK\0)");
                });
            }
        });
        return;
    }
    else
    if (typeof cliOptions.platform != "undefined" && cliOptions.platform != API.ENV.platform)
    {
        spawnForPlatform(cliOptions.platform);
        return;
    }
    
    function run()
    {
	    API.DEBUG.print("\0magenta(----------------------------------------------------------------------------");
	    API.DEBUG.print("\0bold(|  PINF Loader v" + VERSION + "  ~  https://github.com/pinf/loader-js/\0)");
	    API.DEBUG.print("----------------------------------------------------------------------------\0)");
	
	    API.DEBUG.print("Loaded adapter: " + API.ENV.platform);
	
	    var downloader = new ((API.DOWNLOADER = require("./downloader")).Downloader)({
	        // TODO: Look for a better place first
	        basePath: API.SYSTEM.pwd + "/.pinf-packages"
	    });
	
	    var assembler = API.ENV.assembler = new (require("./assembler").Assembler)(downloader);
	
	    API.ENV.loadSourceDescriptorsForProgram = function(path, existingSourceDescriptors)
	    {
	        var DESCRIPTORS = require("./descriptors");
	        var sourceDescriptors = [],
	            files = [];
	        if (typeof existingSourceDescriptors !== "undefined") {
	            existingSourceDescriptors.forEach(function(descriptor)
	            {
	                sourceDescriptors[descriptor.path] = descriptor;
	            });
	        }
	        if (cliOptions.sources)
	        {
	            if (!API.FILE.exists(cliOptions.sources))
	                throw new Error("Source repository overlay file specified via --sources not found at: " + cliOptions.sources);
	            files.push(cliOptions.sources);
	        }
	        if (options.sources)
	        {
	            if (!API.FILE.exists(options.sources))
	                throw new Error("Source repository overlay file specified via options.sources not found at: " + options.sources);
	            files.push(options.sources);
	        }
	
	        if (API.SYSTEM.pwd !== "__PWD__")
	        {
	        	files.push(API.SYSTEM.pwd + "/sources.local.json");
	        }
	        files.push(API.FILE.dirname(path) + "/sources.local.json");
	        if (typeof API.SYSTEM.env.HOME != "undefined" && API.SYSTEM.env.HOME)
	            files.push(API.SYSTEM.env.HOME + "/.pinf/config/sources.json");
	        files.push(API.FILE.dirname(path) + "/sources.json");
	        files.forEach(function(sourcesPath)
	        {
	            if (!sourceDescriptors[sourcesPath] && API.FILE.exists(sourcesPath))
	                sourceDescriptors[sourcesPath] = new DESCRIPTORS.Sources(sourcesPath);
	        });
	        var descriptors = [];
	        for (var key in sourceDescriptors)
	            descriptors.push(sourceDescriptors[key]);
	        sourceDescriptors = descriptors;
	        if (API.DEBUG.enabled)
	        {
	            if (sourceDescriptors.length > 0)
	            {
	                API.DEBUG.print("Using source overlay files:");
	                sourceDescriptors.forEach(function(sourceDescriptor)
	                {
	                    API.DEBUG.print("  \0cyan(" + sourceDescriptor.path + "\0)");
	                });
	            }
	            else
	                API.DEBUG.print("Not using any source overlay files.");
	        }
	        return sourceDescriptors;
	    }
	
	    var init = function(path)
	    {
	        path = path || "";
	        if (path.charAt(0) != "/")
	            path = API.SYSTEM.pwd + "/" + path;
	        path = path.split("/");
	
	        if (/\.zip$/.test(path[path.length-1]))
	        {
	            path[path.length-1] += "!/";
	        }
	        if (!path[path.length-1] || path[path.length-1] != "program.json")
	        {
	            API.DEBUG.print("No descriptor URI argument. Assuming: '[./]program.json'");
	            path.push("program.json");
	        }
	        path = API.FILE.realpath(path.join("/"));
	    
	        API.DEBUG.print("Loading program descriptor from: " + path);
	
	        downloader.basePath = path.substring(0, path.length-13) + "/.pinf-packages";
	    
	        API.DEBUG.print("Using program cache directory: " + downloader.basePath);
	
	        // ######################################################################
	        // # Sandbox
	        // ######################################################################
	
	        var sandbox = new API.SANDBOX.Sandbox({
	            mainModuleDir: API.FILE.dirname(path) + "/"
	        });
	
	        // ######################################################################
	        // # Simple script
	        // ######################################################################
	
	        if (!API.FILE.isFile(path))
	        {
	            var scriptPath = cliOptions.args[0];
	
	            if (scriptPath.charAt(0) != "/")
	            {
	                scriptPath = API.FILE.realpath(API.SYSTEM.pwd + "/" + scriptPath);
	                if (!/\.js$/.test(scriptPath))
	                    scriptPath += ".js";
	            }
	
	            if (!API.FILE.exists(scriptPath))
	            {
	                if (/\.js$/.test(scriptPath))
	                    scriptPath = scriptPath.substring(0, scriptPath.length-3);
	
	                if (!API.FILE.exists(scriptPath))
	                    throw new Error("Script not found at: " + scriptPath);
	            }
	
	            sandbox.init();
	            sandbox.declare([ scriptPath ], function(require, exports, module)
	            {
	                var scriptModule = require(scriptPath);
	                if (typeof scriptModule.main == "undefined")
	                    throw new Error("Script at '" + scriptPath + "' does not export 'main()'");
	
	                API.DEBUG.print("Running script: " + scriptPath);
	
	                API.DEBUG.print("\0magenta(\0:blue(----- | Script stdout & stderr follows ====>\0:)\0)");
	
	                scriptModule.main({
	                    bootProgram: function(options)
	                    {
	                        if (typeof options.platformRequire == "undefined")
	                            options.platformRequire = API.ENV.platformRequire;
	                        return boot(options);
	                    },
	                    args: cliOptions.args.slice(1, cliOptions.args.length)
	                });
	            });
	            return;
	        }
	
	        // ######################################################################
	        // # Program assembly
	        // ######################################################################
	
	        if (!API.FILE.exists(path))
	        {
	            API.SYSTEM.print("\0red(No program descriptor found at: " + path + "\0)\n");
	            return;
	        }
	
	        // Assemble the program (making all code available on disk) by downloading all it's dependencies
	
	        assembler.assembleProgram(sandbox, path, function(program)
	        {
	            var engines = program.getEngines();
	            if (engines)
	            {
	                if (engines.indexOf(API.ENV.platform) === -1)
	                {
	                    API.DEBUG.print("\0yellow(Spawning platform: " + engines[0] + "\0)");
	                    spawnForPlatform(engines[0]);
	                    return false;
	                }
	            }
	            return true;
	        },
	        function(program)
	        {
	            API.ENV.booting = false;
	
	            // TODO: Keep these references elsewhere so we can have nested sandboxes
	            API.ENV.program = program;
	            API.ENV.sandbox = sandbox;
	
	            var dependencies = program.getBootPackages();
	            if (dependencies.length > 1)
	            {
	                throw new Error("Only one program boot package allowed in: " + path);
	            }
	
	            // ######################################################################
	            // # Program Booting
	            // ######################################################################
	    
	            API.ENV.booting = true;
	
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
	            env.args = env.args || options.args || cliOptions.args.slice(1, cliOptions.args.length) || [];
	
	            sandbox.declare(dependencies, function(require, exports, module)
	            {
	                timers.run = new Date().getTime()
	
	                // ######################################################################
	                // # Program Script
	                // ######################################################################
	        
	                if (cliOptions.script)
	                {
	                    var pkg = sandbox.packageForId(dependencies[0]['_package-0'].location);
	                    if (typeof pkg.normalizedDescriptor.json.scripts == "undefined")
	                        throw new Error("No 'scripts' defined in package descriptor: " + pkg.normalizedDescriptor.path);
	                    if (typeof pkg.normalizedDescriptor.json.scripts[cliOptions.script] == "undefined")
	                        throw new Error("Script '" + cliOptions.script + "' not found in 'scripts' defined in package descriptor: " + pkg.normalizedDescriptor.path);
	                    if (typeof pkg.normalizedDescriptor.json.scripts[cliOptions.script] == "object")
	                    {
	                        assembler.addPackageToProgram(sandbox, sandbox.program, pkg.normalizedDescriptor.json.scripts[cliOptions.script], function(pkg)
	                        {
	                            module.load(pkg.getMainId(pkg.normalizedDescriptor.json.scripts[cliOptions.script]), function(id)
	                            {
	                                var script = require(id);
	
	                                if (typeof script.main == "undefined")
	                                    throw new Error("Script does not export main() in " + id);
	
	                                API.ENV.booting = false;
	
	                                API.DEBUG.print("\0magenta(\0:blue(----- | Program script stdout & stderr follows ====>\0:)\0)");
	
	                                script.main(env);
	                            });
	                        }, {
	                            "discover-packages": cliOptions["discover-packages"] || false,
	                            sourceDescriptors: API.ENV.loadSourceDescriptorsForProgram(path)
	                        });
	                    }
	                    else
	                        throw new Error("NYI - Non-locator based script pointers");
	                }
	                else
	
	                // ######################################################################
	                // # Program Boot Packages
	                // ######################################################################
	
	                {
	                    API.DEBUG.print("Booting program. Output for boot package follows in green between ==> ... <==");
	        
	                    // Run the program by calling main() on each packages' main module
	                    var pkg,
	                        hl;
	                    // TODO: Refactor as there is only ever one boot package
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
	                            API.SYSTEM.print("\0:blue(=====>\0:)\0)\0green(\0bold(", false, true);
	                        }
	            
	                        pkg.main(env);
	            
	                        if (API.DEBUG.enabled)
	                        {
	                            API.SYSTEM.print("\0)\0)\0magenta(\0:blue(<=====\0:)\0)\n");
	                            var f = "";
	                            for (var i=0 ; i<hl-8 ; i++) f += "-";
	                            API.DEBUG.print("\0magenta(\0:blue(----- ^ " + f + "\0:)\0)");
	                        }
	                    }
	
	                    API.ENV.booting = false;
	                }
	
	                timers.end = new Date().getTime()
	
	                API.DEBUG.print("Program Booted  ~  Timing (Assembly: "+(timers.load-timers.start)/1000+", Load: "+(timers.run-timers.load)/1000+", Boot: "+(timers.end-timers.run-timers.loadAdditional)/1000+", Additional Load: "+(timers.loadAdditional)/1000+")");
	                var f = "";
	                for (var i=0 ; i<hl ; i++) f += "|";
	                API.DEBUG.print("\0magenta(\0:blue(----- | Program stdout & stderr follows (if not already terminated) ====>\0:)\0)");
	
	                if (typeof options.callback != "undefined")
	                {
	                    options.callback(sandbox, require);
	                }
	            });
	        }, {
	            "discover-packages": cliOptions["discover-packages"] || false,
	            sourceDescriptors: API.ENV.loadSourceDescriptorsForProgram(path)
	        });
	    } // init()
	
	    if (/^https?:\/\//.test(cliOptions.args[0]))
	    {
	        API.DEBUG.print("Boot cache directory: " + downloader.basePath);
	
	        assembler.provisonProgramForURL(cliOptions.args[0], init, {
	            sourceDescriptors: API.ENV.loadSourceDescriptorsForProgram(API.SYSTEM.pwd + "/")
	        });
	    }
	    else
	        init(cliOptions.args[0]);
    
    }  // run()

    if (cliOptions.pidfile) {

    	function preRun()
    	{
        	API.FILE.write(cliOptions.pidfile, API.SYSTEM.pid);
        	API.SYSTEM.on("exit", function()
        	{
            	API.FILE.remove(cliOptions.pidfile);
        	});

        	// TODO: Move this further down so we only daemonize if the program started successfully
            if (cliOptions.daemonize) {
            	API.SYSTEM.daemonize(cliOptions.pidfile, function()
            	{
                	run();
            	});
            } else {
            	run();
            }
    	}
    	if (API.FILE.exists(cliOptions.pidfile)) {
    		// check if process is still running
            API.SYSTEM.exec("kill -0 " + API.FILE.read(cliOptions.pidfile), function (stdout, stderr, error) {
    		    if (!stdout && !stderr) {
            		throw new Error("Program for pid file '" + cliOptions.pidfile + "' already running at process ID: " + API.FILE.read(cliOptions.pidfile));
    		    } else {
//    			if (/No such process/.test(stderr)) {
    				API.FILE.remove(cliOptions.pidfile);
    				preRun();
    			}
            });
    	} else {
    		preRun();
    	}
    } else {
    	run();
    }    
    
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
            console.log("[pinf-loader] " + e.stack);
        else
        if( typeof print != "undefined")
            print("[pinf-loader] " + e.stack + "\n");
    }
}
