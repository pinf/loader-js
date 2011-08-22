
var PATH = require("nodejs/path"),
    FS = require("nodejs/fs"),
    EXEC = require("nodejs/child_process").exec;

exports.main = function(env)
{
    var excludeFilePath = PATH.dirname(module.id) + "/rsync-exclude.txt",
        sourcePath = PATH.dirname(PATH.dirname(PATH.dirname(module.id))),
        targetPath = sourcePath + "/.build/npm/",
        command;

    command = "rm -Rf " + targetPath;
    module.print(command + "\n");

    EXEC(command, function (error, stdout, stderr)
    {
        if (!exists(targetPath))
        {
            module.print("Creating: " + targetPath + "\n");
            mkdirs(PATH.dirname(targetPath), 0775);
        }

        command = "rsync -r --copy-links --exclude-from " + excludeFilePath + " " + sourcePath + "/* " + targetPath;
        module.print(command + "\n");
        EXEC(command, function (error, stdout, stderr)
        {
            module.print("Done. Now run: \0cyan(" + "sudo npm publish " + targetPath + "\0)" + "\n");
        });
    });        
    
}

function exists(filename)
{
    try
    {
        FS.statSync(filename);
        return true;
    }
    catch(e)
    {
        return false;
    }
}

function mkdirs(filename, mode)
{
    // Oh boy. This is inefficient but should work for now.
    filename = filename.split("/");
    var parts = [];
    
    while (!exists(filename.join("/")))
    {
        parts.push(filename.pop());
    }
    
    if (parts.length==0)
        return;
    
    while (parts.length > 0)
    {
        filename.push(parts.pop());
        FS.mkdirSync(filename.join("/"), mode);
    }
}
