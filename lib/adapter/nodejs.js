// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see http://nodejs.org/api.html

var SYS = require('sys'),
    FS = require("fs");
//  process = provided by nodejs as a global 
//  JSON = provided by nodejs as a global 

exports.init = function(objects)
{
    objects.env.platform = "nodejs";

    objects.system.print = SYS.print;
    objects.system.pwd = process.cwd();
    objects.system.args = [];
    process.argv.forEach(function (val, index, array)
    {
        if (index >= 2)
            objects.system.args.push(val);
    });

    objects.file.isFile = function(filename)
    {
        // nodejs throws if file does not exist
        try {
            return FS.statSync(filename).isFile();
        } catch(e) {
            return false;
        }
    }
    objects.file.read = function(filename)
    {
        return FS.readFileSync(filename, "utf-8");
    }

    objects.json.parse = JSON.parse;
}
