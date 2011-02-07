
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


Specification Changes
=====================


[CommonJS Modues/2.0draft8](http://www.page.ca/~wes/CommonJS/modules-2.0-draft8/)
---------------------------

Additions:

 * Need a property to identify the platform in order to load correct platform API modules
   See: http://stackoverflow.com/questions/4224606/how-to-check-whether-a-script-is-running-under-node-js
   Proposed: require.platform

 * Need a way to print to stdout no matter what.
   Proposed: module.print


[CommonJS Packages/1.1](http://wiki.commonjs.org/wiki/Packages/1.1)
-----------------------

Additions:

 * `uid` property must end in `/`

  
[CommonJS Packages/Mappings/C](http://wiki.commonjs.org/wiki/Packages/Mappings/C)
------------------------------

Additions:

 * Mapping labels may not begin with '_' which is reserved for loaders to map special namespaces.


Links
=====

 * CommonJS post: [New CommonJS Modules/2 (draft) loader (BravoJS) with package & mappings support](http://groups.google.com/group/commonjs/browse_thread/thread/94a63889a6ef712f)
 * Design doc: [PINF Fundamental Design: Namespace and Dependency System](https://github.com/cadorn/pinf/blob/master/docs/Design/Foundation.md)
 * Design doc: [CommonJS Reference Framework](http://code.tolsma.net/blog/commonjs/)

