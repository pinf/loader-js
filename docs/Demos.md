PINF Loader Demos
=================

These demos are intended for internal development and showcase various features.

For some more use-friendly demos see the [PINF JavaScript Test Programs](https://github.com/pinf/test-programs-js) project.


Requirements
============

See [./Setup.md](https://github.com/pinf/loader-js/blob/master/docs/Setup.md)


Portable
========

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

To run the programs on a different platform use:

    commonjs -v --platform <PlatformAlias> ./demos/HelloWorld

Where `<PlatformAlias>` is any of `node`, `gpsee`, `v8cgi`, `narwhal` or `ringo`.

Drop the `-v` to omit the loader progress output.

**NOTE: Currently requires running with `--platform node` (default) ONCE first to download dependencies due to incomplete 
[API adapters](https://github.com/pinf/loader-js/tree/master/lib/pinf-loader-js/adapter) for the other platforms.**


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

