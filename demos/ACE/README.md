ACE Editor
==========

Run the ACE editor in the browser:

    node ../../pinf-loader -v
    open http://localhost:8003/

Status
------

The editor and plugins load but it does not initialize properly.

Possible causes:

  * The [worker](https://github.com/pinf/loader-js/blob/6740bd1fd8bb49974c145ca98fde92d67458786c/demos/ACE/worker/worker.js#L56-60) has changed
    to load the worker class **ASYNC**. This may be causing the [modified worker_client](https://github.com/pinf/loader-js/blob/6740bd1fd8bb49974c145ca98fde92d67458786c/demos/ACE/editor/modules/ace/worker/worker_client.js)
    to call the worker class before it is initialized.
    * **FIX: The worker_client must wait until the client is fully initilized.**
  * There may be other reasons that should be troubleshooted by someone who knows the init process well.

TODO
----

Overall:

  * Hierarchical transport file declarations in `program.json` to exclude already loaded modules from additional transport files.

Development workflow:

  * Reduce browser wait times by streamlining __Program Server__
    * Faster loading and module collection
    * Caching
    * Proactive payload generation on file change
  * Reduce browser receiving times by zipping response in __Program Server__
  * Splice in source repositories if available locally

Build workflow:

  * Generate static transport files based on hierarchical transport file declarations in `program.json`.
