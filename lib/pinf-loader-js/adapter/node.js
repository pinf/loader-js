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

    var FS = api.ENV.platformRequire("fs"),
        URL = api.ENV.platformRequire("url"),
        HTTP = api.ENV.platformRequire("http"),
        HTTPS = api.ENV.platformRequire("https"),
        PATH = api.ENV.platformRequire("path"),
        UTIL = api.ENV.platformRequire("util"),
        EXEC = api.ENV.platformRequire('child_process').exec,
        SPAWN = api.ENV.platformRequire('child_process').spawn,
        FORK = api.ENV.platformRequire('child_process').fork,
        VM = api.ENV.platformRequire("vm"),
        BUFFER = require('buffer').Buffer,
        DGRAM = require('dgram');
        
    //  process = provided by nodejs as a global 
    //  JSON = provided by nodejs as a global
    //  setTimeout = provided by nodejs as a global

    if (process.version.match(/^v?(\d*\.\d*)/)[1] < 0.6)
    {
    	throw new Error("NodeJS version 0.6+ is required as of PINF Loader 0.3+!");
    }
    
    // TEMPORARY: http://stackoverflow.com/questions/5919629/express-module-not-found-when-installed-with-npm
    if (/^v?0\.4/.test(process.version)) {
    	api.ENV.platformRequire.paths.push('/usr/local/lib/node_modules');
    }
        
    
    api.ENV.loaderRoot = PATH.dirname(PATH.dirname(PATH.dirname(PATH.dirname(__filename))));

    api.ENV.packageProviders["nodejs.org/"] = {
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

    api.SYSTEM.on("exit", function()
    {
        if (!api.ENV.cliOptions || !api.ENV.cliOptions.pidfile)
        	return;
    	var socket = DGRAM.createSocket("udp4");
    	var buffer = new BUFFER("PINF:" + JSON.stringify({
    		// TODO: Add schema info
    		"event": "exiting",
    		"pidfile": api.ENV.cliOptions.pidfile
    	}));
    	// TODO: Make port configurable
    	socket.send(buffer, 0, buffer.length, 8199, "127.0.0.1");
    	socket.close();
    });

    // 0 - success
    // 1 - failure
    api.SYSTEM.exit = function(code)
    {
    	code = code || 0;
    	process.exit(code);
    }

	api.SYSTEM.daemonize = function()
	{
/*		
		var logPath = "/dev/null";
		if (api.ENV.cliOptions["stdoutLogPath"])
			logPath = api.ENV.cliOptions["stdoutLogPath"];
*/

		
		FORK(process.argv[1], process.argv.slice(2).filter(function(item)
		{
			if (item === "--daemonize") return false;
			return true;
		}), {
			env: process.env,
			cwd: process.cwd()
		});
		process.exit(0);
	
/*		
		// NOTE: stdout and stderr go to logPath
		// TODO: Log stdout separately to `api.ENV.cliOptions["stderrLogPath"]`
		//		 @see https://github.com/indexzero/daemon.node/issues/4
		api.ENV.platformRequire("daemon").daemonize(logPath, pidFile, function (err, pid) {
			// We are now in the daemon process
			if (err) return console.error("Error starting daemon: " + err);
			
			api.SYSTEM.pid = pid;

			callback();
		});
*/		
	}
	
	api.SYSTEM.setupLogger = function()
	{
	    if (api.ENV.cliOptions.logPath)
	    {
	    	if (!api.FILE.exists(api.FILE.dirname(api.ENV.cliOptions.logPath)))
	    		api.FILE.mkdirs(api.FILE.dirname(api.ENV.cliOptions.logPath))

	   		var logStream = FS.createWriteStream(api.ENV.cliOptions.logPath, {
	            "flags": "a",
	            "encoding": "utf-8",
	            "mode": 0775
	        });
	        process.__defineGetter__("stdout", function()
	        {
	        	return logStream;
	    	});
	        process.__defineGetter__("stderr", function()
	        {
	        	return logStream;
	    	});
	    	api.SYSTEM.on("exit", function()
	    	{
	    		logStream.destroySoon();
	    	});
	    }
	    else
	    {
		    if (api.ENV.cliOptions.stdoutLogPath)
		    {
		    	if (!api.FILE.exists(api.FILE.dirname(api.ENV.cliOptions.stdoutLogPath)))
		    		api.FILE.mkdirs(api.FILE.dirname(api.ENV.cliOptions.stdoutLogPath))
	
		   		var stdoutStream = FS.createWriteStream(api.ENV.cliOptions.stdoutLogPath, {
		            "flags": "a",
		            "encoding": "utf-8",
		            "mode": 0775
		        });
		        process.__defineGetter__("stdout", function()
		        {
		        	return stdoutStream;
		    	});
		    	api.SYSTEM.on("exit", function()
		    	{
		        	stdoutStream.destroySoon();
		    	});
		    }
		    if (api.ENV.cliOptions.stderrLogPath)
		    {
		    	if (!api.FILE.exists(api.FILE.dirname(api.ENV.cliOptions.stderrLogPath)))
		    		api.FILE.mkdirs(api.FILE.dirname(api.ENV.cliOptions.stderrLogPath))
	
		   		var stderrStream = FS.createWriteStream(api.ENV.cliOptions.stderrLogPath, {
		            "flags": "a",
		            "encoding": "utf-8",
		            "mode": 0775
		        });
		        process.__defineGetter__("stderr", function()
		        {
		        	return stderrStream;
		    	});
		    	api.SYSTEM.on("exit", function()
		    	{
		    		stderrStream.destroySoon();
		    	});
		    }
	    }
	}
    
	api.SYSTEM.pid = ""+process.pid;
    api.SYSTEM.pwd = process.cwd();
    api.SYSTEM.env = {
        TERM: process.env.TERM,
        HOME: process.env.HOME
    };
    
    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.colorizedPrint(function(msg)
        {
        	process.stdout.write(msg);        	
        });
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

    api.SYSTEM.exec = function(command, options, callback)
    {
    	if (typeof options === "function")
    	{
    		callback = options;
    		options = {};
    	}

    	EXEC(command, options, function (error, stdout, stderr) {
            if (typeof callback !== "undefined")
                callback(stdout, stderr, error);
        });
    }

    api.UTIL.inspect = UTIL.inspect;
    api.UTIL.debug = UTIL.debug;

    api.UTIL.setTimeout = setTimeout;

    var watchingFiles = {};
    
    api.UTIL.eval = function(code, scope, file, line)
    {
        var sandbox = {
            setTimeout: setTimeout,
            setInterval: setInterval,
            clearTimeout: clearTimeout,
            clearInterval: clearInterval,
            process: process,
            Buffer: Buffer
        };
        for (var key in scope)
            sandbox[key] = scope[key];
        try {
        	// @see https://github.com/joyent/node/issues/1307
            VM.runInNewContext(code, sandbox, file, true);
        } catch(e) {
            if (api.ENV.console) {
                api.ENV.console.error("Error '" + e + "' in '" + file + "': " + e.stack);
            }
            throw e;
        }
        
        if (api.ENV.cliOptions.exitOnChange && !watchingFiles[file])
        {
        	watchingFiles[file] = true;
        	// NOTE: We do not need to unwatch files as the process will exit when a change is detected
        	FS.watchFile(file, function (curr, prev)
        	{
        		if (curr.mtime.getTime() != prev.mtime.getTime())
        		{
        			// TODO: Log to log file
        			console.log("Exit! File changed (" + curr.mtime.getTime() + " != " + prev.mtime.getTime() + "): " + file);        			
        			api.SYSTEM.exit();
        		}
    		});
        }
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
    api.FILE.symlink = function(filename, target)
    {
    	FS.symlinkSync(filename, target);
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

    api.NET.download = function(url, path, callback, options)
    {
    	try {
	    	options = options || {};
	    	
	    	var timeoutID = null;
	
	        var urlInfo = URL.parse(url);
	        var port = ((urlInfo.port)?urlInfo.port:((urlInfo.protocol==="https:")?443:80));
	        var didRespond = false;
	
	        function handleResponse(response)
	        {
				try {
		        	if (timeoutID) {
		        		clearTimeout(timeoutID);
		        		timeoutID = null;
		        	}
		        	didRespond = true;
		            if (response.statusCode == 301 || response.statusCode == 302 || response.statusCode == 307)
		            {
		            	if (typeof options.onRedirect === "function")
		            	{
		            		options.onRedirect(response.headers['location'], url, path);
		            		callback(null);
		            	}
		            	else
		            	{
		            		api.NET.download(response.headers['location'], path, callback, options);
		            	}
		            }
		            else
		            if (response.statusCode == 200)
		            {
		                var file = FS.createWriteStream(path);
		                file.addListener("close", function()
		                {
		                	try {
			                    if (response.headers['content-length'] &&
			                    	// NOTE: This may throw if two downloads happened in parallel and the downloaded tmp file is renamed.
			                        response.headers['content-length'] != FS.statSync(path).size)
			                    {
			                        throw new Error("Saved file '" + path + "' does not have correct length based on response header: " + response.headers['content-length']);
			                    }
			                
			                    // TODO: Verify filesize based on content-length header
		                	} catch(e) {
		        	            callback({
		        				    "status": "verify-failed"
		        				});
		        	            return;
		                	}

		                	callback({
								status: response.statusCode
							});
		                });
		                response.addListener("data", function (chunk)
		                {
		                    file.write(chunk, "binary");
		                });
		                response.addListener("end", function()
		                {
		                    file.end();
		                });
		            } else {
						callback({
							status: response.statusCode
						});
					}
				} catch(e) {
					console.error("Error handeling response", e.stack);
				}
	        };
	
	        var opts = {
	            method: "GET",
	            host: urlInfo.hostname,
	            port: port,
	            path: urlInfo.pathname,
	            headers: {
	            	"User-Agent": "github.com/pinf/loader-js",
	            	"Accept": "*/*"
	            }
	        };
	        if (urlInfo.search) {
	        	opts.path += urlInfo.search;
	        }
	
	        var request;
	        if (port === 443) {
	            request = HTTPS.request(opts, function(response)
	            {
	            	handleResponse(response);
	            });
	        } else {
	            request = HTTP.request(opts, function(response)
	            {
	            	handleResponse(response);
	            });
	        }
	        
	        timeoutID = setTimeout(function()
	        {
	        	timeoutID = null;
	            if (didRespond) return;
	            request.abort();
	            console.log("Timeout for " + url);
	            callback({
					// TODO: Use an actual status code here?
				    "status": "timeout"
				});
	        }, 5000);
	
	        request.on("error", function (error)
	        {
	        	if (timeoutID) {
	        		clearTimeout(timeoutID);
	        		timeoutID = null;
	        	}
	        	console.log("Error", error);
	            callback({
					// TODO: Use an actual status code here?
				    "status": "error"
				});
	        });
	        
	        request.end();
    	} catch(e) {
    		console.log("Error '" + e + "' making request", e.stack);
    	}
    }

    api.JSON.parse = JSON.parse;
    api.JSON.stringify = JSON.stringify;
}
