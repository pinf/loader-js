// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see http://docs.phonegap.com/

var API;

exports.init = function(api)
{
    API = api;
    
    api.ENV.platform = "phonegap";
    
    api.ENV.ignoreGlobalPINF = true;
    
    var platformModules = {};

    api.ENV.platformRequire = function(id)
    {
    	throw new Error("ENV.platformRequire not implemented!");
    };

    api.ENV.verifyNativeModuleIdentifier = function(pkg, moduleIdentifier, args)
    {
    	throw new Error("ENV.verifyNativeModuleIdentifier not implemented!");
    }

    // @see http://docs.phonegap.com/phonegap_device_device.md.html#device.platform
    api.SYSTEM.os = device.platform;

    // request the persistent file system

    // TODO: This fails. Need bundle filesystem.
    window.requestFileSystem(LocalFileSystem.APPLICATION, 0, function (fileSystem)
    {
        console.log("fileSystem.name " + fileSystem.name + " " + fileSystem.root);
    }, function(e)
    {
    	console.log("Error getting APPLICATION filesystem", e);
    });

    // TODO: Get path to root of bundle (see above).
    api.SYSTEM.pwd = "NYI";

    api.ENV.loaderRoot = api.SYSTEM.pwd;
    
    api.SYSTEM.env = {
        TERM: "",
        HOME: ""
    };

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.plainPrint(function(msg)
        {
        	console.log((""+msg).replace(/\n*$/, ""));
        });
    }
    
    api.SYSTEM.formatErrorStack = function(e)
    {
    	return "Error: " + e.message + " - " + e.sourceURL + " (" + e.sourceId + ") - " + e.line;
    }
    
    api.SYSTEM.preArgs = [];
    api.SYSTEM.args = [];

    api.SYSTEM.exec = null;
    
    api.UTIL.setTimeout = setTimeout;

    api.UTIL.eval = function(code, scope, file, line)
    {
    	with(scope)
    	{
    		eval(code);
    	}
    };

    /*
    api.FILE.normalizePath = function(path)
    {
        return path;
    }
    */

    api.FILE.exists = function(filename)
    {
        throw new Error("NYI - FILE.exists");
//    	api.SYSTEM.print("exists filename: " + Titanium.Filesystem.resourcesDirectory.replace(/\/$/,"") + filename);
//        return Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, filename).exists();
    }

    api.FILE.isFile = function(filename)
    {
        throw new Error("NYI - FILE.isFile");
//    	api.SYSTEM.print("isFile filename: " + Titanium.Filesystem.resourcesDirectory, filename);
    	// TODO: Need `Titanium.Filesystem.getFile(filename).isFile`
//        return Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, filename).exists();
//        throw new Error("NYI - FILE.isFile");
    }

    api.FILE.read = function(filename, encoding)
    {
        throw new Error("NYI - FILE.read");
//    	api.SYSTEM.print("read filename1: " + Titanium.Filesystem.resourcesDirectory.replace(/\/$/,"") + filename);
    	// @see http://developer.appcelerator.com/apidoc/mobile/latest/Titanium.Filesystem-module
    	// @see http://developer.appcelerator.com/apidoc/mobile/latest/Titanium.Filesystem.File-object.html
//        return Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, filename).read().toString();
    }

    api.FILE.mkdirs = function(filename)
    {
        throw new Error("NYI - FILE.mkdirs");
    }
    
    api.FILE.write = function(filename, data, encoding)
    {
        throw new Error("NYI - FILE.write");
    }
    api.FILE.rename = function(from, to)
    {
        throw new Error("NYI - FILE.rename");
    }

    api.NET.download = function(url, path, callback)
    {
        throw new Error("NYI - NET.download");
    }

    api.JSON.parse = JSON.parse;
    api.JSON.stringify = JSON.stringify;
}

