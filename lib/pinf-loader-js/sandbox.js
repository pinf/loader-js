// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api"),
    DESCRIPTORS = require("./descriptors"),
    PACKAGE = require("./package"),
    CONSOLE = require("./console");

var Sandbox = exports.Sandbox = function Sandbox(options)
{
    this.options = options;
    this.platform = this.options.platform || API.ENV.platform;
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

exports.setConsole = function(console)
{
    // TODO: Trigger deprecation notice
    CONSOLE.setConsole(console);
}

Sandbox.prototype.init = function()
{
    var self = this;


    // ######################################################################
    // # BravoJS
    // ######################################################################

    var loader = self.loader = {
        mainModuleDir: self.options.mainModuleDir,
        platform: self.platform,
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
        {
            // Update platfrom's lookup paths before calling the module based on the
            // dependencies registered for the package if applicable
            if (pkg.normalizedDescriptor.hasDependencies())
            {
                var oldLength = API.ENV.platformRequire.paths.length;
                pkg.normalizedDescriptor.walkDependencies(function(index, locator)
                {
                    var depPkg = self.packageForId(locator.id, true),
                        depLibDir = depPkg.getLibDir(locator);
                    // ensure package main module can be required by package name
                    if (depPkg.ensureMainIdModule(locator))
                    {
                        // package has a module that should be accessible by package name
                        // add the package root to the search path as that is where the package module is stored
                        API.ENV.platformRequire.paths.unshift(depPkg.path);
                    }
                    API.ENV.platformRequire.paths.unshift(depPkg.path + "/" + ((depLibDir)?depLibDir+"/":""));
                });
                var exports = API.ENV.platformRequire(id.replace(/@\//g, "\/"));
                API.ENV.platformRequire.paths.splice(0, (API.ENV.platformRequire.paths.length - oldLength));                
                return exports;
            }
            else
                return API.ENV.platformRequire(id.replace(/@\//g, "\/"));
        }
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
    /**
     * This is called after normalizing the moduleIdentifier and gives the opportunity
     * to throw if an ID was resolved incorrectly due to a missing mapping for example.
     */
    Plugin.prototype.verifyModuleIdentifier = function(moduleIdentifier, args)
    {
        var pkg = self.packageForId(moduleIdentifier, true);

        if (typeof pkg.isProviderPackage != "undefined" && pkg.isProviderPackage === true)
        {
            // ignore for now
        }
        else
        if (typeof pkg.normalizedDescriptor.json.preload != "undefined")
        {
            // ignore for now
            // TODO: Ask preloaders to verify that the source exists
        }
        else
        {
            if (pkg.getIsNative())
            {
                if (typeof API.ENV.verifyNativeModuleIdentifier === "function")
                    return API.ENV.verifyNativeModuleIdentifier(pkg, moduleIdentifier, args);
            }
            else
            if (!pkg.moduleSourceExists(moduleIdentifier))
            {
                var parts = moduleIdentifier.split("@/"),
                    found = false;
                // Before we throw we check the ID against the package's system packages
                if (parts.length == 2 && pkg.normalizedDescriptor.hasDependencies())
                {
                    var libDir = pkg.getLibDir();
                    if (parts[1].substring(0, libDir.length+1) == libDir+"/")
                    {
                        pkg.normalizedDescriptor.walkDependencies(function(index, locator)
                        {
                            if (found)
                                return;
                            var depPkg = self.packageForId(locator.id, true),
                                depLibDir = depPkg.getLibDir(locator),
                                modulePath = ((depLibDir)?depLibDir+"/":"") + parts[1].substring(libDir.length+1);
                            if (depPkg.moduleSourceExists(modulePath))
                                found = depPkg.path + "@/" + modulePath;
                        });
                    }
                }
                if (!found)
                    throw new Error("Incorrectly resolved (file does not exist) moduleIdentifier '" + API.UTIL.locatorToString(args.moduleIdentifier) + "' to '" + API.UTIL.locatorToString(moduleIdentifier) + "' against context '" + args.context.id + "' and relativeModuleDir '" + args.relativeModuleDir + "'.");
                return found;
            }
        }
    }
    loader.bravojs.registerPlugin(new Plugin());
    loader.bravojs.registerPlugin(new (require("./bravojs/plugins/packages/packages").Plugin)());


    // ######################################################################
    // # BravoJS - Module constructor prototypes
    // ######################################################################

    var loading;

    loader.bravojs.module.constructor.prototype.load = function pinf_loader_load(moduleIdentifier, callback)
    {
        // TODO: The API being parsed below below should also be implemented at ./bravojs/plugins/packages/loader.js
        var context;
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
            }, {
                sourceDescriptors: self.sourceDescriptors
            })
            return;
        }
        else
        if (moduleIdentifier.charAt(0)==".")
        {
            throw new Error("Relative IDs '" + moduleIdentifier + "' to module.load() not supported at this time.");
        }
        else
        if (moduleIdentifier.charAt(0)!="/" && typeof this.mappings === "object")
        {
            // check if we match a mapping
            var parts = moduleIdentifier.split("/");
            if (this.mappings[parts[0]])
            {
                context = loader.bravojs.contextForId(this.mappings[parts[0]], true);
                moduleIdentifier = this.mappings[parts[0]] + "@/" + ((context.libDir)?context.libDir+"/":"") + parts.slice(1).join("/");
            }
        }

        if (!context)
            context = loader.bravojs.contextForId(moduleIdentifier, true);
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

                var m;
                var code;
                if (/^text!/.test(moduleIdentifier))
                {
                    // text plugin
                    code =
                        "loader.bravojs.module.declare([], function() {\n" +
                        'return ["' + data.replace(/"/g, '\\"').replace(/\n/g, '","') + '"].join("\\n");' +
                        "\n});";
                }
                else
                if (m = data.match(/(^|[\r\n])\s*define\(\[([^\]]*)\].*/))
                {
                    // AMD with dependencies

                    var deps = m[2].split(",").map(function(dep)
                    {
                        return "'" + dep.replace(/^\s*"|^\s*'|"\s*$|'\s*$/g, "") + "'";
                    });

                    // strip all data prior to define()
                    var parts = data.split(m[0]);
                    if (parts.length != 2)
                        throw new Error("Unable to fix define() wrapper for module: " + moduleIdentifier);
                    data = m[0].replace(/^[\r\n]\s*/, "") + parts[1];

                    code = 
                        "loader.bravojs.module.declare([" +
                        deps.filter(function(dep)
                        {
                            return (!/^'(require|module|exports)'$/.test(dep));
                        }).join(",") +
                        "], function(require, exports, module) {\n" + 
                        "({define:function(deps, factory){module.exports = factory(" +
                        deps.map(function(dep)
                        {
                            if (/^'(require|module|exports)'$/.test(dep))
                                return dep.substring(1, dep.length-1);
                            else
                                return "require(" + dep + ")";
                        }).join(",") +
                        ");}})." +
                        data +
                        "\n});";
                }
                else
                if (m = data.match(/(^|[\r\n])\s*define\(\s*function\s*\(\s*require\s*,\s*exports\s*,\s*module\s*\)\s*{.*/))
                {
                    // AMD without dependencies

                    // strip all data prior to define()
                    var parts = data.split(m[0]);
                    if (parts.length != 2)
                        throw new Error("Unable to fix define() wrapper for module: " + moduleIdentifier);
                    data = parts[1];

                    code =
                        "loader.bravojs.module.declare([" +
                        API.UTIL.scrapeDeps(data).join(',') +
                        "], function(require, exports, module) {\n" + 
                        data;
                }
                else
                if ((typeof loader.bravojs.module.constructor.prototype.load != "undefined" &&
                     typeof loader.bravojs.module.constructor.prototype.load.modules11 != "undefined" &&
                     loader.bravojs.module.constructor.prototype.load.modules11 === false) || data.match(/(^|[\r\n])\s*module.declare\s*\(/))
                {
                    // Modules/2
                    code = "loader.bravojs." + data.replace(/^\s\s*/g, "");
                }
                else
                {
                    // Modules/1.1
                    code = "loader.bravojs.module.declare([" + API.UTIL.scrapeDeps(data).join(',') + "], function(require, exports, module) {\n" + data + "\n});";
                }
                
                if (typeof API.UTIL.eval == "undefined")
                {
                    eval(code);
                }
                else
                {
                    API.UTIL.eval(code, {
                        loader: loader,
                        console: CONSOLE.getAPI()
                    }, moduleIdentifier, 1);
                }
            }
            catch(e)
            {
//                e.message += "\n in module " + moduleIdentifier;
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
                path = m[1],
                data;

            path = path.replace(/^\w*!/, "");

            if (/\.js$/.test(path) && !API.FILE.exists(path))
                path = path.substring(0, path.length-3);

            try
            {
                data = API.FILE.read(path);
            }
            catch(e)
            {
                throw new Error("Error loading file: " + path);
            }

            load(data);
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
        
        function doDeclare(dependencies, moduleFactory, id, callback)
        {
            if (typeof API.UTIL.setTimeout !== "undefined")
                API.UTIL.setTimeout(function()
                {
                    loader.bravojs.provideModule(dependencies, moduleFactory, id, callback);
                }, 1);
            else
                loader.bravojs.provideModule(dependencies, moduleFactory, id, callback);
        }
        doDeclare(dependencies, moduleFactory, id, callback);
    }


    // ######################################################################
    // # Sandbox API
    // ######################################################################
    
    self.declare = loader.bravojs.module.declare;
}

/**
 * Create or get existing package for path
 * 
 * NOTE: The 'locator' argument gets modified!
 * TODO: Refactor so 'locator' argument does not get modified.
 */
Sandbox.prototype.ensurePackageForLocator = function(locator, options)
{
    var self = this;
    var locatorDescriptor = locator.descriptor || void 0;
    delete locator.descriptor;

    function finalize(packageId, newLocator)
    {
        if (typeof newLocator == "undefined")
        {
            if (typeof self.packages[packageId].uid != "undefined") {
                locator.uid = self.packages[packageId].uid;
            }
            newLocator = self.program.descriptor.augmentLocator(locator, options);
        }
        for (var key in newLocator)
            locator[key] = newLocator[key];
        if (typeof locatorDescriptor != "undefined")
            locator.descriptor = locatorDescriptor;
        if (typeof self.packages[packageId].id == "undefined")
            self.packages[packageId].id = locator.id || packageId;
        return self.packages[packageId];
    }

    if (typeof locator.id != "undefined" && typeof this.packages[locator.id] != "undefined")
    {
        return finalize(locator.id);
    }
    else
    if (typeof locator.uid != "undefined" && typeof this.packages[locator.uid] != "undefined")
    {
        return finalize(locator.uid);
    }
    var path = locator.location;
    if (typeof this.packages[path] == "undefined")
    {
        // Merge descriptor information from the locator onto the package descriptor if applicable
        // We first ask the program descriptor to augment the locator with any additional info
        var newLocator = this.program.descriptor.augmentLocator(locator, options);

        if (locator.resource === true)
            this.packages[path] = new PACKAGE.Package(new DESCRIPTORS.Dummy(path, {
                extendsDescriptorJSON: newLocator.descriptor
            }), {
                platform: self.platform
            });
        else
            this.packages[path] = new PACKAGE.Package(new DESCRIPTORS.Package(path, {
                extendsDescriptorJSON: newLocator.descriptor
            }), {
                platform: self.platform
            });

        // If package has a UID set we also index our packages by it
        // TODO: Add version to key if applicable
        if (typeof this.packages[path].uid != "undefined")
        {
            locator.id = this.packages[path].uid;
            this.packages[this.packages[path].uid] = this.packages[path];
        }

        // If locator has an ID set we also index our packages by it
        if (typeof locator.id != "undefined")
            this.packages[locator.id] = this.packages[path];

        // Convert mapped module IDs to paths
        if (typeof this.packages[path].normalizedDescriptor.json.modules != "undefined")
        {
            var libDir = this.packages[path].getLibDir();

            var modules = {};
            for (var id in this.packages[path].normalizedDescriptor.json.modules)
            {
                if (id.charAt(0) == "." || id.charAt(0) == "/")
                    modules[id.replace(/^\./, "")] = this.program.descriptor.augmentLocator(this.packages[path].normalizedDescriptor.json.modules[id], options);
                else
                    modules["/" + libDir + "/" + id] = this.program.descriptor.augmentLocator(this.packages[path].normalizedDescriptor.json.modules[id], options);
            }
            this.packages[path].normalizedDescriptor.json.modules = modules;
        }
        return finalize(path, newLocator);
    }
    else
        return finalize(path);
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
