Wakanda
=======

**Status: Not Yet Working**

An example of how to run the PINF JavaScript Loader on [wakanda](http://wakanda.org/).

TODO
----

  * Need `File().isFile` and `File().isDirectory`
  * Need better `eval()` such as `application.sandboxEval(code, scope, file)`
  * Need [bug](http://bugs.wakanda.org/bugdetail?Product=-8&Set=1&Version=1&Sort=1&sortOrder=0&Page=1&Bug=WAK0073047)
    fixed in order to debug loader within wakanda.

Setup
-----

Import loader into wakanda project:

    ../../bin/bundle-loader --platform wakanda ./project/modules/pinf-loader.js

Boot loader from wakanda bootstrap file:

    TODO
