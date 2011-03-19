
// TODO: This whole module needs to be refactored to make logic more easy to follow and performant

var API = require("../../api"),
    PINF_LOADER = require("./loader"),
    DESCRIPTORS = require("../../descriptors");

var routeDescriptors = {};

var JSGI = exports.JSGI = function(options)
{
    this.API = options.api;

    this.routes = {};
    for (var path in options.map)
    {
        if (path.charAt(0) != "/")
            throw new Error("Path must begin with '/'");

        if (!/\.js$/.test(path))
            throw new Error("Path must end in '.js'");

        if (typeof options.map[path].basePath != "undefined" && !/\/$/.test())
            options.map[path].basePath += "/";

        // Add the main program route
        this.routes[path] = {
            expr: new RegExp("^" + path.replace(/(\/|\\)/g, "\\$1") + "$"),
            path: path,
            options: options.map[path]
        }

        var basePath = path.substring(0, path.length-3);

        // Add a route to load extra code
        this.routes[basePath + "-module/"] = {
            expr: new RegExp("^" + basePath.replace(/(\/|\\)/g, "\\$1") + "\/(.*)$"),
            path: path,
            options: options.map[path],
            load: true
        }
    }

    this.trackRoutes = options.trackRoutes || false;
    this.contexts = {};
}

JSGI.prototype.responder = function(app)
{
    var self = this;

    return function(request)
    {
        var deferred = self.API.PROMISE.defer();

        var responding;

        try
        {
            responding = self.respond(request, function(response)
            {
                deferred.resolve(response);
            });
        }
        catch(e)
        {
            // TODO: Use error reporter here instead of print
            API.SYSTEM.print("\0red(" + e + "\n\n" + e.stack + "\0)\n");
            throw e;
        }

        if (!responding)
        {
            if (typeof app != "undefined" && app)
                deferred.resolve(app(request));
            else
                deferred.resolve({
                    status: 404,
                    headers: {
                        "content-type": "text/plain"
                    },
                    body: [
                        "File not found!"
                    ]
                });
        }

        return deferred.promise;
    }
}

