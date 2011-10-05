// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see https://jetpack.mozillalabs.com/

var FILE = require("file"),
    URL = require("url"),
    BYTE_STREAMS = require("byte-streams"),
    UNLOAD = require("unload"),
    TIMER = require("timer");
//  JSON = provided by jetpack as a global

var Cc = require("chrome").Cc;
var Ci = require("chrome").Ci;
var Cu = require("chrome").Cu;

var API;

exports.init = function(api)
{
    API = api;

    api.ENV.platform = "jetpack";

    api.ENV.ignoreGlobalPINF = true;
    
    var platformModules = {};


    UNLOAD.when(function()
    {
        api.ARCHIVE.forEach(function(archive)
        {
            archive.close();
        });
    });


    api.ENV.platformRequire = function(id)
    {
        // e.g. (prod) id = /__PWD__/resource:/jid0-7wdxr0d8dh783qhqfnjvg78hwo-devcomp-data/packages/p023a760e04072e4095e11461427ebade/lib/net
        if (platformModules[id])
        {
            id = platformModules[id];
        }
        else

        // e.g. (dev) id = /pinf/packages/net/lib/net
        if (API.ENV.platformOptions && API.ENV.platformOptions.resources)
        {
            for (var key in API.ENV.platformOptions.resources)
            {
                // match id = /pinf/packages/net/lib/net
                if (typeof API.ENV.platformOptions.resources[key] === "string" &&
                    id.substring(0, API.ENV.platformOptions.resources[key].length) == API.ENV.platformOptions.resources[key])
                {
                    id = id.substring(API.ENV.platformOptions.resources[key].length +1);
                    break;
                }
            }
        }
        return require(id);
    };

    api.ENV.verifyNativeModuleIdentifier = function(pkg, moduleIdentifier, args)
    {
        // e.g. (prod) moduleIdentifier = /__PWD__/resource:/jid0-7wdxr0d8dh783qhqfnjvg78hwo-devcomp-data/packages/p023a760e04072e4095e11461427ebade@/lib/net
        var id = moduleIdentifier.split("@")[1];
        if (!/^\/lib\//.test(id))
            throw new Error("NYI - Platform module with id '" +  + "' not supported as module is not in 'lib' dir of package!");
        id = id.substring(5);
        platformModules[moduleIdentifier.replace("@/", "/")] = id;
    }


    var parts = __url__.split("/");
    parts.pop();
    api.ENV.loaderRoot = "/" + parts.join("/");

    api.ENV.packageProviders["mozilla.org/labs/jetpack/"] = {
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

    api.SYSTEM.os = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS;

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


    var sandbox;
    
    api.UTIL.setTimeout = TIMER.setTimeout;

    // @see https://developer.mozilla.org/en/Components.utils.evalInSandbox
    api.UTIL.eval = function(code, scope, file, line)
    {
        
        // TODO: Sandbox caching can be enabled once scope properties get injected for module by wrapping
        //       code vs using sandbox variable.
//        if (!sandbox)
            sandbox = new Cu.Sandbox(Cc["@mozilla.org/systemprincipal;1"].createInstance(Ci.nsIPrincipal));

        for (var key in scope)
            sandbox[key] = scope[key];
        // jetpack globals
//        sandbox.packaging = origPackaging;

//dump("origPackaging: " + Object.keys(origPackaging.__packages) + "\n");

//        sandbox.memory = memory;
//        sandbox.__url__ = __url__;

//        code = [
//            "try { ",
//                code,
//            "} catch(e) {",
//                "console.error('Error loading module[" + file + "]: '" + e + ")",
//            "}"
//        ].join("");

//        try {
//dump("code.length: " + code.length + "\n");
            Cu.evalInSandbox(code, sandbox, "1.8", file, line);
//        } catch(e) {
//            dump("Error loading module[" + file + "]: " + e);
//            throw e;
//        }

//        for (var key in sandbox)
//            delete sandbox[key];
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

    api.FILE.normalizePath = function(path)
    {
        return normalizePath(path);
    }

    api.FILE.exists = function(filename)
    {
        filename = normalizePath(filename);
        if (typeof filename == "string")
            return FILE.exists(filename);
        return filename[0].api.exists(filename[1]);
    }

    api.FILE.isFile = function(filename)
    {
        filename = normalizePath(filename);
        if (typeof filename == "string")
            return FILE.isFile(filename);
        return filename[0].api.isFile(filename[1]);
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
        return filename[0].api.read(filename[1]);
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
        
        archive.close = function()
        {
            zipReader.close();
        }

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
                    buffer;
                try {
                    buffer = reader.read();
                } catch(e) {
                    api.SYSTEM.print("Error '" + e + "' reading from stream for path '" + path + "': " + e.stack + "\n");
                } finally {
                    reader.close();
                }
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

function normalizeURI(uri)
{
    var m = uri.match(/^\/__PWD__\/resource:\/(.*?)(!\/(.*))?$/);
    if(m)
    {
        if (m[2])
            return "resource://" + m[1] + "!/" + m[3];
        return "resource://" + m[1];
    }
    m = uri.match(/^resource:\/(.*?)(!\/(.*))?$/);
    if(m)
    {
        if (m[2])
            return "resource:/" + m[1] + "!/" + m[3];
        return "resource:/" + m[1];
    }
    m = uri.match(/^\/resource:\/([^\/].*?)(!\/(.*))?$/);
    if(m)
    {
        if (m[2])
            return "resource://" + m[1] + "!/" + m[3];
        return "resource://" + m[1];
    }
    else
        return uri;
}

function osifyPath(path)
{
    var isWindows = (/\bwindows\b/i.test(API.SYSTEM.os) || /\bwinnt\b/i.test(API.SYSTEM.os));

    if (isWindows)
    {
        path = path.replace(/\//g, "\\");
    }

    return path;
}

function normalizePath(filename)
{
    filename = normalizeURI(filename);

    var m = filename.match(/^resource:\/\/(.*?)(!\/(.*))?$/);
    if(m)
    {
        if (m[2])
            return [API.ARCHIVE.getForPath("resource://" + m[1]), m[3]];
        return URL.toFilename("resource://" + m[1]);
    }
    else
        return osifyPath(filename);
}

