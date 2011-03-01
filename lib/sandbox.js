// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api"),
    DESCRIPTORS = require("./descriptors"),
    PACKAGE = require("./package");

var Sandbox = exports.Sandbox = function Sandbox(options)
{
    this.options = options;
    this.loader = null;
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

    var loader = self.loader = {
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


    // ######################################################################
    // # BravoJS - Plugins
    // ######################################################################

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

        // If it is a native package we let the platform's require handle it
        if (pkg && pkg.getIsNative() === true)
            return API.ENV.platformRequire(id.replace(/@\//g, "\/"));
    }
    Plugin.prototype.contextForId = function(id)
    {
        if (!id) return;
        try
        {
            var id = self.packageForId(id).path;

            if (typeof this.bravojs.contexts[id] == "undefined")
            {
                this.bravojs.makeContext(id);
            }
            return id;
        }
        catch(e)
        {
            // If this throws the ID was likely a non-packaged module ID
            // We only throw if we should have found a package
            if (id.indexOf("@/") !== -1)
                throw new Error("Unable to find package for ID: " + id);
        }
    }
    Plugin.prototype.loadPackageDescriptor = function(id)
    {
        return self.packageForId(id).normalizedDescriptor.toJSONObject();          
    }

    loader.bravojs.registerPlugin(new Plugin());
    loader.bravojs.registerPlugin(new (require("./bravojs/plugins/packages/packages").Plugin)());


    // ######################################################################
    // # BravoJS - Module constructor prototypes
    // ######################################################################

    var loading;

    loader.bravojs.module.constructor.prototype.load = function pinf_loader_load(moduleIdentifier, callback)
    {
        if (typeof moduleIdentifier == "object")
        {
            if (API.DEBUG.enabled)
                if (API.ENV.booting)
                    API.SYSTEM.print("\0)\0)\0magenta(\0:blue(<=====\0:)\0)\n");
                else
                    API.SYSTEM.print("\0magenta(\n");

            var t = new Date().getTime();

            // Load an extra package into the program including all its dependencies
            // and start with the main module
            self.program.assembler.addPackageToProgram(self, self.program, moduleIdentifier, function(pkg)
            {
                loader.bravojs.module.constructor.prototype.load(pkg.getMainId(moduleIdentifier), function(moduleIdentifier)
                {
                    if (API.DEBUG.enabled)
                        if (API.ENV.booting)
                            API.SYSTEM.print("\0magenta(\0:blue(=====>\0:)\0)\0green(\0bold(", false, true);
                        else
                            API.SYSTEM.print("\0)");

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

        var context = loader.bravojs.contextForId(moduleIdentifier, true);
        moduleIdentifier = context.resolveId(moduleIdentifier);

        function load(data)
        {
            loading = {
                id: moduleIdentifier,
                callback: function()
                {
                    callback(moduleIdentifier);
                }
            };

            try
            {
                // Remove shebang line if present
                data = data.replace(/^#!(.*?)\n/, "");

                if ((typeof loader.bravojs.module.constructor.prototype.load != "undefined" &&
                     typeof loader.bravojs.module.constructor.prototype.load.modules11 != "undefined" &&
                     loader.bravojs.module.constructor.prototype.load.modules11 === false) || data.match(/(^|[\r\n])\s*module.declare\s*\(/))
                {
                    eval("loader.bravojs." + data.replace(/^\s\s*/g, ""));
                }
                else
                {
                    // Modules/1.1
                    eval("loader.bravojs.module.declare([" + API.UTIL.scrapeDeps(data).join(',') + "], function(require, exports, module) {\n" + data + "\n})");
                }
            }
            catch(e)
            {
                e.message += " in module " + moduleIdentifier;
                throw e;
            }
        }

        var pkg = self.packageForId(moduleIdentifier, true);
        if (pkg)
        {
            // We do not need to load native modules. See Plugin.prototype.requireModule above.
            if (pkg.getIsNative())
            {
                callback(moduleIdentifier);
            }
            else
            if (pkg.getModuleSource(self, moduleIdentifier, load) === false)
            {
                callback(moduleIdentifier);
            }
        }
        else
        {
            var URL = loader.bravojs.require.canonicalize(moduleIdentifier),
                m = URL.match(/^memory:\/(.*)$/),
                path = m[1];

            if (/\.js$/.test(path) && !API.FILE.exists(path))
                path = path.substring(0, path.length-3);

            load(API.FILE.read(path));
        }
    }

    loader.bravojs.module.constructor.prototype.declare = function pinf_loader_declare(dependencies, moduleFactory)
    {
        var id    = loading.id;
        var callback  = loading.callback;

        loading = void 0;

        if (typeof dependencies === "function")
        {
          moduleFactory = dependencies;
          dependencies = [];
        }

        loader.bravojs.provideModule(dependencies, moduleFactory, id, callback);
    }


    // ######################################################################
    // # Sandbox API
    // ######################################################################
    
    self.declare = loader.bravojs.module.declare;
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
        // We first ask the program descriptor to augment the locator with any additional info
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
    var m = id.match(/^(\/?)(.*?)(@\/(.*))?$/),
        lookupIds;

    // m[1] - '/' prefix
    // m[2] - path
    // m[3] -
    // m[4] - after @/

    if (!m[1] && m[2])
        lookupIds = [ m[2] + "/", m[2] ];
    else
    if (m[1] == "/" && m[2])
        lookupIds = [ "/" + m[2] + "/", m[2] + "/", "/" + m[2], m[2]];

    var lookupId;
    if (!lookupIds || lookupIds.length==0 || (lookupId = Object.keys(this.packages).filter(function(id) { return (lookupIds.indexOf(id)>-1); })).length == 0)
    {
        if (silent)
            return null;
        throw new Error("Package for id '" + id + "' not found via lookup IDs '" + lookupIds + "' in packages: " + Object.keys(this.packages));
    }
    return this.packages[lookupId[0]];
}
