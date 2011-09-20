Titanium Platform support
=========================

Example for running the PINF JavaScript Loader on [Appcelerator Titanium](http://www.appcelerator.com/).

Tested with Titanium Studio on:

  * OSX 10.7 (Lion) - iPad Simulator
  * OSX 10.7 (Lion) - iPhone Simulator


Install
=======
    
Import loader into Titanium project:

    ../../bin/bundle-loader --platform titanium ./project/Resources/pinf-loader.js

Boot loader from project's `app.js` file:
    
    var exports = {};
    Titanium.include("./pinf-loader.js");
    exports.boot({
        debug: false,
        "packages-path": "/packages",
        program: "/programs/HelloWorld",
        callback: function(sandbox, require)
        {
            main(require("/programs/HelloWorld@/main"));
        }
    });
    function main(programMainModule)
    {
        // Init App
    }

Tweak project setup:

  1. Create `/Resources/packages` directory
  2. Create program in `/Resources/programs/<Name>`. Sample program: `./sample/Resources/programs/HelloWorld`


Development
===========

Import loader:

    ../../bin/bundle-loader --platform titanium ./sample/Resources/pinf-loader.js


Links
=====

  * http://developer.appcelerator.com/apidoc/mobile/latest/
