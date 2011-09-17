Adobe Air
=========

Example of using the PINF JavaScript Loader in an [Adobe Air](http://www.adobe.com/products/air/) application.


Install
=======

Requirements
------------

  * PINF JavaScript Loader: https://github.com/pinf/loader-js
  * Adobe Air SDK: http://www.adobe.com/products/air/sdk/

Run
---

Via AIR Debug Launcher:

    .../AdobeAIRSDK/bin/adl app/app.xml

Dev
---

Import loader into air application:

    ../../bin/bundle-loader --platform air ./app/pinf-loader.js
    
TODO
----

  * Load 2.0 modules via script tags to avoid security issues
    * Currently dying at `loader.bravojs.module.constructor.prototype.declare`
    * See: http://help.adobe.com/en_US/AIR/1.5/devappshtml/WS5b3ccc516d4fbf351e63e3d118666ade46-7f11.html
  * Example of spidered program
  * Example of using pinf to download dependencies and then run in air

  
Links
=====

  * [Developer Center](http://www.adobe.com/devnet/air.html)
  * [Intro Tutorial](http://help.adobe.com/en_US/air/build/WS5b3ccc516d4fbf351e63e3d118666ade46-7ecc.html)
  * [Air API](http://help.adobe.com/en_US/air/reference/html/)
