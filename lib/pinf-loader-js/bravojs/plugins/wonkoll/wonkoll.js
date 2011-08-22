/**
 *  This file implements an alternate module loader for an arbitrary
 *  CommonJS Modules/2.0 environment.
 *
 *  This loader implements file-at-a-time loading against a standard web 
 *  server via Ryan Grove's LazyLoad.js library rather than the environment's
 *  native module loader.
 *
 *  Copyright (c) 2010, PageMail, Inc.
 *  Wes Garland, wes@page.ca
 *  MIT License
 *
 *  To use: Load the lazy load library and BravoJS, then layer this loader in
 *  by loading it into the extra-module environment.
 */

(function wonkoll() {

var loading;

if (module.constructor.prototype.load === null)
  throw new Error("Sorry, your CommonJS environment does not support alternate module loaders");

/** Load a module via LazyLoad.js */
module.constructor.prototype.load = function wonko_load(moduleIdentifier, callback)
{
  var URL = require.canonicalize(moduleIdentifier) + "?1";

  if (loading)
    throw new Error("Bug");

  loading = { id: require.id(moduleIdentifier), callback: callback };

  LazyLoad.js(URL);
}

/** Process the module declaring using identity information provided by module.load */
module.constructor.prototype.declare = function wonko_declare(dependencies, moduleFactory)
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

/** LazyLoad.js does not support parallel load operations, so we replace 
 *  module.provide with a serial resolver incase the underlying environment 
 *  uses a parallel algorithm.
 */
module.constructor.prototype.provide = function wonko_provide(dependencies, callback)
{
  function provide(module, dependencies, callback)
  {
    if (dependencies.length === 0)
    {
      callback();
      return;
    }

    module.load(dependencies[0], function() { module.provide(dependencies.slice(1), callback) });
  }

  provide(this, dependencies, callback);
}

})();
