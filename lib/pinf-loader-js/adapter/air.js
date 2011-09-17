// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see http://help.adobe.com/en_US/air/reference/html/

var API;

exports.init = function(api)
{
    API = api;

    api.ENV.platform = "air";

    // We need to ignore everything outside of the application directory
    // as we do not have access to it.
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

    api.SYSTEM.os = null;

    // @see http://help.adobe.com/en_US/air/reference/html/flash/filesystem/File.html
    api.SYSTEM.pwd = window.runtime.flash.filesystem.File.applicationDirectory.nativePath;

    api.ENV.loaderRoot = api.SYSTEM.pwd;
    
    api.SYSTEM.env = {
        TERM: "",
        HOME: ""
    };

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.plainPrint(function(msg)
        {
        	// @see http://help.adobe.com/en_US/air/reference/html/package.html#trace()
        	window.runtime.trace(msg);
        });
    }

    api.SYSTEM.preArgs = [];
    api.SYSTEM.args = [];

    api.SYSTEM.exec = null;
    
    api.SYSTEM.formatErrorStack = function(e)
    {
    	var stack = "";
		if (typeof e.stackTrace === "object") {
			for ( var i in e.stackTrace) {
				stack += e.stackTrace[i].sourceURL + " - " + e.stackTrace[i].line + " - " + e.stackTrace[i].functionName + "\n ";
			}
		}
		return stack;
	}
    
    var sandbox;
    
    api.UTIL.setTimeout = setTimeout;

    api.UTIL.eval = function(code, scope, file, line)
    {
    	window.runtime.trace("file: "+file);

    	for(var i in scope.loader.bravojs)
    	{
        	window.runtime.trace("scope.loader.bravojs: "+i);
    	}
    	
    	with(scope)
    	{
    		
window.runtime.trace("START EVAL");
    		
    		eval(code);
    		
window.runtime.trace("DONE EVAL!");
    		
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
        return new window.runtime.flash.filesystem.File(filename).exists;
    }

    api.FILE.isFile = function(filename)
    {
        return !(new window.runtime.flash.filesystem.File(filename).isDirectory);
    }

    api.FILE.read = function(filename, encoding)
    {
    	var file = new window.runtime.flash.filesystem.File(filename);
    	var fileStream = new window.runtime.flash.filesystem.FileStream();
    	fileStream.open(file, window.runtime.flash.filesystem.FileMode.READ);
    	var data = fileStream.readUTFBytes(file.size);
    	fileStream.close();
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

