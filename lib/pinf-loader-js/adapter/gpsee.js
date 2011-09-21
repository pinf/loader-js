// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see http://ringojs.org/api/v0.8/

var API;

var SYSTEM = require("system"),
	FS_BASE = require("fs-base");

exports.init = function(api)
{
    API = api;

    api.ENV.platform = "gpsee";

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

    api.SYSTEM.pwd = "/pinf/workspaces/github.com/pinf/loader-js/demos/GPSEE"; //FS_BASE.workingDirectory();

    api.ENV.loaderRoot = API.FILE.dirname(API.FILE.dirname(API.FILE.dirname(API.FILE.dirname(module.id))));
    
    api.SYSTEM.env = SYSTEM.env;

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.plainPrint(function(msg)
        {
        	print(msg);
//        	print((""+msg).replace(/\n$/, ""));
        });
    }

    api.SYSTEM.formatErrorStack = function(e)
    {
    	return e.stack;
    }

    api.SYSTEM.parseArgs(SYSTEM.args);

    api.SYSTEM.exec = null;

/*    
    api.UTIL.setTimeout = function(callback, timeout)
    {
    	callback();
    };
*/

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
        return FS_BASE.exists(filename);
    }

    api.FILE.isFile = function(filename)
    {
        return FS_BASE.isFile(filename);
    }

    api.FILE.read = function(filename, encoding)
    {
        return ""+FS_BASE.openRaw(filename, {
        	read: true
        }).read();
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

