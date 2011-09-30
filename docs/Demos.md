
To run these demos you must have the loader [./Setup.md](https://github.com/pinf/loader-js/blob/master/docs/Setup.md).

Portable
========

These demos work on the following platforms:

  * NodeJS (default): `node` (**Tested**)
  * Narwhal: `narwhal` (**Not tested lately**)
  * RingoJS: `ringo` (**Not tested yet**)
  * RingoJS: `gpsee` (**Not tested yet**)
  * RingoJS: `v8cgi` (**Not tested yet**)

To use a specific platform specify `--platform <alias>`. `node` is used by default.

    commonjs -v ./demos/HelloWorld
    commonjs -v ./demos/AMD
    commonjs -v ./demos/Mappings
    commonjs -v ./demos/CommonJSModules1
    commonjs -v ./demos/CommonJSModules1Script/script
    commonjs -v ./demos/CommonJSModules2
    commonjs -v ./demos/CommonJSModules2Script/script
    commonjs -v ./demos/LoadExtraCode
    commonjs -v ./demos/PINFCatalog
    commonjs -v ./demos/MapModule
    commonjs -v ./demos/NotAvailable
    commonjs -v https://gist.github.com/823078


Platform: NodeJS
================

Server-based programs:

    commonjs -v ./demos/BravoJS
    commonjs -v ./demos/NodeUnit
    commonjs -v ./demos/ReloadingJSGI
    commonjs -v ./demos/PreloadCoffeeScript
    commonjs -v ./demos/GithubArchiveDependency
    commonjs -v ./demos/SystemDependencies
    commonjs -v https://gist.github.com/823315
    commonjs -v ./demos/PostCommitProgramReload

Browser-based programs:

    commonjs -v ./demos/ProgramServer
    commonjs -v ./demos/ACE

Via NPM:

    npm install pinf-loader-js-demos-npmpackage
    npm start pinf-loader-js-demos-npmpackage


Platform: GPSEE
===============

Server-based programs: `./demos/GPSEE`

    gsr -f ./pinf-loader.js -- -v ./demos/HelloWorld
    gsr -f ./pinf-loader.js -- -v ./demos/LoadExtraCode
    gsr -f ./pinf-loader.js -- -v ./demos/Mappings


Platform: v8cgi
===============

Server-based programs: `./demos/v8cgi`

    v8cgi ./pinf-loader.js -v ./demos/HelloWorld
    v8cgi ./pinf-loader.js -v ./demos/LoadExtraCode
    v8cgi ./pinf-loader.js -v ./demos/Mappings


Platform: Narwhal
=================

Server-based programs:

    commonjs -v ./demos/Narwhal


Platform: Jetpack
=================

Firefox extensions:

    # Jetpack (assuming SDK activated & FF 4 installed)
    cfx --pkgdir=./demos/JetpackExtension/extension run


Platform: RingoJS
=================

RingoJS-based programs: `./demos/RingoJS`

    ringo ../pinf-loader.js ../demos/HelloWorld


Platform: AdobeAir
==================

AdobeAir-based programs: `./demos/AdobeAir`


Platform: Titanium
=================

Appcelerator Titanium-based programs: `./demos/Titanium`

