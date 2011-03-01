
Programs
========

A program is represented by a `program.json` file (program descriptor) which is used by the loader to provision all referenced
package dependencies. Only packages specifically listed in `program.json` may be used as part of the program.

A simple `program.json` file looks as follows:

    {
        "boot": "github.com/pinf/loader-js/demos/HelloWorld/",
        "packages": {
            "github.com/pinf/loader-js/demos/HelloWorld/": {
                "locator": {
                    "location": "./"
                }
            }
        }
    }

Where:

  * `boot` specifies the package to call when the program first starts. The `main()` export of the `main` module for the package is called.
  * `packages` lists all allowed packages for the program by their top-level IDs which are typically based on the URL of the package without the protocol.
    The `locator` property is used to override where the package is located and if specified here will take precedence over any location
    specified as part of a package mapping.

The program descriptor above specifies that the boot package is to be found in the same directory as the program descriptor. If all `locator`
properties specify URLs instead of relative paths the `program.json` file is the only file needed to provision and execute the program (all package
dependencies will be downloaded on first use).

There are many examples of program descritors in the [../demos](https://github.com/pinf/loader-js/tree/master/demos).


Packages
========

Packages are the primary unit of composition for programs and are represented by a `package.json` file (package descriptor)
located in the root directory of the package. This approach follows the [CommonJS Packages/1.1 (draft)](http://wiki.commonjs.org/wiki/Packages/1.1)
specification.

Packages contain modules and may map the modules of other packages into
the namespace of the package by specifying mappings in the package descriptor. This approach is specified in
[CommonJS Packages/Mappings/C (proposal)](http://wiki.commonjs.org/wiki/Packages/Mappings/C) and can be used to build programs
out of many packages without needing to worry about namespace conflicts.

There are many examples of package descritors in the [../demos](https://github.com/pinf/loader-js/tree/master/demos).


Example Program
===============

Taken from [../demos/HelloWorld/](https://github.com/pinf/loader-js/blob/master/demos/HelloWorld/). There are many more examples under [../demos](https://github.com/pinf/loader-js/tree/master/demos).

    program.json ~ {
        "boot": "github.com/pinf/loader-js/demos/HelloWorld/",
        "packages": {
            "github.com/pinf/loader-js/demos/HelloWorld/": {
                "locator": {
                    "location": "./"
                }
            }
        }
    }

    package.json ~ {
        "uid": "http://github.com/pinf/loader-js/demos/HelloWorld/",
        "main": "main.js"
    }

    main.js ~ module.declare([], function(require, exports, module)
    {
        exports.main = function()
        {
            module.print("Hello World!\n");
        }
    });
