
Install
=======

Minimum Requirements:

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

To install additional platforms (other than `node`) see:

  * [Individual platform projects](https://github.com/pinf/loader-js)
  * [PINF JavaScript Platform for OSX Lion](https://github.com/pinf/platform-js/blob/master/docs/osx-lion.md) (includes all supported platforms)

To run the loader on a different platform (other than `node`) use:

    commonjs --platform <PlatformAlias> ...

Where `<PlatformAlias>` is any of `node`, `gpsee`, `v8cgi`, `narwhal` or `ringo`.

NOTE: Not all features are supported on all platform yet due to incomplete 
[API adapters](https://github.com/pinf/loader-js/tree/master/lib/pinf-loader-js/adapter).


Alternative Invocation
======================

The loader does not have to be used via the `commonjs` command. It can be invoked directly as a script.

Checkout or download the project source, then invoke as follows:

    node ./pinf-loader.js -h
    v8cgi ./pinf-loader.js -h
    gsr ./pinf-loader.js -h
    ringo ./pinf-loader.js -h
    narwhal ./pinf-loader.js -h

The complete loader may also be inlined into one CommonJS module that can be 
included in a platform-specific project:

    # Implemented
    commonjs --bundle-loader jetpack .../node-pinf-loader.js
    commonjs --bundle-loader titanium .../node-pinf-loader.js
    commonjs --bundle-loader air .../node-pinf-loader.js
    
    # Not Yet Implemented
    commonjs --bundle-loader node .../node-pinf-loader.js
    commonjs --bundle-loader v8cgi .../v8cgi-pinf-loader.js
    commonjs --bundle-loader gpsee .../gpsee-pinf-loader.js
    commonjs --bundle-loader narwhal .../narwhal-pinf-loader.js
    commonjs --bundle-loader ringo .../ringo-pinf-loader.js
