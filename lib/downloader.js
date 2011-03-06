// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api"),
    SYSTEM = API.SYSTEM,
    FILE = API.FILE,
    NET = API.NET,
    DEBUG = API.DEBUG;

var MAX_PARALLEL_DOWNLOADS = 2;

var Downloader = exports.Downloader = function(options)
{
    this.basePath = options.basePath;
}

Downloader.prototype.pathForURL = function(url, type)
{
    type = type || "source";

    var m = url.match(/^https?:\/(.*)$/);
    if (!m)
        throw new Error("Invalid archive URL for mapping: " + archive);

    var path = m[1];

    if (path.charAt(path.length-1) == "/")
        path = path.substring(0, path.length-1);

    if (type=="file")
    {
        return this.basePath + "/downloads" + path;
    }
    else
    if (type=="source")
    {
        return this.basePath + "/downloads" + path + "~sources";
    }
    else
    if (type=="archive")
    {
        return this.basePath + "/downloads" + path;
    }
    else
        throw new Error("NYI");
}

// TODO: Limit number of parallel downloads

Downloader.prototype.getForArchive = function(archive, callback)
{
    var self = this;
    var sourcePath = self.pathForURL(archive, "source");

    if (FILE.exists(sourcePath + "/package.json"))
    {
        callback(sourcePath);
        return;
    }

    var archivePath = self.pathForURL(archive, "archive");
    
    function cleanup()
    {
        if (FILE.exists(archivePath))
            SYSTEM.exec("rm -f " + archivePath);
        if (FILE.exists(sourcePath))
            SYSTEM.exec("rm -Rf " + sourcePath);
    }

    // This is run 2.
    function unzip()
    {
        // In case archive was queued multiple times for download
        if (FILE.exists(sourcePath + "/package.json"))
        {
            callback(sourcePath);
            return;
        }
        // First check if we have a TGZ archive    
        SYSTEM.exec("gunzip -t " + archivePath, function(stdout, stderr)
        {
            if (/gunzip: command not found/.test(stderr))
            {
                throw new Error("UNIX Command not found: gunzip");
            }
            else
            if (stderr)
            {
                // ZIP File
                SYSTEM.exec("unzip " + archivePath + " -d " + sourcePath, function(stdout, stderr)
                {
                    if (/unzip: command not found/.test(stderr))
                    {
                        cleanup();
                        throw new Error("UNIX Command not found: unzip");
                    }
                    else
                    if (stderr)
                    {
                        cleanup();
                        throw new Error("Error extracting file '" + archivePath + "': " + stderr);
                    }
                    // See if archive has a directory containing our package
                    if (!FILE.exists(sourcePath + "/package.json"))
                    {
                        SYSTEM.exec("mv " + sourcePath + "/*/* " + sourcePath + "/", function(stdout, stderr)
                        {
                            if (!FILE.exists(sourcePath + "/package.json"))
                            {
                                cleanup();
                                throw new Error("Cannot find package.json in extracted archive: " + sourcePath + "/package.json");
                            }
                            callback(sourcePath);
                        });
                    }
                    else
                        callback(sourcePath);
                });
            }
            else
            {
                // TGZ file
                API.FILE.mkdirs(sourcePath, 0775);
                SYSTEM.exec("tar -zxf  " + archivePath + " -C " + sourcePath, function(stdout, stderr)
                {
                    if (/tar: command not found/.test(stderr))
                    {
                        cleanup();
                        throw new Error("UNIX Command not found: tar");
                    }
                    else
                    if (stderr)
                    {
                        cleanup();
                        throw new Error("Error extracting file '" + archivePath + "': " + stderr);
                    }
                    // See if archive has a directory containing our package
                    if (!FILE.exists(sourcePath + "/package.json"))
                    {
                        SYSTEM.exec("mv " + sourcePath + "/*/* " + sourcePath + "/", function(stdout, stderr)
                        {
                            if (!FILE.exists(sourcePath + "/package.json"))
                            {
                                cleanup();
                                throw new Error("Cannot find package.json in extracted archive: " + sourcePath + "/package.json");
                            }
                            callback(sourcePath);
                        });
                    }
                    else
                        callback(sourcePath);
                });
            }
        });
    }

    // This is run 1.
    if (!FILE.exists(archivePath))
    {
        FILE.mkdirs(FILE.dirname(archivePath), 0775);

        DEBUG.print("Downloading: " + archive);
        
        enqueueDownload(archive, archivePath, unzip);
    }
    else
        unzip();
}

Downloader.prototype.getCatalogForURL = function(url, callback)
{
    var path = this.pathForURL(url, "file");

    if (FILE.exists(path))
    {
        callback(path);
        return;
    }

    FILE.mkdirs(FILE.dirname(path), 0775);

    DEBUG.print("Downloading: " + url);

    enqueueDownload(url, path, function()
    {
        callback(path);
    });
}

var downloadingCount = 0,
    downloadQueue = [];

function enqueueDownload(url, path, callback)
{
    if (downloadingCount >= MAX_PARALLEL_DOWNLOADS)
    {
        downloadQueue.push([url, path, callback]);
        return;
    }
    function download(url, path, callback)
    {
        downloadingCount++;

        NET.download(url, path, function()
        {
            downloadingCount--;

            callback(path);

            var info;
            // In case archive was queued multiple times for download
            while(true)
            {
                if (downloadQueue.length == 0)
                    return;
                info = downloadQueue.shift();
                if (FILE.exists(info[1]))
                {
                    info[2](path);
                }
                else
                    break;
            }
            download(info[0], info[1], info[2]);
        });
    }
    download(url, path, callback);
}
