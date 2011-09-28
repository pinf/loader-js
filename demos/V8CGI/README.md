v8cgi Platform support
======================

Example for running the PINF JavaScript Loader on [v8cgi](http://code.google.com/p/v8cgi/).


Install
=======

v8cgi
-----

Docs: [http://code.google.com/p/v8cgi/wiki/Compiling](http://code.google.com/p/v8cgi/wiki/Compiling)

OSX 10.7:

    sudo port install scons libmemcached
    brew install libiconv

    wget http://v8cgi.googlecode.com/files/v8cgi-0.9.1-src.tar.gz
    tar -zxf v8cgi-0.9.1-src.tar.gz
    cd v8cgi-0.9.1-src
    cd v8
    scons library=shared arch=x64
    sudo cp libv8.dylib /usr/lib/
    cd ../v8cgi
    scons gd=0 dom=0 sqlite=0 mysql=0 module=0 libpath=/usr/local/Cellar/libiconv/1.13.1/include 
    sudo cp v8cgi.conf.darwin /private/etc/v8cgi.conf
    # Edit /private/etc/v8cgi.conf to point `require.paths.push()` to `./lib`
    sudo cp v8cgi /usr/bin/v8cgi
    cd ..

Make sure v8cgi CLI is available and working:

    $ v8cgi -v
    $ v8cgi -h
    $ v8cgi ./scripts/helloworld.js
    Hello, World!
    
Usage
=====

    v8cgi ../../pinf-loader.js -v ../HelloWorld
    v8cgi ../../pinf-loader.js -v ../LoadExtraCode
    v8cgi ../../pinf-loader.js -v ../Mappings

If the above does not work, ensure it works with nodejs first:

    node ../../pinf-loader.js ../HelloWorld

    
TODO
====

  * Need good way to identify v8cgi: `require("SYSTEM").platform == "v8cgi"`
