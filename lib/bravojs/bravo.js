/**
 *  This file implements BravoJS, a CommonJS Modules/2.0 environment.
 *
 *  Copyright (c) 2010, PageMail, Inc.
 *  Wes Garland, wes@page.ca
 *  MIT License
 *
 *    - Initial implementation
 *
 *  Copyright (c) 2011, Christoph Dorn
 *  Christoph Dorn, christoph@christophdorn.com
 *  MIT License
 *
 *    - Added package and mappings support
 *    - Various tweaks
 *
 */

function bravojs_init(bravojs,    /**< Namespace object for this implementation */
                      window)
{
try { 

var require, module;

if (!bravojs.hasOwnProperty("errorReporter"))
{
  bravojs.errorReporter = function bravojs_defaultDrrorReporter(e)
  {
    alert(" * BravoJS: " + e + "\n" + e.stack);
    throw(e);
  }
}

/** Reset the environment so that a new main module can be loaded */
bravojs.reset = function bravojs_reset(mainModuleDir)
{
  if (!mainModuleDir)
  {
    if (typeof bravojs.mainModuleDir != "undefined")
      mainModuleDir = bravojs.mainModuleDir;
    else
      mainModuleDir = bravojs.dirname(bravojs.URL_toId(window.location.href + ".js", true));
  }

  bravojs.requireMemo 			= {};	/**< Module exports, indexed by canonical name */
  bravojs.pendingModuleDeclarations	= {};	/**< Module.declare arguments, indexed by canonical name */
  bravojs.mainModuleDir 		= mainModuleDir;
  bravojs.plugins = [];
  bravojs.contexts = {};
  bravojs.activeContexts = [];

  delete bravojs.Module.prototype.main;
  delete bravojs.scriptTagMemo;
  delete bravojs.scriptTagMemoIE;

  /* The default context. Needed before bravojs.Module() can be called. */
  bravojs.makeContext("_");

  /** Extra-module environment */
  require = window.require = bravojs.requireFactory(bravojs.mainModuleDir);
  module = window.module  = new bravojs.Module('', []);
}

/** Print to text to stdout */
function bravojs_print()
{
  var output="";
  var i;
  var stdout;

  for (i=0; i < arguments.length; i++)
    output += arguments[i] + (i===arguments.length - 1 ? "" : " ");
  output.replace(/\t/, "        ");

  if ((stdout = document.getElementById('stdout')))
  {
    output += "\n";

    if (typeof stdout.value !== "undefined")
    {
      stdout.value += output;
      if (stdout.focus)
	stdout.focus();

      if (stdout.tagName === "TEXTAREA")
	stdout.scrollTop = stdout.scrollHeight;
    }
    else
    {
      if (typeof stdout.innerText !== "undefined")
      {
	stdout.innerText = stdout.innerText.slice(0,-1) + output + " "; 	/* IE normalizes trailing newlines away */
      }
      else
	stdout.textContent += output;
    }
  }
  else if (typeof console === "object" && console.print)
  {
    console.print(output);
  }
  else if (typeof console === "object" && console.log)
  {
    console.log(output);
  }
  else 
    alert(" * BravoJS stdout: " + output);
}
if (typeof bravojs.print === "undefined")
    bravojs.print = bravojs_print;

bravojs.registerPlugin = function(plugin)
{
    bravojs.plugins.push(plugin);
}

bravojs.callPlugins = function(method, args)
{
  var i, ret;
  for (i = 0 ; i < bravojs.plugins.length ; i++ )
  {
    if (typeof bravojs.plugins[i][method] != "undefined" &&
        typeof (ret = bravojs.plugins[i][method].apply(bravojs.plugins[i], args)) != "undefined")
        break;
  }
  return ret;
}

/** Canonicalize path, compacting slashes and dots per basic UNIX rules.
 *  Treats paths with trailing slashes as though they end with INDEX instead.
 *  Not rigorous.
 */
bravojs.realpath = function bravojs_realpath(path)
{
  if (typeof path !== "string")
    path = path.toString();

  var oldPath = path.split('/');
  var newPath = [];
  var i;

  if (path.charAt(path.length - 1) === '/')
    oldPath.push("INDEX");

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

/** Extract the non-directory portion of a path */
bravojs.basename = function bravojs_basename(path)
{
  if (typeof path !== "string")
    path = path.toString();

  var s = path.split('/').slice(-1).join('/');
  if (!s)
    return path;
  return s;
}

/** Extract the directory portion of a path */
bravojs.dirname = function bravojs_dirname(path)
{
  if (typeof path !== "string")
    path = path.toString();

  if (path.charAt(path.length - 1) === '/')
    return path.slice(0,-1);

  var s = path.split('/').slice(0,-1).join('/');
  if (!s)
    return ".";

  /* If path ends in "/@/xxx.js" then s will end in /@ which needs to be fixed */
  if (s.charAt(s.length-1)=="@")
    s += "/";

  return s;
}

/** Turn a module identifier and module directory into a canonical
 *  module.id.
 */
bravojs.makeModuleId = function makeModuleId(relativeModuleDir, moduleIdentifier)
{
  var id;

  if (moduleIdentifier === '')	/* Special case for main module */
    return '';

  if (typeof moduleIdentifier === "object")
  {
    id = bravojs.makeModuleIdFromMapping(relativeModuleDir, moduleIdentifier);
  }
  else
  {
    /* <packageID>@/<moduleID> */
    var parts = moduleIdentifier.split("@/");
    if (parts.length==1)
    {
      if (moduleIdentifier.charAt(0) === '/')
      {
        /* Absolute path. Not required by CommonJS but it makes dependency list optimization easier */
        id = moduleIdentifier;
      }
      else
      if ((moduleIdentifier.indexOf("./") == 0) || (moduleIdentifier.indexOf("../") == 0))
      {
        id = relativeModuleDir + "/" + moduleIdentifier;
      }
      else
      {
        id = bravojs.contextForId(relativeModuleDir).resolveAbsoluteId(relativeModuleDir, moduleIdentifier);
      }
    }
    else
    if (parts.length==2)
    {
        /* Reference a module irrespective of relativeModuleDir as moduleIdentifier includes a packageID.
         * If packageID is a known UID we convert it to it's path-based ID by checking the registered contexts.
         * This means a UID-based moduleId conversion will only be successful if the context is already loaded
         * and should thus only be used within a running program.
         */
        if (bravojs.hasContextForId(parts[0]))
        {
            id = bravojs.contextForId(parts[0]).id + "@/" + parts[1];
        }
        else
        {
          /* Do not change anything as the packageID is already unique and path-based */
          id = moduleIdentifier;
        }
    }
    else
      throw new Error("Invalid module identifier: " + moduleIdentifier);
  }
  return bravojs.realpath(id);
}

/** Turn a package mapping and module directory into a canonical
 *  module.id.
 *  If (moduleIdentifier === false) will return a package ID instead.
 */
bravojs.makeModuleIdFromMapping = function makeModuleIdFromMapping(relativeModuleDir, mapping, moduleIdentifier)
{
  var id;
  if (typeof mapping == "string")
  {
      mapping = {
          location: mapping
      };
  }
  if (typeof mapping.id != "undefined")
  {
      id = mapping.id;
  }
  else
  if (typeof mapping.catalog != "undefined" || typeof mapping.archive != "undefined")
  {
    if (typeof mapping.catalog != "undefined" && typeof mapping.name == "undefined")
      throw new Error("Catalog-basd mapping does not specify 'name' property: " + mapping);
    id = bravojs.callPlugins("resolvePackageMapping", [mapping]);
    if (typeof id == "undefined")
      throw new Error("Mapping could not be resolved by plugins: " + ((mapping.toSource)?mapping.toSource():mapping));
  }
  else
  if (typeof mapping.location != "undefined")
  {
    if ((mapping.location.indexOf("./") == 0) || (mapping.location.indexOf("../") == 0))
    {
      /* Relative package path -- relative to relativeModuleDir */
      id = relativeModuleDir + "/" + mapping.location;
    }
    else
    if (mapping.location.indexOf("/") == 0)
    {
      id = mapping.location;
    }
    else
    {
      id = mapping.location;
    }
  }
  else
    throw new Error("Invalid mapping: " + ((mapping.toSource)?mapping.toSource():mapping));

  /* Separate the package ID from the module ID so we know where to look for the package root */
  id += "@/";

  if (typeof moduleIdentifier == "undefined")
  {
    if (typeof mapping.descriptor =="undefined" || typeof mapping.descriptor.main == "undefined")
      return bravojs.contextForId(bravojs.realpath(id)).resolveRelativeId(relativeModuleDir, null);
    else
      return id + mapping.descriptor.main;
  }
  else
  if (moduleIdentifier === false)
  {
    return bravojs.contextForId(bravojs.realpath(id)).id;  /* This is a package ID */
  }
  else
    return bravojs.contextForId(bravojs.realpath(id + moduleIdentifier)).resolveRelativeId(relativeModuleDir, moduleIdentifier);
}

/** Turn a script URL into a canonical module.id */
bravojs.URL_toId = function URL_toId(moduleURL, relaxValidation)
{
  var i;

  /* Treat the whole web as our module repository.
   * 'http://www.page.ca/a/b/module.js' has id '/www.page.ca/a/b/module'. 
   */
  i = moduleURL.indexOf("://");
  if (i == -1)
    throw new Error("Invalid module URL: " + moduleURL);
  id = moduleURL.slice(i + 2);

  id = bravojs.realpath(id);
  if ((i = id.indexOf('?')) != -1)
    id = id.slice(0, i);
  if ((i = id.indexOf('#')) != -1)
    id = id.slice(0, i);

  if (!relaxValidation && (id.slice(-3) != ".js"))
    throw new Error("Invalid module URL: " + moduleURL);
  id = id.slice(0,-3);

  return id;
}

/** Normalize a dependency array so that only unique and previously unprovided 
 *  dependencies appear in the output list. The output list also canonicalizes
 *  the module names relative to the current require. Labeled dependencies are
 *  unboxed.
 *  If relativeModuleDir is set it is used to resolve relative dependencies.
 */
bravojs.normalizeDependencyArray = function bravojs_normalizeDependencyArray(dependencies, relativeModuleDir)
{
  var normalizedDependencies = [];
  var i, label;

  function addNormal(moduleIdentifier)
  {
    /* Needed to resolve relative dependencies when using module.declare() */
    if (typeof relativeModuleDir != "undefined" && typeof moduleIdentifier == "string" && moduleIdentifier.charAt(0) == ".")
      moduleIdentifier = bravojs.realpath(bravojs.dirname(relativeModuleDir) + "/" + moduleIdentifier);

    var id = require.id(moduleIdentifier);
    if (bravojs.requireMemo[id] || bravojs.pendingModuleDeclarations[id])
      return;

    normalizedDependencies.push(id);
  }

  for (i=0; i < dependencies.length; i++)
  {
    switch(typeof dependencies[i])
    {
      case "object":
	for (label in dependencies[i])
	{
	  if (dependencies[i].hasOwnProperty(label))
	    addNormal(dependencies[i][label]);
	}
	break;

      case "string":
	addNormal(dependencies[i]);
	break;

      default:
	throw new Error("Invalid dependency array value at position " + (i+1));
    }
  }

  return normalizedDependencies;
}

bravojs.loadPackageDescriptor = function bravojs_loadPackageDescriptor(id)
{
  var ret = bravojs.callPlugins("loadPackageDescriptor", [id]);
  if (typeof ret != "undefined")
    return ret;

  /* NOTE: The following request is SYNC and will block. Package descriptors
   * should be memoized before booting the program for better loading performance.
   */
  var URL = require.canonicalize(id);
  // TODO: Get this working in other browsers
  var req = new (bravojs.XMLHttpRequest || XMLHttpRequest)();
  req.open("GET", URL, false);
  req.send(null);
  if(req.status == 200)
  {
    try
    {
      return JSON.parse(req.responseText);
    }
    catch(e)
    {
      throw new Error("Error parsing package descriptor from URL '" + URL + "': " + e);
    }
  }
  else
    throw new Error("Error loading package descriptor from URL: " + URL);
}

bravojs.normalizePackageDescriptor = function bravojs_normalizePackageDescriptor(descriptor)
{
  var ret = bravojs.callPlugins("normalizePackageDescriptor", [descriptor]);
  if (typeof ret != "undefined")
    descriptor = ret;
  return descriptor;
}

/** Get a context for a given module ID used to resolve the ID. If a package
 *  prefix is found a context specific to the package is returned, otherwise
 *  the default context is returned.
 */
bravojs.contextForId = function bravojs_contextForId(id)
{
  var parts = id.split("@/"),
      id = parts[0];

  var ret = bravojs.callPlugins("contextForId", [id]);
  if (typeof ret != "undefined")
    id = ret;

  /* Return the default context if no package delimiter found */
  if (parts.length == 1)
  {
    if(typeof bravojs.contexts[id] != "undefined")
      return bravojs.contexts[id];
    else
      return bravojs.contexts["_"];
  }
  if (typeof bravojs.contexts[id] == "undefined")
    bravojs.makeContext(id);
  return bravojs.contexts[id];
}

bravojs.hasContextForId = function bravojs_hasContext(id)
{
  var parts = id.split("@/");
  if (parts.length == 2)
    id = parts[0];
  return (typeof bravojs.contexts[id] != "undefined");
}

/** Make a new context used to resolve module IDs
 */
bravojs.makeContext = function bravojs_makeContext(id)
{
  bravojs.contexts[id] = new bravojs.Context(id);
  /* The id so far is path-based. If the context/package descriptor specifies a UID we map
   * the same context to the UID as well.
   */
  if (typeof bravojs.contexts[id].uid != "undefined")
    bravojs.contexts[bravojs.contexts[id].uid] = bravojs.contexts[id];
  return bravojs.contexts[id];
}

/**
 * A Context object represents the root of a package and is used to resolve
 * IDs for packages.
 */
bravojs.Context = function bravojs_Context(id)
{
  this.id = id;
  if (this.id=="_")
    return;

  id = this.id + "@/package.json";

  if (require.isMemoized(id))
  {
    this.descriptor = require.getMemoized(id).moduleFactory();
  }
  else
  {
    this.descriptor = bravojs.normalizePackageDescriptor(bravojs.loadPackageDescriptor(id), id);
    var self = this;
    require.memoize(id, [], function() { return self.descriptor; });
  }

  this.libDir = this.descriptor.directories && this.descriptor.directories.lib;
  if (typeof this.libDir != "string")
  this.libDir = "lib";

  this.uid = this.descriptor.uid || void 0;
  if (typeof this.uid != "undefined")
  {
    var m = this.uid.match(/^https?:\/\/(.*)$/);
    if (!m)
      throw new Error("uid property '" + this.uid + "' must be a non-resolving or resolving URL with http or https protocol in: " + id);
    this.uid = m[1];  // strip the protocol prefix
  }
}

/** Get a map where labels point to package IDs for all declared mappings */
bravojs.Context.prototype.getNormalizedMappings = function bravojs_Context_getNormalizedMappings() {
  if (this.id == "_")
    throw new Error("Cannot get mappings for default context");

  if (typeof this.normalizedMappings != "undefined")
    return this.normalizedMappings;

  this.normalizedMappings = {};
  if (typeof this.descriptor.mappings != "undefined")
  {
    for (var label in this.descriptor.mappings)
    {
      this.normalizedMappings[label] = bravojs.makeModuleIdFromMapping(this.id, this.descriptor.mappings[label], false);
    }
  }
  return this.normalizedMappings;
}

bravojs.Context.prototype.resolveRelativeId = function bravojs_Context_resolveRelativeId(relativeModuleDir, moduleIdentifier) {
  /* Relative module path -- relative to relativeModuleDir */
  if (this.id == "_")
    return relativeModuleDir + "/" + moduleIdentifier;
  if (moduleIdentifier === null)
  {
    if (typeof this.descriptor == "undefined" ||
        typeof this.descriptor.main == "undefined")
      throw new Error("'main' property not set in package descriptor for: " + this.id);
    return this.id + "@/" + this.descriptor.main;
  }
  else
    return this.id + "@/" + this.libDir + "/" + moduleIdentifier;
}

bravojs.Context.prototype.resolveAbsoluteId = function bravojs_Context_resolveAbsoluteId(relativeModuleDir, moduleIdentifier) {
  var parts;
  if (
    /* Top-level module. Since we don't implement require.paths,
     * make it relative to the main module.
     */
    this.id == "_" ||

    /* If no descriptor nor mappings we are not interested */
    typeof this.descriptor == "undefined" ||
    typeof this.descriptor.mappings == "undefined" ||

    /* If id does not have at least two terms we are not interested */
    (parts = moduleIdentifier.split("/")).length == 1 ||

    /* If no mapping for first term we are not interested */
    typeof this.descriptor.mappings[parts[0]] == "undefined"
  )
    return bravojs.mainModuleDir + "/" + moduleIdentifier;

  return bravojs.makeModuleIdFromMapping(this.id, this.descriptor.mappings[parts[0]], "./" + parts.slice(1).join("/"));
}


/** Provide a module to the environment 
 *  @param	dependencies		A dependency array
 *  @param	moduleFactoryFunction	The function which will eventually be invoked
 *					to decorate the module's exports. If not specified,
 *					we assume the factory has already been memoized in
 *					the bravojs.pendingModuleDeclarations object.
 *  @param	id			The module.id of the module we're providing
 *  @param	callback		Optional function to run after the module has been
 *					provided to the environment
 */
bravojs.provideModule = function bravojs_provideModule(dependencies, moduleFactory, 
						       id, callback)
{
  /* Memoize the the factory, satistfy the dependencies, and invoke the callback */
  if (moduleFactory)
    require.memoize(id, dependencies, moduleFactory);

  if (dependencies)
  {
    module.provide(bravojs.normalizeDependencyArray(dependencies, id?id:bravojs.mainModuleDir+"/"), callback);
  }
  else
  {
    if (callback)
      callback();
  }
}

/** Initialize a module. This makes the exports object available to require(),
 *  runs the module factory function, and removes the factory function from
 *  the pendingModuleDeclarations object.
 */
bravojs.initializeModule = function bravojs_initializeModule(id)
{
  var moduleDir     = id ? bravojs.dirname(id) : bravojs.mainModuleDir;
  var moduleFactory = bravojs.pendingModuleDeclarations[id].moduleFactory;
  var dependencies  = bravojs.pendingModuleDeclarations[id].dependencies;
  var require, module;

  delete bravojs.pendingModuleDeclarations[id];

  require = bravojs.requireFactory(moduleDir, dependencies);
  exports = bravojs.requireMemo[id] = {};
  module  = new bravojs.Module(id, dependencies);

  module.augment();

  moduleFactory(require, exports, module);
}

/** Search the module memo and return the correct module's exports, or throw.
 *  Searching the module memo will initialize a matching pending module factory.
 */
bravojs.requireModule = function bravojs_requireModule(parentModuleDir, moduleIdentifier)
{
  /* Remove all active contexts as they are not needed any more (load cycle complete) */
  bravojs.activeContexts = [];

  var id = bravojs.makeModuleId(parentModuleDir, moduleIdentifier);

  var exports = bravojs.callPlugins("requireModule", [id]);
  if (typeof exports != "undefined")
  {
    if (exports===true)
      return bravojs.requireMemo[id];
    return bravojs.requireMemo[id] = exports;
  }

  if (!bravojs.requireMemo[id] && bravojs.pendingModuleDeclarations[id])
    bravojs.initializeModule(id);

  if (id === null || !bravojs.requireMemo[id])
    throw new Error("Module " + id + " is not available.");

  return bravojs.requireMemo[id];
}

/** Create a new require function, closing over it's path so that relative
 *  modules work as expected.
 */
bravojs.requireFactory = function bravojs_requireFactory(moduleDir, dependencies)
{
  var deps, i, label;

  function addLabeledDep(moduleIdentifier)
  {
    deps[label] = function bravojs_labeled_dependency() 
    { 
      return bravojs.requireModule(getContextSensitiveModuleDir(), moduleIdentifier);
    }
  }

  if (dependencies)
  {
    for (i=0; i < dependencies.length; i++)
    {
      if (typeof dependencies[i] !== "object")
	continue;

      for (label in dependencies[i])
      {
	if (dependencies[i].hasOwnProperty(label))
	{
	  if (!deps)
	    deps = {};
	  addLabeledDep(dependencies[i][label]);
	}
      }
    }
  }

  function getContextSensitiveModuleDir() {
    var dir;
    if (bravojs.activeContexts.length>0)
      dir = bravojs.activeContexts[bravojs.activeContexts.length-1].id;
    if(typeof dir == "undefined" || dir == "_")
      dir = moduleDir;
    return dir;
  }

  var newRequire = function require(moduleIdentifier) 
  {
    if (deps && deps[moduleIdentifier])
      return deps[moduleIdentifier]();
    return bravojs.requireModule(getContextSensitiveModuleDir(), moduleIdentifier);
  }

  newRequire.paths = [bravojs.mainModuleDir];

  if (typeof bravojs.platform != "undefined")
  {
      newRequire.platform = bravojs.platform;
  }

  newRequire.id = function require_id(moduleIdentifier)
  {
    return bravojs.makeModuleId(getContextSensitiveModuleDir(), moduleIdentifier);
  }

  newRequire.uri = function require_uri(moduleIdentifierPath)
  {
    throw new Error("NYI - require.uri(moduleIdentifierPath)");
  }

  newRequire.canonicalize = function require_canonicalize(moduleIdentifier)
  {
    var id = bravojs.makeModuleId(getContextSensitiveModuleDir(), moduleIdentifier);

    if (id === '')
      throw new Error("Cannot canonically name the resource bearing this main module");

    /* Remove package/module ID delimiter */
    id = id.replace(/\/*@?\/+/g, "\/");

    /* Some IDs may refer to non-js files */
    if (bravojs.basename(id).indexOf(".") == -1)
      id += ".js";

    return window.location.protocol + "/" + id;
  }

  newRequire.memoize = function require_memoize(id, dependencies, moduleFactory)
  {
    bravojs.pendingModuleDeclarations[id] = { moduleFactory: moduleFactory, dependencies: dependencies };
  }

  newRequire.isMemoized = function require_isMemoized(id)
  {
    return (bravojs.pendingModuleDeclarations[id] || bravojs.requireMemo[id]) ? true : false;
  }

  newRequire.getMemoized = function require_getMemoized(id)
  {
    return bravojs.pendingModuleDeclarations[id] || bravojs.requireMemo[id];
  }

  return newRequire;
}

/** Module object constructor 
 *
 *  @param	id		The canonical module id
 *  @param	dependencies	The dependency list passed to module.declare
 */
bravojs.Module = function bravojs_Module(id, dependencies)
{
  this.id   	 = id;
  this.protected = void 0;
  this.dependencies = dependencies;
  this.print = bravojs.print;

  var i, label;

  /* Create module.deps array */
  this.deps = {};

  for (i=0; i < dependencies.length; i++)
  {
    if (typeof dependencies[i] === "string")
      continue;

    if (typeof dependencies[i] !== "object")
      throw new Error("Invalid " + typeof dependencies[i] + " element in dependency array at position " + i);

    /* Labeled dependency object */
    for (label in dependencies[i])
    {
      if (dependencies[i].hasOwnProperty(label))
      {
	this.deps[label] = function bravojs_lambda_module_deps() 
	{ 
	  bravojs.requireModule(bravojs.dirname(this.id), dependencies[i][label]);
        };
      }
    }
  }
}

/** Run just before providing Module to moduleFactory function in bravojs.initializeModule() */
bravojs.Module.prototype.augment = function bravojs_Module_augment()
{
  var context = bravojs.contextForId(this.id);
  /* Only add extra module properties if context represents a package (i.e. not default '_' context) */
  if (context.id == "_")
    return;

  /* If context supplies a UID use it over the path-based ID for the package ID */
  this.pkgId = context.uid || context.id;

  /* Normalized mappings are simply a map where labels point to package IDs */
  this.mappings = context.getNormalizedMappings();
}

/** A module.declare suitable for use during DOM SCRIPT-tag insertion.
 * 
 *  The general technique described below was invented by Kris Zyp.
 *
 *  In non-IE browsers, the script's onload event fires as soon as the 
 *  script finishes running, so we just memoize the declaration without
 *  doing anything. After the script is loaded, we do the "real" work
 *  as the onload event also supplies the script's URI, which we use
 *  to generate the canonical module id.
 * 
 *  In IE browsers, the event can fire when the tag is being inserted
 *  in the DOM, or sometime thereafter. In the first case, we read a 
 *  memo we left behind when we started inserting the tag; in the latter,
 *  we look for interactive scripts.
 *
 *  Event			Action		
 *  -------------------------   ------------------------------------------------------------------------------------
 *  Inject Script Tag		onload event populated with URI
 *				scriptTagMemo populated with URI
 *  IE pulls from cache		cname derived in module.declare from scriptTagMemo, invoke provideModule
 *  IE pulls from http		cname derived in module.declare from script.src, invoke provideModule
 *  Non-IE loads script		onload event triggered, most recent incomplete module.declare is completed, 
 *				deriving the cname from the onload event.
 */
bravojs.Module.prototype.declare = function bravojs_Module_declare(dependencies, moduleFactory)
{
  var stm;

  if (typeof dependencies === "function")
  {
    moduleFactory = dependencies;
    dependencies = [];
  }

  stm = bravojs.scriptTagMemo;
  if (stm && stm.id === '')		/* Static HTML module */
  {
    delete bravojs.scriptTagMemo;
    bravojs.provideModule(dependencies, moduleFactory, stm.id, stm.callback);    
    return;
  }

  if (stm)
    throw new Error("Bug");

  if (document.addEventListener)	/* non-IE, defer work to script's onload event which will happen immediately */
  {
    bravojs.scriptTagMemo = { dependencies: dependencies, moduleFactory: moduleFactory };
    return;
  }

  stm = bravojs.scriptTagMemoIE;
  delete bravojs.scriptTagMemoIE;

  if (stm && stm.id) 			/* IE, pulling from cache */
  {
    bravojs.provideModule(dependencies, moduleFactory, stm.id, stm.callback);
    return;
  }

  /* Assume IE fetching from remote */
  var scripts = document.getElementsByTagName("SCRIPT");
  var i;

  for (i = 0; i < scripts.length; i++)
  {
    if (scripts[i].readyState === "interactive")
    {
      bravojs.provideModule(dependencies, moduleFactory, bravojs.URL_toId(scripts[i].src), stm.callback);
      return;
    }
  }

  throw new Error("Could not determine module's canonical name from script-tag loader");
}

/** A module.provide suitable for a generic web-server back end.  Loads one module at
 *  a time in continuation-passing style, eventually invoking the passed callback.
 * 
 *  A more effecient function could be written to take advantage of a web server
 *  which might aggregate and transport more than one module per HTTP request.
 *
 *  @param	dependencies	A dependency array
 *  @param	callback	The callback to invoke once all dependencies have been
 *				provided to the environment. Optional.
 */
bravojs.Module.prototype.provide = function bravojs_Module_provide(dependencies, callback)
{
  var self = arguments.callee;

  if ((typeof dependencies !== "object") || (dependencies.length !== 0 && !dependencies.length))
    throw new Error("Invalid dependency array: " + dependencies.toString());

  dependencies = bravojs.normalizeDependencyArray(dependencies);

  if (dependencies.length === 0)
  {
    if (callback)
      callback();
    return;
  }

  bravojs.activeContexts.push(bravojs.contextForId(dependencies[0]));

  module.load(dependencies[0], function bravojs_lambda_provideNextDep() { self(dependencies.slice(1), callback) });

  bravojs.activeContexts.pop();
}

/** A module.load suitable for a generic web-server back end. The module is
 *  loaded by injecting a SCRIPT tag into the DOM.
 *
 *  @param	moduleIdentifier	Module to load
 *  @param	callback		Callback to invoke when the module has loaded.
 *
 *  @see	bravojs_Module_declare
 */
bravojs.Module.prototype.load = function bravojs_Module_load(moduleIdentifier, callback)
{
  if (window.module.hasOwnProperty("declare"))
    delete window.module.declare;

  var script = document.createElement('SCRIPT');
  script.setAttribute("type","text/javascript");
  script.setAttribute("src", require.canonicalize(moduleIdentifier) + "?1");

  if (document.addEventListener)	/* Non-IE; see bravojs_Module_declare */
  {
    script.onload = function bravojs_lambda_script_onload()
    {
      /* stm contains info from recently-run module.declare() */
      var stm = bravojs.scriptTagMemo;
      if (typeof stm === "undefined")
        throw new Error("Module '" + moduleIdentifier + "' did not invoke module.declare!");

      delete bravojs.scriptTagMemo;

      if (typeof moduleIdentifier == "object")
      {
        /* The id is a mapping that needs to be resolved against bravojs.mainModuleDir if applicable. */
        moduleIdentifier = bravojs.makeModuleIdFromMapping(bravojs.mainModuleDir, moduleIdentifier);
      }

      bravojs.activeContexts.push(bravojs.contextForId(moduleIdentifier));

      bravojs.provideModule(stm.dependencies, stm.moduleFactory, require.id(moduleIdentifier), function() {
          callback(moduleIdentifier);
      });

      bravojs.activeContexts.pop();
    }

    script.onerror = function bravojs_lambda_script_onerror() 
    { 
      var id = require.id(moduleIdentifier);
      bravojs.pendingModuleDeclarations[id] = null;	/* Mark null so we don't try to run, but also don't try to reload */
      callback();
    }
  }
  else
  {
    bravojs.scriptTagMemoIE = { moduleIdentifier: moduleIdentifier, callback: callback };

    script.onreadystatechange = function bravojs_lambda_script_onreadystatechange()
    {
      if (this.readyState != "loaded")
	return;

      /* failed load below */
      var id = require.id(moduleIdentifier);

      if (!bravojs.pendingModuleDeclarations[id] && !bravojs.requireMemo[id] && id === bravojs.scriptTagMemoIE.moduleIdentifier)
      {
	bravojs.pendingModuleDeclarations[id] = null;	/* Mark null so we don't try to run, but also don't try to reload */
	callback();
      }
    }
  }

  document.getElementsByTagName("HEAD")[0].appendChild(script);
}

bravojs.Module.prototype.eventually = function(cb) { cb(); };

/** Shim the environment to have CommonJS ES-5 requirements (if needed),
 *  the execute the callback
 */
bravojs.es5_shim_then = function bravojs_es5_shim_then(callback)
{
  if (!Array.prototype.indexOf)
  {
    /* Load ES-5 shim into the environment before executing the main module */
    var script = document.createElement('SCRIPT');
    script.setAttribute("type","text/javascript");
    script.setAttribute("src", bravojs.dirname(bravojs.url) + "/global-es5.js?1");

    if (document.addEventListener)
      script.onload = callback;
    else
    {
      script.onreadystatechange = function() 
      {
	if (this.readyState === "loaded")
	  callback();
      }
    }

    document.getElementsByTagName("HEAD")[0].appendChild(script);
  }
  else
  {
    callback();
  }
}

/** Reload a module, violating the CommonJS singleton paradigm and
 *  potentially introducing bugs in to the program using this function --
 *  as references to the previous instance of the module may still be
 *  held by the application program.
 */
bravojs.reloadModule = function(id, callback)
{
  delete bravojs.pendingModuleDeclarations[id];
  delete bravojs.requireMemo[id];
  module.provide([id], callback);
}

/** Main module bootstrap */
bravojs.initializeMainModule = function bravojs_initializeMainModule(dependencies, moduleFactory, moduleIdentifier)
{
  if (module.hasOwnProperty("declare"))		/* special extra-module environment bootstrap declare needs to go */
    delete module.declare;

  if (module.constructor.prototype.main)
    throw new Error("Main module has already been initialized!");

  bravojs.es5_shim_then
  (
    (function() 
     {
       bravojs.provideModule(dependencies, moduleFactory, moduleIdentifier, function bravojs_lambda_requireMain() { module.constructor.prototype.main = require(moduleIdentifier); })
     })
  ); 
}

/** Run a module which is not declared in the HTML document and make it the program module.
 *  @param	dependencies		[optional]	A list of dependencies to sastify before running the mdoule
 *  @param	moduleIdentifier	moduleIdentifier, relative to dirname(window.location.href). This function
 *					adjusts the module path such that the program module's directory is the
 *					top-level module directory before the dependencies are resolved.
 *  @param	callback		[optional]	Callback to invoke once the main module has been initialized
 */
bravojs.runExternalMainModule = function bravojs_runExternalProgram(dependencies, moduleIdentifier, callback)
{
  if (arguments.length === 1 || typeof moduleIdentifier === "function")
  {
    callback = moduleIdentifier;
    moduleIdentifier = dependencies;
    dependencies = [];
  }

  delete module.declare;

  if (moduleIdentifier.charAt(0) === '/')
    bravojs.mainModuleDir = bravojs.dirname(moduleIdentifier);
  else
    bravojs.mainModuleDir = bravojs.dirname(bravojs.URL_toId(window.location.href + ".js"), true) + "/" + bravojs.dirname(moduleIdentifier);

  moduleIdentifier = bravojs.basename(moduleIdentifier);

  bravojs.es5_shim_then(
      function() {
	module.provide(dependencies.concat([moduleIdentifier]), 
		       function bravojs_runMainModule() {
			 bravojs.initializeMainModule(dependencies, '', moduleIdentifier);
			 if (callback)
			   callback(); 
		       })
	    });
}

bravojs.reset();

if (typeof bravojs.url === "undefined")
{
/** Set the BravoJS URL, so that BravoJS can load components
 *  relative to its install dir.  The HTML script element that
 *  loads BravoJS must either have the ID BravoJS, or be the
 *  very first script in the document.
 */ 
(function bravojs_setURL()
{
  var i;
  var script;

  script = document.getElementById("BravoJS");
  if (!script)
    script = document.getElementsByTagName("SCRIPT")[0];

  bravojs.url = script.src;
  i = bravojs.url.indexOf("?");
  if (i !== -1)
    bravojs.url = bravojs.url.slice(0,i);
  i = bravojs.url.indexOf("#");
  if (i !== -1)
    bravojs.url = bravojs.url.slice(0,i);

  if (bravojs.basename(bravojs.url) !== "bravo.js")
    throw new Error("Could not determine BravoJS URL. BravoJS must be the first script, or have id='BravoJS'");
})();
}

/** Diagnostic Aids */
var print   = bravojs.print;
if (!window.onerror)
{
  window.onerror = function window_onerror(message, url, line) 
  { 
    var scripts, i;

    print("\n * Error: " + message + "\n" + 
          "      in: " + url + "\n" + 
          "    line: " + line);  
  }
}

/* Module.declare function which handles main modules inline SCRIPT tags.
 * This function gets deleted as soon as it runs, allowing the module.declare
 * from the prototype take over. Modules created from this function have
 * the empty string as module.id.
 */
module.declare = function main_module_declare(dependencies, moduleFactory)
{
  if (typeof dependencies === "function")
  {
    moduleFactory = dependencies;
    dependencies = [];
  }

  bravojs.initializeMainModule(dependencies, moduleFactory, '');
}

} catch(e) { bravojs.errorReporter(e); }

}

if (typeof exports !== "undefined")
{
    exports.BravoJS = function(context)
    {
        context = context || {};

        var window = {
            location: {
                protocol: "memory:",
                href: "memory:/" + ((typeof context.mainModuleDir != "undefined")?context.mainModuleDir:"/bravojs/")
            }
        };

        var bravojs = {
            mainModuleDir: context.mainModuleDir || void 0,
            platform: context.platform || void 0,
            url: window.location.href,
            print: (context.api && context.api.system && context.api.system.print) || void 0,
            errorReporter: (context.api && context.api.errorReporter) || void 0,
            XMLHttpRequest: (context.api && context.api.XMLHttpRequest) || void 0
        };

        bravojs_init(bravojs, window);

        context.require = window.require;
        context.module = window.module;
        context.requireMemo = bravojs.requireMemo;
        context.initializeModule = bravojs.initializeModule;
        context.registerPlugin = bravojs.registerPlugin;
        context.makeModuleId = bravojs.makeModuleId;
        context.makeModuleIdFromMapping = bravojs.makeModuleIdFromMapping;
        context.normalizeDependencyArray = bravojs.normalizeDependencyArray;
        context.activeContexts = bravojs.activeContexts;
        context.contextForId = bravojs.contextForId;
    }
}
else
{
    if (typeof bravojs === "undefined")
      bravojs = {};
    bravojs_init(bravojs, window);
}
