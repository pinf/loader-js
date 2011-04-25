// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see https://jetpack.mozillalabs.com/

var FILE = require("file"),
    URL = require("url"),
    BYTE_STREAMS = require("byte-streams");
//  JSON = provided by jetpack as a global

var {Cc, Ci, Cu} = require("chrome");

var API;

exports.init = function(api)
{
    API = api;

    api.ENV.platform = "jetpack";
    api.ENV.platformRequire = function(id)
    {
        if (API.ENV.platformOptions && API.ENV.platformOptions.resources)
        {
            for (var key in API.ENV.platformOptions.resources)
            {
                if (id.substring(0, API.ENV.platformOptions.resources[key].length) == API.ENV.platformOptions.resources[key])
                {
                    id = id.substring(API.ENV.platformOptions.resources[key].length +1);
                    break;
                }
            }
        }
        return require(id);
    };
    
    var parts = __url__.split("/");
    parts.pop();
    api.ENV.loaderRoot = "/" + parts.join("/");

    api.ENV.packageProviders["mozilla.org/labs/jetpack"] = {
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

    api.SYSTEM.pwd = "__PWD__";

    api.SYSTEM.env = {
        TERM: "",
        HOME: ""
    };

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.plainPrint(function(msg)
        {
            dump(msg);
        });
    }

    api.SYSTEM.preArgs = [];
    api.SYSTEM.args = [];

    api.SYSTEM.exec = null;
    
    var origPackaging = packaging;

    // @see https://developer.mozilla.org/en/Components.utils.evalInSandbox
    api.UTIL.eval = function(code, scope, file, line)
    {
        var sandbox = new Cu.Sandbox(Cc["@mozilla.org/systemprincipal;1"].createInstance(Ci.nsIPrincipal));
        for (var key in scope)
            sandbox[key] = scope[key];
        // jetpack globals
//        sandbox.packaging = origPackaging;

//dump("origPackaging: " + Object.keys(origPackaging.__packages) + "\n");

//        sandbox.memory = memory;
//        sandbox.__url__ = __url__;
        Cu.evalInSandbox(code, sandbox, "1.8", file, line);
    };

/*
NOTE: If this is added various things break that look for "/" at beginning of path to determine if it is absolute
    var realpath = api.FILE.realpath;
    api.FILE.realpath = function(path)
    {
        path = realpath(path);
        path = path.replace(/^\/resource:\//, "resource://");
        return path;
    }
    
    var isAbsolute = api.FILE.isAbsolute;
    api.FILE.isAbsolute = function(path)
    {
        if (isAbsolute(path) || /^resource:\/\//.test(path))
            return true;
        return false;
    }
*/

    api.FILE.exists = function(filename)
    {
        filename = normalizePath(filename);
        if (typeof filename == "string")
            return FILE.exists(filename);
        return filename[0].api.exists(filename[1])
    }

    api.FILE.isFile = function(filename)
    {
        filename = normalizePath(filename);
        if (typeof filename == "string")
            return FILE.isFile(filename);
        return filename[0].api.isFile(filename[1])
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
        filename = normalizePath(filename);
        if (typeof filename == "string")
            return FILE.read(filename);
        return filename[0].api.read(filename[1])
    }

    api.FILE.write = function(filename, data, encoding)
    {
console.log("FILE.write: " + filename);
        throw new Error("NYI");
    }
    api.FILE.rename = function(from, to)
    {
console.log("FILE.rename: " + from);
        throw new Error("NYI");
    }

    api.NET.download = function(url, path, callback)
    {
console.log("NET.download("+url+"): " + path);
        throw new Error("NYI");
    }

    api.JSON.parse = JSON.parse;
    api.JSON.stringify = JSON.stringify;


    api.ARCHIVE.open = function(archive)
    {
        if (!/\.zip|\.jar/.test(archive.path))
            throw new Error("Only 'zip' and 'jar' archives are supported at this time! Archive path: " + archive.path);

        var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
        file.initWithPath(URL.toFilename(archive.path));

        var zipReader = Cc["@mozilla.org/libjar/zip-reader;1"].createInstance(Ci.nsIZipReader);
        zipReader.open(file);
        zipReader.test(null);

        archive.api = {
            "isDirectory": function(path)
            {
                path = archive.prefixPath + path;
                if(archive.entries[path] && archive.entries[path].dir) return true;
                return false;
            },
            "isFile": function(path)
            {
                path = archive.prefixPath + path;
                if(archive.entries[path] && !archive.entries[path].dir) return true;
                return false;
            },
            "list": function(path)
            {
                path = archive.prefixPath + path;
                var parts = path.split("/");
                var entryNames = [];
                for (var entry in archive.entries)
                {
                    var item = archive.entries[entry];
                    if(path) {
                        if(item[1].parts.length==parts.length+1 && 
                           item[1].parts.slice(0,parts.length).join("/")==path) {
                            entryNames.push(item[1].parts[item[1].parts.length-1]);
                        }
                    } else {
                        if(item[1].parts.length==1) {
                            entryNames.push(item[1].parts[0]);
                        }
                    }
                }
                return entryNames;       
            },
            "exists": function(path)
            {
                path = archive.prefixPath + path;
                return (!!archive.entries[path]);
            },
            "read": function(path)
            {
                path = archive.prefixPath + path;
                var reader = new BYTE_STREAMS.ByteReader(zipReader.getInputStream(path)),
                    buffer = "",
                    chunk;
                while ( (chunk = reader.read(1024)) !== "" ) {
                    buffer += chunk;
                }
                reader.close();
                return buffer;
            },
            "mtime": function(path)
            {
                path = archive.prefixPath + path;
                new Date(zipReader.getEntry(path).lastModifiedTime);
            }
        }

        var entries = zipReader.findEntries(null),
            topDirs = {};
        while (entries.hasMore()) {
            var entry = entries.getNext();
            var dir = (entry.substr(entry.length-1,1)=="/");
            if(dir) {
                topDirs[entry.split("/")[0]] = true;
            }
            archive.entries[entry] = {
                "parts": entry.split("/"),
                "dir": dir
            }
        }
        // delete some junk directories
        delete topDirs["__MACOSX"];

        archive.prefixPath = "";
        if (Object.keys(topDirs).length == 1)
            archive.prefixPath = Object.keys(topDirs)[0] + "/";
    }
}


function normalizePath(filename)
{
    var m = filename.match(/^\/__PWD__\/resource:\/(.*?)(!\/(.*))?$/);
    if(m)
    {
        if (m[2])
            return [API.ARCHIVE.getForPath("resource://" + m[1]), m[3]];
        return URL.toFilename("resource://" + m[1]);
    }
    m = filename.match(/^resource:\/(.*?)(!\/(.*))?$/);
    if(m)
    {
        if (m[2])
            return [API.ARCHIVE.getForPath("resource:/" + m[1]), m[3]];
        return URL.toFilename("resource:/" + m[1]);
    }
    m = filename.match(/^\/resource:\/([^\/].*?)(!\/(.*))?$/);
    if(m)
    {
        if (m[2])
            return [API.ARCHIVE.getForPath("resource://" + m[1]), m[3]];
        return URL.toFilename("resource://" + m[1]);
    }
    else
        return filename;
}

