Adobe Air
=========

Example of using the PINF JavaScript Loader in an [Adobe Air](http://www.adobe.com/products/air/) application.


Install
=======

Requirements
------------

  * PINF JavaScript Loader: https://github.com/pinf/loader-js
  * Adobe Air SDK: http://www.adobe.com/products/air/sdk/

Run
---

Via AIR Debug Launcher:

    .../AdobeAIRSDK/bin/adl app/app.xml

Dev
---

Import loader into air application:

    ../../bin/bundle-loader --platform air ./app/pinf-loader.js

Boot loader from project's `bootstrap.js` file:

    <script type="text/javascript">
      var exports = {},
          module = {};
    </script>
    <script type="text/javascript" src="pinf-loader.js"></script> 
    <script type="text/javascript"> 
        function appLoad()
        {
            try {
                exports.boot({
                    debug: false,
                    program: window.runtime.flash.filesystem.File.applicationDirectory.nativePath + "/programs/HelloWorld",
                    "packages-path": window.runtime.flash.filesystem.File.applicationDirectory.nativePath,
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
                        main(require(window.runtime.flash.filesystem.File.applicationDirectory.nativePath + "/programs/HelloWorld@/main"));
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


TODO
----

  * Example of spidered program
  * Example of using pinf to download dependencies and then run in air

  
Links
=====

  * [Developer Center](http://www.adobe.com/devnet/air.html)
  * [Intro Tutorial](http://help.adobe.com/en_US/air/build/WS5b3ccc516d4fbf351e63e3d118666ade46-7ecc.html)
  * [Air API](http://help.adobe.com/en_US/air/reference/html/)
