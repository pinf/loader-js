
module.declare(["nodejs/path", "nodejs/fs", "pinf/loader"], function(require, exports, module)
{
    var PATH = require("nodejs/path"),
        FS = require("nodejs/fs"),
        PINF_LOADER = require("pinf/loader");

    exports.main = function()
    {
        var basePath = PATH.dirname(PATH.dirname(PATH.dirname(module.id))) + "/demos";

        FS.readdir(basePath, function(err, files)
        {
            var count = 0;

            files.forEach(function(filename) {
                
                var exists = true;
                try {
                    FS.statSync(basePath + "/" + filename + "/program.json");
                } catch(e) { exists = false; }
                
                if (!exists || filename == "Narwhal")
                {
                    module.print("Skipping demo: " + basePath + "/" + filename + " (you need to run manually for now)\n");
                    return;
                }

                module.print("Running demo: " + basePath + "/" + filename + "\n");

                count++;

                PINF_LOADER.runProgram({
                    "uri": basePath + "/" + filename,
                    "exec": true,
                    "options": [
                        "--terminate"
                    ]
                }, function(stdout, stderr) {

                    if (stderr)
                    {
                        throw new Error("Demo '" + basePath + "/" + filename + "' failed: " + stderr);
                    }
                    if (stdout)
                    {
                        var parts = stdout.split("\n"),
                            ending = new String(parts.slice(parts.length-2, parts.length).join("").replace(/\033.*?m/g, ""));
                        if (!/OK$/.test(ending))
                            throw new Error("Demo '"+basePath + "/" + filename+"' failed: " + stdout);
                    }
                    else
                        throw new Error("Demo '"+basePath + "/" + filename+"' failed. No stdout.");
                    count--;
                    if (count==0)
                    {
                        module.print("OK");
                    }
                });
                
            });
        });

    }
});
