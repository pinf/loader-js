
To use the loader the loader code is needed and a supported CommonJS platform.

Requirements
============

The loader should work on any CommonJS platform for which there is an adapter. NodeJS is recommended at this time.

UNIX file paths are expected and no testing has been done on Windows.

Compatibility
-------------

  * `0.1.x` requires NodeJS `0.4.x`
  * `0.2.x` requires NodeJS `>= 0.5` and NPM `>= 1.0.24`


Loader Code
===========

Clone or download the [pinf/loader-js](https://github.com/pinf/loader-js) repository:

    git clone git://github.com/pinf/loader-js.git
    cd ./loader-js

Link the `commonjs` command to the bootstrap script at `./pinf-loader.sh`:

    ln -s /.../pinf-loader.sh /usr/local/bin/commonjs

To update the loader to the latest code at any time:

    git pull origin master

_Downloadable and installable releases of the loader will be made available in time._


CommonJS Platform
=================

Install one or more of the following platforms. __NodeJS__ is required at minimum at this time as it is the most popular, complete and tested.

When done make sure the loader is working:

    commonjs -h

You are now ready to check out the [./Demos.md](https://github.com/pinf/loader-js/tree/master/docs/Demos.md).


NodeJS
------

Homepage: [http://nodejs.org/](http://nodejs.org/)

Install Instructions: [https://github.com/joyent/node/wiki/Installation](https://github.com/joyent/node/wiki/Installation)

    # download and compile node
    git clone git://github.com/joyent/node.git
    cd ./node
    ./configure
    make
    make install
    
    # make sure node works
    node -h
    
    # make sure the loader works with the platform
    commonjs --test-platform node


Narwhal
-------

Homepage: [http://narwhaljs.org/](http://narwhaljs.org/)

**NOTE: Only the `rhino` engine has been tested on OSX thus far.**

Install Instructions: [http://narwhaljs.org/quick-start.html](http://narwhaljs.org/quick-start.html)

    # download narwhal and activate
    git clone git://github.com/280north/narwhal.git
    source narwhal/bin/activate
    
    # make sure narwhal works
    narwhal -h
    
    # make sure the loader works with the platform
    commonjs --test-platform narwhal


Jetpack
-------

The Jetpack platform is not intended to be used from the command line at this time.

The loader is intended to be included in a Jetpack extension to _host_ the program code.

See: [../demos/JetpackExtension](https://github.com/pinf/loader-js/tree/master/demos/JetpackExtension)
