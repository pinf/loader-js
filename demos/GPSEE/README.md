GPSEE Platform support
======================

Example for running the PINF JavaScript Loader on [GPSEE](http://code.google.com/p/gpsee).


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
    ./configure --with-mozilla=`pwd`/../tracemonkey
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
    make clean
    ./configure --with-mozilla=/pinf/workspaces/github.com/pinf/loader-js/demos/GPSEE/tracemonkey
    make build
    sudo make install


TODO
====

    $ gsr -f ./pinf-loader.js -- -v ./demos/HelloWorld 
    JS strict warning #157 in sandbox.js at line 200 ch 8 - anonymous function does not always return a value
    JS strict warning #112 in sandbox.js at line 293 ch 73 - test for equality (==) mistyped as assignment (=)?
    JS strict warning #112 in sandbox.js at line 328 ch 123 - test for equality (==) mistyped as assignment (=)?
    JS strict warning #112 in descriptors.js at line 413 ch 78 - test for equality (==) mistyped as assignment (=)?
    JS strict warning #157 in util.js at line 458 ch 41 - anonymous function does not always return a value
    JS strict warning #112 in util.js at line 986 ch 34 - test for equality (==) mistyped as assignment (=)?
    JS strict warning #157 in package.js at line 294 ch 15 - anonymous function does not always return a value
    JS strict warning #157 in package.js at line 298 ch 11 - anonymous function does not always return a value
    JS strict warning #157 in console.js at line 45 ch 52 - anonymous function does not always return a value
    JS strict warning #132 in gpsee.js at line 15 ch 32 - int is a reserved identifier
    JS strict warning #132 in gpsee.js at line 16 ch 53 - int is a reserved identifier
    JS warning #232 in term.js at line 120 ch 12 - octal literals and octal escape sequences are deprecated
    JS warning #232 in term.js at line 131 ch 30 - octal literals and octal escape sequences are deprecated
    JS warning #232 in term.js at line 137 ch 27 - octal literals and octal escape sequences are deprecated
    JS warning #232 in term.js at line 139 ch 27 - octal literals and octal escape sequences are deprecated
    JS warning #232 in term.js at line 143 ch 27 - octal literals and octal escape sequences are deprecated
    JS warning #232 in term.js at line 145 ch 27 - octal literals and octal escape sequences are deprecated
    JS warning #232 in term.js at line 152 ch 30 - octal literals and octal escape sequences are deprecated
    JS warning #232 in term.js at line 156 ch 30 - octal literals and octal escape sequences are deprecated
    JS warning #232 in term.js at line 159 ch 30 - octal literals and octal escape sequences are deprecated
    JS warning #232 in term.js at line 162 ch 30 - octal literals and octal escape sequences are deprecated
    JS warning #232 in term.js at line 165 ch 22 - octal literals and octal escape sequences are deprecated
    JS warning #232 in term.js at line 168 ch 30 - octal literals and octal escape sequences are deprecated
    JS warning #232 in term.js at line 171 ch 30 - octal literals and octal escape sequences are deprecated
    JS strict warning #157 in args.js at line 119 ch 8 - anonymous function does not always return a value
    JS strict warning #157 in args.js at line 126 ch 15 - anonymous function does not always return a value
    JS strict warning #127 in args.js at line 340 ch 12 - variable parent redeclares argument
    JS strict warning #110 in args.js at line 500 ch 8 - function validate does not always return a value
    :::::----------------------------------------------------------------------------
    :::::|  PINF Loader v0.0.2  ~  https://github.com/pinf/loader-js/::
    :::----------------------------------------------------------------------------::
    :::Loaded adapter: gpsee
    JS warning #232 in assembler.js at line 60 ch 46 - octal literals and octal escape sequences are deprecated
    JS warning #232 in assembler.js at line 60 ch 46 - octal literals and octal escape sequences are deprecated
    JS warning #232 in assembler.js at line 60 ch 46 - octal literals and octal escape sequences are deprecated
    JS strict warning #112 in assembler.js at line 318 ch 18 - test for equality (==) mistyped as assignment (=)?
    JS strict warning #112 in assembler.js at line 330 ch 66 - test for equality (==) mistyped as assignment (=)?
    JS strict warning #112 in assembler.js at line 335 ch 75 - test for equality (==) mistyped as assignment (=)?
    JS strict warning #112 in program.js at line 170 ch 80 - test for equality (==) mistyped as assignment (=)?
    JS strict warning #112 in program.js at line 184 ch 58 - test for equality (==) mistyped as assignment (=)?
    :::No descriptor URI argument. Assuming: '[./]program.json'
    :::Loading program descriptor from: /Users/wes/git/loader-js/demos/HelloWorld/program.json
    :::Using program cache directory: /Users/wes/git/loader-js/demos/HelloWorld/.pinf-packages
    :::Not using any source overlay files.
    :::Assembling program:
    :::  Program URI: /Users/wes/git/loader-js/demos/HelloWorld/program.json
    :::  Boot packages:
    :::    ID: github.com/pinf/loader-js/demos/HelloWorld/
    :::      ID: ::github.com/pinf/loader-js/demos/HelloWorld/::
    :::      Path: ::/Users/wes/git/loader-js/demos/HelloWorld::
    :::      Mappings: None
    :::      Dependencies: None
    :::Loading program's main packages:
    :::  /Users/wes/git/loader-js/demos/HelloWorld/
    :::Booting program. Output for boot package follows in green between ==> ... <==
    :::::::----- /Users/wes/git/loader-js/demos/HelloWorld -> [package.json].main -> main() -----::
    :::::=====>::::::::::Hello World!
    :::OK:::::::::::<=====::::
    :::::::----- ^ ------------------------------------------------------------------------------::::
    :::Program Booted  ~  Timing (Assembly: 0.07, Load: 0.002, Boot: 0.004, Additional Load: 0)
    :::::::----- | Program stdout & stderr follows (if not already terminated) ====>::::

