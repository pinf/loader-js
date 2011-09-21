// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api"),
    SYSTEM = API.SYSTEM,
    FILE = API.FILE,
    NET = API.NET,
    DEBUG = API.DEBUG;

var MAX_PARALLEL_DOWNLOADS = 2,
    USE_CACHE = false;
//    ENABLED = true;

var directoriesVerified = false;

// TODO: This module should go into pinf/core

var Downloader = exports.Downloader = function(options)
{
    this.basePath = options.basePath;

    // NOTE: This has changed. We now only create the dirs if a download was actually requested.
    //		 We assume `this.basePath` does not start with `__PWD__` (as is the case if no `/pinf/pinf_packages` directory found and we are running on jetpack)
    // this is the case when used in jetpack or other embedded environment with no PWD
//    if (/^__PWD__/.test(this.basePath)) {
//        ENABLED = false;
//        return;
//    }
}

Downloader.prototype.pathForURL = function(url, type)
{
	if (!directoriesVerified)
	{
		directoriesVerified = true;
	    FILE.mkdirs(this.basePath + "/downloads/files", parseInt("0775"));
	    FILE.mkdirs(this.basePath + "/downloads/packages", parseInt("0775"));
	    FILE.mkdirs(this.basePath + "/downloads/archives", parseInt("0775"));
	    FILE.mkdirs(this.basePath + "/cache", parseInt("0775"));
	}
	
    type = type || "source";

    var m = url.match(/^https?:\/(.*?)(\?(.*))?$/);
    if (!m)
        throw new Error("Invalid archive URL for mapping: " + archive);

    var path = m[1];

    if (m[3]) {
    	path += "." + encodeURIComponent("?" + m[3]);
    }

    if (path.charAt(path.length-1) == "/")
        path = path.substring(0, path.length-1);

    if (type=="file")
    {
        return this.basePath + "/downloads/files" + path;
    }
    else
    if (type=="source")
    {
        return this.basePath + "/downloads/packages" + path + "~pkg";
    }
    else
    if (type=="install")
    {
        return this.basePath + "/downloads/packages" + path + "~install";
    }
    else
    if (type=="archive")
    {
        return this.basePath + "/downloads/archives" + path;
    }
    else
    if (type=="cache")
    {
        return this.basePath + "/cache" + path;
    }
    else
        throw new Error("NYI");
}

var unzipping = false,
    unzipQueue = [];

