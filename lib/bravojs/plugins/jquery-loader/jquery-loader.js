/**
 *  This file implements an alternate module loader for an arbitrary
 *  CommonJS Modules/2.0 environment.
 *
 *  This plug-in alters a CommonJS Modules/2.0 environment to load
 *  modules with jQuery.get(). These modules may conform to either
 *  Modules/2.0 or Modules/1.1.
 *
 *  Simply load the jquery-loader.js script after the CommonJS environment
 *  and the current version of jQuery. Ths plug-in will override
 *  module.load, module.provide, and module.declare in your environment.
 *
 *  Copyright (c) 2010, PageMail, Inc.
 *  Wes Garland, wes@page.ca
 *  MIT License
 *
 *  To use: Load jQuery and your CommonJS/2.0 environment, then layer 
 *  this loader in by loading it into the extra-module environment.
 */

(function jquery_loader() {

var loading;

if (module.constructor.prototype.load === null)
  throw new Error("Sorry, your CommonJS environment does not support alternate module loaders");

/** Load a module via jQuery.ajax(), and dynamically mark up Modules/1.1 modules to work 
 *  as Modules/2.0 modules. 
 *
 *  Note: In order to support /1.1 modules, we have to regexp-match the loaded module
 *        before eval'ing the returned script. This behaviour can be disabled to improve
 * 	  performance by setting module.constructor.prototype.load.modules11 = false.
 *
 *  Note 2: The regular expression we match against assumes that the module.declare call
 *          will be the first statement on the line.
 */
module.constructor.prototype.load = function jquery_loader_load(moduleIdentifier, callback)
{
  var URL = require.canonicalize(moduleIdentifier);
  
  function loaded_cb(data, textStatus, XMLHttpRequest)
  {
    if (loading)
      throw("Bug");

    loading = { id: require.id(moduleIdentifier), callback: callback };
    if (module.constructor.prototype.load.modules11 === false || data.match(/(^|[\r\n])\s*module.declare\s*\(/))
      eval(data);
    else
      eval("module.declare([" + scrapeDeps(data).join(',') + "], function(require, exports, module) {\n" + data + "\n})"); /* Modules/1.1 */
  }

  jQuery.ajax({url: URL, success: loaded_cb, error: callback, dataType: "text" });
}

/** Process the module declaration using identity information provided by module.load */
module.constructor.prototype.declare = function jquery_loader_declare(dependencies, moduleFactory)
{
  var id 	= loading.id;
  var callback  = loading.callback;
  var deps	= [], i, label;

  loading = void 0;

  if (typeof dependencies === "function")
  {
    moduleFactory = dependencies;
    dependencies = [];
  }

  require.memoize(id, dependencies, moduleFactory);

  /* Build a list of dependencies suitable for module.provide; this
   * means no labeled dependencies. 
   */
  function addDep(dependency)
  {
    var id = require.id(dependency);

    if (require.isMemoized(id) || deps.indexOf(id) !== -1)
      return;

    deps.push(id);
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

  module.provide(deps, callback);
}

/** Scrape dependencies from a Modules/1.1 module. Mostly borrowed from FlyScript. */
function scrapeDeps(txt)
{
  var dep = [];
  var m;
  var $requireRE = /\/\/.*|\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|[;=(,:!^]\s*\/(?:\\.|[^\/\\])+\/|(?:^|\W)\s*require\s*\(\s*("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')\s*\)/g;

   for ($requireRE.lastIndex = 0; m = $requireRE.exec(txt);)
     if (m[1]) dep.push(m[1]);

  return dep;
}

})();

