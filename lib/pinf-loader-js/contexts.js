// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("./api");


function normalizeId(sandbox, id)
{
    var parts = id.split("@");

    if (parts.length == 1 && id.charAt(0) != "/")
    {
        var pkg = sandbox.packageForId(parts[0]),
            mainId = pkg.getMainId(null, true);
        if (mainId)
            mainId = mainId.split("@")[1];
        else
            mainId = "/";
        if (/\.js$/.test(mainId))
            mainId = mainId.substring(0, mainId.length-3);
        return {
            id: id,
            pkg: parts[0],
            module: mainId,
            hashId: pkg.getHashId(),
            main: true,
            inst: pkg
        };
    }
    else
    if (parts.length == 2)
    {
        var pkg = sandbox.packageForId(parts[0]);
        return {
            id: id,
            pkg: parts[0],
            module: parts[1],
            hashId: pkg.getHashId(),
            inst: pkg
        };
    }
    else
    {
        return {
            module: id
        };
    }
}

function walkTop(descriptor, callback)
{
    if (typeof descriptor.json.contexts == "undefined" || typeof descriptor.json.contexts.top == "undefined")
        return;
    for (var id in descriptor.json.contexts.top)
        callback(id, descriptor.json.contexts.top[id]);
}


var ProgramContext = exports.ProgramContext = function(program, sandbox)
{
    this.contexts = {};
    var self = this;

    function populateContext(context, includes, parents)
    {
        self.contexts[context.pkg + "@" + context.module] = {
            id: context.id,
            pkg: context.pkg,
            module: context.module,
            hashId: context.hashId,
            type: context.type,
            includes: API.UTIL.copy(includes),
            parents: API.UTIL.copy(parents)
        };
    }

    walkTop(program.descriptor, function(id, info)
    {
        var locator = normalizeId(sandbox, id);

        var ctx = new PackageContext(locator);
        
        var options = {
            sandbox: sandbox,
            includes: [],
            parents: [],
            onRecordContext: populateContext,
            contexts: self.contexts,
            walked: {}
        };

        ctx.walkContexts(options);

        options.includes.shift();

        populateContext(ctx, options.includes, []);
    });
}

ProgramContext.prototype.getAllContexts = function()
{
    return this.contexts;
}

ProgramContext.prototype.contextFor = function(pkgId, moduleId)
{
    var ids = [
        pkgId + "@" + moduleId,
        pkgId + "@" + API.FILE.dirname(moduleId) + "/*",
        moduleId
    ];
    [0, 2].forEach(function(offset)
    {
        if (!/\.js$/.test(ids[offset]))
            ids.push(ids[offset] + ".js");
        else
            ids.push(ids[offset].substring(0, ids[offset].length-3));
    });
    for (var i=0,ic=ids.length ; i<ic ; i++ )
    {
        if (this.contexts[ids[i]])
            return this.contexts[ids[i]];
    }
    return false;
}


var PackageContext = exports.PackageContext = function(locator)
{
    this.contexts = {};
    var self = this;

    this.id = locator.id;
    this.type = locator.type || "top";
    this.pkg = locator.pkg;
    this.module = locator.module;
    this.hashId = locator.hashId;
    this.inst = locator.inst;   
}

PackageContext.prototype.walkContexts = function(options)
{
    var self = this;

    if (options.walked[self.pkg + "@" + self.module])
        return;
    options.walked[self.pkg + "@" + self.module] = true;

    if (self.module != "/")
        options.includes.push(self.pkg + "@" + self.module);

    function walkIncludes(info)
    {
        for (var id2 in info.include)
        {
            var locator3 = normalizeId(options.sandbox, id2);
            locator3.type = "include";
            
            if (locator3.inst)
            {
                var ctx = new PackageContext(locator3);
                ctx.walkContexts(options);
            }
            else
            {
                // an include referring to a module
                options.includes.push(self.pkg + "@" + locator3.module);
            }
        }
    }

    function walkLoad(info)
    {
        for (var id2 in info.load)
        {
            var locator3 = normalizeId(options.sandbox, id2);
            locator3.type = "include";

            var prevIncludes = [].concat(options.includes);

            options.includes = [];

            if (locator3.inst)
            {
                // a load entry point in a sub package
                var ctx = new PackageContext(locator3);
                
                ctx.walkContexts(options);
            }
            else
            if (!options.contexts[self.pkg + "@" + locator3.module])
            {
                // a load entry point referring to a module(s)

                if (locator3.module != "/")
                    options.parents.push(self.pkg + "@" + locator3.module);
                
                if (info.load[id2].include)
                    walkIncludes(info.load[id2]);

                if (info.load[id2].load)
                    walkLoad(info.load[id2]);

                if (locator3.module != "/")
                    options.parents.pop();

                options.onRecordContext({
                    id: self.pkg + "@" + locator3.module,
                    pkg: self.pkg,
                    module: locator3.module,
                    hashId: self.hashId,
                    type: "load"
                }, options.includes, options.parents);
            }
            options.includes = prevIncludes;
        }
    }

    walkTop(this.inst.normalizedDescriptor, function(id, info)
    {
        var locator2 = normalizeId(options.sandbox, id);
        locator2.type = "top";

        if (locator2.inst)
            throw new Error("a top context pointing to a package is only supported for program.json files");
        else
        {
            // we have a top context referring to a module

            if (self.module != "/")
                options.parents.push(self.pkg + "@" + self.module);
            
            if (info.include)
                walkIncludes(info);

            if (info.load)
                walkLoad(info);

            if (self.module != "/")
                options.parents.pop();
        }
    });

    // only record load context if it matches the main module
    if (self.module != "/" && self.module + ".js" == "/" + self.inst.normalizedDescriptor.json.main)
        options.onRecordContext({
            id: self.pkg + "@" + self.module,
            pkg: self.pkg,
            module: self.module,
            hashId: self.hashId,
            type: "load"
        }, options.includes, options.parents);
}
