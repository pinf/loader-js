// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var ENV = exports.ENV = {};
var SYSTEM = exports.SYSTEM = {};
var FILE = exports.FILE = {};
var ARCHIVE = exports.ARCHIVE = {};
var NET = exports.NET = {};
var JSON = exports.JSON = {};
var UTIL = exports.UTIL = {};
var DEBUG = exports.DEBUG = {};


// ######################################################################
// # Fix JS
// ######################################################################

// ES5 15.4.3.2 
if (!Array.isArray) {
    Array.isArray = function(obj) {
        return Object.prototype.toString.call(obj) == "[object Array]";
    };
}

// ES5 15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function(fun /*, thisp*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function")
          throw new TypeError();

        var res = new Array(len);
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this)
                res[i] = fun.call(thisp, this[i], i, this);
        }

        return res;
    };
}


// ######################################################################
// # ENV
// ######################################################################

ENV.platformRequire = null;
if (typeof require !== "undefined")
{
	ENV.platformRequire = require;
}
ENV.mustTerminate = false;
ENV.mustClean = false;
ENV.packageProviders = {};

ENV.packageProviders = {
    "pinf.org/loader/":
    {
        requireModule: function(id)
        {
//            if (id == "loader")
//                return PINF_LOADER;
            if (typeof __require__ != "undefined")
                return __require__("modules/pinf/" + id);
            else
                return require("./modules/pinf/" + id);
        },
        getModuleSource: function(sandbox, resourceURI, callback)
        {
            // There is no module source. We make it available directly above.
            return false;
        }
    }
}


ENV.console = null;
if (typeof console !== "undefined")
{
	ENV.console = console;
}

// ######################################################################
// # SYSTEM
// ######################################################################

SYSTEM.exit = function(status)
{
    // do nothing for now
}

SYSTEM.parseArgs = function(args)
{
    SYSTEM.preArgs = [];
    SYSTEM.args = false;
    args.forEach(function (val, index, array)
    {
        if (SYSTEM.args === false || (SYSTEM.args.length ==0 && /\/?pinf-loader(\.js)?$/.test(val)))
            SYSTEM.preArgs.push(val);
        else
            SYSTEM.args.push(val);
        if (SYSTEM.args === false && /\/?pinf-loader(\.js)?$/.test(val))
            SYSTEM.args = [];
    });
    if (SYSTEM.args === false)
        SYSTEM.args = [];
}

SYSTEM.colorizedPrint = function(print)
{
    var TERM = require("./term"),
        writer = {
            write: function()
            {
                print.apply(null, arguments);
                return writer;
            },
            flush: function() {}
        };
    var termStream = new TERM.Stream({
        stdout: writer,
        stderr: writer
    });
    return function(msg)
    {
        termStream.write(msg);
    }
}

SYSTEM.plainPrint = function(print)
{
    return function(msg)
    {
        // TODO: Strip color markup
        print(msg);
    }
}



// ######################################################################
// # DEBUG
// ######################################################################

var debugIndent = 0;
DEBUG.enabled = false;
DEBUG.print = function() {
    if (DEBUG.enabled)
    {
        var padding = ""; for(var i=0 ; i<debugIndent ; i++) padding += "  ";
        SYSTEM.print(padding + arguments[0] + "\n");
    }
    return DEBUG;
};
DEBUG.indent = function(count)
{
    if (typeof count == "undefined")
        return debugIndent;
    debugIndent = count;
    return DEBUG;
};

DEBUG.inspect = function(obj, label)
{
	SYSTEM.print(((typeof label !== "undefined")?label+": ":"") + obj + "\n");
	if (typeof obj === "object")
	{
		for (var key in obj)
			SYSTEM.print("  " + key + ": " + obj[key] + "\n");
	}
}


// ######################################################################
// # UTIL
// ######################################################################

UTIL.isArray = function(obj) {
    return Object.prototype.toString.call(obj) == "[object Array]";
};


/**
 * Merge two objects recursively.
 * 
 * @source https://github.com/kriskowal/narwhal-lib/blob/master/lib/narwhal/util.js
 */
