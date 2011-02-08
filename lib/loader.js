// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

exports.boot = function(options)
{
    try
    {

    options = options || {};

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

    var ENV = {},
        SYSTEM = {},
        FILE = {},
        JSON = {};

    require("./adapter/" + adapter).init({
        env: ENV,
        system: SYSTEM,
        file: FILE,
        json: JSON
    });

    var DEBUG = {
        enabled: options.debug,
        print: options.debug ? function() { SYSTEM.print("[pinf-loader] " + arguments[0] + "\n"); } : function() {}
    }

    DEBUG.print("----------------------------------------------------------------");
    DEBUG.print("|  PINF Loader v0.1dev  ~  https://github.com/pinf/loader-js/  |");
    DEBUG.print("----------------------------------------------------------------");

    DEBUG.print("Loaded adapter: " + ENV.platform);

    // Now that we have a basic file and system API available we can proceed

    // Determine program descriptor path

    var path = (SYSTEM.args[0] || "").split("/");
    if (!path[path.length-1] || path[path.length-1] != "program.json") path.push("program.json");
    if (!path[0]) path[0] = SYSTEM.pwd; else if(path[0].charAt(0) != "/") path.unshift(SYSTEM.pwd);
    path = realpath(path.join("/"));

    DEBUG.print("Loading program descriptor from: " + path);
    
    if (!FILE.isFile(path))
        throw new Error("No program descriptor found at: " + path);

    // Load the program descriptor and normalize it to our context

    var descriptor;
    try
    {
        descriptor = new (require("./descriptor/program").ProgramDescriptor)(JSON.parse(FILE.read(path)), path);
    }
    catch(e)
    {
        throw new Error("Error parsing program descriptor (" + path + "): " + e);
    }
    descriptor.normalizeTo({
        pwd: path.substring(0, path.length-13)  // Strip '/program.json'
    });

    // Initialize BravoJS

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
            this.responseText = FILE.read(m[1]);
            this.status = 200;
        }
        catch(e)
        {
            this.status = 404;
        }
    }

    var loader = {
        mainModuleDir: dirname(path) + "/",
        api: {
            system: SYSTEM,
            errorReporter: function(e)
            {
                SYSTEM.print("[BravoJS] " + e + "\n" + e.stack);
            },
            XMLHttpRequest: request
        }
    };

    require("./bravojs/bravo").BravoJS(loader);

    var loading;

    loader.module.constructor.prototype.load = function pinf_loader_load(moduleIdentifier, callback)
    {
        if (typeof moduleIdentifier == "object")
        {
            moduleIdentifier = loader.makeModuleIdFromMapping(null, moduleIdentifier);
        }
        else
        if (moduleIdentifier.charAt(0)==".")
        {
            throw new Error("Relative IDs '" + moduleIdentifier + "' to module.load() not supported at this time.");
        }
        else
        {
            moduleIdentifier = loader.require.id(moduleIdentifier);
        }

        var URL = loader.require.canonicalize(moduleIdentifier),
            m = URL.match(/^memory:\/(.*)$/);

        var data = FILE.read(m[1]);

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
            eval("loader.module.declare([" + scrapeDeps(data).join(',') + "], function(require, exports, module) {\n" + data + "\n})"); // Modules/1.1
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
                dep = realpath(dirname(id) + "/" + dependency);
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

        loader.module.provide(deps, callback);
    }

    // Register a bravojs core plugin to resolve package mappings to top-level package IDs

    var Plugin = function() {}
    Plugin.prototype.contextForId = function(id)
    {
        var lookupId = id.substring(1);
        if (typeof descriptor.packages[lookupId] == "undefined")
            return;
        if (typeof descriptor.packages[lookupId].locator == "undefined")
            return;
        return loader.makeModuleIdFromMapping(null, descriptor.packages[lookupId].locator, false);
    }
    Plugin.prototype.resolvePackageMapping = function(packageMapping)
    {
        if (typeof packageMapping.catalog != "undefined")
        {
            var m = packageMapping.catalog.match(/^https?:\/\/(.*)$/),
                id = m[1] + "/" + packageMapping.name + "/";
            return id;
        }
    }
    loader.registerPlugin(new Plugin());

    DEBUG.print("Initialized BravoJS");

    // Boot the program

    var dependencies = descriptor.getBootDependencies();

    if (DEBUG.enabled) {
        DEBUG.print("Loading program's main packages:");
        for (var i=0, ic=dependencies.length ; i<ic ; i++ )
        {
            if (typeof dependencies[i]["_package-" + i] != "undefined")
                DEBUG.print("  " + dependencies[i]["_package-" + i].location);
        }
    }

    loader.module.declare(dependencies, function(require, exports, module)
    {
        DEBUG.print("Booting program:");

        // Run the program by calling main() on each packages' main module
        var pkg;
        for (var i=0, ic=dependencies.length ; i<ic ; i++ )
        {
            var pkg = require("_package-" + i);

            if (typeof pkg.main === "undefined")
                throw new Error("Package's main module does not export main() in package: " + dependencies[i]["_package-" + i].location);

            if (DEBUG.enabled)
            {
                DEBUG.print("  " + dependencies[i]["_package-" + i].location);
                DEBUG.print("----- " + dependencies[i]["_package-" + i].location + " -> [package.json].main -> main() -----");
                SYSTEM.print("\n=>");
            }

            pkg.main();

            if (DEBUG.enabled)
            {
                SYSTEM.print("<=\n\n");
                DEBUG.print("----- ^ -----");
            }
        }
    });

    DEBUG.print("Terminating");

    /**
     * Scrape dependencies from a Modules/1.1 module. Mostly borrowed from FlyScript.
     *
     * @credit http://code.google.com/p/bravojs/source/browse/bravo.js
     */
    function scrapeDeps(txt)
    {
      var dep = [];
      var m;
      var $requireRE = /\/\/.*|\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|[;=(,:!^]\s*\/(?:\\.|[^\/\\])+\/|(?:^|\W)\s*require\s*\(\s*("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')\s*\)/g;
    
       for ($requireRE.lastIndex = 0; m = $requireRE.exec(txt);)
         if (m[1]) dep.push(m[1]);
    
      return dep;
    }

    /**
     * Canonicalize path, compacting slashes and dots per basic UNIX rules.
     * 
     * @credit http://code.google.com/p/bravojs/source/browse/bravo.js
     */
    function realpath(path)
    {
        if (typeof path !== "string") path = path.toString();
    
        var oldPath = path.split('/');
        var newPath = [];
        var i;
    
        for (i = 0; i < oldPath.length; i++)
        {
            if (oldPath[i] == '.' || !oldPath[i].length)
                continue;
            if (oldPath[i] == '..')
            {
                if (!newPath.length)
                    throw new Error("Invalid module path: " + path);
                newPath.pop();
                continue;
            }
            newPath.push(oldPath[i]);
        }
    
        newPath.unshift('');
        return newPath.join('/');
    }

    /**
     * Extract the directory portion of a path.
     * 
     * @credit http://code.google.com/p/bravojs/source/browse/bravo.js
     */
    function dirname(path)
    {
      if (typeof path !== "string")
        path = path.toString();
    
      if (path.charAt(path.length - 1) === '/')
        return path.slice(0,-1);
    
      var s = path.split('/').slice(0,-1).join('/');
      if (!s)
        return ".";
    
      /* If path ends in "/!/xxx.js" then s will end in /! which needs to be fixed */
      if (s.charAt(s.length-1)=="!")
        s += "/";
    
      return s;
    }

    }
    catch(e)
    {
        if (typeof SYSTEM.print != "undefined")
            SYSTEM.print("[pinf-loader] " + e + "\n" + e.stack + "\n");
        else
        if (typeof console != "undefined")
            console.log("[pinf-loader] " + e);
        else
        if( typeof print != "undefined")
            print("[pinf-loader] " + e + "\n");
    }
}
