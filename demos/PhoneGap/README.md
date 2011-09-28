PhoneGap Platform support
=========================

*Status: NOT FUNCTIONAL YET*

Example for running the PINF JavaScript Loader on [PhoneGap](http://www.phonegap.com/).

Tested on:

  * OSX 10.7 (Lion) - iPad Simulator
  * OSX 10.7 (Lion) - iPhone Simulator

TODO
====

For native loader integration need:

  * Need `window.requestFileSystem(LocalFileSystem.APPLICATION,...)`
  * SYNC File API


Install (exported)
==================

PINF-base JS apps should be loadable on PhoneGap when exported via the PINF Program Server.

TODO: Instructions and demo


Install (native)
================
    
Import loader into PhoneGap project:

    ../../bin/bundle-loader --platform phonegap <project>/www/pinf-loader.js

Boot loader from project's `index.html` file:
    
    <script type="text/javascript">
      var exports = {},
          module = {};
    </script>
    <script type="text/javascript" src="pinf-loader.js"></script> 
    <script type="text/javascript"> 
        function onDeviceReady()
        {
            try {
                exports.boot({
                    debug: false,
                    program: "/programs/HelloWorld",
                    "packages-path": "/packages",
                    onSandboxInit: function(sandbox, loader)
                    {
                        // Delete initial module.declare so prototype can take over
                        delete loader.bravojs.module.declare;

                        // Init extra-module environment so modules can be loaded with
                        // `module.declare(...)` from script tags
                        module.declare = loader.bravojs.module.declare;
                    },
                    callback: function(sandbox, require)
                    {
                        main(require("/programs/HelloWorld@/main"));
                    }
                });
            } catch(e) {
                window.runtime.trace("Error '" + e + "' booting PINF Loader!");
            }
        }  
        function main(programMainModule)
        {
            // Init App
        }
    </script>

Tweak project setup:

  1. Create `/www/packages` directory
  2. Create program in `/www/programs/<Name>`. Sample program: `./apps/HelloWorldPINF/www/programs/HelloWorld`


Development
-----------

Import loader:

    ../../bin/bundle-loader --platform phonegap ./apps/HelloWorldPINF/www/pinf-loader.js


Links
=====

  * http://docs.phonegap.com/
  * https://github.com/pmuellr/lumpgap
  
