// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = require("../../api");

exports.getPlatformRequire = function()
{
    return API.ENV.platformRequire;
}

exports.mustTerminate = function()
{
    return API.ENV.mustTerminate;
}

exports.canExit = function()
{
    // TODO: Use own flag here
    return !API.ENV.mustTerminate;
}

exports.runProgram = function(options, callback)
{
    if (options.exec)
    {
        var command = API.SYSTEM.preArgs.join(" ") + ((options.options)?" "+options.options.join(" "):"") + " " + options.uri;
        API.SYSTEM.exec(command, callback);
    }
    else
        throw new Error("NYI");
}

var Sandbox = exports.Sandbox = function Sandbox()
{
    var sandbox = API.ENV.sandbox.clone();
    
    this.declare = function(dependencies, moduleFactory)
    {
        var cbt = new API.UTIL.CallbackTracker(function()
        {
            sandbox.declare(dependencies, moduleFactory);
        });
        for (var i=0,ic=dependencies.length ; i<ic ; i++)
            API.ENV.assembler.addPackageToProgram(sandbox, sandbox.program, dependencies[i][Object.keys(dependencies[i])[0]], cbt.add());
        
        cbt.done();
    }
}