Downloader.prototype.getForArchive = function(archive, callback, options)
{
//    if (!ENABLED)
//        throw new Error("Downloader is not enabled!");
    
    options = options || {};
    var self = this;
    var sourcePath = self.pathForURL(archive, "source");
    
    var packageTestFilepath = "/package.json";
    if (options.verifyPackageDescriptor!==true)
        packageTestFilepath = "";

    if (FILE.exists(sourcePath + packageTestFilepath))
    {
        callback(sourcePath);
        return;
    }

    function throwError(msg)
    {
        if (typeof options.onError === "function") {
            options.onError(msg);
        } else {
            throw new Error(msg);
        }
    }
    
    function cleanup()
    {
        if (FILE.exists(archivePath))
            SYSTEM.exec("rm -f " + archivePath);
        if (FILE.exists(sourcePath))
            SYSTEM.exec("rm -Rf " + sourcePath);
    }

    function serialUnzip(archive, callback, options)
    {
        if (unzipping)
        {
            unzipQueue.push([archive, callback, options]);
            return;
        }
        var self = this;
        function unzip(archive, callback, options)
        {
            unzipping = true;
    
            doUnzip(archive, function(sourcePath)
            {
                callback(sourcePath);
    
                var info;
                if (unzipQueue.length == 0)
                {
                    unzipping = false;
                    return;
                }
                info = unzipQueue.shift();
                unzip(info[0], info[1], info[2]);
            },
            options);
        }
        unzip(archive, callback, options);
    }

    function doUnzip(archive, callback, options)
    {
        var sourcePath = self.pathForURL(archive, "source");
        var archivePath = self.pathForURL(archive, "archive");

        var packageTestFilepath = "/package.json";
        if (options.verifyPackageDescriptor!==true)
            packageTestFilepath = "";

        // In case archive was queued multiple times for download
        if (FILE.exists(sourcePath + packageTestFilepath))
        {
            callback(sourcePath);
            return undefined;
        }

        if (typeof options.extract === "function")
        {
        	try {
	        	options.extract(archivePath, sourcePath, function()
	        	{
	        		callback(sourcePath);
	        	});
        	} catch(e) {
                cleanup();
                return throwError("Error calling custom extract while extracting file '" + archivePath + "': " + e);
        	}
        }
        else
        {
	        // First check if we have a TGZ archive    
	        SYSTEM.exec("gunzip -t " + archivePath, function(stdout, stderr)
	        {
	            if (/gunzip: command not found/.test(stderr))
	            {
	                throwError("UNIX Command not found: gunzip");
	                return;
	            }
	            else
	            if (stderr)
	            {
	                FILE.mkdirs(sourcePath, parseInt("0775"));
	                // ZIP File
	                SYSTEM.exec("unzip -qq -o " + archivePath + " -d " + sourcePath, function(stdout, stderr)
	                {
	                    if (/unzip: command not found/.test(stderr))
	                    {
	                        cleanup();
	                        throwError("UNIX Command not found: unzip");
	                        return;
	                    }
	                    else
	                    if (stderr)
	                    {
	                        cleanup();
	                        throwError("Error extracting file '" + archivePath + "': " + stderr);
	                        return;
	                    }
	                    else
	                    if (!FILE.exists(sourcePath))
	                    {
	                        cleanup();
	                        throwError("Error extracting file '" + archivePath) + "' to '" + sourcePath + "'.";
	                        return;
	                    }
	
	                    // See if archive has a directory containing our package
	                    var list = FILE.readdir(sourcePath);
	                    if (list.length == 1)
	                    {
	                        SYSTEM.exec("mv " + sourcePath + "/*/* " + sourcePath + "/", function(stdout, stderr)
	                        {
	                            if (!FILE.exists(sourcePath + packageTestFilepath))
	                            {
	                                cleanup();
	                                throwError("Cannot find " + packageTestFilepath + " in extracted archive: " + sourcePath + packageTestFilepath);
	                                return;
	                            }
	
	                            SYSTEM.exec("mv " + sourcePath + "/*/.* " + sourcePath + "/", function(stdout, stderr)
	                            {
	                                callback(sourcePath);
	                            });
	                        });
	                    }
	                    else
	                    {
	                        callback(sourcePath);
	                    }
	                });
	            }
	            else
	            {
	                // TGZ file
	                FILE.mkdirs(sourcePath, parseInt("0775"));
	                SYSTEM.exec("tar -zxf  " + archivePath + " -C " + sourcePath, function(stdout, stderr)
	                {
	                    if (/tar: command not found/.test(stderr))
	                    {
	                        cleanup();
	                        throwError("UNIX Command not found: tar");
	                        return;
	                    }
	                    else
	                    if (stderr)
	                    {
	                        cleanup();
	                        throwError("Error extracting file '" + archivePath + "': " + stderr);
	                        return;
	                    }
	                    else
	                    if (!FILE.exists(sourcePath))
	                    {
	                        cleanup();
	                        throwError("Error extracting file '" + archivePath) + "' to '" + sourcePath + "'.";
	                        return;
	                    }
	
	                    // See if archive has a directory containing our package
	                    var list = FILE.readdir(sourcePath);
	                    if (list.length == 1)
	                    {
	                        SYSTEM.exec("mv " + sourcePath + "/*/* " + sourcePath + "/", function(stdout, stderr)
	                        {
	                            if (!FILE.exists(sourcePath + packageTestFilepath))
	                            {
	                                cleanup();
	                                throwError("Cannot find " + packageTestFilepath + " in extracted archive: " + sourcePath + packageTestFilepath);
	                                return;
	                            }
	
	                            SYSTEM.exec("mv " + sourcePath + "/*/.* " + sourcePath + "/", function(stdout, stderr)
	                            {
	                                callback(sourcePath);
	                            });
	                        });
	                    }
	                    else
	                    {
	                        callback(sourcePath);
	                    }
	                });
	            }
	        });
        }
        return undefined;
    }

    var archivePath = self.pathForURL(archive, "archive");

    if (!FILE.exists(archivePath))
    {
        FILE.mkdirs(FILE.dirname(archivePath), parseInt("0775"));

        DEBUG.print("Downloading: " + archive);
        
        this.enqueueDownload(archive, archivePath, function()
        {
            serialUnzip(archive, callback, options);
        });
    }
    else
        serialUnzip(archive, callback, options);
}

