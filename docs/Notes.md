
__NOTE: These notes are not organized as of yet.__


Code Loading
============

This is the problem area that the design of PINF addresses. My view is that all that is required to load packages and modules statically (without a server) is the rewriting of package.json mappings when the packages are placed on the server.

I envision the following layers:

  1) Simple installer to install static packages (rewriting mappings)
     * Out of the box browser loading (no special server needed ... just SCRIPT and XHR to HTTP)
     * Facilitates evaluation of packages (minimal install requirements)
     * Facilitates production deployment
     * Facilitates simple code hacking workflows

  2) Package Server to serve packages
     * Arbitrary package fetching and serving (rewriting mappings as needed)
     * Dynamic overlays to splice in version controlled source repositories
     * Client reload (complete application or isolated plugin via LOAD()) by server push notification
     * Dynamic compilation and build processes prior to serving code
  
  3) Build Server to build static packages
     * 1 to 1 source to package for simple packages
     * Arbitrary compile and build steps for complex packages
     * Build profiles for packages to include and exclude files and steps
     * Automated testing
     * Continuous integration

All this can be facilitated by a few layers of metadata and each transformation or build step can be run at any point in the stack depending on the capabilities of the stack without needing to touch the original source code.

The following implementations aim to achieve all of the above by using the metadata of the packages.

  * [sm](github.com/sourcemint/sm)


Packages
========

http://groups.google.com/group/commonjs/browse_thread/thread/db97218d6608aef6/c2fb76db9c11aeb7
