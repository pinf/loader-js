// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see http://doc.wakanda.org/home.en.html

var API;

var SYSTEM = require("system");

exports.init = function(api)
{
    API = api;

    api.ENV.platform = "wakanda";
    
    var platformModules = {};

    api.ENV.platformRequire = function(id)
    {
    	throw new Error("ENV.platformRequire not implemented!");
    };

    api.ENV.verifyNativeModuleIdentifier = function(pkg, moduleIdentifier, args)
    {
    	throw new Error("ENV.verifyNativeModuleIdentifier not implemented!");
    }

    // @see http://doc.wakanda.org/Global-Application/Application/os.303-690737.en.html
    api.SYSTEM.os = application.os;

    // @see http://doc.wakanda.org/Global-Application/Application/getFolder.301-636665.en.html
    api.SYSTEM.pwd = application.getFolder().path;

    api.ENV.loaderRoot = api.SYSTEM.pwd;
    
    api.SYSTEM.env = {
        TERM: "",
        HOME: ""
    };

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.plainPrint(function(msg)
        {
        	SYSTEM.print(msg);
        });
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
        return File(filename).exists || Folder(filename).exists;
    }

    api.FILE.isFile = function( v)
    {
    	// TODO: Need `new File(filename).isFile`
        return File(filename).isFile();
//        throw new Error("NYI - FILE.isFile");
    }

    api.FILE.read = function(filename, encoding)
    {
    	// @see http://doc.wakanda.org/Global-Application/Application/loadText.301-655198.en.html
    	return application.loadText(filename);
    }

    api.FILE.mkdirs = function(filename)
    {
        // @see http://doc.wakanda.org/Files-and-Folders/Folder-Class/create.301-677914.en.html
        return Folder(filename).create();
    }
    
    api.FILE.write = function(filename, data, encoding)
    {
        // @see http://doc.wakanda.org/Global-Application/Application/saveText.301-664836.en.html#
        var charsets, charset;
        charsets = {
            "utf-8": 7
        };
        
        charset = charsets[encoding];
        if (charset === undefined) {
            throw new Error("NYI - FILE.write with charset different to utf-8");
        }
        application.saveText(data, filename, charset);
    }
    
    api.FILE.rename = function(from, to)
    {
        // @see http://doc.wakanda.org/Files-and-Folders/File-Class/setName.301-677039.en.html
        // File(from).setName(to);
        throw new Error("NYI - FILE.rename");
    }

    api.NET.download = function(url, path, callback)
    {
        throw new Error("NYI - NET.download");
    }

    api.JSON.parse = JSON.parse;
    api.JSON.stringify = JSON.stringify;
}

