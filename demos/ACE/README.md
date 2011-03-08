ACE Editor
==========

Run the ACE editor in the browser:

    node ../../pinf-loader -v
    open http://localhost:8003/


Status
------

TODO:

  * The [worker](https://github.com/pinf/loader-js/blob/6740bd1fd8bb49974c145ca98fde92d67458786c/demos/ACE/worker/worker.js#L56-60) has changed
    to load the worker class **ASYNC**. This may be causing the [modified worker_client](https://github.com/pinf/loader-js/blob/6740bd1fd8bb49974c145ca98fde92d67458786c/demos/ACE/editor/modules/ace/worker/worker_client.js)
    to call the worker class before it is initialized.
    * **FIX: The worker_client must wait until the client is fully initilized.**


Developing
----------

The loader downloads archives from Github to provision ACE and stores these in `./.pinf-packages/downloads/**/*~sources/`.

You should be able to link cloned source repositories to these directories to hack on ACE. This process will be improved via
a `sources.json` file shortly (see TODO below).


TODO
----

Overall:

  * Configurable path for worker code. See [./editor/modules/ace/worker/worker_client.js](https://github.com/pinf/loader-js/blob/6740bd1fd8bb49974c145ca98fde92d67458786c/demos/ACE/editor/modules/ace/worker/worker_client.js#L19)
  * Hierarchical transport file declarations in `program.json` to exclude already loaded modules from additional transport files.

Development workflow:

  * Reduce browser wait times by streamlining _Program Server_
    * Faster loading and module collection
    * Caching
    * Proactive payload generation on file change
  * Reduce browser receiving times by zipping response in _Program Server_
  * Splice in source repositories if available locally

Build workflow:

  * Generate static transport files based on hierarchical transport file declarations in `program.json`.
