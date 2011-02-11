// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var ENV = exports.ENV = {};
var SYSTEM = exports.SYSTEM = {};
var FILE = exports.FILE = {};
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

ENV.platformRequire = require;
ENV.mustTerminate = false;
ENV.mustClean = false;


// ######################################################################
// # DEBUG
// ######################################################################

var debugIndent = 0;
DEBUG.enabled = false;
DEBUG.print = function() {
    if (DEBUG.enabled)
    {
        var padding = ""; for(var i=0 ; i<debugIndent ; i++) padding += "  ";
        var str = padding + arguments[0] + "\n";
        if (typeof DEBUG.termStream != "undefined")
            DEBUG.termStream.write(str);
        else
            SYSTEM.print(str);
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


// ######################################################################
// # UTIL
// ######################################################################

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
    locator = UTIL.copy(locator);
    delete locator.descriptor;
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
        $requireRE = /\/\/.*|\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|[;=(,:!^]\s*\/(?:\\.|[^\/\\])+\/|(?:^|\W)\s*require\s*\(\s*("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')\s*\)/g;
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

  /* If path ends in "/!/xxx.js" then s will end in /! which needs to be fixed */
  if (s.charAt(s.length-1)=="!")
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
