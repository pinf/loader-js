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
        	window.runtime.trace((""+msg).replace(/\n$/, ""));
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
    
    
    api.SYSTEM.loadModule = function(path)
    {
		var rootPath = window.runtime.flash.filesystem.File.applicationDirectory.nativePath;

		if (path.substring(0, rootPath.length) !== rootPath)
			throw new Error("Cannot load file '" + path + "' because it is not within: " + rootPath);

		path = path.substring(rootPath.length);

		
		var script = document.createElement('SCRIPT');
		script.setAttribute("type","text/javascript");
		script.setAttribute("src", path);
		
		script.onload = function air_script_onload()
		{
			// do nothing.
		}

		script.onerror = function air_script_error()
		{
			window.runtime.trace("Error loading script URL: " + script.src);
		}
		
		document.getElementsByTagName("HEAD")[0].appendChild(script);
    }
    
    
    var sandbox;
    
    api.UTIL.setTimeout = setTimeout;

    api.UTIL.eval = function(code, scope, file, line)
    {
    	// We do not eval code for AdobeAir but use `SYSTEM.loadModule` instead.
    	// This is important as evaled code in AdobeAir has security restrictions.
    	// The `SYSTEM.loadModule` method loads modules via script tags to get around
    	// these restrictions.
    	throw new Error("UTIL.eval not supported!");
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

