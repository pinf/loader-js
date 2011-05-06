
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
        this.routes[basePath + "/"] = {
            expr: new RegExp("^" + basePath.replace(/(\/|\\)/g, "\\$1") + "\/(.*)$"),
            path: path,
            options: options.map[path],
            load: true
        }
    }

    this.trackRoutes = options.trackRoutes || false;
    this.contexts = {};
}

JSGI.prototype.spider = function(route, targetPath, callback)
{
    if (typeof this.routes[route] == "undefined")
        throw new Error("Route '" + route + "' not found in routes: " + Object.keys(this.routes));
    route = this.routes[route];

    if (typeof route.options.programPath != "undefined")
    {
        API.SYSTEM.print("Spidering program: " + route.options.programPath + "\n");

        API.SYSTEM.print("Target path: " + targetPath + "\n");
        
        if (!API.FILE.exists(API.FILE.dirname(targetPath)))
            throw new Error("Directory containing target path must exist: " + API.FILE.dirname(targetPath));

        var self = this;

        function spider()
        {
            var responder = self.responder(null);

            new PINF_LOADER.Sandbox(
            {
                programPath: route.options.programPath,
                platform: "browser"
            },
            function done(sandbox)
            {
                var contexts = sandbox.program.getContexts(sandbox).getAllContexts();

                if (!contexts || Object.keys(contexts).length === 0)
                {
                    if (typeof callback === "function")
                        callback(false);
                    return;
                }

                API.SYSTEM.print("Routes:\n");

                var spidering = false,
                    spiderQueue = [],
                    spiderInsight = {},
                    resourceQueue = [];
                    
                function copyResourcesForPackage(info)
                {
                    function copyResourcesForPackage_final()
                    {
                        if (resourceQueue.length > 0)
                        {
                            copyResourcesForPackage(resourceQueue.shift());
                        }
                        else
                        {
                            resourceQueue = false;
                            if (typeof callback === "function")
                                callback(true);
                        }
                    }

                    var fromPath = info.sourcePath + "/resources",
                        toPath = targetPath + route.path.substring(0, route.path.length-3) + "/" + info.hashId + "@/resources";

                    if (!API.FILE.exists(fromPath) || API.FILE.exists(toPath))
                    {
                        copyResourcesForPackage_final();
                        return;
                    }

                    API.SYSTEM.print("    Copy Resources: " + fromPath + " -> " + toPath + "\n");

                    if (!API.FILE.exists(API.FILE.dirname(toPath)))
                        API.FILE.mkdirs(API.FILE.dirname(toPath), 0775);

                    API.SYSTEM.exec("cp -Rf " + fromPath + " " + toPath, function() {
                        copyResourcesForPackage_final();
                    });
                }

                function spiderForUri(uri)
                {
                    if (spidering)
                    {
                        spiderQueue.push(uri);
                        return;
                    }
                    spidering = true;

                    API.SYSTEM.print("    URI: " + uri + "\n");

                    var data = responder({
                        pathInfo: uri
                    }, spiderInsight);
                    data.then(
                        function handle(data)
                        {
                            if (data.status != 200)
                                throw new Error("Status for uri '" + uri + "' not 200.");
    
                            var path = targetPath + uri,
                                dirname = API.FILE.dirname(path);
                            if (/\/$/.test(dirname))
                                dirname = dirname.substring(0, dirname.length-1);
                            if (!API.FILE.exists(dirname))
                                API.FILE.mkdirs(dirname, 0775);
    
                            API.FILE.write(path, data.body.join(""));
                            
                            spidering = false;
                            if (spiderQueue.length > 0)
                            {
                                spiderForUri(spiderQueue.shift());
                            }
                            else
                            {
                                if (Object.keys(spiderInsight.packages).length > 0)
                                {
                                    for (var key in spiderInsight.packages)
                                    {
                                        resourceQueue.push(spiderInsight.packages[key]);
                                    }
                                    copyResourcesForPackage(resourceQueue.shift());
                                }
                                else
                                {
                                    if (typeof callback === "function")
                                        callback(true);
                                }
                            }
                        },
                        function (error)
                        {
                            throw new Error("ERROR: " + error.stack);
                        },
                        function (data)
                        {
                            throw new Error("NYI");
                            // @see https://github.com/kriszyp/jsgi-node/blob/v0.2.4/lib/jsgi-node.js#L128
                            // TODO: handle(data, true);
                        }
                    );
                }
                
                for (var id in contexts)
                {
                    var info = contexts[id];
                
                    var uri = route.path.substring(0, route.path.length-3) + "/" + info.hashId + "@" + info.module;
                
                    if (info.id == sandbox.program.descriptor.json.boot)
                        uri = route.path;
                
                    API.SYSTEM.print("  URI: \0yellow(" + info.id + "\0)\n");

                    if (API.FILE.basename(uri) == "*")
                    {
                        var pkg = sandbox.packageForId(info.pkg),
                            basePath = pkg.path + API.FILE.dirname(info.module),
                            files = API.FILE.readdir(basePath);
                
                        files.forEach(function (basename)
                        {
                            spiderForUri(API.FILE.dirname(uri) + "/" + basename);
                        });
                    }
                    else
                    {
                        if (!/\.js$/.test(uri))
                            uri += ".js";
                        spiderForUri(uri);
                    }
                }
            });            
        }

        var command = "rm -f " + targetPath + route.path;
        API.SYSTEM.exec(command, function() {
            command = "rm -Rf " + targetPath + route.path.substring(0, route.path.length-3);
            API.SYSTEM.exec(command, function() {
                spider();
            });
        });
    }
    else
        throw new Error("NYI");
}

