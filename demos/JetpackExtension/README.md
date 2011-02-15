Jetpack Extension
=================

This is a basic Jetpack extension illustrating how to boot programs into the
jetpack environment and use the jetpack API from within program modules.

Demo
----

  1. Drag `extension.xpi` into a Firefox 4 browser.
  2. Click on _mozilla icon_ at bottom right of status bar.


Notes
-----

Jetpack SDK: https://jetpack.mozillalabs.com/

Version: 1.0b2

Tutorial: https://jetpack.mozillalabs.com/sdk/1.0b2/docs/#guide/getting-started

### Dev Setup (needed if testing, modifying, upgrading or re-packaging extension):

__NOTE:__ If building loader you may require this SDK instead: https://github.com/cadorn/addon-sdk

    mkdir sdk
    cd sdk
    wget --no-check-certificate https://ftp.mozilla.org/pub/mozilla.org/labs/jetpack/jetpack-sdk-latest.zip
    unzip *.zip
    cd addon-sdk-1.*
    source bin/activate
    cfx docs
    cd ../../

### Initial Creation (just for reference):

    mkdir extension
    cd extension
    cfx init
    cfx -b /Applications/Firefox-4/Firefox.app/Contents/MacOS/firefox-bin test
    cd ../

### Building and bundling loader:

    // This is necessary for now as the jetpack modules environment chokes on
    // linked directories and relative module requires.

    cd extension
    ../../../bin/bundle-loader --platform jetpack lib/pinf-loader.js
    cfx test
    cd ../

### Packaging:

    cd extension
    cfx xpi
    cd ../
