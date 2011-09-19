// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see http://developer.appcelerator.com/apidoc/mobile/latest/

var API;

exports.init = function(api)
{
    API = api;
    
    api.ENV.platform = "titanium";
    
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

    // @see http://developer.appcelerator.com/apidoc/mobile/latest/Titanium.Platform-module
    api.SYSTEM.os = Titanium.Platform.osname;

    api.SYSTEM.pwd = Titanium.Filesystem.resourcesDirectory;

    api.ENV.loaderRoot = api.SYSTEM.pwd;
    
    api.SYSTEM.env = {
        TERM: "",
        HOME: ""
    };

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.plainPrint(function(msg)
        {
        	// @see http://developer.appcelerator.com/apidoc/mobile/latest/Titanium.API-module
        	Titanium.API.log((""+msg).replace(/\n*$/, ""));
        });
    }
    
    api.SYSTEM.formatErrorStack = function(e)
    {
    	return "Error: " + e.message + " - " + e.sourceURL + " (" + e.sourceId + ") - " + e.line;
    }
    
    api.SYSTEM.preArgs = [];
    api.SYSTEM.args = [];

    api.SYSTEM.exec = null;
    
    var sandbox;
    
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
//    	api.SYSTEM.print("exists filename: " + Titanium.Filesystem.resourcesDirectory.replace(/\/$/,"") + filename);
        return Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, filename).exists();
    }

    api.FILE.isFile = function(filename)
    {
//    	api.SYSTEM.print("isFile filename: " + Titanium.Filesystem.resourcesDirectory, filename);
    	// TODO: Need `Titanium.Filesystem.getFile(filename).isFile`
        return Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, filename).exists();
//        throw new Error("NYI - FILE.isFile");
    }

    api.FILE.read = function(filename, encoding)
    {
//    	api.SYSTEM.print("read filename1: " + Titanium.Filesystem.resourcesDirectory.replace(/\/$/,"") + filename);
    	// @see http://developer.appcelerator.com/apidoc/mobile/latest/Titanium.Filesystem-module
    	// @see http://developer.appcelerator.com/apidoc/mobile/latest/Titanium.Filesystem.File-object.html
        return Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, filename).read().toString();
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

