API Adapters
============

The adapters contained in this directory implement the interface between the
PINF JavaScript Loader and the various JavaScript platforms.

**At this time, the `./node.js` adapter is the only complete adapter and represents the full platform interface of the loader.**

Until unit tests are available, the best approach to working on an adapter is to run
the [PINF JavaScript Test Programs](https://github.com/pinf/test-programs-js) and/or 
[../../Demos/](https://github.com/pinf/loader-js/tree/master/demos) programs against the platform and follow the errors.

For support and questions post to: [http://groups.google.com/group/pinf-dev/](http://groups.google.com/group/pinf-dev/)

Existing discussions:

  * [`v8cgi` - PINF JavaScript Loader support for v8cgi](http://groups.google.com/group/v8cgi/browse_thread/thread/17b8687e30578460)


TODO
====

  * Unti tests
  * Interface docs
  * Refactor to make certain parts re-usable across adapters
