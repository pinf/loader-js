
The `commonjs` Command
======================

The loader allows for bootstrapping a consistent and state-of-the-art CommonJS environment
for any supported platform and thus is ideally suited to be used as the target for the `commonjs` command and the
development of cross-platform JavaScript applications and libraries.

The loader will automatically use the appropriate CommonJS platform based on the requirements
of the program.

    commonjs -v ./demos/HelloWorld

See [./Setup.md](https://github.com/pinf/loader-js/blob/master/docs/Setup.md) and [./Demos.md](https://github.com/pinf/loader-js/blob/master/docs/Demos.md).


Command-Line
============

The loader allows for running server-based scripts, daemons and applications from the command line:

    # program-based
    
    commonjs -v ./demos/HelloWorld

    commonjs -v --platform node ./demos/HelloWorld
    node ./pinf-loader -v ./demos/HelloWorld

    commonjs -v --platform narwhal ./demos/HelloWorld
    narwhal ./pinf-loader -v ./demos/HelloWorld
    
    # script-based
    
    commonjs -v ./demos/CommonJSModules1Script/script

    commonjs -v --platform node ./demos/CommonJSModules1Script/script
    node ./pinf-loader -v ./demos/CommonJSModules1Script/script

    commonjs -v --platform narwhal ./demos/CommonJSModules1Script/script
    narwhal ./pinf-loader -v ./demos/CommonJSModules1Script/script


Within CommonJS Modules
=======================

The loader can _host_ and run programs and packages within CommonJS Modules.

Examples:

  * Sandboxed JSGI-based app package: [../demos/ReloadingJSGI/main.js](https://github.com/pinf/loader-js/blob/master/demos/ReloadingJSGI/main.js)
  * Programs hosted in Jetpack extension: [../demos/JetpackExtension/extension/lib/main.js](https://github.com/pinf/loader-js/blob/master/demos/JetpackExtension/extension/lib/main.js)
  * Programs as sub-processes (via `exec`): [../tests/demos/main.js](https://github.com/pinf/loader-js/blob/master/tests/demos/main.js)


In-Browser
==========

The loader includes a _Program Server_ used to make programs available for browser and [WebWorker](http://www.whatwg.org/specs/web-workers/current-work/)
loading. The program server automatically combines the core program and all its dependencies into one file and can make additional
sets of modules available for loading on demand by the browser.

    commonjs -v --platform node ./demos/ProgramServer
    open http://localhost:8003/ 


NPM
===

The loader can be used as an [NPM](http://npmjs.org/) package to boot a program.

    npm install pinf-loader-js-demos-npmpackage
    npm start pinf-loader-js-demos-npmpackage

See: [../demos/NPMPackage](https://github.com/pinf/loader-js/tree/master/demos/NPMPackage)


Cloud-based Services
====================

The loader is ideally suited for writing programs to be deployed to online hosting services. By providing everything that is needed
for a program to run it is unnecessary to learn or use the package management and dependency resolution solutions provided
by the hosting provider. This makes programs highly reliable and portable across providers.

More information about this will be available in time.


Development
===========

The loader facilitates an efficient development workflow by supporting project workspaces, dynamic code reloading and remote debugging.

An example of a project that uses the loader to provide a development environment: [https://github.com/cadorn/ace-extjs](https://github.com/cadorn/ace-extjs)

More information about this will be available in time.


Release Building
================

The loader plays a role in building releases for programs (especially when intended for the browser) by collecting all
initial and dynamic load dependencies and combining these into optimized files ready for static loading into
CommonJS runtimes.

More information about this will be available in time.
