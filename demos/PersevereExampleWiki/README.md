Persevere Example Wiki
======================

Status: **Not functional yet**

The example wiki pulls in many packages where some packages rely on *mappings*,
some on *dependencies* (i.e. modules put on `require.paths`) and some use the *AMD* style module definitions.

With the exception of `require.paths` the loader should be able to handle all cases.

The example does not load yet and chokes on a module require for a module that is in *AMD* format. The problem
does not seem to be the *AMD* format though but rather the way the module is required (not quite sure where).

Various package descriptors are fixed in `./program.json` but not all are fixed correctly and some
fixes are missing.

This is a huge example application and thus not really suited to fix these issues. They should be fixed in
isolation.
