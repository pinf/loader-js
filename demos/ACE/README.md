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
  * The worker seems to be loaded twice for some reason. Likely related to issue above.


Developing
----------

When the demo runs it downloads archives from github to provision ACE locally.

If you want to make changes to ACE you need to overlay a source repository that is used instead of the downloaded one.

Place the following code into a file at `./sources.local.json`:

    {
        "packages": {
            "github.com/ajaxorg/ace/": {
                "source": {
                    "location": "/path/to/cloned/ace"
                }
            }
        }
    }

Where:

  * The `packages` keys are the `UID`s (minus protocol) from `program.json`
  * The `location` property pointes to a cloned version of [https://github.com/ajaxorg/ace](https://github.com/ajaxorg/ace)

To make changes to other packages clone the appropriate source repository and add it to the `sources.json` file. Restart the demo server.

Source overlays can be added in various ways. See [../../docs/SourceOverlays.md](https://github.com/pinf/loader-js/blob/master/docs/SourceOverlays.md)


TODO
----

Development workflow:

  * Reduce browser wait times by streamlining _Program Server_
    * Faster loading and module collection
    * Caching
    * Proactive payload generation on file change
  * Reduce browser receiving times by zipping response in _Program Server_

Build workflow:

  * Generate static transport files based on hierarchical transport file declarations in `program.json`.
