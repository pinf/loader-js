// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var ProgramDescriptor = exports.ProgramDescriptor = function ProgramDescriptor(json, path)
{
    this.json = json;
    this.path = path;
}

ProgramDescriptor.prototype.normalizeTo = function(context)
{
    if (!this.json)
        throw new Error("No program descriptor in: " + this.path);
        
    if (typeof this.json.main === "undefined")
        throw new Error("Program descriptor does not define 'main' property. (path: " + this.path + ")");

    this.main = this.json.main;

    if (typeof this.main == "string")
        this.main = [this.main];

    if (typeof this.json.packages != "object")
        throw new Error("Program descriptor does not define 'packages' property. (path: " + this.path + ")");

    this.packages = this.json.packages;

    for (var packageId in this.packages)
    {
        if (packageId.charAt(0)=="/")
            throw new Error("Package ID '" + packageId + "' key in 'packages' property may not begin with '/'. (path: " + this.path + ")");

        if (typeof this.packages[packageId] != "object")
            throw new Error("Package with ID '" + packageId + "' in 'packages' property does not define a 'locator' property. (path: " + this.path + ")");

        if (typeof this.packages[packageId].locator.location != "undefined")
        {
            if (this.packages[packageId].locator.location.charAt(0) == ".")
            {
                if (!context.pwd)
                    throw new Error("Cannot normalize location path as context does not provide 'pwd'");
                this.packages[packageId].locator.location = realpath(context.pwd + "/" + this.packages[packageId].locator.location) + "/";
            }
        }
    }
}

ProgramDescriptor.prototype.getBootDependencies = function()
{
    if (!this.packages)
        throw new Error("Program descriptor has not beeen normalized to a context yet");

    var dependencies = [];

    for (var i=0, ic=this.main.length ; i<ic ; i++)
    {
        var dep = {};
        dep["_package-" + i] = this.packages[this.main[i]].locator;
        dependencies.push(dep);
    }

    return dependencies;
}


/**
 * Canonicalize path, compacting slashes and dots per basic UNIX rules.
 * 
 * @credit http://code.google.com/p/bravojs/source/browse/bravo.js
 */
function realpath(path)
{
    if (typeof path !== "string") path = path.toString();

    var oldPath = path.split('/');
    var newPath = [];
    var i;

    for (i = 0; i < oldPath.length; i++)
    {
        if (oldPath[i] == '.' || !oldPath[i].length)
            continue;
        if (oldPath[i] == '..')
        {
            if (!newPath.length)
                throw new Error("Invalid module path: " + path);
            newPath.pop();
            continue;
        }
        newPath.push(oldPath[i]);
    }

    newPath.unshift('');
    return newPath.join('/');
}