// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api"),
    DESCRIPTORS = require("./descriptors"),
    PACKAGE = require("./package");

var Sandbox = exports.Sandbox = function Sandbox(options)
{
    this.options = options;
    this.packages = {};
}

Sandbox.prototype.clone = function()
{
    var sandbox = new Sandbox(this.options);
    sandbox.packages = this.packages;
    sandbox.setProgram(this.program);
    return sandbox;
}

Sandbox.prototype.setProgram = function(program)
{
    this.program = program;
    
    // Add provider packages
    
    var packages = this.program.getProviderPackages();
    for (var id in packages)
    {
        this.packages[id] = new PACKAGE.ProviderPackage(id, packages[id]);
    }
    this.init();
}

Sandbox.prototype.init = function()
{
    var self = this;

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
        mainModuleDir: self.options.mainModuleDir,
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
        var idBasedModuleIdentifier;
        if (typeof moduleIdentifier == "object")
        {
            if (API.DEBUG.enabled)
                if (API.ENV.booting)
                    API.DEBUG.termStream.write("\0)\0)\0magenta(\0:blue(<=====\0:)\0)\n");
                else
                    API.DEBUG.termStream.write("\0magenta(\n");

            var t = new Date().getTime();

            // Load an extra package into the program including all its dependencies
            // and start with the main module
            self.program.assembler.addPackageToProgram(self, self.program, moduleIdentifier, function(pkg)
            {
                loader.module.constructor.prototype.load(pkg.getMainId(moduleIdentifier), function(moduleIdentifier)
                {
                    if (API.DEBUG.enabled)
                        if (API.ENV.booting)
                            API.DEBUG.termStream.write("\0magenta(\0:blue(=====>\0:)\0)\0green(\0bold(", false, true);
                        else
                            API.DEBUG.termStream.write("\0)");

                    API.ENV.timers.loadAdditional += new Date().getTime() - t;

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

            // Convert UID-based ID to path-based ID
            var parts = moduleIdentifier.split("!/");
            if (parts.length==2)
            {
                idBasedModuleIdentifier = moduleIdentifier;
                moduleIdentifier = self.packageForId(moduleIdentifier).path + "/!/" + parts[1];
            }
        }

        // See if package requests for its modules to be treated as native
        try
        {
            if (self.packageForId(moduleIdentifier).getIsNative() === true)
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

        if (typeof idBasedModuleIdentifier != "undefined")
            moduleIdentifier = idBasedModuleIdentifier;

        var data = API.FILE.read(path);

        loading = {
            id: moduleIdentifier,
            callback: function()
            {
                callback(moduleIdentifier);
            }
        };

        if ((typeof loader.module.constructor.prototype.load != "undefined" &&
             typeof loader.module.constructor.prototype.load.modules11 != "undefined" &&
             loader.module.constructor.prototype.load.modules11 === false) || data.match(/(^|[\r\n])\s*module.declare\s*\(/))
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
            if (dependency == "pinf/loader")
                return;
            else
            {
                var depId = loader.makeModuleId(id, dependency);

                // Check if the dependency is platform native
                // Determining this is a bit of a hack for now
                // TODO: Use a default ProvidePackage?
                if (depId.indexOf("!/")==-1 && depId.substring(0, loader.mainModuleDir.length) == loader.mainModuleDir)
                {
//                    depId = depId.substring(loader.mainModuleDir.length);
                    // depId is a native module
                    // TODO: Check against list of native modules?
                    return;
                }

                // Determine if we are dealing with a provider package
                var pkg = self.packageForId(depId, true);
                if (pkg && typeof pkg.isProviderPackage != "undefined" && pkg.isProviderPackage === true)
                    return;

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
    Plugin.prototype.requireModule = function(id)
    {
        if (!id)
            return;

        // Determine if we are dealing with a provider package
        var pkg = self.packageForId(id, true);
        if (pkg && typeof pkg.isProviderPackage != "undefined" && pkg.isProviderPackage === true)
        {
            return pkg.requireModule(id);
        }

        // If id contains a package delimiter we are not interested
        if (id.indexOf("!/") !== -1)
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
                return API.ENV.platformRequire(id);
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
            return self.packageForId(id).path + "/";
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
        return self.packageForId(id).normalizedDescriptor.toJSONObject();          
    }
    loader.registerPlugin(new Plugin());


    // ######################################################################
    // # Sandbox API
    // ######################################################################
    
    self.declare = loader.module.declare;
}

/**
 * Create or get existing package for path
 */
Sandbox.prototype.ensurePackageForLocator = function(locator)
{
    if (typeof locator.id != "undefined" && typeof this.packages[locator.id] != "undefined")
    {
        return this.packages[locator.id];
    }
    else
    if (typeof locator.uid != "undefined" && typeof this.packages[locator.uid] != "undefined")
    {
        return this.packages[locator.uid];
    }
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
        locator = this.program.descriptor.augmentLocator(locator);
        if (typeof locator.descriptor != "undefined")
        {
            API.UTIL.deepMerge(this.packages[path].normalizedDescriptor.json, locator.descriptor);
        }
    }
    return this.packages[path];
}

/**
 * Get an existing package for id
 */
Sandbox.prototype.packageForId = function(id, silent)
{
    if (!id)
        throw new Error("Empty ID!");
    var m = id.match(/^(\/?)(.*?)\/([^!\/]*)(!\/(.*))?$/),
        lookupIds;
    // m[1] - '/' prefix
    // m[2] - path
    // m[3] - version/revision
    // m[4] -
    // m[5] - after !/

    if (!m[1] && m[2] && !m[3])         // <packageUID>/ no version/revision
        lookupIds = [ m[2] + "/", m[2] ];
    else
    if (m[1] == "/" && m[2] && !m[3])   // /<packagePath>/ no version/revision
        lookupIds = [ "/" + m[2] + "/", m[2] + "/"];

    var lookupId;
    if (!lookupIds || lookupIds.length==0 || (lookupId = Object.keys(this.packages).filter(function(id) { return (lookupIds.indexOf(id)>-1); })).length == 0)
    {
        if (silent)
            return null;
        throw new Error("Package for id '" + id + "' not found via lookup IDs '" + lookupIds + "' in packages: " + Object.keys(this.packages));
    }
    return this.packages[lookupId[0]];
}
