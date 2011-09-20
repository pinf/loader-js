RingoJS Platform support
========================

Example for running the PINF JavaScript Loader on [RingoJS](http://ringojs.org/).


Install
=======

[Download RingoJS](http://ringojs.org/downloads) source and place into `./ringo-ringojs/`.

Now run ([Getting Started](http://ringojs.org/getting_started)):

    cd ./ringo-ringojs
    ant jar
    cd ../

Ensure it works:

   ./ringo-ringojs/bin/ringo -h
   ./ringo-ringojs/bin/ringo ./scripts/helloworld.js


Usage
=====

    ./ringo-ringojs/bin/ringo ../../pinf-loader.js ../HelloWorld

If the above does not work, ensure it works with nodejs first:

    node ../../pinf-loader.js ../HelloWorld
