// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see https://jetpack.mozillalabs.com/

var FILE = require("file"),
    URL = require("url");
//  JSON = provided by jetpack as a global

exports.init = function(api)
{
    api.ENV.platform = "jetpack";
    api.ENV.platformRequire = require;
    
    var parts = __url__.split("/");
    parts.pop();
    api.ENV.loaderRoot = "/" + parts.join("/");

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = function(msg)
        {
            dump(msg);
        }
    }

    api.ENV.packageProviders = {
        "mozilla.org/labs/jetpack/":
        {
            requireModule: function(id)
            {
                return api.ENV.platformRequire(id);
            }
        }
    }

    api.SYSTEM.pwd = "__PWD__";

    api.SYSTEM.env = {
        TERM: ""
    };

    api.SYSTEM.preArgs = [];
    api.SYSTEM.args = [];

    api.SYSTEM.exec = null;


    api.FILE.exists = function(filename)
    {
        return FILE.exists(normalizePath(filename));
    }

    api.FILE.isFile = function(filename)
    {
        return FILE.isFile(normalizePath(filename));
    }

    api.FILE.mkdirs = function(filename)
    {
console.log("FILE.mkdirs: " + filename);
        throw new Error("NYI");
    }

    api.FILE.read = function(filename, encoding)
    {
        if (typeof encoding != "undefined")
            throw new Error("NYI - encoding when reading file");
        return FILE.read(normalizePath(filename));
    }

    api.FILE.write = function(filename, data, encoding)
    {
console.log("FILE.write: " + filename);
        throw new Error("NYI");
    }

    api.NET.download = function(url, path, callback)
    {
console.log("NET.download("+url+"): " + path);
        throw new Error("NYI");
    }

    api.JSON.parse = JSON.parse;
    api.JSON.stringify = JSON.stringify;
}


function normalizePath(filename)
{
    var m = filename.match(/^\/__PWD__\/resource:\/(.*)$/);
    if(m)
    {
        return URL.toFilename("resource://" + m[1]);
    }
    else
        throw new Error("NYI: " + filename);
}

