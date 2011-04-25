
Status
======

__Stability:__ Beta

Summary
-------

The loader is currently under active development. Production use is possible if
releases are thoroughly tested prior to use. APIs may slightly change in future.


Contributors
------------

Looking for:

  * Users to use the loader and report issues
  * Adapter authors for other CommonJS platforms
  * Critical reviewers for specifications
  * Feedback in all areas
  * Contributions in any area


TODO
====

General
-------

  * OS distro packages for loader

  * Author: CommonJS Programs/A (strawman)
  * Author: PINF Workspace/A (strawman)

  * Enforce reserved names for mapping labels based on default modules provided by platform

  * Build and publish commands to provide versioned releases (This will be part of PINF/CLI)

  * Rename ./lib/pinf-loader-js to ./lib/pinf-loader


NodeJS
-------

  * Get `./lib/modules/pinf/protocol-handler.js` working

Jetpack
-------

  * warning: undeclared require(widget) called from ...
  * CLI variables and arguments
  * Package parsing to find widgets etc... for security policy stuff

  * Downloading program archives based on mappings
  * Resource path resolving for packages
  * Hook package testing into `cfx test`


BravoJS Comments
================

  * All internal top-level module paths for packaged modules follow <packageID>@/<modulePath> where '@/' is used to signify the package root.
  * Expanded scope of module.load(s, f) to allow a mappings object for 's'.
  * Expanded scope of module.declare([], f) to allow labelled mapping objects for '[]'.
  * Changed module.load(id/mapping, function(id) { ... }) to return the canonical ID of the loaded module that can be used with require(id).
  * Added chained plugin system to service resolvePackageMapping(packageMapping) which must return a top-level package ID if it can resolve.
  * Added module.pkgId which is set to the ID of the containing package for a module if the module is part of a package.
  * Added module.mappings which is set to a resolved map where values are top-level package IDs for a module if the module is part of a package with mappings.
  * Map package UID as valid package ID (in addition to path-basd package ID) if package descriptor has uid property set.   
  * Ability to resolve modules by <packageUID>@/<modulePath> if the package descriptor has the "uid" property set.
    e.g. require("http://registry/hostname/path/package1/@/lib/main")
    This is not ideal as one must know the *<modulePath>* in this case 'lib/main'. A better solution may be:
      require("http://registry/hostname/path/package1/@/").resolve("main");
    Where '@/' is used to signify that we want to load a special object that can resolve IDs for the specified package ID.
  * Relative dependency IDs for module.declare() were resolved based on bravojs.mainModuleDir whereas they should be resolved based on the path of the module.
  * The spec could use more wording as to whether functions accept relative and/or absolute module identifiers only.

  * The `modules` property for `package.json` is only partially supported and module IDs (keys) must be normalized on server prior to loading.


Specification Comments
======================


