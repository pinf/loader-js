
var API = require("./api"),
	UTIL = require("./util");

var consoleAPI = {
    instance: (typeof console !== "undefined")?console:void 0
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
        {
        	if (priority === "error")
        	{
        		if (consoleAPI.instance[priority] === console[priority] && typeof API.UTIL.debug === "function")
        		{
        			return API.UTIL.debug(normalizeArguments.apply(null, arguments));
        		} else
        			return consoleAPI.instance[priority].apply(consoleAPI.instance, normalizeArguments.apply(null, arguments));
        	} else
        		return consoleAPI.instance[priority].apply(consoleAPI.instance, normalizeArguments.apply(null, arguments));
        }
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
	// TODO: Log deprecation message
    API.ENV.console = console;
    consoleAPI.instance = console;
}

exports.getAPI = function()
{
    return consoleAPI;
}

function normalizeArguments()
{
	return UTIL.values(arguments).map(function(arg)
	{
		// We have an error object if `error` is found in object constructor name
		// TODO: This may need to be more deterministic in future
		if (typeof arg === "object" && /error/i.test(arg.constructor.name))
		{
			arg = UTIL.copy(arg);
			if (arg.stack)
			{
				arg.stack = ("" + arg.stack).split("\n").slice(1).map(function(frame)
				{
					return UTIL.trim(frame);
				});
			}
		}

		if (typeof arg === "object" && typeof API.UTIL.inspect === "function")
			return API.UTIL.inspect(arg);

		return arg;
	});
}
