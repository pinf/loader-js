/**
 *  This file implements an alternate module loader for an arbitrary
 *  CommonJS Modules/2.0 environment.
 *
 *  This loader implements multi-module loading against any of the BravoJS
 *  fastload backends.  It does not require a BravoJS environment; any
 *  CommonJS Modules/2.0 environment which supports pluggable module loaders
 *  will work.
 *
 *  Copyright (c) 2010, PageMail, Inc.
 *  Wes Garland, wes@page.ca
 *  MIT License
 *
 *  To use: Load the lazy load library and BravoJS, then layer this loader in
 *  by loading it into the extra-module environment.
 *
 *  This plug-in will use the default loader to resolve modules from other 
 *  websites. 
 */

var fastload_config;
if (!fastload_config)
  fastload_config = {};

if (module.constructor.prototype.load === null)
  throw new Error("Sorry, your CommonJS environment does not support alternate module loaders");

var fastload_modules = {};
(function fastload() {
var tmp;
var default_config =
{
  server_module:	window.location.href.split("/").slice(0,3).join("/") + "/cgi-bin/BravoJS/gpsee.js",
  server_options: {}
};

/* Replace properties in dest with own properties in src, provided the
 * properties are not colliding objects. Colliding objects are merged
 * recursively.
 */
function objMerge(src, dest)
{
  var el;

  for (el in src)
  {
    if (!src.hasOwnProperty(el))
      continue;
    if (typeof src[el] === "object" && dest[el] && src[el] !== null)
      objMerge(src[el], dest[el]);
    else
      dest[el] = src[el];
  }
}

/* Let the library user update fastload config either before or after
 * this script is included in the document.
 */
objMerge(default_config, fastload_config);

/* Implement module.provide, which will be invoked by the CommonJS Modules/2.0
 * environment to load modules.
 */
module.constructor.prototype.provide = function fastload_provide(dependencies, callback)
{
  /** @todo filter out non-local modules and provide thoses another way */

  var URL = fastload_config.server_module + "?"; 
  var script;
  var opt;

  for (opt in server_options)
    URL += opt + "=" + server_options[opt];

  if (dependencies.length)
  {
    if (URL.charAt(URL.length -1) === "?")
      URL += "module=";
    else
      URL += "&module=";

    URL += dependencies.map(require.id).join("&module=");
  }

  script = document.createElement('SCRIPT');
  script.setAttribute("type","text/javascript");
  script.setAttribute("src", URL);

  /* Fake script.onload for IE6-8 */
  script.onreadystatechange = function()
  {
    var cb;

    if (this.readyState === "loaded")
    {
      cb = this.onload;
      this.onload = null;
      setTimeout(cb,0);
    }
  }

  /* When the script loads, swap in our own module.declare which knows how
   * to memoize modules out of the batch just loaded via CommonJS Modules/2.0 
   * primitives.
   */
  script.onload = function fastload_script_onload()
  {
    this.onreadystatechange = null;

    var md_backup = module.constructor.prototype.declare;
    var id;

    module.constructor.prototype.declare = function fastload_module_declare(dependencies, moduleFactory)
    {
      if (typeof dependencies === "function")
      {
	moduleFactory = dependencies;
	dependencies = [];
      }

      require.memoize(id, dependencies, moduleFactory);
    }

    /** @todo memoize not-found modules too */
    for (id in fastload_modules)
    {
      fastload_modules[id]();
      delete fastload_modules[id];
    }

    module.constructor.prototype.declare = md_backup;
  }

  /* Supply errors on browsers that can */
  script.onerror = function fastload_script_error()
  {
    alert("Error contacting server\nURL=" + script.src);
  }

  document.getElementsByTagName("HEAD")[0].appendChild(script);
}

})();














