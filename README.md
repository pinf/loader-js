Versatile & Complete Cross-Platform CommonJS JavaScript Module, Package & Program Loader
========================================================================================

*Status: BETA - Mostly stable API undergoing wider testing.*

The PINF JavaScript Loader asynchronously combines what you would traditionally call a **package installer** and 
**class loader** and is **intended to be used as the core to all your JavaScript applications** no matter what 
platform they run on.

The loader allows for bootstrapping a state-of-the-art, consistent and portable CommonJS environment
for any supported platform (on servers, in browsers, desktop applications, secure sandboxes, and embedded) and thus 
is ideally suited to be used as the target for the `commonjs` command and the
development of cross-platform JavaScript applications and libraries that may be shared with the CommonJS ecosystem.

![Loader overview image](https://github.com/pinf/loader-js/raw/master/docs/images/PINFLoaderJSOverview_v1.png)

This module loader brings __[CommonJS](http://www.commonjs.org/) Modules/2__ _(currently in draft)_ plus
__CommonJS Packages__, __Package Mappings__ and further concepts to the following platforms:

  * __[NodeJS](http://nodejs.org/)__ - Boot via `commonjs program.json` or via `pinf-loader-js` npm package.
  * __[Jetpack](https://jetpack.mozillalabs.com/)__ - Use it in any Gecko/XULRunner extension or application
  * __[Titanium](http://www.appcelerator.com/)__ - Use it in any Appcelerator Titanium application
  * __[RingoJS](http://ringojs.org/)__ - Use it in any RingoJS application
  * __[AdobeAir](http://www.adobe.com/products/air/)__ - Use it in any AdobeAir application
  * __[GPSEE](http://code.google.com/p/gpsee/)__ - Use it in any GPSEE application
  * __[v8cgi](http://code.google.com/p/v8cgi)__ - Use it in any v8cgi application
  * __[Narwhal](https://github.com/280north/narwhal)__ - Use it with any Narwhal engine platform
  * __[Wakanda](http://www.wakanda.org/)__ (__In Progress__)
  * __[CouchApp](http://couchapp.org/page/index)__ (__Initial exploration__)
  * __[PhoneGap](http://www.phonegap.com/)__ (__Initial exploration__)
  * __[Rhino](http://www.mozilla.org/rhino/)__ (__Not Yet Implemented__)
  * __Browser__ - For development and optimized production purposes
    * __Standalone__ - Just include one small file in your page (**6.2 KB minified & gziped**)
    * __[jQuery](http://jquery.org/)__ (__Not Yet Implemented__)
    * __[NobleJS](https://github.com/NobleJS/Noble-Modules)__ (__Not Yet Implemented__)
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
  * Various additions and generalizations to be able to load a wide range of packages. (__Not Yet Documented__)

The loader can be used:

  * By calling it from the command line to run a program
  * By `require()`ing it from any CommonJS module to load a sub-program
  * By setting it up as a package server to load programs into a browser
  * To export CommonJS programs to be loaded by CommonJS compliant loaders

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


Install
=======

Requirements:

  * UNIX system (Windows support is under development but still has some way to go)
  * NodeJS: [http://nodejs.org/](http://nodejs.org/)

Use any one of the following install solutions:

    npm install -g pinf-loader-js

    cd ~/
    wget -O pinf-loader-js.tar.gz https://github.com/pinf/loader-js/tarball/master
    tar -zxf pinf-loader-js.tar.gz
    mv pinf-loader-js-* pinf-loader-js
    alias commonjs='~/pinf-loader-js/pinf-loader.sh'

    cd ~/
    git clone git://github.com/pinf/loader-js.git pinf-loader-js
    alias commonjs='~/pinf-loader-js/pinf-loader.sh'

Make sure it works:

    commonjs -h


Demo: Hello World
=================

    commonjs -v --platform node https://github.com/pinf/test-programs-js/zipball/master --port 8081 HelloWorld

More demos:

  * **User friendly:** See the [PINF JavaScript Test Programs](https://github.com/pinf/test-programs-js) project.
  * **Internal/advanced:** See [./docs/Demos.md](https://github.com/pinf/loader-js/blob/master/docs/Demos.md).


Documentation
=============

  * [High-level Introduction](https://github.com/pinf/loader-js/blob/master/docs/Presentations/Introduction.md) (presentation slides)

  * [Setup](https://github.com/pinf/loader-js/blob/master/docs/Setup.md) - Setup your `commonjs` command.
  * [Demos](https://github.com/pinf/loader-js/blob/master/docs/Demos.md) - Looking at the source code of the demos is a good place to start.
  * [Use Cases](https://github.com/pinf/loader-js/blob/master/docs/UseCases.md) - The loader can be used in various ways.
  * [Writing Programs](https://github.com/pinf/loader-js/blob/master/docs/WritingPrograms.md) - A quick introduction.
  * [Source Overlays](https://github.com/pinf/loader-js/blob/master/docs/SourceOverlays.md) - Use cloned source code instead of downloaded archive for a package.

  * [Tests](https://github.com/pinf/loader-js/blob/master/docs/Tests.md)

  * [Compare to other loaders](https://spreadsheets.google.com/lv?key=tDdcrv9wNQRCNCRCflWxhYQ&toomany=true#gid=0) (third party link)

  * [Notes](https://github.com/pinf/loader-js/blob/master/NOTES.md)

Related Projects:

  * Cross-platform tests via the [PINF JavaScript Test Programs](https://github.com/pinf/test-programs-js) project.


Support, Feedback & News
========================

Mailing list: [http://groups.google.com/group/pinf-dev/](http://groups.google.com/group/pinf-dev/)

Twitter: [http://twitter.com/pinf](http://twitter.com/pinf)

Blog: [http://christophdorn.com/Blog/](http://christophdorn.com/Blog/)


TODO
====

Priority: High
--------------

  * Clean hierarchical sandbox implementation.
  * Refactored and abstracted program server to support various plugins.
  * Consistent and reliable file and line info for errors and stack traces across all platforms.
  * Run exported programs on various browser loaders (RequireJS, NobleJS) in addition to BravoJS.

Priority: Medium
----------------

  * Remove color characters when printing to browser consoles and buffer until newline
  * Profiling code in loader to time various things with an option to monitor interpreter spawn/load time as well.

Priority: Low
-------------

  * Refactor to leverage Q promises throughout.
  * Run exported programs on all platforms (not just browser).
  * Refactor, abstract and simplify various concepts like descriptors, locators, mapping resolver.


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
  * [http://membres-liglab.imag.fr/donsez/cours/exemplescourstechnoweb/js_securehash/md5src.html](http://membres-liglab.imag.fr/donsez/cours/exemplescourstechnoweb/js_securehash/md5src.html)
  * [http://www.webtoolkit.info/javascript-base64.html](http://www.webtoolkit.info/javascript-base64.html)


Documentation License
=====================

[Creative Commons Attribution-NonCommercial-ShareAlike 3.0](http://creativecommons.org/licenses/by-nc-sa/3.0/)

Copyright (c) 2011+ [Christoph Dorn](http://www.christophdorn.com/)


Code License
============

[MIT License](http://www.opensource.org/licenses/mit-license.php)

Copyright (c) 2011+ [Christoph Dorn](http://www.christophdorn.com/)

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