Downloader.prototype.getCatalogForURL = function(url, callback)
{
    return this.getFileForURL(url, callback);
}

Downloader.prototype.getFileForURL = function(url, callback)
{
//    if (!ENABLED)
//        throw new Error("Downloader is not enabled!");

    var path = this.pathForURL(url, "file");

    if (FILE.exists(path))
    {
        callback(path);
        return;
    }

    FILE.mkdirs(FILE.dirname(path), parseInt("0775"));

    DEBUG.print("Downloading: " + url);

    this.enqueueDownload(url, path, function()
    {
        callback(path);
    });
}

var downloadingCount = 0,
    downloadQueue = [],
    currentlyDownloading = [];

Downloader.prototype.enqueueDownload = function(url, path, callback)
{
    if (downloadingCount >= MAX_PARALLEL_DOWNLOADS || currentlyDownloading[url + "::" + path] === true)
    {
        downloadQueue.push([url, path, callback]);
        return;
    }
    var self = this;
    function download(url, path, callback)
    {
        downloadingCount++;

        self.doDownload(url, path, function()
        {
            downloadingCount--;

            callback(path);

            var info = false;
            // In case archive was queued multiple times for download
            while(true)
            {
                if (downloadQueue.length == 0)
                    return;
                info = downloadQueue.shift();
                if (FILE.exists(info[1]))
                {
                    info[2](path);
                    info = false;
                }
                else
                    break;
            }
            if(!info)
                return;
            download(info[0], info[1], info[2]);
        });
    }
    download(url, path, callback);
}

Downloader.prototype.doDownload = function(url, path, callback)
{
	currentlyDownloading[url + "::" + path] = true;
    var cachePath = this.pathForURL(url, "cache");
    if (USE_CACHE)
    {
        if (FILE.exists(cachePath))
        {
            API.FILE.mkdirs(API.FILE.dirname(path), parseInt("0775"));
            SYSTEM.exec("cp " + cachePath + " " + path, function(stdout, stderr)
            {
                delete currentlyDownloading[url + "::" + path];
                callback();
            });
            return;
        }
    }

	function finalizeDoDownload()
	{
        if (USE_CACHE)
        {
            API.FILE.mkdirs(API.FILE.dirname(cachePath), parseInt("0775"));
            SYSTEM.exec("cp " + path + " " + cachePath, function(stdout, stderr)
            {
                delete currentlyDownloading[url + "::" + path];
                callback();
            });
            return;
        }
        delete currentlyDownloading[url + "::" + path];
        callback();
	}

    NET.download(url, path + ".tmp", function(response)
    {
		if (response.status != 200)
		{
			// TODO: This should be more generic
			var m;
			if (response.status == 404 && (m = url.match(/^https?:\/\/github.com\/([^\/]*)\/([^\/]*)\/zipball\/(.*)$/)))
			{
				var repoPath = FILE.dirname(path) + "/__repo__";
				
				function exportFromGit()
				{
			        SYSTEM.exec("cd " + repoPath + " ; git archive --format zip --output " + path + ".tmp" + " --prefix repo/ " + m[3], function(stdout, stderr)
			        {
						if (stderr)
						{
							console.error(stderr);
							throw new Error("Error exporting from '" + path + ".repo" + "'.");
						}
				        FILE.rename(path + ".tmp", path);
						finalizeDoDownload();
					});
				}

				if (FILE.exists(repoPath))
				{
			        SYSTEM.exec("cd " + repoPath + " ; git pull origin", function(stdout, stderr)
			        {
						// TODO: Ensure update was successful
						exportFromGit();
			        });
				}
				else
				{
			        SYSTEM.exec("git clone " + "git@github.com:" + m[1] + "/" + m[2] + ".git " + repoPath, function(stdout, stderr)
			        {
						if (stderr)
						{
							console.error(stderr);
							throw new Error("Error cloning '" + "git@github.com:" + m[1] + "/" + m[2] + ".git" + "'.");
						}
						exportFromGit();
			        });
				}
				return;
			}
			throw new Error("Error downloading from URL '" + url + "'. Status: " + response.status);
		}
        FILE.rename(path + ".tmp", path);
		finalizeDoDownload();
    });
}