JSGI.prototype.respond = function(request, callback)
{
    var route;
    for (route in this.routes)
    {
        if (this.routes[route].expr.test(request.pathInfo))
        {
            route = this.routes[route];
            break;
        }
        else
            route = void 0;
    }
    if (typeof route == "undefined")
        return false;

    var self = this;

    function sendResponse(body)
    {
        callback({
            status: 200,
            headers: {
                "content-type": "text/javascript",
                "transfer-encoding": "chunked"
                // NOTE: Do not set content length as length is not accurate for some JS files                
//                "content-length": (body = body.join("\n")).length
            },
            body: [
                body.join("\n")
            ]
        });
    }

    if (typeof route.options.programPath != "undefined")
    {
        function send(sandbox)
        {
            var body = [],
                path,
                deps,
                parts,
                descriptor,
                pkg,
                id;

            var contextId,
                parentContextsModules = [],
                memoizedModules = [],
                loaderInjected = false;

            var port = ((request.port)?request.port:80);

            var basePath = route.options.basePath || sandbox.getMainModuleDir();

            var routesDescriptor;
            if (self.trackRoutes === true)
            {
                var routesPath = API.FILE.dirname(sandbox.program.descriptor.path);
                if (!routeDescriptors[routesPath])
                    routeDescriptors[routesPath] = new DESCRIPTORS.Routes(routesPath);
                routesDescriptor = routeDescriptors[routesPath];

                function recordRoute(info)
                {
                    var uri;
                    if (info.load === true)
                        uri = request.pathInfo.substring(route.path.length-3);
                    else
                        uri = "/";
                    var finalInfo = {
                        locator: {
                            location: info.path
                        },
                        modules: memoizedModules
                    };
                    if (typeof info.pkg != "undefined")
                    {
                        finalInfo.locator.id = info.pkg.id;
                        finalInfo.locator.module = uri.split("@").pop();
                    }
                    routesDescriptor.ensureRoute(uri, finalInfo);

                    if (contextId)
                        self.contexts[contextId] = memoizedModules;
                }
            }

            var config = {
                url: "http" + ((port==80)?"":"s") + "://" + request.host + ":" + port + request.pathInfo,
                mainModuleDir: "/" + request.host + ":" + port + route.path.substring(0, route.path.length-3)
            }
            config.mainContext = config.mainModuleDir + "/" + sandbox.packageForId(sandbox.program.getBootPackages()[0]["_package-0"].location).getHashId();

            function rewritePath(path, packageIDOnly)
            {
                var parts = path.split("@/");
                if (parts.length == 2)
                {
                    var pkg = sandbox.packageForId(parts[0]);
                    if (pkg)
                        return pkg.getHashId() + "@/" + parts[1];
                }

                var pkg = sandbox.packageForId(path);
                if (pkg)
                {
                    if (packageIDOnly)
                        return pkg.getHashId();
                    else
                        return rewritePath(pkg.getMainId());
                }

                if (path.substring(0, basePath.length) == basePath)
                    return path.substring(basePath.length);

                if (typeof route.options.rewritePaths == "undefined")
                    throw new Error("Path '" + path + "' must be rewritten via 'rewritePaths' map property. Property is not set!");

                var paths = route.options.rewritePaths.filter(function(filterPath)
                {
                    return (path.substring(0, filterPath[0].length) == filterPath[0]);
                });

                if (paths.length == 0)
                    throw new Error("No matching path in 'rewritePaths' map property found for path '" + path + "'.");

                return paths[0][1] + path.substring(paths[0][0].length);
            }

            var packageDescriptors = {
                "mapped": {},
                "sent": {}
            };

            function memoizeModule(moduleIdentifier, dependencies, moduleFactory)
            {
                if(memoizedModules.indexOf(moduleIdentifier) > -1 || parentContextsModules.indexOf(moduleIdentifier) > -1)
                    return;

                memoizedModules.push(moduleIdentifier);

                // Pull out plugin if applicable
                var plugin;
                if (typeof moduleIdentifier == "string")
                {
                    var m = moduleIdentifier.match(/^(\w*)!(.*)$/);
                    if (m)
                    {
                        plugin = m[1];
                        moduleIdentifier = m[2];
                    }
                }

                parts = moduleIdentifier.split("@/");

                deps = "";
                if (dependencies.length > 0)
                    deps = "'" + dependencies.join("','") + "'";

                // Rewrite package modules and mappings
                if (parts[1] == "package.json")
                {
                    packageDescriptors.sent[rewritePath(parts[0], true)] = true;
                    descriptor = API.UTIL.deepCopy(moduleFactory());
                    if (typeof descriptor.modules != "undefined")
                    {
                        for( var path in descriptor.modules)
                        {
                            if (typeof descriptor.modules[path].location == "undefined")
                                throw new Error("There should be a location property in the mapping locator by now!");
                            packageDescriptors.mapped[rewritePath(descriptor.modules[path].location, true)] = true;
                            descriptor.modules[path].location = config.mainModuleDir + "/" + rewritePath(descriptor.modules[path].location, true);
                            delete descriptor.modules[path].id;
                        }
                    }
                    if (typeof descriptor.mappings != "undefined")
                    {
                        for( var alias in descriptor.mappings)
                        {
                            if (typeof descriptor.mappings[alias].location == "undefined")
                                throw new Error("There should be a location property in the mapping locator by now!");
                            packageDescriptors.mapped[rewritePath(descriptor.mappings[alias].location, true)] = true;
                            descriptor.mappings[alias].location = config.mainModuleDir + "/" + rewritePath(descriptor.mappings[alias].location, true);
                            delete descriptor.mappings[alias].id;
                        }
                    }
                    moduleFactory = "function() { return " + API.JSON.stringify(descriptor) + "; }";
                }

                var pkg = sandbox.packageForId(parts[0]);
                if (pkg)
                {
                    id = config.mainModuleDir + "/" + pkg.getHashId() + "@/" + parts[1];
                }
                else
                if (parts.length == 1)
                {
                    id = config.mainModuleDir + rewritePath(API.FILE.realpath(parts[0]));
                }
                else
                    throw new Error("NYI - " + parts);

                if (/\.js$/.test(id))
                    id = id.substring(0, id.length-3);

                body.push("require.memoize(" + ((typeof plugin != "undefined")?"'"+plugin+"!'+":"") + "bravojs.realpath('" + id + "'), [" + deps + "], " + moduleFactory + ");");
            }

            function memoizeMissingPackageDescriptors()
            {
                for (var pkgId in packageDescriptors.mapped)
                {
                    if (typeof packageDescriptors.sent[pkgId] == "undefined")
                    {
                        pkg = sandbox.packageForHash(pkgId);
                        memoizeModule(pkg.path + "@/package.json", [], function()
                        {
                            return pkg.normalizedDescriptor.json;
                        });
                    }
                }
            }

            function injectLoader()
            {
                if (loaderInjected)
                    return;
                loaderInjected = true;

                var path;

                // Configure BravoJS

                body.push("bravojs = " + API.JSON.stringify(config) + ";");

                // Pull in BravoJS and plugins

                path = API.ENV.loaderRoot + "/lib/pinf-loader-js/bravojs/global-es5.js";
                body.push(API.FILE.read(path));

                path = API.ENV.loaderRoot + "/lib/pinf-loader-js/bravojs/bravo.js";
                body.push(API.FILE.read(path));

                path = API.ENV.loaderRoot + "/lib/pinf-loader-js/bravojs/plugins/packages/packages.js";
                body.push(API.FILE.read(path));

                path = API.ENV.loaderRoot + "/lib/pinf-loader-js/bravojs/plugins/packages/loader.js";
                body.push(API.FILE.read(path));                
            }

            function initContext(pkgId, modulePathId, callback, trackCollectedModules)
            {
                if (!pkgId || !modulePathId)
                {
                    callback();
                    return;
                }

                trackCollectedModules = trackCollectedModules || true;

                var collectedModules = [];

                var cbt = new API.UTIL.CallbackTracker(function()
                {
                    if (trackCollectedModules !== false)
                        parentContextsModules = collectedModules;
                    callback(collectedModules);
                });

                // Check program contexts to see if we are a top-level context and need to inject the loader
                var info,
                    contextOptions = {
                        contextFor: function(pkgId, contexts)
                        {
                            var pkg = sandbox.packageForId(pkgId),
                                mainId = pkg.getMainId(null, true);
                            if (mainId)
                                mainId = mainId.split("@")[1];
                            else
                                mainId = "/";
                            return pkg.normalizedDescriptor.contextFor(pkgId, mainId, contextOptions, contexts);
                        }
                    };
                if ((info = sandbox.program.descriptor.contextFor(pkgId, modulePathId, contextOptions)))
                {
                    contextId = pkgId + "@" + modulePathId;
                    var cbt2 = new API.UTIL.CallbackTracker(function()
                    {
                        if (info.top === true)
                            injectLoader();

                        if (typeof info.include != "undefined")
                        {
                            info.include.forEach(function(id)
                            {
                                var idParts = id.split("@/");
                                sandbox.load({
                                    id: idParts[0],
                                    module: "/" + idParts[1]
                                }, cbt.add());
                            });
                        }
                    });

                    if (typeof info.parents != "undefined" && info.parents.length > 0)
                    {
                        info.parents.forEach(function(parent)
                        {
                            if (!self.contexts[parent])
                            {
                                new PINF_LOADER.Sandbox(
                                {
                                    programPath: route.options.programPath
                                },
                                cbt2.add(function done(sandbox)
                                {
                                    self.contexts[parent] = [];
                                    sandbox.forEachModule(function(moduleIdentifier, dependencies, moduleFactory)
                                    {
                                        self.contexts[parent].push(moduleIdentifier);
                                        collectedModules.push(moduleIdentifier);
                                    });
                                }));
                            }
                            else
                            {
                                self.contexts[parent].forEach(function(moduleIdentifier)
                                {
                                    collectedModules.push(moduleIdentifier);
                                })
                            }
                        });
                    }
                    
                    cbt2.done();
                }

                cbt.done();
            }

            if (typeof route.load != "undefined" && route.load === true)
            {
                // Prepare extra load payload

                pkg = null;
                var pathInfoParts = route.expr.exec(request.pathInfo),
                    pathParts = pathInfoParts[1].split("@/");
                if (pathParts.length == 2 && (pkg = sandbox.packageForHash(pathParts[0])))
                {
                    path = pkg.path + "@/" + pathParts[1];
                }
                else
                {
                    // The client converted ../ to __/ to keep the directory up path segments in tact
                    path = basePath + pathInfoParts[1].replace(/_{2}\//g, "../");
                }

                // Collect all existing modules so we can determine new ones
                function sendModules(loadedId, info)
                {
                    // Memoize new modules

                    sandbox.forEachModule(function(moduleIdentifier, dependencies, moduleFactory)
                    {
                        memoizeModule(moduleIdentifier, dependencies, moduleFactory);
                    });
                    memoizeMissingPackageDescriptors();

                    // Set loaded ID if applicable
                    
                    if (typeof loadedId != "undefined")
                    {
                        if (/\.js$/.test(loadedId))
                            loadedId = loadedId.substring(0, loadedId.length-3);
                        body.push("__bravojs_loaded_moduleIdentifier = bravojs.realpath('" + config.mainModuleDir + "/" + rewritePath(loadedId) + "');");
                    }

                    // Send response

                    if (typeof routesDescriptor != "undefined")
                        recordRoute(info);

                    sendResponse(body);
                }

                initContext((pkg)?pkg.id:null, (pkg)?"/"+pathParts[1]:null, function()
                {
                    var loadedCallback = function(loadedId)
                    {
                        sendModules(loadedId, {
                            path: path,
                            pkg: pkg,
                            load: true
                        });
                    };
    
                    pathParts = path.split("@/");
                    if (pathParts.length == 2)
                    {
                        sandbox.load({
                            location: pathParts[0],
                            module: "/" + pathParts[1]
                        }, loadedCallback);
                    }
                    else
                    if (/\/$/.test(path))
                    {
                        sandbox.load({
                            location: path
                        }, loadedCallback);
                    }
                    else
                    {
                        sandbox.load(path, loadedCallback);
                    }                    
                });
            }
            else
            {
                var dependencies = sandbox.program.getBootPackages();
                if (dependencies.length != 1)
                    throw new Error("Multiple boot packages not supported! Specified in: " + sandbox.program.descriptor.path);

                var pkg = sandbox.packageForId(sandbox.program.descriptor.json.boot);

                initContext(pkg.id, pkg.getMainId().split("@")[1], function(collectedModules)
                {
                    // Prepare initial program payload
                    
                    injectLoader();

                    // Memoize modules
    
                    sandbox.forEachModule(memoizeModule);
                    memoizeMissingPackageDescriptors();
        
                    // Boot the program

                    for (var i=0, ic=dependencies.length ; i<ic ; i++ )
                    {
                        if (typeof dependencies[i]["_package-" + i].location != "undefined")
                        {
                            var pkg = sandbox.packageForId(dependencies[i]["_package-" + i].location);
                            dependencies[i]["_package-" + i] = {
                                id: pkg.getHashId()
                            }
                        }
                        else
                            throw new Error("NYI");
                    }
    
                    body.push("(function() {");
                        body.push("var env = {};");
                        body.push("module.declare(" + API.JSON.stringify(dependencies) + ", function(require, exports, module) {");
                            for (var i=0, ic=dependencies.length ; i<ic ; i++ )
                                body.push("require('_package-" + i + "').main(env);");
                        body.push("});");
                    body.push("})();");
    
                    // Send response
    
                    if (typeof routesDescriptor != "undefined")
                        recordRoute({
                            path: sandbox.program.descriptor.path
                        });
    
                    sendResponse(body);
                }, false);
            }
        }

        // Always create a new sandbox for the request
        // TODO: Config to exclude modules
        new PINF_LOADER.Sandbox(
        {
            programPath: route.options.programPath
        },
        function done(sandbox)
        {
            send(sandbox);
        });
    }
    else
        throw new Error("Unrecognized route target options '" + Object.keys(route.options) + "'");

    return true;
}