UTIL.deepMerge = function(target, source) {
    if (typeof source == "undefined")
        return target;
    var key;
    for (key in source) {
        if(Object.prototype.hasOwnProperty.call(source, key)) {
            if(Array.isArray(source[key])) {
                target[key] = source[key];
            } else
            if(typeof source[key] == "object" && Object.prototype.hasOwnProperty.call(target, key) &&
               typeof target[key] == "object" && !Array.isArray(target[key])) {
                UTIL.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
};

/**
 * Copy an object recursively
 * 
 * @source https://github.com/kriskowal/narwhal-lib/blob/master/lib/narwhal/util.js
 */
UTIL.deepCopy = function (object) {
    if (object === null || object === undefined)
        return object;
    if (Array.isArray(object))
        return object.map(UTIL.deepCopy);
    if (typeof object == 'object') {
        var copy = {};
        UTIL.keys(object).forEach(function (key) {
            copy[key] = UTIL.deepCopy(object[key]);
        });
        return copy;
    }
    return object;
};

UTIL.copy = function (object) {
    if (object === null || object === undefined)
        return object;
    if (Array.isArray(object))
        return object.map(UTIL.deepCopy);
    if (typeof object == 'object') {
        var copy = {};
        UTIL.keys(object).forEach(function (key) {
            copy[key] = object[key];
        });
        return copy;
    }
    return object;
};

/**
 * Get all the keys of an object
 * 
 * @source https://github.com/kriskowal/narwhal-lib/blob/master/lib/narwhal/util.js
 */
UTIL.keys = function (object) {
    var keys = [];
    for (var key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key))
            keys.push(key);
    }
    return keys;
};

UTIL.locatorToString = function(locator)
{
//    locator = UTIL.copy(locator);
    return JSON.stringify(locator);
/*    
    if (typeof locator.id != "undefined")
        return '{id:"'+locator.id+'"}';
    else
    if (typeof locator.location != "undefined")
        return '{location:"'+locator.location+'"}';
    else
    if (typeof locator.archive != "undefined")
        return '{archive:"'+locator.archive+'"}';
    else
    if (typeof locator.catalog != "undefined")
        return '{catalog:"'+locator.catalog+'",name:"'+locator.name+'"}';
    else
        throw new Error("NYI");
*/
}

/**
 * Scrape dependencies from a Modules/1.1 module. Mostly borrowed from FlyScript.
 *
 * @source http://code.google.com/p/bravojs/source/browse/bravo.js
 */
UTIL.scrapeDeps = function(txt)
{
    var dep = [],
        m,
        $requireRE = /\/\/.*|\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|[;=(,:!^]\s*\/(?:\\.|[^\/\\])+\/|(?:^|[^A-Za-z0-9_\.])\s*require\s*\(\s*("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')\s*\)/g;
    for ($requireRE.lastIndex = 0; m = $requireRE.exec(txt);)
        if (m[1]) dep.push(m[1]);
    return dep;
}

var CallbackTracker = UTIL.CallbackTracker = function(callback) {
    this.callback = callback;
    this.callbackIndex = 1;
};
CallbackTracker.prototype.add = function(callback)
{
    var self = this;
    self.callbackIndex++;
    return function UTIL_CallbackTracker_lambda_add()
    {
        if (typeof callback != "undefined")
            callback.apply(null, arguments);
        self.callbackIndex--;
        if (self.callbackIndex == 0)
            self.callback();
    }
}
CallbackTracker.prototype.done = function(callback)
{
    this.callbackIndex--;
    // TODO: Schedule this callback differently so it runs last
    this.add(callback)();
}


// ######################################################################
// # FILE
// ######################################################################

FILE.isAbsolute = function(path)
{
    if (path.charAt(0) == "/" || /^resource:\/\//.test(path))
        return true;
    return false;
}

/**
 * Extract the non-directory portion of a path
 * 
 * @source http://code.google.com/p/bravojs/source/browse/bravo.js
 */
FILE.basename = function(path)
{
  if (typeof path !== "string")
    path = path.toString();

  var s = path.split('/').slice(-1).join('/');
  if (!s)
    return path;
  return s;
}

/**
 * Extract the directory portion of a path.
 * 
 * @source http://code.google.com/p/bravojs/source/browse/bravo.js
 */
FILE.dirname = function(path)
{
  if (typeof path !== "string")
    path = path.toString();

  if (path.charAt(path.length - 1) === '/')
    return path.slice(0,-1);

  var s = path.split('/').slice(0,-1).join('/');
  if (!s)
    return ".";

  /* If path ends in "/@/xxx.js" then s will end in /@ which needs to be fixed */
  if (s.charAt(s.length-1)=="@")
    s += "/";

  return s;
};

/**
 * Canonicalize path, compacting slashes and dots per basic UNIX rules.
 * 
 * @source http://code.google.com/p/bravojs/source/browse/bravo.js
 */
FILE.realpath = function(path)
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

FILE.readdir = function(path)
{
    throw new Error("NYI - FILE.readdir");
}

// ######################################################################
// # ARCHIVE
// ######################################################################

var archives = {};

var Archive = function(path)
{
    this.path = path;
    this.entries = {};
    this.api = {};
    ARCHIVE.open(this);
}

ARCHIVE.getForPath = function(path)
{
    if (typeof archives[path] == "undefined")
    {
        archives[path] = new Archive(path);
    }
    return archives[path];
}

ARCHIVE.forEach = function(callback)
{
    for (var path in archives)
    {
        callback(archives[path]);
    }
}
