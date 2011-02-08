
Status
======

Summary
-------

The loader is currently under active development. Production use is possible if
releases are thoroughly tested prior to use.

__2011-02-07__:

  * Work in progress:
    * BravoJS refinements
    * pinf-loader <-> BravoJS interface
    * Specification authoring
    * Documentation

Contributors
------------

Looking for:

  * Users to use the loader and report issues
  * Adapter authors for other CommonJS platforms
  * Critical reviewers for specifications
  * Feedback in all areas


TODO
====

  * Implement: [Jetpack](https://jetpack.mozillalabs.com/) adapter
  * Implement: browser adapter

  * Import: Command-line parser from narwhal
  * Implement: Command-line UI

  * Author: Initial ./docs/
  * Author: CommonJS Programs/A (strawman)
  * Author: PINF Workspace/A (strawman)

  * Review, refine & move here: ./lib/bravojs/NOTES


Specification Comments
======================


[CommonJS Modues/2.0draft8](http://www.page.ca/~wes/CommonJS/modules-2.0-draft8/)
---------------------------

Additions:

  * Need a property to identify the platform in order to load correct platform API modules.
    See: http://stackoverflow.com/questions/4224606/how-to-check-whether-a-script-is-running-under-node-js
    Proposed: require.platform

  * Need a way to print to stdout no matter what. Especially important in browser where window.print.
    should not be over-written.
    Proposed: module.print

  * Section 5.2: Paths in `require.paths` may separate a packageID from a resourceID with `!/`. 

Changes:

  * Section 5.2.1: Environments that do not support searchable module paths must set `require.paths[0]`
    to the mainModuleDir.
  
  
  

[CommonJS Packages/1.1](http://wiki.commonjs.org/wiki/Packages/1.1)
-----------------------

Additions:

  * `uid` property must end in `/`.
  * `uid` property must be a non-resolving or resolving URL.
  * `uid` may resolve to a catalog covering the different release branches of the package.
  * `uid` may resolve to a registry namespace.

  
[CommonJS Packages/Mappings/C](http://wiki.commonjs.org/wiki/Packages/Mappings/C)
------------------------------

Additions:

  * Mapping labels may not begin with '_' which is reserved for loaders to map special namespaces.
  
  * Catalog URLs (and any other descriptor URLs) must end in `.json` to be able to distinguish from `<packageUID>`

Verify alternate mapping locators:

    # `location`-based locators must end in `/` to infer and refer to a directory
    
    locator: "/<packagePath>/"
    locator: {
        location: "/<packagePath>/"
    }
    locator: {
        location: "<relativePath>/"
    }

    locator: {
        catalog: "<catalogURL>",
        name: "<packageName>"
    }



Other
-----

Top-level ID formats:

    /<packagePath>/!/<resourcePath>
    <packageUID>/!/<resouecePath>
    <catalogURL>/<packageName>/!/<resouecePath>

Where:

  * `<packagePath>` is the UNIX path to a package root directory (no trailing slash, absolute path implied).
  * `<resourcePath>` is the UNIX path to a resource in the package from the package root (no beginning slash).
  * `<packageUID>` - is the `uid` property from `package.json` without `http://` prefix.
    * If hostname (`uid` property is a URL) is a known registry server it is dropped as a prefix as well leaving the registry namespace as the ID.


Links
=====

  * CommonJS post: [New CommonJS Modules/2 (draft) loader (BravoJS) with package & mappings support](http://groups.google.com/group/commonjs/browse_thread/thread/94a63889a6ef712f)
  * Design doc: [PINF Fundamental Design: Namespace and Dependency System](https://github.com/cadorn/pinf/blob/master/docs/Design/Foundation.md)
  * Design doc: [CommonJS Reference Framework](http://code.tolsma.net/blog/commonjs/)