[CommonJS Modues/2.0draft8](http://www.page.ca/~wes/CommonJS/modules-2.0-draft8/)
---------------------------

Additions:

  * Need a property to identify the platform in order to load correct platform API modules.
    * See: http://stackoverflow.com/questions/4224606/how-to-check-whether-a-script-is-running-under-node-js
    * Proposed: `require.platform`

  * `require("./lib/platform/{platform}/main")` where `{platform}` is replaced with `require.platform`

  * Need a way to print to stdout no matter what. Especially important in browser where window.print.
    should not be over-written.
    Proposed: module.print

  * New `module.pkgId` property
  * New `module.hashId` property

  * New `require.pkg(<packageID>).id(<moduleId>)`. If no argument for `id()` the package ID is returned.
    If `true` as second argument to `.id()` the ID is returned unsanitized (context delimiters stay in tact)

  * There may not be any delimiters in the pathIDs given by `module.id`, `module.pkgId`

  * Need facility to get command line arguments

Changes:

  * Section 5.2.1: Environments that do not support searchable module paths must set `require.paths[0]`
    to the mainModuleDir.
  
  * If `true` as second argument to `require.id()` the ID is returned unsanitized (context delimiters stay in tact)
  
  
  

[CommonJS Packages/1.1](http://wiki.commonjs.org/wiki/Packages/1.1)
-----------------------

Additions:

  * `uid` property must end in `/`.
  * `uid` property must be a non-resolving or resolving URL.
  * `uid` may resolve to a catalog covering the different release branches of the package.
  * `uid` may resolve to a registry namespace.
  
  * `native` boolean to indicate that modules should be treated as-is (i.e. the package contains modules written
    for the host platform where require() provided by intermediate loaders should be bypassed at all times
    and modules should not be wrapper or altered in any way.)

  * `preload` array to hold list of moduleIDs for modules to call when initializing package.
    If moduleId starts with `./` the ID is relative to the package root. If not it is relative to `directories.lib`
    The `main()` function of each module is called passing a `context` object.
    The `main()` function may return an object with keys mapping functions to specific hooks.
      * [https://github.com/pinf/loader-js/blob/master/demos/PreloadCoffeeScript/package.json](https://github.com/pinf/loader-js/blob/master/demos/PreloadCoffeeScript/package.json)
      * [https://github.com/pinf/loader-js/blob/master/demos/PreloadCoffeeScript/compiler.js](https://github.com/pinf/loader-js/blob/master/demos/PreloadCoffeeScript/compiler.js)

Notes:

  * `overlay` property with keys: `pinf:{platform}`

  
[CommonJS Packages/Mappings/C](http://wiki.commonjs.org/wiki/Packages/Mappings/C)
------------------------------

Additions:

  * Mapping labels may not begin with '_' which is reserved for loaders to map special namespaces.
  * Catalog URLs (and any other descriptor URLs) must end in `.json` to be able to distinguish from `<packageUID>`

Verify alternate mapping locators:

    locator: "/<packagePath>"
    locator: "<archiveURL>"
    locator: "jar:<archiveURL>!/path/to/package"
    locator: {
        location: "/<packagePath>"
    }
    locator: {
        location: "<relativePath>"
    }

    locator: {
        catalog: "<catalogURL>",
        name: "<packageName>"
    }

    // `archive`-based locators are URLs that must point to a ZIP archive
    
    locator: {
        archive: "<archiveURL>"
    }
    locator: {
        archive: "jar:<archiveURL>!/path/to/package"
    }

    // specifying modules
    
    locator: {
        module: "<moduleId>"
    }
    locator: {
        module: "./<modulePathId>"
    }
    locator: {
        module: "/<modulePathId>"
    }

    // indicate that a mapping (or module) is not available
    // causes require() to throw
    locator: {
        available: false
    }

Top-level ID lookup rules when deriving IDs from mapping properties:

  * Check for matching `id`
  * Check for matching `uid`
  * Check for matching `uid` + `version`
  * Check for matching `uid` + `revision`
  * Check for matching `location`

New: Module Mappings

    package.json ~ {
        "modules": {
            "module3": {
                "id": "github.com/pinf/loader-js/demos/MapModule/",
                "module": "new-module3"
            }
            "/lib/module3": {},
            "./lib/module3": {}
        }
    }

  * Before module IDs are finalized they are matched against the `modules` property.
  * The keys are prepended with `directories.lib` (if not prefixed with './' or '/') and matched against the final module IDs for the package.
  * If a match is found the mapped module is used instead.


CommonJS Programs/A
-------------------

  * A program is booted by calling the package listed for `boot`
    * __NOTE:__ Multiple `boot` packages (specified as array) are partially supported but will likely be phased out as there are too many side-effects
  * All packages listed in `boot` must have matching keys in `packages`
  * Only packages listed in `packages` may be loaded into the program
  * Only packages listed in `boot` (and associated dependencies) are loaded into the program at boot time
  * Additional packages may be loaded into program if listed in `packages`

  * Load contexts to avoid adding already loaded modules to transport files. E.g.:
    "contexts": {
        "top": {
            "github.com/pinf/loader-js/demos/ACE/editor/@/main": {
                "include": {
                    "github.com/ajaxorg/pilot/@/lib/pilot/index": {},
                    "github.com/ajaxorg/ace/@/lib/ace/defaults": {},
                    "github.com/ajaxorg/cockpit/@/lib/cockpit/index": {}
                },
                "load": {
                    "github.com/ajaxorg/ace/": {}
                }
            },
            "github.com/pinf/loader-js/demos/ACE/worker/@/worker": {
            }
        }
    }


Top-level ID formats
--------------------

    /<packagePath>@/<resourcePath>
    <packageUID>@/<resouecePath>
    <catalogURL>/<packageName>@/<resouecePath>

Where:

  * `<packagePath>` is the UNIX path to a package root directory (no trailing slash, absolute path implied).
  * `<resourcePath>` is the UNIX path to a resource in the package from the package root (no beginning slash).
  * `<packageUID>` - is the `uid` property from `package.json` without `http://` prefix.
    * If hostname (`uid` property is a URL) is a known registry server it is dropped as a prefix as well leaving the registry namespace as the `<packageUID>`.

Other
-----

  * `require()` must look to platform `require()` to resolve top-level IDs that do not resolve within the loader
    * Actually if a module ID does not resolve locally or via a mapping it should fail


Jetpack Wishlist
================

  * Get current working directory path
  * Get environment variables
  * Get command-line arguments
  * Keep positioning and size of last test/run profile and apply to new profiles



Links
=====

  * http://code.google.com/p/bravojs/
  * http://www.page.ca/~wes/CommonJS/modules-2.0-draft8/
  * http://code.tolsma.net/blog/commonjs/
  * http://wiki.commonjs.org/wiki/Packages/1.1
  * http://wiki.commonjs.org/wiki/Packages/Mappings/C

  * CommonJS post: [New CommonJS Modules/2 (draft) loader (BravoJS) with package & mappings support](http://groups.google.com/group/commonjs/browse_thread/thread/94a63889a6ef712f)
  * Design doc: [PINF Fundamental Design: Namespace and Dependency System](https://github.com/cadorn/pinf/blob/master/docs/Design/Foundation.md)
  * Design doc: [CommonJS Reference Framework](http://code.tolsma.net/blog/commonjs/)

