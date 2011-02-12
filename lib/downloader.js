// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api"),
    SYSTEM = API.SYSTEM,
    FILE = API.FILE,
    NET = API.NET,
    DEBUG = API.DEBUG;

var Downloader = exports.Downloader = function(options)
{
    this.basePath = options.basePath;
}

Downloader.prototype.pathForArchive = function(archive, type)
{
    type = type || "source";

    var m = archive.match(/^https?:\/(.*)$/);
    if (!m)
        throw new Error("Invalid archive URL for mapping: " + archive);
    
    if (type=="source")
    {
        return this.basePath + "/downloads" + m[1] + "~sources";
    }
    else
    if (type=="archive")
    {
        return this.basePath + "/downloads" + m[1];
    }
}

Downloader.prototype.getForArchive = function(archive, callback)
{
    var self = this;
    var sourcePath = this.pathForArchive(archive, "source");

    if (FILE.exists(sourcePath))
    {
        callback(sourcePath);
        return;
    }

    var archivePath = this.pathForArchive(archive, "archive");

    // This is run 2.
    function unzip()
    {
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
                        throw new Error("UNIX Command not found: unzip");
                    }
                    else
                    if (stderr)
                    {
                        throw new Error("Error extracting file '" + archivePath + "': " + stderr);
                    }
                    // See if archive has a directory containing our package
                    if (!FILE.exists(sourcePath + "/package.json"))
                    {
                        SYSTEM.exec("mv " + sourcePath + "/*/* " + sourcePath + "/", function(stdout, stderr)
                        {
                            if (!FILE.exists(sourcePath + "/package.json"))
                                throw new Error("Cannot find package.json in extracted archive: " + sourcePath + "/package.json");
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
                        throw new Error("UNIX Command not found: tar");
                    }
                    else
                    if (stderr)
                    {
                        throw new Error("Error extracting file '" + archivePath + "': " + stderr);
                    }
                    // See if archive has a directory containing our package
                    if (!FILE.exists(sourcePath + "/package.json"))
                    {
                        SYSTEM.exec("mv " + sourcePath + "/*/* " + sourcePath + "/", function(stdout, stderr)
                        {
                            if (!FILE.exists(sourcePath + "/package.json"))
                                throw new Error("Cannot find package.json in extracted archive: " + sourcePath + "/package.json");
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
        
        NET.download(archive, archivePath, unzip);
    }
    else
        unzip();
}
