// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see http://ringojs.org/api/v0.8/

var API;

var SYSTEM = require("system"),
	FS = require("fs"),
	SCHEDULER = require("ringo/scheduler");

exports.init = function(api)
{
    API = api;
    
    api.ENV.platform = "ringo";
    
    var platformModules = {};

    api.ENV.platformRequire = function(id)
    {
    	throw new Error("ENV.platformRequire not implemented!");
    };

    api.ENV.verifyNativeModuleIdentifier = function(pkg, moduleIdentifier, args)
    {
    	throw new Error("ENV.verifyNativeModuleIdentifier not implemented!");
    }

    // TODO: Get OS name
    api.SYSTEM.os = "NYI-OS";

    api.SYSTEM.pwd = FS.workingDirectory();

	// TODO: Need filepath of this module via `module.id` or equivalent so we can get path
	//		 to root of loader by going up directories.
    api.ENV.loaderRoot = "NYI-loaderRoot";
    
    api.SYSTEM.env = SYSTEM.env;

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.plainPrint(function(msg)
        {
        	// @see http://ringojs.org/api/v0.8/system/
        	SYSTEM.print((""+msg).replace(/\n$/, ""));
        });
    }
    
    api.SYSTEM.formatErrorStack = function(e)
    {
    	return e.stack + "\n" + e.rhinoException;
    }

    api.SYSTEM.parseArgs(SYSTEM.args);

    api.SYSTEM.exec = null;
    
    var sandbox;
    
    api.UTIL.setTimeout = SCHEDULER.setTimeout;

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
        return FS.exists(filename);
    }

    api.FILE.isFile = function(filename)
    {
        return FS.isFile(filename);
    }

    api.FILE.read = function(filename, encoding)
    {
    	// TODO: Add encoding to options
    	// @see http://ringojs.org/api/v0.8/fs/#read
        return FS.read(filename);
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

