Source Overlays
===============

Source overlays allow you to use a cloned source repository instead of the downloaded archive of a package within a program.

These overlays are defined in a `sources.json` file as follows:

    {
        "packages": {
            "<ID>": {
                "source": {
                    "location": "<absolutePath>"
                }
            }
        }
    }

Where:

  * `<ID>` is the `UID` (minus protocol) of a package or the key used for the `packages` property in `program.json`
  * `<absolutePath>` is the absolute path to the cloned source repository of the package on your local system

The loader automatically looks for source overlay files in various places or you can specify your own as an argument on the command line.
The following lookup order for source overlay files applies and the first match for a package ID is used.

  1. `--sources ABSOLUTE_PATH` command line argument
  2. `dirname("/.../program.json") + "/sources.local.json"` (local overlays not committed with program)
  3. `$HOME/.pinf/config/sources.json` (user-specific overlays that apply to all programs)
  4. `/pinf/etc/pinf/sources.json` (system-wide overlays that apply to all programs)
  5. `dirname("/.../program.json") + "/sources.json"` (overlays managed with program)

