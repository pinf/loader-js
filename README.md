
Versatile & Complete Module Loader for CommonJS JavaScript
==========================================================

Version: v0.1dev

Status: [See ./NOTES.md](https://github.com/pinf/loader-js/blob/master/NOTES.md)

This module loader brings __[CommonJS](http://www.commonjs.org/) Modules/2__ _(currently in draft)_ plus
__CommonJS Packages__, __Package Mappings__ and further concepts to the following platforms:

  * __[NodeJS](http://nodejs.org/)__ - No npm, just boot via `./pinf-loader program.json`
  * __[Jetpack](https://jetpack.mozillalabs.com/)__ - Use it in any Gecko/Firefox/XULRunner extension or application (__Not Yet Implemented__)
  * __[Rhino](http://www.mozilla.org/rhino/)__ - Use it in any Java application or from the command line (__Not Yet Implemented__)
  * __Browser__ - For development and optimized production purposes (__Not Yet Implemented__)
    * __Standalone__ - Just include one small file in your page (__Not Yet Implemented__)
    * __[jQuery](http://jquery.org/)__ - Use it in any existing jQuery installation (__Not Yet Implemented__)
    * __[RequireJS](http://requirejs.org/)__ - Use it in any existing requirejs installation (__Not Yet Implemented__)
    * __[Dojo](http://dojotoolkit.org/)__ - Use it in any existing Dojo installation (__Not Yet Implemented__)

The loader implements or is compatible with the following specs:

  * [CommonJS Modues/2.0draft8 (draft)](http://www.page.ca/~wes/CommonJS/modules-2.0-draft8/)
  * [CommonJS Packages/1.1 (draft)](http://wiki.commonjs.org/wiki/Packages/1.1)
  * [CommonJS Packages/Mappings/C (proposal)](http://wiki.commonjs.org/wiki/Packages/Mappings/C)

The loader extends the core CommonJS platform defined by the above specifications
with the following additions:

  * CommonJS Programs/A (strawman) (__Not Yet Documented__)
  * PINF Workspace/A (strawman) (__Not Yet Documented__)

The loader can be used:

  * By `require()`ing it from any CommonJS module to load a sub-program
  * By calling it from the command line to run a program
  * By setting it up as a package server to load programs into a browser

The loader aims to be __complete and fully specification compliant__ where possible.

To learn how to use this loader see [here](https://github.com/pinf/loader-js/blob/master/docs/Learn.md). (__Not Yet Documented__)


Requirements
============

The loader should work on any CommonJS platform for which there is an adapter (see _Usage_ below).

UNIX file paths are expected and no testing has been done on Windows.


Example
=======

Taken from: [https://github.com/pinf/loader-js/blob/master/demos/HelloWorld/](https://github.com/pinf/loader-js/blob/master/demos/HelloWorld/)

    program.json ~ {
        "boot": "github.com/pinf/loader-js/demos/HelloWorld/",
        "packages": {
            "github.com/pinf/loader-js/demos/HelloWorld/": {
                "locator": {
                    "location": "./"
                }
            }
        }
    }

    package.json ~ {
        "uid": "http://github.com/pinf/loader-js/demos/HelloWorld/",
        "main": "main.js"
    }

    main.js ~ module.declare([], function(require, exports, module)
    {
        exports.main = function()
        {
            module.print("Hello World!\n");
        }
    });


Usage
=====

If you have the `commonjs` command linked to a supported CommonJS platform binary:

    ./pinf-loader [.../[program.json]]    // `$PWD/program.json` implied if not provided

    ./pinf-loader -h

To run via a specific supported CommonJS platform binary see below.

The following demos are available:

    ./pinf-loader -v ./demos/HelloWorld
    ./pinf-loader -v ./demos/Mappings
    ./pinf-loader -v ./demos/CommonJSModules1
    ./pinf-loader -v ./demos/CommonJSModules2
    ./pinf-loader -v ./demos/LoadExtraCode
    ./pinf-loader -v ./demos/GithubArchiveDependency

The following tests are available:

    ./pinf-loader ./tests/demos

To learn how to write programs see [here](https://github.com/pinf/loader-js/blob/master/docs/WritingPrograms.md). (__Not Yet Documented__)


NodeJS
------

Homepage: [http://nodejs.org/](http://nodejs.org/)

    node ./pinf-loader [.../[program.json]]

Jetpack
-------

Homepage: [https://jetpack.mozillalabs.com/](https://jetpack.mozillalabs.com/)

__Not Yet Implemented__

Browser
-------

__Not Yet Implemented__


Support & Feedback
==================

Developer mailing list: [http://groups.google.com/group/pinf-dev/](http://groups.google.com/group/pinf-dev/)


Contribute
==========

You can find a list of things to get involved with here: [https://github.com/pinf/loader-js/blob/master/NOTES.md](https://github.com/pinf/loader-js/blob/master/NOTES.md)

Collaboration Platform: [https://github.com/pinf/loader-js/](https://github.com/pinf/loader-js/)

Collaboration Process:

  1. Discuss your change on the mailing list
  2. Write a patch on your own
  3. Send pull request on github & ping mailing list
  4. Discuss pull request on github to refine

You must explicitly license your patch by adding the following to the top of any file you modify
in order for your patch to be accepted:

    //  - <GithubUsername>, First Last <Email>, Copyright YYYY, MIT License

Author
======

This project is a part of the [PINF](http://www.christophdorn.com/Research/#PINF) project maintained by
[Christoph Dorn](http://www.christophdorn.com/).


Credits
=======

This project would not be possible without the following:

  * [CommonJS](http://www.commonjs.org/) - For framing requirements into specifications
  * [BravoJS](http://code.google.com/p/bravojs/) - For a pure and clean CommonJS Modules/2 loader implementation
  * [NodeJS](http://nodejs.org/) - For providing a solid runtime used by default
  * [nodules](https://github.com/kriszyp/nodules) - For implementing and refining CommonJS Packages/Mappings/C
  * [pinf](https://github.com/cadorn/pinf) - For implementing and refining various designs and specifications
  * [Narwhal](http://narwhaljs.org/) - For providing an experimentation ground while prototyping conceps
  * [Github](http://github.com/) - For igniting a generation of collaborative development
  * [JavaScript](https://developer.mozilla.org/en/javascript) - For the awesome language it is

This project uses code from:

  * [http://code.google.com/p/bravojs/](http://code.google.com/p/bravojs/)
  * [http://narwhaljs.org/](http://narwhaljs.org/)
  * [https://github.com/jfd/optparse-js](https://github.com/jfd/optparse-js)


Documentation License
=====================

[Creative Commons Attribution-NonCommercial-ShareAlike 3.0](http://creativecommons.org/licenses/by-nc-sa/3.0/)

Copyright (c) 2011 [Christoph Dorn](http://www.christophdorn.com/)


Code License
============

[MIT License](http://www.opensource.org/licenses/mit-license.php)

Copyright (c) 2011 [Christoph Dorn](http://www.christophdorn.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
