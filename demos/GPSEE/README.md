GPSEE Platform support
======================

Example for running the PINF JavaScript Loader on [GPSEE](http://code.google.com/p/gpsee).

Status
------

  * Segfaulting


Install
=======

GPSEE
-----

Docs: [http://code.google.com/p/gpsee/wiki/Building](http://code.google.com/p/gpsee/wiki/Building)

OSX 10.7:

    sudo port install libidl autoconf213 yasm nspr

    hg clone https://gpsee.googlecode.com/hg/ gpsee
    hg clone http://hg.mozilla.org/tracemonkey tracemonkey
    cd tracemonkey
    hg revert -r 21e90d198613 --all
    cd ../
    
    cd gpsee
    ./configure --with-mozilla=/pinf/workspaces/github.com/pinf/loader-js/demos/GPSEE/tracemonkey
    make build
    sudo make install

Make sure GPSEE is available and working:

    gsr -h
    gsr -f ./scripts/helloworld.js
    ./scripts/helloworld

Usage
=====

    gsr -f ../../pinf-loader.js -- -v ../HelloWorld
    gsr -f ../../pinf-loader.js -- -v ../LoadExtraCode
    gsr -f ../../pinf-loader.js -- -v ../Mappings

If the above does not work, ensure it works with nodejs first:

    node ../../pinf-loader.js ../HelloWorld


Development
===========

Updating GPSEE:

    cd ./gpsee
    hg pull
    hg update
    make build
    sudo make install
