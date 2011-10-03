Narwhal Platform support
========================

Example for running the PINF JavaScript Loader on [Narwhal](https://github.com/cappuccino/narwhal).


Install
=======

Narwhal
-------

OSX 10.7:

    git clone git://github.com/280north/narwhal.git

Make sure narwhal CLI is working:

    $ ./narwhal/bin/narwhal -h
    $ ./narwhal/bin/narwhal ./scripts/helloworld.js
    Hello, World!

Usage
=====

    ./narwhal/bin/narwhal ../../pinf-loader.js -v ../HelloWorld
    ./narwhal/bin/narwhal ../../pinf-loader.js -v ../LoadExtraCode
    ./narwhal/bin/narwhal ../../pinf-loader.js -v ../Mappings

If the above does not work, ensure it works with nodejs first:

    node ../../pinf-loader.js ../HelloWorld
