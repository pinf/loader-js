
module.declare([], function(require, exports, module)
{
    var PATH = require("path"),
        FS = require("fs"),
        PINF_LOADER = require("pinf/loader");

    exports.main = function()
    {
        var basePath = PATH.dirname(PATH.dirname(PATH.dirname(PATH.dirname(module.id)))) + "/demos";

        FS.readdir(basePath, function(err, files)
        {
            var count = 0;

            files.forEach(function(filename) {

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
                        throw new Error("Demo '"+basePath + "/" + filename+"' failed: " + stderr);
                    }
                    if (stdout.substring(stdout.length-2, stdout.length) != "OK")
                    {
                        throw new Error("Demo '"+basePath + "/" + filename+"' failed: " + stdout);
                    }
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
