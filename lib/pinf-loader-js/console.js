
var API = require("./api");

var consoleAPI = {
    instance: console || void 0
};
var errorLogPath = false;

[
    "log",
    "info",
    "warn",
    "error",
    "to"
].forEach(function(priority)
{
    consoleAPI[priority] = function()
    {
        if (errorLogPath) {
            var line = [
                "[" + new Date() + "]",
                priority.toUpperCase()
            ];
            for (var i=0,ic=arguments.length ; i<ic ; i++) {
                line.push(arguments[i]);
            }
            API.FILE.asyncAppend(errorLogPath, line.join("\t") + "\n");
        }

        if (typeof consoleAPI.instance != "undefined" && consoleAPI.instance[priority])
            return consoleAPI.instance[priority].apply(consoleAPI.instance, arguments);
        else
            API.DEBUG.print("[console]" + arguments);
    }
});

exports.setErrorLogPath = function(path)
{
    errorLogPath = path;
}

exports.setConsole = function(console)
{
    API.ENV.console = console;
    consoleAPI.instance = console;
}

exports.getAPI = function()
{
    return consoleAPI;
}
