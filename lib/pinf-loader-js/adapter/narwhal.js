// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see http://narwhaljs.org/

var SYSTEM = require("system"),
    OS = require("os"),
    FILE = require("file"),
    JSON = require("json"),
    HTTP_CLIENT = require("http-client");

exports.init = function(api)
{
    api.ENV.platform = "narwhal";
    if (typeof api.ENV.platformRequire == "undefined")
    {
        api.ENV.platformRequire = require;
    }

    api.ENV.loaderRoot = FILE.dirname(FILE.dirname(FILE.dirname(FILE.dirname(module.id))));

    api.ENV.packageProviders["narwhaljs.org"] = {
        requireModule: function(id)
        {
            return api.ENV.platformRequire(id);
        },
        getModuleSource: function(sandbox, resourceURI, callback)
        {
            // There is no module source. We use api.ENV.platformRequire to
            // make the module available.
            return false;
        }
    }

    api.SYSTEM.pwd = SYSTEM.env.PWD;
    // TODO: Get all env vars
    api.SYSTEM.env = {
        TERM: SYSTEM.env.TERM,
        HOME: SYSTEM.env.HOME
    };

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.colorizedPrint(function(msg)
        {
            SYSTEM.stdout.write(msg).flush();
        });
    }

    api.SYSTEM.parseArgs(SYSTEM.args);

    api.SYSTEM.exec = function(command, callback)
    {
        var process = OS.popen(command);
        var result = process.communicate();
        if (typeof callback != "undefined")
            callback(result.stdout, (result.stderr!="")?result.stderr:false, null);
    }

    api.FILE.exists = FILE.exists;
    api.FILE.isFile = FILE.isFile;
    api.FILE.mkdirs = function(filename, mode)
    {
        // TODO: mode
        return FILE.mkdirs(filename);
    }
    api.FILE.read = function(filename, encoding)
    {
        // TODO: encoding
        return FILE.read(filename);
    }
    api.FILE.write = function(filename, data, encoding)
    {
        // TODO: encoding
        return FILE.write(filename, data);
    }
    api.FILE.rename = function(from, to)
    {
        return FILE.rename(from, to);
    }

    api.NET.download = function(url, path, callback)
    {
        var request = HTTP_CLIENT.open(url, "b", {
            method: "GET"
        });

        var data;
        try {
            data = request.read();
        }
        finally
        {
            request.close();
        }

        // Fix status if redirecting
        // TODO: Fix this in narwhal
        if (typeof request.headers['Location'] != "undefined")
            request.status = 302;

        if (request.status == 302 || request.status == 301)
        {
            api.NET.download(request.headers['Location'], path, callback);
        }
        else
        {
            FILE.write(path, data, "b");
            data = void 0;
            // TODO: Verify filesize based on content-length header
            callback();
        }
    }

    api.JSON.parse = JSON.parse;
    api.JSON.stringify = JSON.stringify;
}
