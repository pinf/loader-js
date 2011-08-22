NPM Package
===========

Sample [NPM](http://npmjs.org/) package that depends on `pinf-loader-js` and loads a program.


Test
----

Install:

    npm install pinf-loader-js-demos-npmpackage
    
    or
    
    npm link .

Run:

    npm start pinf-loader-js-demos-npmpackage


Usage
-----

Add dependency for `pinf-loader-js` to `package.json`:

    {
        "dependencies": {
            "pinf-loader-js": ">=0.0.1"
        }
    }

Boot program from within module:

    var PINF_LOADER = require("pinf-loader-js/lib/pinf-loader-js/loader");

    PINF_LOADER.boot({
        program: "/.../program.json"
    });
