
  * [PINF](http://www.christophdorn.com/Research/#PINF): __Good software just works__ ~ PINF Toolchain Automation Platform
  * PINF/**Loader**: _The one loader to load them all_ (Language Specific Loaders: `JavaScript` **70% done**, `PHP` 0%)
  * PINF/Insight: _Intelligence served on a platter_ (Language Specific Libraries: `JavaScript` 40% done, `PHP` 90+%)
  * PINF/Wildfire: _Amazing communication above all_ (Language Specific Libraries: `JavaScript` 90+% done, `PHP` 90+%)

Versatile & Complete Cross-Platform CommonJS JavaScript Module, Package & Program Loader
========================================================================================

The PINF JavaScript Loader combines what you would traditionally call a __package installer__ and __class loader__ and is
intended to be used instead of tools such as [npm](http://npmjs.org/), [RequireJS](http://requirejs.org/) and [tusk](http://narwhaljs.org/).

The loader allows for bootstrapping a consistent and state-of-the-art CommonJS environment
for any supported platform (on server & in browser) and thus is ideally suited to be used as the target for the `commonjs` command and the
development of cross-platform JavaScript applications and libraries.

Status: [See ./NOTES.md](https://github.com/pinf/loader-js/blob/master/NOTES.md)

![Loader overview image](https://github.com/pinf/loader-js/raw/master/docs/images/PINFLoaderJSOverview_v1.png)

This module loader brings __[CommonJS](http://www.commonjs.org/) Modules/2__ _(currently in draft)_ plus
__CommonJS Packages__, __Package Mappings__ and further concepts to the following platforms:

  * __[NodeJS](http://nodejs.org/)__ - Boot via `commonjs program.json` or via `pinf-loader-js` npm package.
  * __[Narwhal](http://narwhaljs.org/)__ - Use it with any Narwhal engine platform
  * __[Jetpack](https://jetpack.mozillalabs.com/)__ - Use it in any Gecko/XULRunner extension or application
  * __[Rhino](http://www.mozilla.org/rhino/)__ (__Not Yet Implemented__)
  * __[RingoJS](http://ringojs.org/)__ (__Not Yet Implemented__)
  * __[GPSEE](http://code.google.com/p/gpsee/)__ (__Not Yet Implemented__)
  * __[CouchApp](http://couchapp.org/page/index)__ (__Not Yet Implemented__)
  * __[Titanium](http://www.appcelerator.com/)__ (__Not Yet Implemented__)
  * __Browser__ - For development and optimized production purposes
    * __Standalone__ - Just include one small file in your page (**6.2 KB minified & gziped**)
    * __[jQuery](http://jquery.org/)__ (__Not Yet Implemented__)
    * __[RequireJS](http://requirejs.org/)__ (__Not Yet Implemented__)
    * __[Dojo](http://dojotoolkit.org/)__ (__Not Yet Implemented__)
  * __Services__
    * __[Duostack](http://www.duostack.com/)__ - No npm & hassle free deployment with secret configuration (__Not Yet Implemented__)
    * __[no.de](https://no.de/)__ (__Not Yet Implemented__)
    * __[NodeSocket](www.nodesocket.com)__ (__Not Yet Implemented__)
    * __[Google App Engine](http://code.google.com/appengine/)__ Use it to run JavaScript on the Java stack (__Not Yet Implemented__)

The loader implements or is compatible with the following specs:

  * [CommonJS Modues/1.1.1 (approved)](http://wiki.commonjs.org/wiki/Modules/1.1.1)
  * [CommonJS Modues/2.0draft8 (draft)](http://www.page.ca/~wes/CommonJS/modules-2.0-draft8/)
  * [CommonJS Modules/AsynchronousDefinition (proposal)](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition) (partial)
  * [CommonJS Packages/1.1 (draft)](http://wiki.commonjs.org/wiki/Packages/1.1)
  * [CommonJS Packages/Mappings/C (proposal)](http://wiki.commonjs.org/wiki/Packages/Mappings/C)
  * [CommonJS Modules/LoaderPlugin (proposal)](http://wiki.commonjs.org/wiki/Modules/LoaderPlugin) (partial)

The loader extends the core CommonJS platform defined by the above specifications
with the following additions:

  * CommonJS Programs/A (strawman) (__Not Yet Documented__)
  * PINF Workspace/A (strawman) (__Not Yet Documented__)

The loader can be used:

  * By calling it from the command line to run a program
  * By `require()`ing it from any CommonJS module to load a sub-program
  * By setting it up as a package server to load programs into a browser

The loader:

  * Aims to be __complete and fully specification compliant__ where possible.
  * Aims to validate the _CommonJS Program and Mappings_ approaches and inform CommonJS specifications.
  * Provisions and executes programs by downloading and linking dependencies on first use.
  * By default isolates the dependencies for each program.
  * Can provision complex applications (programs) composed of hundreds of packages by contacting an open network of public registry and repository servers. (__Not Yet Implemented__)
  * Can load complex applications (programs) composed of hundreds of packages from __Content Delivery Networks__ fed by a simple program server. (__Not Yet Implemented__)
  * Supports REMOTE LIVE application DEBUGGING and EDITING for DEPLOYED applications running on any ANY PLATFORM (`eval()` or equivalent required). (__Not Yet Implemented__)

The loader is a sub-project of the [PINF Toolchain Automation Platform](http://www.christophdorn.com/Research/) where an *application*
(program) is a *view into the toolchain* that statically links package-based dependencies.

The toolchain is an organized body of code & services maintained collectively for the purpose of
automating software production and system operation. Any CommonJS package may be used as part of the toolchain.

![Platform overview image](https://github.com/pinf/loader-js/raw/master/docs/images/PINFPlatformOverview_v1.png)


Demo: Hello World
=================

Assumes NodeJS is installed. See [./docs/Setup.md](https://github.com/pinf/loader-js/blob/master/docs/Setup.md) for instructions.

    git clone git://github.com/pinf/loader-js.git
    cd ./loader-js
    node ./pinf-loader -v ./demos/HelloWorld

For more demos see: [./docs/Demos.md](https://github.com/pinf/loader-js/blob/master/docs/Demos.md)


Documentation
=============

  * [High-level Introduction](https://github.com/pinf/loader-js/blob/master/docs/Presentations/Introduction.md) (presentation slides)

  * [Setup](https://github.com/pinf/loader-js/blob/master/docs/Setup.md) - Setup your `commonjs` command.
  * [Demos](https://github.com/pinf/loader-js/blob/master/docs/Demos.md) - Looking at the source code of the demos is a good place to start.
  * [Use Cases](https://github.com/pinf/loader-js/blob/master/docs/UseCases.md) - The loader can be used in various ways.
  * [Writing Programs](https://github.com/pinf/loader-js/blob/master/docs/WritingPrograms.md) - A quick introduction.

  * [Tests](https://github.com/pinf/loader-js/blob/master/docs/Tests.md)

  * [Compare to other loaders](https://spreadsheets.google.com/lv?key=tDdcrv9wNQRCNCRCflWxhYQ&toomany=true#gid=0) (third party link)


Support & Feedback
==================

Developer mailing list: [http://groups.google.com/group/pinf-dev/](http://groups.google.com/group/pinf-dev/)


Contribute
==========

You can find a list of things to get involved with here: [./NOTES.md](https://github.com/pinf/loader-js/blob/master/NOTES.md)

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
  * [Firefox](http://getfirefox.com/) - For providing an amazing browser platform
  * [Jetpack](https://jetpack.mozillalabs.com/) - For providing a decent extension environment, API and tooling
  * [Firebug](http://getfirebug.com/) - For the amazing developer tool it is
  * [nodules](https://github.com/kriszyp/nodules) - For implementing and refining CommonJS Packages/Mappings/C
  * [pinf](https://github.com/cadorn/pinf) - For implementing and refining various designs and specifications
  * [Narwhal](http://narwhaljs.org/) - For providing an experimentation ground while prototyping conceps
  * [Github](http://github.com/) - For igniting a generation of collaborative development
  * [JavaScript](https://developer.mozilla.org/en/javascript) - For the awesome language it is

This project uses code from:

  * [http://code.google.com/p/bravojs/](http://code.google.com/p/bravojs/)
  * [http://narwhaljs.org/](http://narwhaljs.org/)
  * [https://github.com/Gozala/light-traits/](https://github.com/Gozala/light-traits/)
  * [https://github.com/Gozala/jetpack-protocol/](https://github.com/Gozala/jetpack-protocol/)
  * [http://pajhome.org.uk/crypt/md5/sha1.html](http://pajhome.org.uk/crypt/md5/sha1.html)


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
