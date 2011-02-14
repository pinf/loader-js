// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see http://nodejs.org/api.html

var SYS = require('sys'),
    FS = require("fs"),
    URL = require("url"),
    HTTP = require("http"),
    PATH = require("path"),
    EXEC = require('child_process').exec;
//  process = provided by nodejs as a global 
//  JSON = provided by nodejs as a global

exports.init = function(api)
{
    api.ENV.platform = "nodejs";
    api.ENV.loaderRoot = PATH.dirname(PATH.dirname(__filename));

    api.SYSTEM.print = SYS.print;
    api.SYSTEM.pwd = process.cwd();
    api.SYSTEM.env = {
        TERM: process.env.TERM
    };
    api.SYSTEM.preArgs = [];
    api.SYSTEM.args = [];
    process.argv.forEach(function (val, index, array)
    {
        if (index >= 2)
            api.SYSTEM.args.push(val);
        else
            api.SYSTEM.preArgs.push(val);
    });
    api.SYSTEM.exec = function(command, callback)
    {
        EXEC(command, function (error, stdout, stderr) {
          callback(stdout, stderr, error);
        });
    }

    api.FILE.exists = function(filename)
    {
        // Oh boy. nodejs throws if file does not exist
        try {
            FS.statSync(filename);
            return true;
        } catch(e) {
            return false;
        }
    }
    api.FILE.isFile = function(filename)
    {
        // Oh boy. nodejs throws if file does not exist
        try {
            return FS.statSync(filename).isFile();
        } catch(e) {
            return false;
        }
    }
    api.FILE.mkdirs = function(filename, mode)
    {
        // Oh boy. This is inefficient but should work for now.
        filename = filename.split("/");
        var parts = [];
        
        while (!api.FILE.exists(filename.join("/")))
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
    api.FILE.read = function(filename, encoding)
    {
        encoding = encoding || "utf-8";
        return FS.readFileSync(filename, encoding);
    }
    api.FILE.write = function(filename, data, encoding)
    {
        encoding = encoding || "utf-8";
        return FS.writeFileSync(filename, data, encoding);
    }

    api.NET.download = function(url, path, callback)
    {
        var urlInfo = URL.parse(url);
        var port = ((urlInfo.port)?urlInfo.port:((urlInfo.protocol=="https:")?443:80));
        var httpClient = HTTP.createClient(port, urlInfo.hostname, (port==443));

        httpClient.addListener('error', function (error)
        {
            console.log(error);
        });

        var request = httpClient.request('GET', urlInfo.pathname, {
            "host": urlInfo.hostname
        });

        request.addListener('response', function (response)
        {
            if (response.statusCode == 302 || response.statusCode == 301)
            {
                api.NET.download(response.headers['location'], path, callback);
            }
            else
            {
                var file = FS.createWriteStream(path);
                file.addListener("close", function()
                {
                    // TODO: Verify filesize based on content-length header
                    callback();
                });
                response.addListener("data", function (chunk)
                {
                    file.write(chunk, "binary");
                });
                response.addListener("end", function()
                {
                    file.end();
                });
            }
        });
        request.end();
    }

    api.JSON.parse = JSON.parse;
    api.JSON.stringify = JSON.stringify;
}