JSGI.prototype.responder = function(app)
{
    var self = this;

    return function(request, spiderInsight)
    {
        var deferred = self.API.PROMISE.defer();

        var responding;

        try
        {
            responding = self.respond(request, function(response)
            {
                deferred.resolve(response);
            }, spiderInsight);
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

JSGI.prototype.respond = function(request, callback, spiderInsight)
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

    spiderInsight = spiderInsight || {};
    spiderInsight.packages = spiderInsight.packages || {};

    // we collect contexts locally and store them globally once done for a request
    // this way we ensure we don't have partial parent contexts when a new request comes in
    if (typeof this.contexts == "undefined")
        this.contexts = {};
    if (typeof this.contexts[route.path] == "undefined")
        this.contexts[route.path] = {};
    var contextsCache = {};
    for (var ctxId in this.contexts[route.path])
    {
        contextsCache[ctxId] = this.contexts[route.path][ctxId];
    }

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
                }
            }
            
            function recordContexts()
            {
                if (contextId)
                    contextsCache[contextId] = memoizedModules;
                        
                for (var ctxId in contextsCache)
                {
                    if (typeof self.contexts[route.path][ctxId] == "undefined")
                    {
                        self.contexts[route.path][ctxId] = [].concat(contextsCache[ctxId]);
                    }
                }
            }

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

//console.log("  memoise: " + moduleIdentifier);

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

                var pkg = sandbox.packageForId(parts[0]);

                // Rewrite package modules and mappings
                if (parts[1] == "package.json")
                {
                    spiderInsight.packages[pkg.getHashId()] = {
                        hashId: pkg.getHashId(),
                        sourcePath: pkg.path
                    };

                    packageDescriptors.sent[rewritePath(parts[0], true)] = true;
                    descriptor = API.UTIL.deepCopy(moduleFactory());
                    if (typeof descriptor.modules != "undefined")
                    {
                        for( var path in descriptor.modules)
                        {
                            if (typeof descriptor.modules[path] == "object" && descriptor.modules[path].available !== false)
                            {
                                if (typeof descriptor.modules[path].location == "undefined")
                                    throw new Error("There should be a location property in the mapping locator by now! path["+path+"] locator["+API.JSON.stringify(descriptor.modules[path])+"]");
                                packageDescriptors.mapped[rewritePath(descriptor.modules[path].location, true)] = true;
                                descriptor.modules[path].location = "__MAIN_MODULE_DIR__" + "/" + rewritePath(descriptor.modules[path].location, true);
                                delete descriptor.modules[path].id;
                            }
                        }
                    }
                    if (typeof descriptor.mappings != "undefined")
                    {
                        for( var alias in descriptor.mappings)
                        {
                            if (descriptor.mappings[alias].available === false)
                            {
                                // leave as is
                            }
                            else
                            {
                                if (typeof descriptor.mappings[alias].location == "undefined")
                                    throw new Error("There should be a location property in the mapping locator by now!");
                                packageDescriptors.mapped[rewritePath(descriptor.mappings[alias].location, true)] = true;
                                descriptor.mappings[alias].location = "__MAIN_MODULE_DIR__" + "/" + rewritePath(descriptor.mappings[alias].location, true);
                                delete descriptor.mappings[alias].id;
                            }
                        }
                    }
                    descriptor = API.JSON.stringify(descriptor);
                    descriptor = descriptor.replace(/__MAIN_MODULE_DIR__/g, '" + bravojs.mainModuleDir + "');
                    moduleFactory = "function() { return " + descriptor + "; }";
                }

                if (pkg)
                {
                    id = "/" + pkg.getHashId() + "@/" + parts[1];
                }
                else
                if (parts.length == 1)
                {
                    id = rewritePath(API.FILE.realpath(parts[0]));
                }
                else
                    throw new Error("NYI - " + parts);

                if (/\.js$/.test(id))
                    id = id.substring(0, id.length-3);

                body.push("require.memoize(" + ((typeof plugin != "undefined")?"'"+plugin+"!'+":"") + "bravojs.realpath(bravojs.mainModuleDir + '" + id + "'), [" + deps + "], " + moduleFactory + ");");
            }

            function memoizeMissingPackageDescriptors()
            {
                var count = Object.keys(packageDescriptors.mapped).length;
                
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
                if (Object.keys(packageDescriptors.mapped).length != count)
                    memoizeMissingPackageDescriptors();
            }

            function injectLoader()
            {
                if (loaderInjected)
                    return;
                loaderInjected = true;

                var path;

                // Configure BravoJS

                body.push("if (typeof bravojs == 'undefined') { bravojs = {}; }");
                body.push("if (typeof window != 'undefined' && typeof bravojs.url == 'undefined') {");
                // in browser
                body.push("bravojs.url = window.location.protocol + '//' + window.location.host + '" + request.pathInfo + "';");
                body.push("} else if(typeof importScripts != 'undefined' && typeof bravojs.url == 'undefined') {");
                // in worker
                body.push("bravojs.url = location;");
                body.push("}");
                // all
                body.push("bravojs.mainModuleDir = /^(https?|resource):\\/(.*?)\\.js$/.exec(bravojs.url)[2];");
                body.push("bravojs.mainContext = bravojs.mainModuleDir + '/" + sandbox.packageForId(sandbox.program.getBootPackages()[0]["_package-0"].location).getHashId() + "';");
                body.push("bravojs.platform = 'browser';");
                body.push("function dump() { (bravojs.dump || bravojs.print).apply(null, arguments); };");

                // Pull in BravoJS and plugins

                if (typeof __require__ != "undefined")
                {
                    body.push(__require__("text!bravojs/global-es5.js"));
                    body.push(__require__("text!bravojs/bravo.js"));
                    body.push(__require__("text!bravojs/plugins/packages/packages.js"));
                    body.push(__require__("text!bravojs/plugins/packages/loader.js"));
                }
                else
                {
                    path = API.ENV.loaderRoot + "/lib/pinf-loader-js/bravojs/global-es5.js";
                    body.push(API.FILE.read(path));
    
                    path = API.ENV.loaderRoot + "/lib/pinf-loader-js/bravojs/bravo.js";
                    body.push(API.FILE.read(path));
    
                    path = API.ENV.loaderRoot + "/lib/pinf-loader-js/bravojs/plugins/packages/packages.js";
                    body.push(API.FILE.read(path));
    
                    path = API.ENV.loaderRoot + "/lib/pinf-loader-js/bravojs/plugins/packages/loader.js";
                    body.push(API.FILE.read(path));                
                }
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
                var contexts = sandbox.program.getContexts(sandbox).getAllContexts(),
                    info = sandbox.program.getContexts(sandbox).contextFor(pkgId, modulePathId);

                if (info)
                {
                    contextId = pkgId + "@" + modulePathId.replace(/\.js$/, "");
                    var cbt2 = new API.UTIL.CallbackTracker(function()
                    {
                        if (info.type === "top")
                            injectLoader();

                        if (typeof info.includes != "undefined")
                        {
                            info.includes.forEach(function(id)
                            {
                                var idParts = id.split("@/");
                                sandbox.load({
                                    id: idParts[0],
                                    module: "/" + idParts[1]
                                }, cbt.add());
                            });
                        }
                    });

                    if (typeof info.parents != "undefined")
                    {
                        for (var i=0,ic=info.parents.length ; i<ic ; i++)
                        {
                            var parent = info.parents[i];

                            if (!contextsCache[parent])
                            {
                                new PINF_LOADER.Sandbox(
                                {
                                    programPath: route.options.programPath,
                                    platform: "browser"
                                },
                                cbt2.add(function done(sandbox)
                                {
                                    contextsCache[parent] = [];

                                    if (contexts[parent] && contexts[parent].includes && contexts[parent].includes.length > 0)
                                    {
                                        contexts[parent].includes.forEach(function(id)
                                        {
                                            var idParts = id.split("@/");
                                            sandbox.load({
                                                id: idParts[0],
                                                module: "/" + idParts[1]
                                            }, cbt2.add(function()
                                            {
                                                // TODO: Move this up so it is only called once after all sandbox.load() are called 
                                                sandbox.forEachModule(function(moduleIdentifier, dependencies, moduleFactory)
                                                {
                                                    contextsCache[parent].push(moduleIdentifier);
                                                    collectedModules.push(moduleIdentifier);
                                                });
                                            }));
                                        });
                                    }
                                }));
                            }
                            else
                            {
                                contextsCache[parent].forEach(function(moduleIdentifier)
                                {
                                    collectedModules.push(moduleIdentifier);
                                });
                            }
                        }
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

                if (/@\/resources\//.test(path))
                {
                    path = path.replace(/@\//, "/").replace(/\?.*$/, "");

                    if (!API.FILE.exists(path))
                    {
                        callback({
                            status: 404,
                            headers: {
                                "content-type": "text/plain"
                            },
                            body: [
                                "File not found!"
                            ]
                        });
                        return;
                    }

                    var ext = path.match(/\.([^\.]*)$/)[1],
                        types = {
                            "png": "image/png",
                            "jpg": "image/jpeg",
                            "jpeg": "image/jpeg",
                            "gif": "image/gif",
                            "htm": "text/html",
                            "html": "text/html",
                            "xml": "text/xml",
                            "css": "text/css",
                            "js": "application/x-javascript",
                            "json": "application/json"
                        };

                    callback({
                        status: 200,
                        headers: {
                            "content-type": types[ext],
                            "transfer-encoding": "chunked"
                        },
                        body: [
                            API.FILE.read(path, "binary")
                        ]
                    });
                    return;
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
                        body.push("__bravojs_loaded_moduleIdentifier = bravojs.realpath(bravojs.mainModuleDir + '/" + rewritePath(loadedId) + "');");
                    }

                    // Send response

                    recordContexts();

                    if (typeof routesDescriptor != "undefined")
                        recordRoute(info);

                    sendResponse(body);
                }

                initContext((pkg)?pkg.id:null, (pkg)?"/"+pathParts[1]:null, function(collectedModules)
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

                    recordContexts();
    
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
            programPath: route.options.programPath,
            platform: "browser"
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
