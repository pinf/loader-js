// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API;

var SYSTEM = system,
	FS = require("fs");

exports.init = function(api)
{
    API = api;

    api.ENV.platform = "v8cgi";

    var platformModules = {};

    api.ENV.platformRequire = function(id)
    {
    	// TODO: Is there a *global* require? Maybe `require("system").global.require` as in GPSEE?
    	return require(id);
    };

    api.ENV.packageProviders["code.google.com/p/v8cgi/"] = {
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

    api.ENV.verifyNativeModuleIdentifier = function(pkg, moduleIdentifier, args)
    {
    	throw new Error("ENV.verifyNativeModuleIdentifier not implemented!");
    }

    // TODO
    api.SYSTEM.os = "N/A";

    api.SYSTEM.pwd = SYSTEM.getcwd();

    api.ENV.loaderRoot = API.FILE.dirname(API.FILE.dirname(API.FILE.dirname(API.FILE.dirname(module.id))));

    api.SYSTEM.env = SYSTEM.env;

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.colorizedPrint(function(msg)
        {
        	SYSTEM.stdout(""+msg);
        });
    }

    api.SYSTEM.formatErrorStack = function(e)
    {
    	return e.stack;
    };

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
    	// TODO: Improve with something like: http://gpsee.blogspot.com/2010/12/wrapped-modules-with-gpsee-02-gsr-10.html
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
        return new FS.File(filename).exists();
    }

    api.FILE.isFile = function(filename)
    {
        return new FS.File(filename).isFile();
    }

    api.FILE.read = function(filename, encoding)
    {
    	var fd = new FS.File(filename);
    	fd.open("r");
    	var data = fd.read().toString(encoding || "UTF-8");
    	fd.close();
    	return data;    	
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

