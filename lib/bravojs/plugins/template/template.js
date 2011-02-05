/**
 *  This file implements a bravojs core plugin.
 *
 *  This plugin declares all available hooks.
 *
 *  Copyright (c) 2011, Christoph Dorn
 *  Christoph Dorn, christoph@christophdorn.com
 *  MIT License
 *
 *  To use: Load BravoJS, then layer this plugin in
 *  by loading it into the extra-module environment.
 */

(function template() {

var Plugin = function()
{
}

/**
 * Given a package mapping return a top-level ID for the *package*
 */
Plugin.prototype.resolvePackageMapping = function(packageMapping)
{
  // Return nothing to continue with next plugin or default behavior 
}

bravojs.registerPlugin(new Plugin());

})();
