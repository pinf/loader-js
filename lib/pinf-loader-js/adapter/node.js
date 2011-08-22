// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see http://nodejs.org/api.html

exports.init = function(api)
{
    api.ENV.platform = "node";
    
    if (typeof api.ENV.platformRequire == "undefined")
    {
        api.ENV.platformRequire = require;
    }

    var SYS = api.ENV.platformRequire('sys'),
        FS = api.ENV.platformRequire("fs"),
        URL = api.ENV.platformRequire("url"),
        HTTP = api.ENV.platformRequire("http"),
        HTTPS = api.ENV.platformRequire("https"),
        PATH = api.ENV.platformRequire("path"),
        EXEC = api.ENV.platformRequire('child_process').exec,
        SPAWN = api.ENV.platformRequire('child_process').spawn,
        VM = api.ENV.platformRequire("vm");
    //  process = provided by nodejs as a global 
    //  JSON = provided by nodejs as a global
    //  setTimeout = provided by nodejs as a global


    
    // TEMPORARY: http://stackoverflow.com/questions/5919629/express-module-not-found-when-installed-with-npm
    if (/^v?0\.4/.test(process.version)) {
    	api.ENV.platformRequire.paths.push('/usr/local/lib/node_modules');
    }
    
    
    
    api.ENV.loaderRoot = PATH.dirname(PATH.dirname(PATH.dirname(PATH.dirname(__filename))));

    api.ENV.packageProviders["nodejs.org"] = {
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

    api.SYSTEM.on = function(name, callback)
    {
    	if (name === "exit")
    	{
    		process.on(name, function()
    		{
    			callback();
    		});
    	}
    }    

	api.SYSTEM.daemonize = function(pidFile, callback)
	{
		api.ENV.platformRequire("daemon").daemonize('/dev/null', pidFile, function (err, pid) {
			// We are now in the daemon process
			if (err) return console.error("Error starting daemon: " + err);
			
			api.SYSTEM.pid = pid;
			
			callback();
		});
	}
    
	api.SYSTEM.pid = ""+process.pid;
    api.SYSTEM.pwd = process.cwd();
    api.SYSTEM.env = {
        TERM: process.env.TERM,
        HOME: process.env.HOME
    };
    
    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.colorizedPrint(SYS.print);
    }
    
    api.SYSTEM.parseArgs(process.argv);
    
    api.SYSTEM.spawn = function(command, args)
    {
        var childProcess = SPAWN(command, args, {
            cwd: api.SYSTEM.pwd,
            env: process.env,
            customFds: [-1, -1, -1],
            setsid: false
        });
        // TODO: Direct stdout and stderr to equivalents here instead of pint()
        // TODO: Fix console coloring for relayed output
        childProcess.stdout.on('data', function (data) {
            api.SYSTEM.print("" + data);
        });
        childProcess.stderr.on('data', function (data) {
            api.SYSTEM.print("" + data);
        });
        childProcess.on('exit', function (code) {
        });
    }

    api.SYSTEM.exec = function(command, callback)
    {
        EXEC(command, function (error, stdout, stderr) {
            if (typeof callback != "undefined")
                callback(stdout, stderr, error);
        });
    }

    api.UTIL.setTimeout = setTimeout;

    api.UTIL.eval = function(code, scope, file, line)
    {
        var sandbox = {
            setTimeout: setTimeout,
            setInterval: setInterval,
            clearTimeout: clearTimeout,
            process: process,
            Buffer: Buffer
        };
        for (var key in scope)
            sandbox[key] = scope[key];
//        try {
            VM.runInNewContext(code, sandbox, file);
//        } catch(e) {
//            if (api.ENV.console) {
//                api.ENV.console.error("Error '" + e + "' in '" + file + "': " + e.stack);
//            }
//            throw e;
//        }
    };

    api.FILE.exists = function(filename)
    {
        // Oh boy. nodejs throws if file does not exist
        try {
            FS.statSync(filename);
            return true;
        } catch(e) {
            return false;
        }
    }
    api.FILE.isFile = function(filename)
    {
        // Oh boy. nodejs throws if file does not exist
        try {
            return FS.statSync(filename).isFile();
        } catch(e) {
            return false;
        }
    }
    api.FILE.mkdirs = function(filename, mode)
    {
        if (filename.charAt(filename.length-1) == "/")
            filename = filename.substring(0, filename.length-1);
        
        // Oh boy. This is inefficient but should work for now.
        filename = filename.split("/");
        var parts = [];
        
        while (!api.FILE.exists(filename.join("/")))
        {
            parts.push(filename.pop());
        }
        
        if (parts.length==0)
            return;
        
        while (parts.length > 0)
        {
            filename.push(parts.pop());
            FS.mkdirSync(filename.join("/"), mode);
        }
    }
    api.FILE.read = function(filename, encoding)
    {
        encoding = encoding || "utf-8";
        return FS.readFileSync(filename, encoding);
    }
    api.FILE.write = function(filename, data, encoding)
    {
        encoding = encoding || "utf-8";
        return FS.writeFileSync(filename, data, encoding);
    }
    api.FILE.remove = function(filename)
    {
        return FS.unlinkSync(filename);
    }
    api.FILE.asyncAppend = function(filename, data)
    {
        var stream = FS.createWriteStream(filename, {
            "flags": "a",
            "encoding": "utf-8",
            "mode": 0775
        });
        stream.write(data, "utf-8");
        stream.destroySoon();
    }
    api.FILE.readdir = function(filename)
    {
        return FS.readdirSync(filename);
    }
    api.FILE.rename = function(from, to)
    {
        return FS.renameSync(from, to);
    }

    api.NET.download = function(url, path, callback)
    {
        var urlInfo = URL.parse(url);
        var port = ((urlInfo.port)?urlInfo.port:((urlInfo.protocol=="https:")?443:80));
        var didRespond = false;

        function handleResponse(response)
        {
            didRespond = true;
            if (response.statusCode == 301 || response.statusCode == 302 || response.statusCode == 307)
            {
                api.NET.download(response.headers['location'], path, callback);
            }
            else
            {
                var file = FS.createWriteStream(path);
                file.addListener("close", function()
                {
                    if (response.headers['content-length'] &&
                        response.headers['content-length'] != FS.statSync(path).size)
                    {
                        throw new Error("Saved file '" + path + "' does not have correct length based on response header: " + response.headers['content-length']);
                    }
                    // TODO: Verify filesize based on content-length header
                    callback();
                });
                response.addListener("data", function (chunk)
                {
                    file.write(chunk, "binary");
                });
                response.addListener("end", function()
                {
                    file.end();
                });
            }
        }

        var options = {
            method: "GET",
            host: urlInfo.hostname,
            port: port,
            path: urlInfo.pathname
        };
        if (urlInfo.search) {
        	options.path += urlInfo.search;
        }
        
        var request;
        if (port == 443)
            request = HTTPS.request(options, handleResponse);
        else
            request = HTTP.request(options, handleResponse);

        request.end();

        setTimeout(function()
        {
            if (didRespond) return;
            request.abort();
            console.log("Timeout for " + url);
            callback();
        }, 20000);

        request.on('error', function (error)
        {
            console.log("Error", error);
            callback();
        });
    }

    api.JSON.parse = JSON.parse;
    api.JSON.stringify = JSON.stringify;
}
