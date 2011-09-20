CouchApp support
================

**Status: Work in progress**

Example for running the PINF JavaScript Loader in a [CouchApp](http://couchapp.org/).

Required: [http://couchdb.apache.org/](http://couchdb.apache.org/)


TODO
====

  * Simple framework for couchapps via PINF (pinf/sdk-couchapp)
  * Need to export program into couchapp format (pinf/builder-js --sdk couchapp --target .../)


Install
=======

[CouchDB on OSX](http://wiki.apache.org/couchdb/Installing_on_OSX):

    sudo port install couchdb
    brew install pip && pip install couchapp

NOTE: Using `brew` does not seem to work. The compile takes forever.

[python.CouchApp on OSX](http://couchapp.org/page/installing):

    sudo easy_install pip
    sudo pip install couchapp
    sudo mv /usr/local/bin/couchapp /usr/local/bin/couchapp-python

[node.CouchApp.js on OSX](https://github.com/mikeal/node.couchapp.js):

    git clone git://github.com/mikeal/node.couchapp.js.git
    sudo npm link ./node.couchapp.js
    sudo mv /usr/local/bin/couchapp /usr/local/bin/couchapp-node

Use
===

See *Development* below on how to generate some demo couchapps using existing tools.

Start CouchDB
-------------

    sudo couchdb


python.CouchApp Demo App
------------------------

Puch to CouchDB server:

    cd ./apps/couchapp
    couchapp-python push testdb

View demo app:

    open http://127.0.0.1:5984/testdb/_design/helloworld-app/index.html
    open http://127.0.0.1:5984/testdb/_design/helloworld-app/_show/hello


node.CouchApp.js Demo App
-------------------------

Puch to CouchDB server:

    couchapp-node push ./apps/node.couchapp.js/app.js http://localhost:5984/testdb2

View demo app:

    open http://localhost:5984/testdb2/_design/app/index.html


Development
===========

Create sample apps:

    mkdir ./apps
    couchapp generate ./apps/couchapp
    mkdir ./apps/node.couchapp.js
    cp -Rf ./node.couchapp.js/boiler/* ./apps/node.couchapp.js/


Links
=====

  * http://127.0.0.1:5984/_utils/
  * http://couchapp.org/page/getting-started
  * https://github.com/mikeal/node.couchapp.js
