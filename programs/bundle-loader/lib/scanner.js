
// NOTE: This code is not very generic and intended for bundeling the loader only.

var FS = require("fs");

var exclude = [
    "/.pinf-packages/",
    "/bravojs/demos/",
    "/bravojs/plugins/",
    "/bravojs/README",
    "/bravojs/NOTES"
];

exports.scan = function(path, options)
{
    var files = [];
    walk({
        exclude: exclude,
        platform: options.platform
    }, files, path);
    return files;
}

function walk(options, files, path, subpath)
{
    var subpath = subpath || "/";

    var dirList = FS.readdirSync(path + subpath);
    
    dirList.forEach(function(basename)
    {
        if (FS.statSync(path + subpath + basename).isDirectory())
        {
            if (options.exclude.indexOf(subpath + basename + "/")>=0)
                return;
            walk(options, files, path, subpath + basename + "/");
        }
        else
        {
            if (options.exclude.indexOf(subpath + basename)>=0)
                return;

            if (subpath == "/adapter/" && basename != options.platform + ".js")
                return;

            files[subpath + basename] = new File(path + subpath + basename, subpath + basename);
        }
    });
}


var File = function File(path, subpath)
{
    var self = this;
    self.path = path;
    self.subpath = subpath;
    self.code = FS.readFileSync(self.path, "utf-8");
    self.requires = {};
    self.dependencies = scrapeDeps(self.code).filter(function(dep)
    {
        if (!dep || dep.charAt(1) != ".")
            return false;
        return true;
    }).map(function(origDep) {
        var dep = origDep.substring(1, origDep.length-1);
        if (dep.substring(0, 2) == "./")
        {
            dep = dep.substring(2);
        }
        else
        {
            var pathParts = self.subpath.split("/"),
                depParts = dep.split("/");
            pathParts = pathParts.splice(1, pathParts.length-2);
            for (var i=0,ic=depParts.length-1 ; i<ic ; i++)
            {
                if (depParts[i]=="..")
                {
                    depParts.shift();
                    i--;
                    pathParts.pop();
                }
            }
            dep = ((pathParts.length>0)?pathParts.join("/")+"/":"") + depParts.join("/");
        }
        self.requires[dep] = "require(" + origDep + ")";
        return dep;
    });
}



/**
 * Scrape dependencies from a Modules/1.1 module. Mostly borrowed from FlyScript.
 *
 * @source http://code.google.com/p/bravojs/source/browse/bravo.js
 */
function scrapeDeps(txt)
{
    var dep = [],
        m,
        $requireRE = /\/\/.*|\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|[;=(,:!^]\s*\/(?:\\.|[^\/\\])+\/|(?:^|\W)\s*require\s*\(\s*("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')\s*\)/g;
    for ($requireRE.lastIndex = 0; m = $requireRE.exec(txt);)
        if (m[1]) dep.push(m[1]);
    return dep;
}
