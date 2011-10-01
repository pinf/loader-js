// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var boot = exports.boot = function(options)
{
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

	// Test for Titanium
	if (typeof Titanium !== "undefined")
	{
		adapter = "titanium";
	}
	else
    // Test for Adobe Air
	if (typeof window !== "undefined" && typeof window.runtime !== "undefined" && typeof window.runtime.air !== "undefined")
	{
        adapter = "air";
	}
	else
    // Test for PhoneGap
	if (typeof device !== "undefined" && typeof device.phonegap !== "undefined")
	{
        adapter = "phonegap";
	}
	else
    if (typeof window === "undefined" || typeof this.window === "undefined" || (""+this.window) === "undefined")
    {
        // We are running on a server or headless environment
    	    	
        if (typeof require !== "undefined")
        {
        	// We are running on a CommonJS Modules environment
        	        	
            // Test for Jetpack
            if (typeof __url__ !== "undefined" && typeof packaging !== "undefined" && typeof memory !== "undefined")
            {
                adapter = "jetpack";
            }
	        // Test for GPSEE
            if (!adapter) {
	            try {
	                var systemId = "system";
	                if (require(systemId).platform.indexOf("gpsee") >= 0)
	                {
	                    adapter = "gpsee";
	                }
	            } catch(e) {}
            }
	        // Test for NodeJS
            if (!adapter) {
	            try {
			        var httpId = "http";
			        if (typeof process != "undefined" && typeof require(httpId).Server != "undefined")
			        {
			            adapter = "node";
			        }
	            } catch(e) {}
            }
            // Test for RingoJS
            if (!adapter) {
	            try {
	                var ringoArgsId = "ringo/args";
	                if (typeof require(ringoArgsId).Parser !== "undefined")
	                {
	                    adapter = "ringo";
	                }
	            } catch(e) {}
            }
            // Test for v8cgi
            if (!adapter) {
	            try {
	                var jsonRpcHandlerId = "jsonRpcHandler.js";
	                if (typeof require(jsonRpcHandlerId).jsonRpcHandler !== "undefined")
	                {
	                    adapter = "v8cgi";
	                }
	            } catch(e) {}
            }
            // Test for Narwhal
            if (!adapter) {
	            try {
	                var narwhalId = "narwhal";
	                if (typeof require(narwhalId).ensureEngine != "undefined")
	                {
	                    adapter = "narwhal";
	                }
	            } catch(e) {}
            }
            // Test for Wakanda
            if (!adapter) {
	            try {
	                var systemId = "system";
	                if (typeof application !== "undefined" && typeof application.addHttpRequestHandler !== "undefined" &&
	                    typeof require(systemId).platform === "Wakanda")
	                {
	                    adapter = "wakanda";
	                }
	            } catch(e) {}
            }
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
    
    var masthead = [
            "\0magenta(--- http://pinf.org/ ------------------------- http://commonjs.org/ ---",
            "|   \0bold(PINF JavaScript Loader ~ https://github.com/pinf/loader-js/\0)       |",
            "------------------------------- (c) Christoph Dorn --- License: MIT ---\0)"
        ].join("\n");

    // Setup command line options

    API.ARGS = require("./args");

    var optParser = new API.ARGS.Parser(),
        cliOptions;

    //command.help('Announce a new release of a package');
    optParser.arg(".../[program.json]").optional();
    optParser.help("Runs the specified program or script through the PINF JavaScript Loader.");
    optParser.option("--version").bool().help("Version");
    optParser.option("-v", "--verbose").bool().help("Enables progress messages");
    optParser.option("--pidfile").set().help("Write the process ID to the specified file. Remove file on exit. Ensures only one instance at a time.");
    optParser.option("--daemonize").bool().help("Daemonize the process. Requires: npm install -g daemon");
    optParser.option("--stdoutLogPath").set().help("Path to file to log stdout output. For use with --daemonize");
    optParser.option("--stderrLogPath").set().help("(Currently redirects to --stdoutLogPath internally) Path to file to log stderr output. For use with --daemonize");
    optParser.option("--exitOnChange").bool().help("Exit process when any source file changes");
    optParser.option("--packages-path").set().help("Path to root of packages cache/repository");
    optParser.option("--ignore-global-pinf").bool().help("Ignore global PINF environment at /pinf");
    optParser.option("--platform").set().help("The platform to use");
    optParser.option("--test-platform").set().help("Make sure a platform is working properly");
    optParser.option("--sources").set().help("The path to a sources.json file to overlay source repositories");
    optParser.option("--script").set().help("Call a script defined in the program boot package");
    optParser.option("--init-program").set().help("Path to root of program to initialize/create");
    optParser.option("--init-package").set().help("Path to root of package to initialize/create");
    optParser.option("--link-program-to").set().help("Link the program package to the given directory");
    optParser.option("--discover-packages").bool().help("Discover all packages and add to program.json");
    optParser.option("--clean").bool().help("Removes all downloaded packages first");
    optParser.option("--terminate").bool().help("Asks program to terminate if it was going to deamonize (primarily used for testing)");
    optParser.option("-h", "--help").bool().help("Display usage information");

    if (typeof options.program != "undefined")
    {
        cliOptions = optParser.parse(["commonjs"].concat([options.program]));
    }
    else
    {
        cliOptions = optParser.parse(["commonjs"].concat(API.SYSTEM.args));
    }

    if (cliOptions.help === true)
    {
    	API.SYSTEM.print(masthead + "\n");
        optParser.printHelp(cliOptions);
        return;
    }

    if (cliOptions.version)
    {
    	var descriptorJson = API.JSON.parse(API.FILE.read(API.FILE.dirname(API.FILE.dirname(API.FILE.dirname(module.id))) + "/package.json"));
        API.SYSTEM.print(descriptorJson.version + "\n");
    	return;
    }

    API.ENV.cliOptions = cliOptions;
    
    if (typeof API.DEBUG.enabled == "undefined")
    {
        if (cliOptions.verbose === true)
            API.DEBUG.enabled = true;
    }
    if (cliOptions.terminate === true)
        API.ENV.mustTerminate = true;
    if (cliOptions.clean === true)
        API.ENV.mustClean = true;
    if (cliOptions["ignore-global-pinf"] === true)
    	API.ENV.ignoreGlobalPINF = true;

    var knownCliPlatforms = [
        "node",
        "gsr",
        "v8cgi",
        "ringo",
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
    	// Do nothing! `./pinf-loader.sh` already directed arguments to correct binary.
//        spawnForPlatform(cliOptions.platform);
//        return;
    }

    // TODO: Move `--init-package` elsewhere to keep this module cleaner.
    if (cliOptions["init-program"] || cliOptions["init-package"])
    {
    	if (cliOptions["init-program"] && cliOptions["init-package"])
    	{
    		API.SYSTEM.print("\0red(" + "Cannot specify `--init-program` AND `--init-package`. Pick ONE!" + "\0)\n");
    		return;
    	}
    	var initPath = cliOptions["init-program"] || cliOptions["init-package"];
    	if (/^\//.test(initPath))
    	{
    		API.SYSTEM.print("\0red(" + "Absolute paths to `--init-package` not yet supported!" + "\0)\n");
    		return;
    	}
    	else
    	{
    		initPath = API.FILE.realpath(API.SYSTEM.pwd + "/" + initPath);
    	}

		if (API.FILE.exists(initPath))
		{
    		API.SYSTEM.print("\0red(" + "Package already exists at: " + initPath + "\0)\n");
    		return;
		}

		// Locate parent package.json to determine UID of new package
		var initPathParts = initPath.split("/");
		var parentDescriptor = false,
			uid = false,
			subPath = [];
		while(initPathParts.length > 1)
		{
			if (API.FILE.exists(initPathParts.join("/") + "/1package.json"))
			{
				try {
					parentDescriptor = API.JSON.parse(API.FILE.read(initPathParts.join("/") + "/package.json"));
				} catch(e) {
					console.error("Error '" + e + "' parsing: " + initPathParts.join("/") + "/package.json");
				}
			}
			if (parentDescriptor)
			{
				if (parentDescriptor.uid)
				{
					uid = parentDescriptor.uid + subPath.reverse().join("/") + "/";
				}
				break;
			}
			subPath.push(initPathParts.pop());
		}
		if (!uid && /^\/pinf\/workspaces\//.test(initPath))
		{
			uid = "http://" + API.FILE.realpath(initPath.substring(17)).replace(/^\//, "") + "/";
		}
		if (!uid)
		{
    		API.SYSTEM.print("\0red(" + "Could not extrapolate UID for new package!" + "\0)\n");
    		return;
		}
		
		API.FILE.mkdirs(initPath, parseInt("0775"));
		
		API.FILE.write(initPath + "/package.json", [
		    '{',
            '    "uid": "' + uid + '",',
            '    "main": "main.js",',
            '    "mappings": {',
            '    }',
            '}'
		].join("\n"));

		API.FILE.write(initPath + "/main.js", [
		    'exports.main = function(env)',
		    '{',
		    '    module.print("Hello World!\\n");',
		    '}'
		].join("\n"));
		
		if (cliOptions["init-program"])
		{
			API.FILE.write(initPath + "/program.json", [
			    '{',
	            '    "uid": "' + uid + '",',
	            '    "boot": "' + uid.replace(/^https?:\/\//, "") + '",',
	            '    "packages": {',
	            '        "' + uid.replace(/^https?:\/\//, "") + '": {',
	            '            "locator": {',
	            '                "location": "./"',
	            '            }',
	            '        }',
	            '    }',
	            '}'
			].join("\n"));
		}

		API.SYSTEM.print("\0green(" + "Initialized package with UID '" + uid + "' at: " + initPath + "\0)\n");
    	return;
    }

    function run()
    {
	    API.DEBUG.print(masthead);

    	if (typeof API.ENV.ignoreGlobalPINF != "undefined" && API.ENV.ignoreGlobalPINF === true)
    		API.DEBUG.print("Ignore global PINF: YES");

	    API.DEBUG.print("\0green(Loaded adapter: \0bold(" + API.ENV.platform + "\0)\0)");

	    var pinfPackagesPath = false;
	    if (options["packages-path"]) {
	    	pinfPackagesPath = options["packages-path"];
	    } else
	    if (cliOptions["packages-path"]) {
	    	pinfPackagesPath = cliOptions["packages-path"];
	    } else
    	if (!API.ENV.ignoreGlobalPINF) {
	    	pinfPackagesPath = "/pinf/pinf_packages";
	    }

	    if (!pinfPackagesPath || !API.FILE.exists(pinfPackagesPath)) {
	    	if (pinfPackagesPath) {
	    		API.DEBUG.print("\0yellow(Warning: Packages path '" + pinfPackagesPath + "' not found. Using default path '" + API.SYSTEM.pwd + "/.pinf_packages" + "' instead.\0)");
	    	}
	    	pinfPackagesPath = API.SYSTEM.pwd + "/.pinf_packages";
	    }

	    // TODO: Tell downloader to link packages to sources via sources.json if applicable
	    var downloader = new ((API.DOWNLOADER = require("./downloader")).Downloader)({
	        basePath: pinfPackagesPath
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
	        if (!API.ENV.ignoreGlobalPINF)
	        	files.push("/pinf/etc/pinf/sources.json");
	        files.push(API.FILE.dirname(path) + "/sources.json");
	        files.forEach(function(sourcesPath)
	        {
	            if (!sourceDescriptors[sourcesPath] && API.FILE.exists(sourcesPath))
	                sourceDescriptors[sourcesPath] = new DESCRIPTORS.Sources(sourcesPath);
	        });
	        var descriptors = [];
	        for (var key in sourceDescriptors)
	            descriptors.push(sourceDescriptors[key]);
	    	if (!API.ENV.ignoreGlobalPINF && !sourceDescriptors["/pinf/workspaces/**"])
	    	{
	    		descriptors.push(new DESCRIPTORS.WorkspaceSources("/pinf/workspaces"));
	    	}
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
	    
	        API.DEBUG.print("\0green(Loading program descriptor from: \0bold(" + path + "\0)\0)");

	        if (cliOptions["link-program-to"])
	        {
	        	if (API.FILE.exists(cliOptions["link-program-to"]))
	        	{
	        		API.FILE.remove(cliOptions["link-program-to"]);
	        	} else
	        	if (!API.FILE.exists(API.FILE.dirname(cliOptions["link-program-to"])))
        			API.FILE.mkdirs(API.FILE.dirname(cliOptions["link-program-to"]), parseInt("0775"));
	        		
        		API.SYSTEM.exec("ln -s " + API.FILE.dirname(path) + " " + cliOptions["link-program-to"], function(stdout, stderr)
        		{
        			console.log(stdout);
        			console.log(stderr);
        		});
	        }
	        
	    
	        API.DEBUG.print("Using program cache directory: " + downloader.basePath);
	
	        // ######################################################################
	        // # Sandbox
	        // ######################################################################
	
	        var sandbox = new API.SANDBOX.Sandbox({
	            mainModuleDir: API.FILE.dirname(path) + "/",
	            onInitCallback: options.onSandboxInit || undefined
	        });
	
	        // ######################################################################
	        // # Simple script
	        // ######################################################################
	
	        if (!API.FILE.isFile(path))
	        {
	            var scriptPath = cliOptions.args[0];

	            if (!scriptPath)
	            {
	            	API.SYSTEM.print("\0red(Error: No script path nor `./[program.json]` file specified!\0)\n");
	            	return;
	            }

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
	                {
		            	API.SYSTEM.print("\0red(Error: Script not found at '" + scriptPath + "'!\0)\n");
		            	return;
	                }
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
	            
	            if (!program.hasBootPackage())
	            {
	            	return;
	            }
	
	            program.getBootPackages(assembler, function(dependencies)
	            {
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
		            env.programDescriptorPath = path;
		            env.bootPackagePath = dependencies[0]["_package-0"].location.replace(/\/$/, "");

		            sandbox.env = env;
		            
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

		                    var scriptConfig = pkg.normalizedDescriptor.json.scripts[cliOptions.script];

		                    if (typeof scriptConfig === "undefined")
		                        throw new Error("Script '" + cliOptions.script + "' not found in 'scripts' defined in package descriptor: " + pkg.normalizedDescriptor.path);

		                    if (typeof scriptConfig === "object")
		                    {
	                        	assembler.addPackageToProgram(sandbox, sandbox.program, scriptConfig.locator, function(pkg)
		                        {
	                            	var concreteScriptConfig = pkg.normalizedDescriptor.json.scripts[scriptConfig.script || cliOptions.script];
	                            	concreteScriptConfig.options = API.UTIL.deepMerge(concreteScriptConfig.options || {}, scriptConfig.options || {});

	                            	module.load(pkg.getMainId(concreteScriptConfig.locator), function(id)
		                            {
		                                var script = require(id);

		                                if (typeof script.main == "undefined")
		                                    throw new Error("Script does not export main() in " + id);
		
		                                API.ENV.booting = false;
		
		                                API.DEBUG.print("\0magenta(\0:blue(----- | Program script stdout & stderr follows ====>\0:)\0)");

		                                env.options = concreteScriptConfig.options;
		                                
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
		var stack = "";
		if (typeof API.SYSTEM === "object" && typeof API.SYSTEM.formatErrorStack === "function") {
			stack = API.SYSTEM.formatErrorStack(e);
		} else
		if (typeof e.stack !== "undefined") {
			stack = e.stack.split("\n").join("\n  ");
		}
		
        if (typeof options.print != "undefined")
            options.print("[pinf-loader] " + e + "\n\n  " + stack + "\n\n");
        else
        if (typeof API != "undefined" && typeof API.SYSTEM != "undefined" && typeof API.SYSTEM.print != "undefined")
            API.SYSTEM.print("[pinf-loader] " + e + "\n\n  " + stack + "\n\n");
        else
        if (typeof console != "undefined")
            console.log("[pinf-loader] " + e + "\n\n  " + stack);
        else
        if( typeof print != "undefined")
            print("[pinf-loader] " + e + "\n\n  " + stack + "\n");
        else
        	throw new Error("Unable to print error: " + e);
    }
}
