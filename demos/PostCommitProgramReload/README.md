Post-commit Program Reload
==========================

This demo illustrates how to setup a webserver that dynamically provisions a JSGI program
and allows for the program to be reloaded triggered by a post-commit hook.

**NOTE:** This demo is not intended for production use as-is.

Usage
-----

Launch webserver for [this](https://gist.github.com/859578) sample program:

    commonjs -v ./demos/PostCommitProgramReload https://gist.github.com/859578

Browse to the program:

    open http://localhost:8003/

Refreshing will increment the counter. To reload the program access:

    http://localhost:8003/post-commit

You will notice that the counter resets.
