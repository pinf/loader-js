// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API;

var SYSTEM = require("system"),
	FS_BASE = require("fs-base");


// Monkey patch SYSTEM.os
if (typeof SYSTEM.os == "undefined")
{
	const FFI = require("gffi");
	const { int, pointer, CFunction, MutableStruct } = FFI;
	const UNAME    = new CFunction(int, "uname", pointer);
	const STRERROR = new CFunction(pointer, "strerror", int);
	
	SYSTEM.__defineGetter__("os", function()
	{
	  var name = new MutableStruct("struct utsname");
	  if (UNAME(name) == -1)
	    throw new Error("Cannot determine OS name (" + STRERROR(FFI.errno).asString() + ")");
	  return name.sysname.asString();
	});
}


exports.init = function(api)
{
    API = api;

    api.ENV.platform = "gpsee";

    var platformModules = {};

    api.ENV.platformRequire = function(id)
    {
    	return SYSTEM.global.require(id);
    };

    api.ENV.packageProviders["code.google.com/p/gpsee/"] = {
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

    api.SYSTEM.os = SYSTEM.os;

    api.SYSTEM.pwd = FS_BASE.workingDirectory();

    api.ENV.loaderRoot = API.FILE.dirname(API.FILE.dirname(API.FILE.dirname(API.FILE.dirname(module.id))));
    
    api.SYSTEM.env = SYSTEM.env;

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.colorizedPrint(function(msg)
        {
/*        	
	        var fd = FS_BASE.openRaw("/dev/stdout", {
	        	write: true
	        });
        	fd.write(":"+msg);
        	fd.close();
*/        	
        	SYSTEM.stdout.write(""+msg);        	
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
    	// TODO: Don't use with()
    	// TODO: Mark source or use require("gpsee").include() - see: http://groups.google.com/group/gpsee/browse_thread/thread/e4c1934460c0ed5
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
    	var fd = FS_BASE.openRaw(filename, {
        	read: true
        });
    	var data = "" + fd.read();
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

