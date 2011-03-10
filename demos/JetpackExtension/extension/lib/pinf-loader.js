(function() {
var __pinf_loader__ = function(__pinf_loader_scope__) {
var __loader__, __Loader__ = function() { this.modules = {}; this.memos = {}; };
__Loader__.prototype.memoize = function(id, factory) { this.memos[id] = factory; }
__Loader__.prototype.__require__ = function(id) {
    if (typeof __loader__.modules[id] == 'undefined') {
        var exports = {};
        __loader__.memos[id](__loader__.__require__, null, exports);
        __loader__.modules[id] = exports;
    }
    return __loader__.modules[id];
}
__loader__ = new __Loader__();
__loader__.__require__.platform = 'jetpack';
__loader__.memoize('adapter/jetpack', function(__require__, module, exports) {
// ######################################################################
// # /adapter/jetpack.js
// ######################################################################
// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

// @see https://jetpack.mozillalabs.com/

var FILE = require("file"),
    URL = require("url"),
    BYTE_STREAMS = require("byte-streams");
//  JSON = provided by jetpack as a global

var {Cc, Ci} = require("chrome");

var API;

exports.init = function(api)
{
    API = api;

    api.ENV.platform = "jetpack";
    api.ENV.platformRequire = require;
    
    var parts = __url__.split("/");
    parts.pop();
    api.ENV.loaderRoot = "/" + parts.join("/");

    api.ENV.packageProviders["mozilla.org/labs/jetpack"] = {
        requireModule: function(id)
        {
            return api.ENV.platformRequire(id);
        },
        getModuleSource: function(sandbox, resourceURI, callback)
        {
            // There is no module source. We use api.ENV.platformRequire to
            // make the module available.
            return false;
        }
    }

    api.SYSTEM.pwd = "__PWD__";

    api.SYSTEM.env = {
        TERM: "",
        HOME: ""
    };

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = api.SYSTEM.plainPrint(function(msg)
        {
            dump(msg);
        });
    }

    api.SYSTEM.preArgs = [];
    api.SYSTEM.args = [];

    api.SYSTEM.exec = null;


    api.FILE.exists = function(filename)
    {
        filename = normalizePath(filename);
        if (typeof filename == "string")
            return FILE.exists(filename);
        return filename[0].api.exists(filename[1])
    }

    api.FILE.isFile = function(filename)
    {
        filename = normalizePath(filename);
        if (typeof filename == "string")
            return FILE.isFile(filename);
        return filename[0].api.isFile(filename[1])
    }

    api.FILE.mkdirs = function(filename)
    {
console.log("FILE.mkdirs: " + filename);
        throw new Error("NYI");
    }

    api.FILE.read = function(filename, encoding)
    {
        if (typeof encoding != "undefined")
            throw new Error("NYI - encoding when reading file");
        filename = normalizePath(filename);
        if (typeof filename == "string")
            return FILE.read(filename);
        return filename[0].api.read(filename[1])
    }

    api.FILE.write = function(filename, data, encoding)
    {
console.log("FILE.write: " + filename);
        throw new Error("NYI");
    }

    api.NET.download = function(url, path, callback)
    {
console.log("NET.download("+url+"): " + path);
        throw new Error("NYI");
    }

    api.JSON.parse = JSON.parse;
    api.JSON.stringify = JSON.stringify;


    api.ARCHIVE.open = function(archive)
    {
        if (!/\.zip|\.jar/.test(archive.path))
            throw new Error("Only 'zip' and 'jar' archives are supported at this time! Archive path: " + archive.path);

        var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
        file.initWithPath(URL.toFilename(archive.path));

        var zipReader = Cc["@mozilla.org/libjar/zip-reader;1"].createInstance(Ci.nsIZipReader);
        zipReader.open(file);
        zipReader.test(null);

        archive.api = {
            "isDirectory": function(path)
            {
                path = archive.prefixPath + path;
                if(archive.entries[path] && archive.entries[path].dir) return true;
                return false;
            },
            "isFile": function(path)
            {
                path = archive.prefixPath + path;
                if(archive.entries[path] && !archive.entries[path].dir) return true;
                return false;
            },
            "list": function(path)
            {
                path = archive.prefixPath + path;
                var parts = path.split("/");
                var entryNames = [];
                for (var entry in archive.entries)
                {
                    var item = archive.entries[entry];
                    if(path) {
                        if(item[1].parts.length==parts.length+1 && 
                           item[1].parts.slice(0,parts.length).join("/")==path) {
                            entryNames.push(item[1].parts[item[1].parts.length-1]);
                        }
                    } else {
                        if(item[1].parts.length==1) {
                            entryNames.push(item[1].parts[0]);
                        }
                    }
                }
                return entryNames;       
            },
            "exists": function(path)
            {
                path = archive.prefixPath + path;
                return (!!archive.entries[path]);
            },
            "read": function(path)
            {
                path = archive.prefixPath + path;
                var reader = new BYTE_STREAMS.ByteReader(zipReader.getInputStream(path)),
                    buffer = "",
                    chunk;
                while ( (chunk = reader.read(1024)) !== "" ) {
                    buffer += chunk;
                }
                reader.close();
                return buffer;
            },
            "mtime": function(path)
            {
                path = archive.prefixPath + path;
                new Date(zipReader.getEntry(path).lastModifiedTime);
            }
        }

        var entries = zipReader.findEntries(null),
            topDirs = {};
        while (entries.hasMore()) {
            var entry = entries.getNext();
            var dir = (entry.substr(entry.length-1,1)=="/");
            if(dir) {
                topDirs[entry.split("/")[0]] = true;
            }
            archive.entries[entry] = {
                "parts": entry.split("/"),
                "dir": dir
            }
        }
        // delete some junk directories
        delete topDirs["__MACOSX"];

        archive.prefixPath = "";
        if (Object.keys(topDirs).length == 1)
            archive.prefixPath = Object.keys(topDirs)[0] + "/";
    }
}


function normalizePath(filename)
{
    var m = filename.match(/^\/__PWD__\/resource:\/(.*?)(!\/(.*))?$/);
    if(m)
    {
        if (m[2])
            return [API.ARCHIVE.getForPath("resource://" + m[1]), m[3]];
        return URL.toFilename("resource://" + m[1]);
    }
    else
        throw new Error("NYI: " + filename);
}


});
__loader__.memoize('api', function(__require__, module, exports) {
// ######################################################################
// # /api.js
// ######################################################################
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

ENV.platformRequire = require;
ENV.mustTerminate = false;
ENV.mustClean = false;
ENV.packageProviders = {};

ENV.packageProviders = {
    "pinf.org/loader":
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
    var TERM = __require__('term'),
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


});
__loader__.memoize('args', function(__require__, module, exports) {
// ######################################################################
// # /args.js
// ######################################################################
// @see https://github.com/280north/narwhal/blob/master/packages/narwhal-lib/lib/narwhal/args.js
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson
// -- abhinav Abhinav Gupta

var API = __require__('api'),
    util = __require__('util');

exports.UsageError = function (message) {
    this.name = "UsageError";
    this.message = message;
};

exports.UsageError.prototype = Object.create(Error.prototype);

exports.ConfigurationError = function (message) {
    this.name = "ConfigurationError";
    this.message = message;
};

exports.ConfigurationError.prototype = Object.create(Error.prototype);

/**
 * Create a new command line argument parser.
 *
 * @constructor
 */
exports.Parser = function () {
    this._options = [];
    this._def = {};
    this._long = {};
    this._short = {};
    this._commands = {};
    this._args = [];
    this._vargs = undefined;
    this._interleaved = false;
};

/**
 * Add an option to the parser.
 *
 * Takes the same arguments as the {@link Option} constructor.
 *
 * @returns {Option} the new Option object
 */
exports.Parser.prototype.option = function () {
    var option = new this.Option(this, arguments);
    this._options.push(option);
    return option;
};

/**
 * Create a new group of options.
 *
 * @param {String} name     name of the group
 * @returns {Group}         {@link Group} object representing the group
 */
exports.Parser.prototype.group = function (name) {
    var group = new this.Group(this, this, name);
    this._options.push(group);
    return group;
};

/**
 * Set default values for the parser.
 *
 * @param {String} name     key in the result
 * @param          value    default value for the key
 * @returns {Parser}        this
 */
exports.Parser.prototype.def = function (name, value) {
    this._def[name] = value;
    return this;
};

/**
 * Reset the default values in the given hash.
 *
 * Normally, this won't be used externally.
 *
 * @param {Object} options  parser state
 */
exports.Parser.prototype.reset = function (options) {
    var self = this;
    for (var name in this._def) {
        if (util.has(this._def, name) && !util.has(options, name))
            options[name] = util.copy(this._def[name]);
    }
    this._options.forEach(function (option) {
        if (!(option instanceof self.Option))
            return;
        if (!util.has(options, option.getName()))
            options[option.getName()] = option._def;
    });
};

/**
 * Add a new sub-command to the parser.
 *
 * @param {String} name         name of the sub command
 * @param          [handler]    either a module name that exports a `parser'
 *                              or a function that will be used as a parser
 *                              action
 * @returns {Parser}            if no handler was given or a parser action was
 *                              given, returns the Parser for the sub-command
 */
exports.Parser.prototype.command = function (name, handler) {
    var parent = this;
    if (!handler) {
        var parser = new exports.Parser();
        this._commands[name] = function () {
            return parser;
        };
        return parser;
    } else if (typeof handler == "string") {
        this._commands[name] = function () {
            return require(handler).parser;
        };
        return;
    } else {
        var parser = new this.Parser();
        parser.action(handler);
        this._commands[name] = function () {
            return parser;
        };
        return parser;
    }
};

/**
 * Add a single positional argument to the command.
 *
 * Warning: Only used for printing the help or usage. The parser is not
 * responsible for reading them from the command line arguments.
 *
 * @param {String} name     name of the argument
 * @returns {Argument}      {@link Argument} object reprsenting the argument
 */
exports.Parser.prototype.arg = function (name) {
    var argument = new exports.Argument(this).name(name);
    this._args.push(argument);
    return argument;
};

/**
 * Add a variable number of arguments to the command.
 *
 * Warning: Only used for printing the help or usage. The parser is not
 * responsible for reading them from the command line arguments.
 *
 * @param {String} name     name of the arguments
 * @returns {Argument}      {@link Argument} object representing the argument
 */
exports.Parser.prototype.args = function (name) {
    var argument = new exports.Argument(this).name(name);
    this._vargs = argument;
    return argument;
};

/**
 * Enable or disable interleaved arguments.
 *
 * Disabled by default.
 *
 * @param {Boolean} [value=true]    true to allow interleaved arguments
 * @returns {Parser}                this
 */
exports.Parser.prototype.interleaved = function (value) {
    if (value === undefined)
        value = true;
    this._interleaved = value;
    return this;
};

/**
 * Act on the given arguments.
 *
 * Parses the arguments and calls the appropriate actions.
 *
 * Normally, this won't be used externally.
 *
 * @param {String[]} args       arguments to parse
 * @param {Option[]} options    result of the parent parser
 */
exports.Parser.prototype.act = function (args, options) {
    if (!this._action) {
        this.error(options, "Not yet implemented.");
        this.exit(-1);
    }
    options.acted = true;
    this._action.call(this, this.parse(args), options);
};

/**
 * Add an action to the parser.
 * 
 * If an action already exists, the new action will be executed after the
 * executing action.
 *
 * Warning: Not executed when the parse method is called. Normally used on
 * sub-command parsers only.
 *
 * @param {Function} action     the action to execute
 * @returns {Parser}            this
 */
exports.Parser.prototype.action = function (action) {
    if (this._action) {
        action = (function (previous, next) {
            return function () {
                previous.apply(this, arguments);
                next.apply(this, arguments);
            };
         })(this._action, action);
    }
    this._action = action;
    return this;
};

/**
 * Make the parser helpful.
 *
 * Will add help options and if required, commands.
 *
 * Warning: Must be called last, after all parser configuration is finished.
 *
 * @returns {Parser} this
 */
exports.Parser.prototype.helpful = function () {
    var self = this;
    this.option('-h', '--help')
        .help('displays usage information')
        .action(function (options) {
            return self.printHelp(options);
        })
        .halt();
    if (util.len(this._commands))
        this.command('help', function (options) {
            self.printHelp(options);
        }).help('displays usage information');
    return this;
};

exports.Parser.prototype.usage = function (usage) {
    this._usage = usage;
    return this;
};

exports.Parser.prototype.help = function (help) {
    this._help = help;
    return this;
};

exports.Parser.prototype.printHelp = function (options) {
    var args = options.args || [];
    if (args.length) {
        // parse args for deep help
        // TODO offer extended help for options
        if (!util.has(this._commands, args[0])) {
            this.error(options, util.repr(args[0]) + ' is not a command.');
            this.printCommands(options);
            this.exit(options);
        } else {
            util.put(args, 1, '--help');
            this._commands[args[0]]().act(args, options);
            this.exit(options);
        }
    } else {
        this.printUsage(options);
        if (this._help)
            this.print('' + this._help + '');
        this.printCommands(options);
        this.printOptions(options);
        this.exit(options);
    }
};

exports.Parser.prototype.printUsage = function (options) {
    this.print(
        'Usage: \0bold(\0blue(' + API.FILE.basename(options.command || '<unknown>') +
        (!this._interleaved ?  ' [OPTIONS]' : '' ) + 
        (util.len(this._commands) ?
            ' COMMAND' :
            ''
        ) + 
        (util.len(this._args) ?
            ' ' + this._args.map(function (arg) {
                if (arg._optional) {
                    return '[' + arg._name.toUpperCase() + ']';
                } else {
                    return arg._name.toUpperCase();
                }
            }).join(' ') :
            ''
        ) +
        (this._vargs ?
            ' [' + this._vargs._name.toUpperCase() + ' ...]':
            ''
        ) + 
        (this._interleaved ?  ' [OPTIONS]' : '' ) + 
        (this._usage ?
            ' ' + this._usage :
            ''
        ) + "\0)\0)"
    );
};

exports.Parser.prototype.printCommands = function (options) {
    var self = this;
    util.forEachApply(
        util.items(this._commands),
        function (name, command) {
            var parser = command();
            self.print('  \0bold(\0green(' + name + '\0)\0)' + (
                parser._help ?
                (
                    ': ' +
                    (
                        parser._action?
                        '': '\0red(NYI\0): '
                    ) + 
                    parser._help
                ) : ''
            ));
        }
    );
};

exports.Parser.prototype.printOption = function (options, option, depth, parent) {
    var self = this;
    depth = depth || 0;
    var indent = util.mul('   ', depth);

    if (option._hidden)
        return;
    if (option._group !== parent)
        return;

    if (option instanceof exports.Group) {
        self.print(indent + ' \0yellow(' + option._name + ':\0)');
        var parent = option;
        option._options.forEach(function (option) {
            return self.printOption(options, option, depth + 1, parent);
        });
        return;
    }

    var message = [];
    if (option._short.length)
        message.push(option._short.map(function (_short) {
            return ' \0bold(\0green(-' + _short + '\0)\0)';
        }).join(''));
    if (option._long.length)
        message.push(option._long.map(function (_long) {
            return ' \0bold(\0green(--' + _long + '\0)\0)';
        }).join(''));
    if (option._action && option._action.length > 2)
        message.push(
            ' ' +
            util.range(option._action.length - 2)
            .map(function () {
                return '\0bold(\0green(' + util.upper(
                    option.getDisplayName()
                ) + '\0)\0)';
            }).join(' ')
        );
    if (option._help)
        message.push(': ' + option._help + '');
    if (option._choices) {
        var choices = option._choices;
        if (!util.isArrayLike(choices))
            choices = util.keys(choices);
        message.push(' \0bold(\0blue((' + choices.join(', ') + ')\0)\0)');
    }
    if (option._halt)
        message.push(' \0bold(\0blue((final option)\0)\0)');
    self.print(indent + message.join(''));

};

exports.Parser.prototype.printOptions = function (options) {
    var self = this;
    self._options.forEach(function (option) {
        self.printOption(options, option);
    });
};

exports.Parser.prototype.error = function (options, message) {
    if (this._parser) {
        this._parser.error.apply(
            this._parser,
            arguments
        );
    } else {
        this.print('\0red(' + message + '\0)');
        this.exit();
    }
};

exports.Parser.prototype.exit = function (status) {
    if (this._parser) {
        this._parser.exit.apply(
            this._parser,
            arguments
        );
    } else {
        // FIXME: exit is sometimes called with the "options" object as the "status" argument. Why?
        API.SYSTEM.exit(typeof status == "number" ? status : 1);
//        throw new Error("exit failed");
    }
};

exports.Parser.prototype.print = function () {
    if (this._parser)
        this._parser.print.apply(
            this._parser,
            arguments
        );
    else
    {
        var args = [];
        for (var i=0, ic=arguments.length ; i<ic ; i++ )
            args.push(arguments[i]);
        API.SYSTEM.print(args.join("") + "\n");
    }
};

// verifies that the parser is fully configured
exports.Parser.prototype.check = function () {
    // make sure all options have associated actions
    var self = this;
    self._options.forEach(function (option) {
        if (!(option instanceof self.Option))
            return;
        if (!option._action)
            throw new exports.ConfigurationError(
                "No action associated with the option " + 
                util.repr(option.getDisplayName())
            );
    });
};

/**
 * Parse the arguments, calling the appropriate option actions.
 *
 * @param {String[]}    [args=system.args]  command line arguments
 * @param {Object}      [options]           parser state
 * @param {Boolean}     [noCommand=false]   true if sub-commands are not
 *                                          allowed
 * @param {Boolean}     [allowInterleaved]  true to allow interleaved
 *                                          arguments; overrides
 *                                          this.interleaved
 * @returns {Object}                        final parser state
 */
exports.Parser.prototype.parse = function (args, options, noCommand, allowInterleaved) {

    // TODO break this into sub-functions
    // TODO wrap with a try catch and print the progress through the arguments

    var self = this;

    this.check();

    if (!args)
    {
        throw new Error("NI");
//        args = system.args;
    }
    if (!options)
        options = {};
    if (allowInterleaved === undefined)
        allowInterleaved = this._interleaved;

    options.args = args;
    if (!noCommand && args.length && !/^-/.test(args[0]))
        options.command = args.shift();

    function mandatoryShift(n, name) {
        if (n > args.length) {
            this.error(
                options,
                'Error: The ' + util.enquote(name) +
                ' option requires ' + n + ' arguments.'
            );
        }
        var result = args.slice(0, n);
        for (var i = 0; i < n; i++)
            args.shift()
        return result;
    };

    function validate(option, value) {
        try {
            if (option._action.length <= 3)
                value = value[0];
            return option._validate.call(self, value);
        } catch (exception) {
            throw exception;
            self.error(options, exception);
        }
    };

    // initial values
    this.reset(options);

    var interleavedArgs = [];

    // walk args
    ARGS: while (args.length) {
        var arg = args.shift();
        if (arg == "--") {
            break;

        } else if (/^--/.test(arg)) {

            var pattern = arg.match(/^--([^=]+)(?:=(.*))?/).slice(1);
            var word = pattern[0];
            var value = pattern[1];

            if (!!value) {
                args.unshift(value);
            }

            if (util.has(this._long, word)) {

                var option = this._long[word];
                if (!option._action) {
                    self.error(
                        options,
                        "Programmer error: The " + word +
                        " option does not have an associated action."
                    );
                }

                option._action.apply(
                    self,
                    [
                        options,
                        option.getName()
                    ].concat(
                        validate(option, mandatoryShift.call(
                            this,
                            Math.max(0, option._action.length - 2),
                            option.getName()
                        ))
                    )
                );

                if (option._halt)
                    break ARGS;

            } else {
                this.error(options, 'Error: Unrecognized option: ' + util.enquote(word));
            }

        } else if (/^-/.test(arg)) {

            var letters = arg.match(/^-(.*)/)[1].split('');
            while (letters.length) {
                var letter = letters.shift();
                if (util.has(this._short, letter)) {
                    var option = this._short[letter];

                    if (option._action.length > 2) {
                        if (letters.length) {
                            args.unshift(letters.join(''));
                            letters = [];
                        }
                    }

                    option._action.apply(
                        self,
                        [
                            options,
                            option.getName(),
                        ].concat(
                            validate(
                                option,
                                mandatoryShift.call(
                                    this,
                                    Math.max(0, option._action.length - 2),
                                    option.getName()
                                )
                            )
                        )
                    );

                    if (option._halt)
                        break ARGS;

                } else {
                    this.error(options, 'Error: unrecognized option: ' + util.enquote(letter));
                }
            }

        } else {
            interleavedArgs.push(arg);
            if (!allowInterleaved)
                break;
        }

    }

    // add the interleaved arguments back in
    args.unshift.apply(args, interleavedArgs)

    if (util.len(this._commands)) {
        if (args.length) {
            if (util.has(this._commands, args[0])) {
                var command = this._commands[args[0]];
                command().act(args, options);
            } else {
                this.error(options, 'Error: unrecognized command');
            }
        } else {
            this.error(options, 'Error: command required');
            this.exit(0);
        }
    }

    return options;
};

/**
 * Represents positional arguments for the parser.
 * 
 * @constructor
 * @param {Parser} parser   the parent parser
 */
exports.Argument = function (parser) {
    this._parser = parser;
    return this;
};

/**
 * Set the name of the argument.
 *
 * @param {String} name     name of the parser
 * @returns {Argument}      this
 */
exports.Argument.prototype.name = function (name) {
    this._name = name;
    return this;
};

/**
 * Make the argument optional.
 *
 * @param {Boolean} [value=true]    true to make this optional
 * @returns {Argument}              this
 */
exports.Argument.prototype.optional = function (value) {
    if (value === undefined)
        value = true;
    this._optional = value;
    return this;
};

/**
 * Represents a command line option.
 *
 * Other than the parser, the arguments are read with the following rules.
 *
 * Hashes contain attributes.
 * <code>
 *      new Option(parser, {
 *          action: function () { ... },
 *          _: 'l',         // short name
 *          __: 'list',     // long name
 *          help: "list all packages"
 *      });
 * </code>
 *
 * A function is the option's action.
 * <code>
 *      new Option(parser, function () { ... });
 * </code>
 *
 * Strings starting with "-" and "--" are short and long names respectivey.
 * <code>
 *      new Option(parser, "-l", "--list");
 * </code>
 *
 * A string with spaces is the help message.
 * <code>
 *      new Option(parser, "-l", "--list", "list all packages");
 * </code>
 *
 * A one-word string is the display name and the option name. An additional
 * one-word string is the option name.
 * <code>
 *      new Option(parser, "-d", "--delete", "file", "del");
 *      // file is the display name and del is the option name
 * </code>
 *
 * @param {Parser} parser       the owning parser
 */
exports.Option = function (parser, args) {
    var self = this;
    this._parser = parser;
    this._validate = function (value) {
        return value;
    };
    this._long = [];
    this._short = [];
    util.forEach(args, function (arg) {
        if (typeof arg == "function") {
            self.action(arg);
        } else if (typeof arg !== "string") {
            for (var name in arg) {
                var value = arg[name];
                self[name](value);
            }
        } else if (/ /.test(arg)) {
            self.help(arg);
        } else if (/^--/.test(arg)) {
            arg = arg.match(/^--(.*)/)[1];
            self.__(arg);
        } else if (/^-.$/.test(arg)) {
            arg = arg.match(/^-(.)/)[1];
            self._(arg);
        } else if (/^-/.test(arg)) {
            throw new Error("option names with one dash can only have one letter.");
        } else {
            if (!self._name) {
                self.name(arg);
                self.displayName(arg);
            } else {
                self.name(arg);
            }
        }
    });
    if (!(self._short.length || self._long.length || self._name))
        throw new exports.ConfigurationError("Option has no name.");
    return this;
};

/**
 * Set the short option.
 *
 * @param {String} letter   the character for the option
 * @returns {Option}        this
 */
exports.Option.prototype._ = function (letter) {
    this._short.push(letter);
    this._parser._short[letter] = this;
    return this;
};

/**
 * Set the long option.
 *
 * @param {String} word     the word for the long option
 * @returns {Option}        this
 */
exports.Option.prototype.__ = function (word) {
    this._long.push(word);
    this._parser._long[word] = this;
    return this;
};

/**
 * Set the name of the option.
 *
 * Used in the result hash.
 *
 * @param {String} name     name of the option
 * @returns {Option}        this
 */
exports.Option.prototype.name = function (name) {
    this._name = name;
    return this;
};

/**
 * Set the display name for the option.
 *
 * Shown in the help as the name of the argument. Useless if the option
 * doesn't have an argument.
 *
 * @param {String} displayName      new display name
 * @returns {Option}                this
 */
exports.Option.prototype.displayName = function (displayName) {
    this._displayName = displayName;
    return this;
};

/**
 * @returns {String} the display name
 */
exports.Option.prototype.getDisplayName = function () {
    if (this._displayName)
        return this._displayName;
    return this.getName();
};

/**
 * @returns {String} the name
 */
exports.Option.prototype.getName = function () {
    if (this._name) {
        return this._name;
    }
    if (this._long.length > 0) {
        return this._long[0];
    }
    if (this._short.length > 0) {
        return this._short[0];
    }
    throw new Error("Programmer error: unnamed option");
};

/**
 * Set the action executed when this option is encountered.
 *
 * @param action        either a function or a string with the name of a
 *                      function in the parser
 * @returns {Option}    this
 */
exports.Option.prototype.action = function (action) {
    var self = this;
    if (typeof action == "string") {
        this._action = self._parser[action];
    } else {
        this._action = action;
    }
    return this;
};

/**
 * If value is given, the option will not take any arguments and will have the
 * given value if its flag was passed.
 *
 * Otherwise, the option will take a single argument.
 *
 * @param value         desired value
 * @returns {Option}    this
 */
exports.Option.prototype.set = function (value) {
    var option = this;
    if (arguments.length == 0)
        return this.action(function (options, name, value) {
            options[name] = value;
        });
    else if (arguments.length == 1)
        return this.action(function (options, name) {
            options[name] = value;
        });
    else
        throw new exports.UsageError("Option().set takes 0 or 1 arguments");
};

/**
 * The option can have multiple values.
 *
 * Each argument for this option will be passed separately.
 *
 * @returns {Option} this
 */
exports.Option.prototype.push = function () {
    var option = this;
    return this.def([]).action(function (options, name, value) {
        options[name].push(option._validate.call(
            this,
            value
        ));
    });
};

/**
 * The option will keep track of the number of times the flag was passed in the
 * arguments.
 *
 * @returns {Option} this
 */
exports.Option.prototype.inc = function () {
    return this.def(0).action(function (options, name) {
        options[name]++;
    });
};

/**
 * The option's value will be the negative of number of times its flag was
 * passed in the arguments.
 *
 * @returns {Option} this
 */
exports.Option.prototype.dec = function () {
    return this.def(0).action(function (options, name) {
        options[name]--;
    });
};

/**
 * The option can only have one of the given values.
 *
 * @param choices array of string containing the choices or hash whose keys
 *                will be the possible choices and the mapped value will be
 *                the value of the option
 * @returns {Option} this
 */
exports.Option.prototype.choices = function (choices) {
    this.set();
    this._choices = choices;
    var self = this;
    if (util.isArrayLike(choices)) {
        return this.validate(function (value) {
            if (choices.indexOf(value) < 0)
                throw new exports.UsageError(
                    "choice for " + util.upper(self.getDisplayName()) +
                    " is invalid: " + util.repr(value) + "\n" +
                    "Use one of: " + choices.map(function (choice) {
                        return util.enquote(choice);
                    }).join(', ')
                );
            return value;
        })
    } else {
        return this.validate(function (value) {
            if (!util.has(choices, value))
                throw new exports.UsageError(
                    "choice for " + util.upper(self.getDisplayName()) +
                    " is invalid: " + util.enquote(value) + "\n" +
                    "Use one of: " + util.keys(choices).map(function (choice) {
                        return util.enquote(choice);
                    }).join(', ')
                );
            return choices[value];
        });
    }
};

/**
 * Set the default value for the option.
 *
 * Overrides setting from Parser.def().
 *
 * @param value      new default value
 * @returns {Option} this
 */
exports.Option.prototype.def = function (value) {
    if (this._def === undefined)
        this._def = value;
    return this;
};

/**
 * Add a validate function to the option.
 *
 * The last added validate function is executed first.
 *
 * @param {Function} validate   the validate function - takes the option's
 *                              value and returns a new value or the original
 *                              value unchanged; can throw {@link UsageError}
 * @returns {Option}            this
 */
exports.Option.prototype.validate = function (validate) {
    var current = this._validate;
    if (this._validate) {
        validate = (function (previous) {
            return function () {
                return current.call(
                    this,
                    previous.apply(this, arguments)
                );
            };
        })(validate);
    }
    this._validate = validate;
    return this;
};

/**
 * The option will take an input file.
 *
 * If the given file name is "-", stdin is used.
 *
 * @returns {Option} this
 */
exports.Option.prototype.input = function () {
    throw new Error("NYI");
/*
    return this.set().validate(function (value) {
        if (value == "-")
            return system.stdin;
        else
            return file.open(value, 'r');
    });
*/
};

/**
 * The option will take an output file.
 *
 * If the given file name is "-", stdout is used.
 *
 * @returns {Option} this
 */
exports.Option.prototype.output = function () {
    throw new Error("NYI");
/*
    return this.set().validate(function (value) {
        if (value == "-")
            return system.stdout;
        else
            return file.open(value, 'w');
    });
*/
};

/**
 * The option will take a number.
 *
 * @returns {Option} this
 */
exports.Option.prototype.number = function () {
    return this.set().validate(function (value) {
        var result = +value;
        if (isNaN(result))
            throw new exports.UsageError("not a number");
        return result;
    });
};

/**
 * The option will take an octal value.
 *
 * @returns {Option} this
 */
exports.Option.prototype.oct = function () {
    return this.set().validate(function (value) {
        var result = parseInt(value, 8);
        if (isNaN(result))
            throw new exports.UsageError("not an octal value");
        return result;
    });
};

/**
 * The option will take a hexadecimal value.
 *
 * @returns {Option} this
 */
exports.Option.prototype.hex = function () {
    return this.set().validate(function (value) {
        var result = parseInt(value, 16);
        if (isNaN(result))
            throw new exports.UsageError("not an hex value");
        return result;
    });
};

/**
 * The option will take an integer value.
 *
 * @returns {Option} this
 */
exports.Option.prototype.integer = function () {
    return this.set().validate(function (value) {
        var result = parseInt(value, 10);
        if (isNaN(result) || result !== +value)
            throw new exports.UsageError("not an integer");
        return result;
    });
};

/**
 * The option will take a natural number
 *
 * @returns {Option} this
 */
exports.Option.prototype.natural = function () {
    return this.set().validate(function (value) {
        var result = value >>> 0;
        if (result !== +value || result < 0)
            throw new exports.UsageError("not a natural number");
        return result;
    });
};

/**
 * The option will take a whole number.
 *
 * @returns {Option} this
 */
exports.Option.prototype.whole = function () {
    return this.set().validate(function (value) {
        var result = value >>> 0;
        if (result !== +value || result < 1)
            throw new exports.UsageError("not a whole number");
        return result;
    });
};

/**
 * The option will take a boolean value.
 *
 * @param {Boolean} def     default value
 * @returns {Option}        this
 */
exports.Option.prototype.bool = function (def) {
    if (def === undefined)
        def = true;
    return this.def(!def).set(!!def);
};

exports.Option.prototype.todo = function (command, value) {
    this._parser.def('todo', []);
    command = command || this.getName();
    if (value)
        return this.action(function (options, name, value) {
            options.todo.push([command, value]);
        });
    else
        return this.action(function (options, name) {
            options.todo.push([command]);
        });
};

/**
 * The option will have an inverse option.
 *
 * @returns {Option} this
 */
exports.Option.prototype.inverse = function () {
    var args = arguments;
    if (!args.length) {
        args = [];
        this._short.forEach(function (_) {
            args.push('-' + _.toUpperCase());
        });
        this._long.forEach(function (__) {
            args.push('--no-' + __);
        });
        if (this.getName()) 
            args.push(this.getName());
    }
    var parser = this._parser;
    var inverse = this._inverse = parser.option.apply(
        parser,
        args
    ).set(!this._def).help('^ inverse');
    return this;
};

/**
 * Set the help text for this option.
 *
 * @param {String} text     the help text
 * @returns {Option}        this
 */
exports.Option.prototype.help = function (text) {
    this._help = text;
    return this;
};

/**
 * The option is final.
 *
 * None of the other options will be parsed after this.
 *
 * @param {Boolean} [value=true]    true to make this option final
 * @returns {Option}                this
 */
exports.Option.prototype.halt = function (value) {
    if (value == undefined)
        value = true;
    this._halt = value;
    return this;
};

/**
 * The option is hidden.
 *
 * It won't be shown in the program usage.
 *
 * @param {Boolean} [value=true]    true to make this option hidden
 * @returns {Option}                this
 */
exports.Option.prototype.hidden = function (value) {
    if (value === undefined)
        value = true;
    this._hidden = value;
    return this;
};

/**
 * Return the option's owning parser.
 *
 * Useful for chaining.
 *
 * @returns {Parser} owning parser
 */
exports.Option.prototype.end = function () {
    return this._parser;
};

/**
 * Helper function equivalent to end().option(...).
 */
exports.Option.prototype.option = function () {
    return this.end().option.apply(this, arguments);
};

/**
 * Return the parser's parent parser.
 *
 * @returns {Parser} parent parser
 */
exports.Parser.prototype.end = function () {
    return this._parser;
};

/**
 * Represents an option group.
 *
 * @param {Parser} parser   option parser
 * @param          parent   parent parser or group
 * @param {String} name     name of the group
 */
exports.Group = function (parser, parent, name) {
    this._name = name;
    this._parser = parser;
    this._parent = parent;
    this._options = [];
    return this;
};

/**
 * Add an option to the group.
 *
 * Takes the same arguments as the {@link Option} constructor.
 *
 * @returns {Option} the new Option object
 */
exports.Group.prototype.option = function () {
    var option = this._parser.option.apply(this._parser, arguments);
    option._group = this;
    this._options.push(option);
    return option;
};

/**
 * Create a sub-group to this group.
 *
 * @param {String} name     name of the new group
 * @returns {Group}         the new group
 */
exports.Group.prototype.group = function (name) {
    var Group = this.Group || this._parser.Group;
    var group = new Group(this._parser, this, name);
    return group;
};

/**
 * Returns the group's parent group or parser.
 * 
 * Useful for chaining commands.
 *
 * @returns parent parser or group
 */
exports.Group.prototype.end = function () {
    return this._parent;
};

exports.Parser.prototype.Parser = exports.Parser;
exports.Parser.prototype.Option = exports.Option;
exports.Parser.prototype.Group = exports.Group;


});
__loader__.memoize('assembler', function(__require__, module, exports) {
// ######################################################################
// # /assembler.js
// ######################################################################
// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = __require__('api'),
    ENV = API.ENV,
    DEBUG = API.DEBUG,
    UTIL = API.UTIL,
    FILE = API.FILE,
    SYSTEM = API.SYSTEM,
    DESCRIPTORS = __require__('descriptors'),
    PROGRAM = __require__('program');

var Assembler = exports.Assembler = function(downloader)
{
    this.downloader = downloader;
    this.cleaned = [];
}

Assembler.prototype.assembleProgram = function(sandbox, uri, programCallback, callback, options)
{
    var self = this;
    if (typeof callback == "undefined")
    {
        callback = programCallback;
        programCallback = void 0;
    }

    var di = DEBUG.indent();
    DEBUG.print("Assembling program:").indent(di+1);

    function assembleProgram()
    {
        DEBUG.print("Program URI: " + uri);
    
        var path;
        if (uri.charAt(0) == "/")
            path = uri;
    
        var programDescriptor = new DESCRIPTORS.Program(path);
        
        var program = new PROGRAM.Program(programDescriptor);

        if (typeof programCallback != "undefined")
        {
            if (programCallback(program) === false)
                return;
        }

        sandbox.setProgram(program);
        sandbox.sourceDescriptors = options.sourceDescriptors || void 0;

        program.assembler = self;

        // This will download all packages and make them available on disk
        program.discoverPackages(function assembler_assembleProgram_lambda_discoverPackages_packageForLocator(locator, callback)
        {
            program.resolveLocator(self, locator, function(resolvedLocator)
            {
                if (typeof resolvedLocator.available != "undefined" && resolvedLocator.available === false)
                {
                    callback(null);
                }
                else
                if (typeof resolvedLocator.id != "undefined")
                {
                    callback(sandbox.ensurePackageForLocator(resolvedLocator, options), resolvedLocator);
                }
                else
                if (typeof resolvedLocator.location == "undefined")
                {
                    throw new Error("No location property found in locator: " + UTIL.locatorToString(resolvedLocator));
                }
                else
                if (!FILE.exists(resolvedLocator.location))
                {
                    throw new Error("Directory for location property not found in locator: " + UTIL.locatorToString(resolvedLocator));
                }
//                else
                // We do not need to follow locators (in order to discover requires()) that map to providers.
//                if (typeof locator.provider != "undefined")
//                    callback(null);
                else
                {
                    callback(sandbox.ensurePackageForLocator(resolvedLocator, options), resolvedLocator);
                }
            }, options);
        }, function assembler_assembleProgram_lambda_discoverPackages_done()
        {
            DEBUG.indent(di);
            self.finalizeProgram(sandbox, program);
            callback(program);
        });
    }

    if (ENV.mustClean && !this.cleaned[this.downloader.basePath + "/downloads"])
    {
        this.cleaned[this.downloader.basePath + "/downloads"] = true;

        DEBUG.print("Removing downloaded packages from: " + this.downloader.basePath + "/downloads");
        
        SYSTEM.exec("rm -Rf " + this.downloader.basePath + "/downloads", function(stdout, stderr)
        {
            assembleProgram();
        });
    }
    else
        assembleProgram();    
}

/**
 * Load an extra package for the program.
 * 
 * NOTE: The 'locator' argument gets modified!
 * TODO: Refactor so 'locator' argument does not get modified.
 * 
 * @throws If package is not listed (by UID) in program's descriptor
 */
Assembler.prototype.addPackageToProgram = function(sandbox, program, locator, callback, options)
{
    var self = this;

    var di = DEBUG.indent();
    DEBUG.print("Load additional package into program:").indent(di+1);
    DEBUG.print("Locator(original): " + UTIL.locatorToString(locator));

    program.resolveLocator(self, locator, function(resolvedLocator)
    {
        DEBUG.print("Locator(resolved): " + UTIL.locatorToString(resolvedLocator));

        var pkg = sandbox.ensurePackageForLocator(resolvedLocator, options);

        if (pkg.discovering)
        {
            DEBUG.indent(di+1).print("... skip second pass ...");
            DEBUG.indent(di);
            for (var key in resolvedLocator)
                locator[key] = resolvedLocator[key];
            self.finalizeProgram(sandbox, program);
            callback(pkg);
            return;
        }

        pkg.discoverMappings(function assembler_assembleProgram_lambda_addPackageToProgram_packageForLocator(locator, callback)
        {
            program.resolveLocator(self, locator, function(resolvedLocator)
            {
                if (!FILE.exists(resolvedLocator.location))
                {
                    throw new Error("This should not happen");
                }
                else
                {
                    callback(sandbox.ensurePackageForLocator(resolvedLocator, options), resolvedLocator);
                }
            });
            
        }, function assembler_assembleProgram_lambda_addPackageToProgram_done()
        {
            DEBUG.indent(di);
            for (var key in resolvedLocator)
                locator[key] = resolvedLocator[key];
            self.finalizeProgram(sandbox, program);
            callback(pkg);
        });
    });
}

/**
 * When all packages are loaded we need to resolve some IDs to locations.
 */
Assembler.prototype.finalizeProgram = function(sandbox, program)
{
/*
    for (var id in sandbox.packages)
    {
console.log("PACKAGE: " + id);        
console.log(sandbox.packages[id].normalizedDescriptor.json);
    }
*/
/*
NOTE: This should not be here. IDs cannot be resolved this way. Need to use UIDs instead.
    program.descriptor.walkPackages(function(id)
    {
        var pkg = sandbox.packageForId(id);

        if (typeof pkg.normalizedDescriptor != "undefined" && typeof pkg.normalizedDescriptor.walkMappings != "undefined")
        {
            pkg.normalizedDescriptor.walkMappings(function(alias, locator)
            {
                if (typeof locator.location == "undefined" && typeof locator.id != "undefined")
                {
                    var mappedPackage = sandbox.packageForId(locator.id);
                    pkg.normalizedDescriptor.json.mappings[alias].location = mappedPackage.path;
                }
            });
        }
    });
*/
}

Assembler.prototype.provisonProgramForURL = function(url, callback)
{
    var self = this;

    var di = DEBUG.indent();
    DEBUG.print("Provision program package:").indent(di+1);

    function provisonProgram()
    {
        // Fix some URL
        // TODO: Put this into a plugin
        var m = url.match(/^https?:\/\/gist.github.com\/(\d*).*$/);
        if (m)
        {
            url = "https://gist.github.com/gists/" + m[1] + "/download";
        }
    
        DEBUG.print("URL: " + url);
    
        self.downloader.getForArchive(url, function(path)
        {
            DEBUG.print("Path: " + path);
            
            // Look for program.json file. If it does not exist create a default one
            
            var descriptorPath = path + "/program.json";
            
            if (!API.FILE.exists(descriptorPath))
            {
                DEBUG.print("Creating program descriptor at: " + descriptorPath);
                
                var id = API.FILE.dirname(descriptorPath.substring(self.downloader.basePath.length+1));
                id = id.substring(0, id.length-8) + "/";
                
                var descriptor = {
                    "boot": id,
                    "packages": {}
                };
                descriptor.packages[id] = {
                    "locator": {
                        "location": "./"
                    }
                };
    
                API.FILE.write(descriptorPath, API.JSON.stringify(descriptor));
            }

            DEBUG.indent(di);

            callback(descriptorPath);
        });
    }

    if (ENV.mustClean && !this.cleaned[this.downloader.basePath + "/downloads"])
    {
        this.cleaned[this.downloader.basePath + "/downloads"] = true;

        DEBUG.print("Removing downloaded packages from: " + this.downloader.basePath + "/downloads");

        SYSTEM.exec("rm -Rf " + this.downloader.basePath + "/downloads", function(stdout, stderr)
        {
            provisonProgram();
        });
    }
    else
        provisonProgram();    
}

});
__loader__.memoize('bravojs/bravo', function(__require__, module, exports) {
// ######################################################################
// # /bravojs/bravo.js
// ######################################################################
/**
 *  This file implements BravoJS, a CommonJS Modules/2.0 environment.
 *
 *  Copyright (c) 2010, PageMail, Inc.
 *  Wes Garland, wes@page.ca
 *  MIT License
 *
 *    - Initial implementation
 *
 *  Copyright (c) 2011, Christoph Dorn
 *  Christoph Dorn, christoph@christophdorn.com
 *  MIT License
 *
 *    - Added package and mappings support
 *    - Various tweaks
 *
 */

function bravojs_init(bravojs,    /**< Namespace object for this implementation */
                      window)
{
try {

bravojs.window = window;

if (!bravojs.hasOwnProperty("errorReporter"))
{
  bravojs.errorReporter = function bravojs_defaultDrrorReporter(e)
  {
    alert(" * BravoJS: " + e + "\n" + e.stack);
    throw(e);
  }
}

/** Reset the environment so that a new main module can be loaded */
bravojs.reset = function bravojs_reset(mainModuleDir, plugins)
{
  if (!mainModuleDir)
  {
    if (typeof bravojs.mainModuleDir != "undefined")
      mainModuleDir = bravojs.mainModuleDir;
    else
      mainModuleDir = bravojs.dirname(bravojs.URL_toId(window.location.href + ".js", true));
  }

  bravojs.requireMemo 			= {};	/**< Module exports, indexed by canonical name */
  bravojs.pendingModuleDeclarations	= {};	/**< Module.declare arguments, indexed by canonical name */
  bravojs.mainModuleDir 		= mainModuleDir;
  bravojs.plugins = plugins || [];
  bravojs.contexts = {};
  bravojs.activeContexts = [];

  delete bravojs.Module.prototype.main;
  delete bravojs.scriptTagMemo;
  delete bravojs.scriptTagMemoIE;

  /* The default context. Needed before bravojs.Module() can be called. */
  bravojs.makeContext("_");

  /** Extra-module environment */
  bravojs.module = window.module = new bravojs.Module('', []);
  bravojs.require = window.require = bravojs.requireFactory(bravojs.mainModuleDir, [], bravojs.module);

  /* Module.declare function which handles main modules inline SCRIPT tags.
   * This function gets deleted as soon as it runs, allowing the module.declare
   * from the prototype take over. Modules created from this function have
   * the empty string as module.id.
   */
  bravojs.module.declare = function main_module_declare(dependencies, moduleFactory)
  {
    if (typeof dependencies === "function")
    {
      moduleFactory = dependencies;
      dependencies = [];
    }

    bravojs.initializeMainModule(dependencies, moduleFactory, '');
  }
}

/** Print to text to stdout */
function bravojs_print()
{
  var output="";
  var i;
  var stdout;

  for (i=0; i < arguments.length; i++)
    output += arguments[i] + (i===arguments.length - 1 ? "" : " ");
  output.replace(/\t/, "        ");

  if (typeof window.document != "undefined" && (stdout = window.document.getElementById('stdout')))
  {
    output += "\n";

    if (typeof stdout.value !== "undefined")
    {
      stdout.value += output;
      if (stdout.focus)
        stdout.focus();

      if (stdout.tagName === "TEXTAREA")
        stdout.scrollTop = stdout.scrollHeight;
    }
    else
    {
      if (typeof stdout.innerText !== "undefined")
      {
        stdout.innerText = stdout.innerText.slice(0,-1) + output + " "; 	/* IE normalizes trailing newlines away */
      }
      else
        stdout.textContent += output;
    }
  }
  else if (typeof console === "object" && console.print)
  {
    console.print(output);
  }
  else if (typeof console === "object" && console.log)
  {
    console.log(output);
  }
  // WebWorker
  else if (typeof importScripts === "function" && typeof postMessage === "function")
  {
      postMessage({type: "log", data: output});
  }
  else
    alert(" * BravoJS stdout: " + output);
}
if (typeof bravojs.print === "undefined")
    bravojs.print = bravojs_print;

bravojs.registerPlugin = function(plugin)
{
    plugin.bravojs = bravojs;
    bravojs.plugins.push(plugin);
    if (typeof plugin.init == "function")
      plugin.init();
}

bravojs.callPlugins = function(method, args)
{
  var i, ret;
  for (i = 0 ; i < bravojs.plugins.length ; i++ )
  {
    if (typeof bravojs.plugins[i][method] != "undefined" &&
        typeof (ret = bravojs.plugins[i][method].apply(bravojs.plugins[i], args)) != "undefined")
        break;
  }
  return ret;
}

/** Canonicalize path, compacting slashes and dots per basic UNIX rules.
 *  Treats paths with trailing slashes as though they end with INDEX instead.
 *  Not rigorous.
 */
bravojs.realpath = function bravojs_realpath(path, index)
{
  if (typeof index === "undefined")
    index = "INDEX";
  if (typeof path !== "string")
    path = path.toString();

  var oldPath = path.split('/');
  var newPath = [];
  var i;

  if (path.charAt(path.length - 1) === '/' && index)
    oldPath.push(index);

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

/** Extract the non-directory portion of a path */
bravojs.basename = function bravojs_basename(path)
{
  if (typeof path !== "string")
    path = path.toString();

  var s = path.split('/').slice(-1).join('/');
  if (!s)
    return path;
  return s;
}

/** Extract the directory portion of a path */
bravojs.dirname = function bravojs_dirname(path)
{
  if (typeof path !== "string")
    path = path.toString();

  if (path.charAt(path.length - 1) === '/')
    return path.slice(0,-1);

  var s = path.split('/').slice(0,-1).join('/');
  if (!s)
    return ".";

  return s;
}

/** Turn a module identifier and module directory into a canonical
 *  module.id.
 */
bravojs.makeModuleId = function makeModuleId(relativeModuleDir, moduleIdentifier)
{
  return bravojs.contextForId(relativeModuleDir, true).resolveId(moduleIdentifier, relativeModuleDir);
}

/** Turn a script URL into a canonical module.id */
bravojs.URL_toId = function URL_toId(moduleURL, relaxValidation)
{
  var i;

  /* Treat the whole web as our module repository.
   * 'http://www.page.ca/a/b/module.js' has id '/www.page.ca/a/b/module'. 
   */
  i = moduleURL.indexOf("://");
  if (i == -1)
    throw new Error("Invalid module URL: " + moduleURL);
  id = moduleURL.slice(i + 2);

  id = bravojs.realpath(id);
  if ((i = id.indexOf('?')) != -1)
    id = id.slice(0, i);
  if ((i = id.indexOf('#')) != -1)
    id = id.slice(0, i);

  if (!relaxValidation && (id.slice(-3) != ".js"))
    throw new Error("Invalid module URL: " + moduleURL);
  id = id.slice(0,-3);

  return id;
}

/** Normalize a dependency array so that only unique and previously unprovided 
 *  dependencies appear in the output list. The output list also canonicalizes
 *  the module names relative to the current require. Labeled dependencies are
 *  unboxed.
 *  If relativeModuleDir is set it is used to resolve relative dependencies.
 */
bravojs.normalizeDependencyArray = function bravojs_normalizeDependencyArray(dependencies, relativeModuleDir)
{
  var normalizedDependencies = [];
  var i, label;

  function addNormal(moduleIdentifier)
  {
    var id = moduleIdentifier;

    if (typeof id != "string" || id.charAt(0) != "/")
      id = bravojs.contextForId(relativeModuleDir, true).resolveId(id, relativeModuleDir);

    if (id === null)
      return;

    if (bravojs.requireMemo[id] || bravojs.pendingModuleDeclarations[id])
      return;

    normalizedDependencies.push(id);
  }

  for (i=0; i < dependencies.length; i++)
  {
    switch(typeof dependencies[i])
    {
      case "object":
        for (label in dependencies[i])
        {
          if (dependencies[i].hasOwnProperty(label))
            addNormal(dependencies[i][label]);
        }
        break;

      case "string":
        addNormal(dependencies[i]);
        break;

      default:
        throw new Error("Invalid dependency array value at position " + (i+1));
    }
  }

  return normalizedDependencies;
}

/** Get a context for a given module ID used to resolve the ID.
 * Plugins should override this function to provide additional contexts.
 */
bravojs.contextForId = function bravojs_contextForId(id, onlyCreateIfDelimited)
{
  return bravojs.contexts["_"];
}

/** Make a new context used to resolve module IDs. */
bravojs.makeContext = function bravojs_makeContext(id)
{
  return bravojs.contexts[id] = new bravojs.Context(id);
}

/** A Context object used to resolve IDs. */
bravojs.Context = function bravojs_Context(id)
{
  this.id = id;
}

bravojs.Context.prototype.resolveId = function bravojs_Context_resolveId(moduleIdentifier, relativeModuleDir)
{
  var id;

  if (moduleIdentifier === '')  /* Special case for main module */
    return '';

  if (typeof moduleIdentifier !== "string")
    throw new Error("Invalid module identifier: " + moduleIdentifier);

  if (moduleIdentifier.charAt(0) === '/')
  {
    /* Absolute path. Not required by CommonJS but it makes dependency list optimization easier */
    id = moduleIdentifier;
  }
  else
  if ((moduleIdentifier.indexOf("./") == 0) || (moduleIdentifier.indexOf("../") == 0))
  {
    /* Relative module path -- relative to relativeModuleDir */
    id = relativeModuleDir + "/" + moduleIdentifier;
  }
  else
  {
    /* Top-level module. Since we don't implement require.paths,
     *  make it relative to the main module.
     */
    id = bravojs.mainModuleDir + "/" + moduleIdentifier;
  }

  return bravojs.realpath(id);
}

/** Provide a module to the environment 
 *  @param	dependencies		A dependency array
 *  @param	moduleFactoryFunction	The function which will eventually be invoked
 *					to decorate the module's exports. If not specified,
 *					we assume the factory has already been memoized in
 *					the bravojs.pendingModuleDeclarations object.
 *  @param	id			The module.id of the module we're providing
 *  @param	callback		Optional function to run after the module has been
 *					provided to the environment
 */
bravojs.provideModule = function bravojs_provideModule(dependencies, moduleFactory, 
						       id, callback)
{
  /* Memoize the the factory, satistfy the dependencies, and invoke the callback */
  if (moduleFactory)
    bravojs.require.memoize(id, dependencies, moduleFactory);

  if (dependencies)
  {
    bravojs.module.provide(bravojs.normalizeDependencyArray(dependencies, id?bravojs.dirname(id):bravojs.mainModuleDir), callback);
  }
  else
  {
    if (callback)
      callback();
  }
}

/** Initialize a module. This makes the exports object available to require(),
 *  runs the module factory function, and removes the factory function from
 *  the pendingModuleDeclarations object.
 */
bravojs.initializeModule = function bravojs_initializeModule(id)
{
  var moduleDir     = id ? bravojs.dirname(id) : bravojs.mainModuleDir;
  var moduleFactory = bravojs.pendingModuleDeclarations[id].moduleFactory;
  var dependencies  = bravojs.pendingModuleDeclarations[id].dependencies;
  var require, exports, module;

  delete bravojs.pendingModuleDeclarations[id];

  exports = bravojs.requireMemo[id] = {};
  module  = new bravojs.Module(id, dependencies);

  if (typeof module.augment == "function")
    module.augment();

  require = bravojs.requireFactory(moduleDir, dependencies, module);

  moduleFactory(require, exports, module);
}

/** Search the module memo and return the correct module's exports, or throw.
 *  Searching the module memo will initialize a matching pending module factory.
 */
bravojs.requireModule = function bravojs_requireModule(parentModuleDir, moduleIdentifier)
{
  /* Remove all active contexts as they are not needed any more (load cycle complete) */
  bravojs.activeContexts = [];

  var id = bravojs.makeModuleId(parentModuleDir, moduleIdentifier);

  var exports = bravojs.callPlugins("requireModule", [id]);
  if (typeof exports != "undefined")
  {
    if (exports === true)
      return bravojs.requireMemo[id];
    return bravojs.requireMemo[id] = exports;
  }

  if (!bravojs.requireMemo[id] && bravojs.pendingModuleDeclarations[id])
    bravojs.initializeModule(id);

  if (id === null || !bravojs.requireMemo[id])
    throw new Error("Module " + id + " is not available.");

  return bravojs.requireMemo[id];
}

/** Create a new require function, closing over it's path so that relative
 *  modules work as expected.
 */
bravojs.requireFactory = function bravojs_requireFactory(moduleDir, dependencies, module)
{
  var deps, i, label;

  function getContextSensitiveModuleDir()
  {
    var contextId;
    if (bravojs.activeContexts.length > 0)
      contextId = bravojs.activeContexts[bravojs.activeContexts.length-1].id;
    if (typeof contextId == "undefined" || !contextId)
      contextId = moduleDir;
    else
    if (contextId == "_")
      contextId = bravojs.mainModuleDir;
    return contextId;
  }

  function addLabeledDep(moduleIdentifier)
  {
    deps[label] = function bravojs_labeled_dependency() 
    { 
      return bravojs.requireModule(getContextSensitiveModuleDir(), moduleIdentifier);
    }
  }

  if (dependencies)
  {
    for (i=0; i < dependencies.length; i++)
    {
      if (typeof dependencies[i] !== "object")
	continue;

      for (label in dependencies[i])
      {
	if (dependencies[i].hasOwnProperty(label))
	{
	  if (!deps)
	    deps = {};
	  addLabeledDep(dependencies[i][label]);
	}
      }
    }
  }

  var newRequire = function require(moduleIdentifier) 
  {
    if (deps && deps[moduleIdentifier])
      return deps[moduleIdentifier]();
    return bravojs.requireModule(getContextSensitiveModuleDir(), moduleIdentifier);
  };

  var ret = bravojs.callPlugins("newRequire", [{
      module: module,
      deps: deps,
      getContextSensitiveModuleDir: getContextSensitiveModuleDir
  }]);
  if (typeof ret != "undefined")
    newRequire = ret;

  newRequire.paths = [bravojs.mainModuleDir];

  if (typeof bravojs.platform != "undefined")
      newRequire.platform = bravojs.platform;

  newRequire.id = function require_id(moduleIdentifier, unsanitized)
  {
    var contextId = getContextSensitiveModuleDir(),
        context = bravojs.contextForId(contextId, true);
        id = context.resolveId(moduleIdentifier, contextId);
    if (unsanitized)
      return id;
    return bravojs.callPlugins("sanitizeId", [id]) || id;
  }

  newRequire.uri = function require_uri(moduleIdentifierPath)
  {
    throw new Error("NYI - require.uri(moduleIdentifierPath)");
  }

  newRequire.canonicalize = function require_canonicalize(moduleIdentifier)
  {
    var id = bravojs.makeModuleId(getContextSensitiveModuleDir(), moduleIdentifier);

    if (id === '')
      throw new Error("Cannot canonically name the resource bearing this main module");

    return window.location.protocol + "/" + id + ".js";
  }

  newRequire.memoize = function require_memoize(id, dependencies, moduleFactory)
  {
    bravojs.pendingModuleDeclarations[id] = { moduleFactory: moduleFactory, dependencies: dependencies };
  }

  newRequire.isMemoized = function require_isMemoized(id)
  {
    return (bravojs.pendingModuleDeclarations[id] || bravojs.requireMemo[id]) ? true : false;
  }

  newRequire.getMemoized = function require_getMemoized(id)
  {
    return bravojs.pendingModuleDeclarations[id] || bravojs.requireMemo[id];
  }

  bravojs.callPlugins("augmentNewRequire", [newRequire, {
      module: module,
      getContextSensitiveModuleDir: getContextSensitiveModuleDir
  }]);

  return newRequire;
}

/** Module object constructor 
 *
 *  @param	id		The canonical module id
 *  @param	dependencies	The dependency list passed to module.declare
 */
bravojs.Module = function bravojs_Module(id, dependencies)
{
  this._id       = id;
  this.id        = bravojs.callPlugins("sanitizeId", [id]) || id;
  this["protected"] = void 0;
  this.dependencies = dependencies;
  this.print = bravojs.print;

  var i, label;

  /* Create module.deps array */
  this.deps = {};

  for (i=0; i < dependencies.length; i++)
  {
    if (typeof dependencies[i] === "string")
      continue;

    if (typeof dependencies[i] !== "object")
      throw new Error("Invalid " + typeof dependencies[i] + " element in dependency array at position " + i);

    /* Labeled dependency object */
    for (label in dependencies[i])
    {
      if (dependencies[i].hasOwnProperty(label))
      {
        this.deps[label] = function bravojs_lambda_module_deps() 
        {
          bravojs.requireModule(bravojs.dirname(id), dependencies[i][label]);
        };
      }
    }
  }
}

/** A module.declare suitable for use during DOM SCRIPT-tag insertion.
 * 
 *  The general technique described below was invented by Kris Zyp.
 *
 *  In non-IE browsers, the script's onload event fires as soon as the 
 *  script finishes running, so we just memoize the declaration without
 *  doing anything. After the script is loaded, we do the "real" work
 *  as the onload event also supplies the script's URI, which we use
 *  to generate the canonical module id.
 * 
 *  In IE browsers, the event can fire when the tag is being inserted
 *  in the DOM, or sometime thereafter. In the first case, we read a 
 *  memo we left behind when we started inserting the tag; in the latter,
 *  we look for interactive scripts.
 *
 *  Event			Action		
 *  -------------------------   ------------------------------------------------------------------------------------
 *  Inject Script Tag		onload event populated with URI
 *				scriptTagMemo populated with URI
 *  IE pulls from cache		cname derived in module.declare from scriptTagMemo, invoke provideModule
 *  IE pulls from http		cname derived in module.declare from script.src, invoke provideModule
 *  Non-IE loads script		onload event triggered, most recent incomplete module.declare is completed, 
 *				deriving the cname from the onload event.
 */
bravojs.Module.prototype.declare = function bravojs_Module_declare(dependencies, moduleFactory)
{
  var stm;

  if (typeof dependencies === "function")
  {
    moduleFactory = dependencies;
    dependencies = [];
  }

  stm = bravojs.scriptTagMemo;
  if (stm && stm.id === '')		/* Static HTML module */
  {
    delete bravojs.scriptTagMemo;
    bravojs.provideModule(dependencies, moduleFactory, stm.id, stm.callback);    
    return;
  }

  if (stm)
    throw new Error("Bug");

  if (document.addEventListener)	/* non-IE, defer work to script's onload event which will happen immediately */
  {
    bravojs.scriptTagMemo = { dependencies: dependencies, moduleFactory: moduleFactory };
    return;
  }

  stm = bravojs.scriptTagMemoIE;
  delete bravojs.scriptTagMemoIE;

  if (stm && stm.id) 			/* IE, pulling from cache */
  {
    bravojs.provideModule(dependencies, moduleFactory, stm.id, stm.callback);
    return;
  }

  /* Assume IE fetching from remote */
  var scripts = document.getElementsByTagName("SCRIPT");
  var i;

  for (i = 0; i < scripts.length; i++)
  {
    if (scripts[i].readyState === "interactive")
    {
      bravojs.provideModule(dependencies, moduleFactory, bravojs.URL_toId(scripts[i].src), stm.callback);
      return;
    }
  }

  throw new Error("Could not determine module's canonical name from script-tag loader");
}

/** A module.provide suitable for a generic web-server back end.  Loads one module at
 *  a time in continuation-passing style, eventually invoking the passed callback.
 * 
 *  A more effecient function could be written to take advantage of a web server
 *  which might aggregate and transport more than one module per HTTP request.
 *
 *  @param	dependencies	A dependency array
 *  @param	callback	The callback to invoke once all dependencies have been
 *				provided to the environment. Optional.
 */
bravojs.Module.prototype.provide = function bravojs_Module_provide(dependencies, callback)
{
  var self = arguments.callee;

  if ((typeof dependencies !== "object") || (dependencies.length !== 0 && !dependencies.length))
    throw new Error("Invalid dependency array: " + dependencies.toString());

  dependencies = bravojs.normalizeDependencyArray(dependencies, (this._id)?this._id:bravojs.mainModuleDir);

  if (dependencies.length === 0)
  {
    if (callback)
      callback();
    return;
  }

  bravojs.activeContexts.push(bravojs.contextForId(dependencies[0], true));

  bravojs.module.load(dependencies[0], function bravojs_lambda_provideNextDep() { self(dependencies.slice(1), callback) });

  bravojs.activeContexts.pop();
}

/** A module.load suitable for a generic web-server back end. The module is
 *  loaded by injecting a SCRIPT tag into the DOM.
 *
 *  @param	moduleIdentifier	Module to load
 *  @param	callback		Callback to invoke when the module has loaded.
 *
 *  @see	bravojs_Module_declare
 */
bravojs.Module.prototype.load = function bravojs_Module_load(moduleIdentifier, callback)
{
  if (window.module.hasOwnProperty("declare"))
    delete window.module.declare;

  var script = document.createElement('SCRIPT');
  script.setAttribute("type","text/javascript");
  script.setAttribute("src", bravojs.require.canonicalize(moduleIdentifier) + "?1");

  if (document.addEventListener)	/* Non-IE; see bravojs_Module_declare */
  {
    script.onload = function bravojs_lambda_script_onload()
    {
      /* stm contains info from recently-run module.declare() */
      var stm = bravojs.scriptTagMemo;
      if (typeof stm === "undefined")
        throw new Error("Module '" + moduleIdentifier + "' did not invoke module.declare!");

      delete bravojs.scriptTagMemo;

      if (typeof moduleIdentifier == "object")
      {
        /* The id is a mapping locator and needs to be resolved. */
        moduleIdentifier = bravojs.makeModuleId(bravojs.mainModuleDir, moduleIdentifier);
      }

      bravojs.activeContexts.push(bravojs.contextForId(moduleIdentifier, true));

      bravojs.provideModule(stm.dependencies, stm.moduleFactory, bravojs.require.id(moduleIdentifier, true), function()
      {
        callback(moduleIdentifier);
      });

      bravojs.activeContexts.pop();
    }

    script.onerror = function bravojs_lambda_script_onerror() 
    { 
      var id = bravojs.require.id(moduleIdentifier, true);
      bravojs.pendingModuleDeclarations[id] = null;	/* Mark null so we don't try to run, but also don't try to reload */
      callback();
    }
  }
  else
  {
    bravojs.scriptTagMemoIE = { moduleIdentifier: moduleIdentifier, callback: callback };

    script.onreadystatechange = function bravojs_lambda_script_onreadystatechange()
    {
      if (this.readyState != "loaded")
        return;

      /* failed load below */
      var id = bravojs.require.id(moduleIdentifier, true);

      if (!bravojs.pendingModuleDeclarations[id] && !bravojs.requireMemo[id] && id === bravojs.scriptTagMemoIE.moduleIdentifier)
      {
        bravojs.pendingModuleDeclarations[id] = null;	/* Mark null so we don't try to run, but also don't try to reload */
        callback();
      }
    }
  }

  document.getElementsByTagName("HEAD")[0].appendChild(script);
}

bravojs.Module.prototype.eventually = function(cb) { cb(); };

/** Shim the environment to have CommonJS ES-5 requirements (if needed),
 *  the execute the callback
 */
bravojs.es5_shim_then = function bravojs_es5_shim_then(callback)
{
  if (!Array.prototype.indexOf)
  {
    /* Load ES-5 shim into the environment before executing the main module */
    var script = document.createElement('SCRIPT');
    script.setAttribute("type","text/javascript");
    script.setAttribute("src", bravojs.dirname(bravojs.url) + "/global-es5.js?1");

    if (document.addEventListener)
      script.onload = callback;
    else
    {
      script.onreadystatechange = function() 
      {
	if (this.readyState === "loaded")
	  callback();
      }
    }

    document.getElementsByTagName("HEAD")[0].appendChild(script);
  }
  else
  {
    callback();
  }
}

/** Reload a module, violating the CommonJS singleton paradigm and
 *  potentially introducing bugs in to the program using this function --
 *  as references to the previous instance of the module may still be
 *  held by the application program.
 */
bravojs.reloadModule = function(id, callback)
{
  delete bravojs.pendingModuleDeclarations[id];
  delete bravojs.requireMemo[id];
  bravojs.module.provide([id], callback);
}

/** Main module bootstrap */
bravojs.initializeMainModule = function bravojs_initializeMainModule(dependencies, moduleFactory, moduleIdentifier)
{
  if (bravojs.module.hasOwnProperty("declare"))		/* special extra-module environment bootstrap declare needs to go */
    delete bravojs.module.declare;

  if (bravojs.module.constructor.prototype.main)
    throw new Error("Main module has already been initialized!");

  bravojs.es5_shim_then
  (
    (function() 
     {
       bravojs.provideModule(dependencies, moduleFactory, moduleIdentifier, function bravojs_lambda_requireMain() { bravojs.module.constructor.prototype.main = bravojs.require(moduleIdentifier); })
     })
  ); 
}

/** Run a module which is not declared in the HTML document and make it the program module.
 *  @param	dependencies		[optional]	A list of dependencies to sastify before running the mdoule
 *  @param	moduleIdentifier	moduleIdentifier, relative to dirname(window.location.href). This function
 *					adjusts the module path such that the program module's directory is the
 *					top-level module directory before the dependencies are resolved.
 *  @param	callback		[optional]	Callback to invoke once the main module has been initialized
 */
bravojs.runExternalMainModule = function bravojs_runExternalProgram(dependencies, moduleIdentifier, callback)
{
  if (arguments.length === 1 || typeof moduleIdentifier === "function")
  {
    callback = moduleIdentifier;
    moduleIdentifier = dependencies;
    dependencies = [];
  }

  delete bravojs.module.declare;

  if (moduleIdentifier.charAt(0) === '/')
    bravojs.mainModuleDir = bravojs.dirname(moduleIdentifier);
  else
    bravojs.mainModuleDir = bravojs.dirname(bravojs.URL_toId(window.location.href + ".js"), true) + "/" + bravojs.dirname(moduleIdentifier);

  moduleIdentifier = bravojs.basename(moduleIdentifier);

  bravojs.es5_shim_then(
      function() {
	bravojs.module.provide(dependencies.concat([moduleIdentifier]), 
		       function bravojs_runMainModule() {
			 bravojs.initializeMainModule(dependencies, '', moduleIdentifier);
			 if (callback)
			   callback(); 
		       })
	    });
}

bravojs.reset();

if (typeof bravojs.url === "undefined")
{
/** Set the BravoJS URL, so that BravoJS can load components
 *  relative to its install dir.  The HTML script element that
 *  loads BravoJS must either have the ID BravoJS, or be the
 *  very first script in the document.
 */ 
(function bravojs_setURL()
{
  var i;
  var checkBasename = false;
  var script;

  script = document.getElementById("BravoJS");
  if (!script)
  {
    checkBasename = true;
    script = document.getElementsByTagName("SCRIPT")[0];
  }

  bravojs.url = script.src;
  i = bravojs.url.indexOf("?");
  if (i !== -1)
    bravojs.url = bravojs.url.slice(0,i);
  i = bravojs.url.indexOf("#");
  if (i !== -1)
    bravojs.url = bravojs.url.slice(0,i);

  if (checkBasename && bravojs.basename(bravojs.url) !== "bravo.js")
    throw new Error("Could not determine BravoJS URL. BravoJS must be the first script, or have id='BravoJS'");
})();
}

/** Diagnostic Aids */
var print   = bravojs.print;
if (!window.onerror)
{
  window.onerror = function window_onerror(message, url, line) 
  { 
    var scripts, i;

    print("\n * Error: " + message + "\n" + 
          "      in: " + url + "\n" + 
          "    line: " + line);  
  }
}

} catch(e) { bravojs.errorReporter(e); }

}

if (typeof exports !== "undefined")
{
    exports.BravoJS = function(context)
    {
        context = context || {};

        var window = {
            location: {
                protocol: "memory:",
                href: "memory:/" + ((typeof context.mainModuleDir != "undefined")?context.mainModuleDir:"/bravojs/")
            }
        };

        var bravojs = {
            mainModuleDir: context.mainModuleDir || void 0,
            platform: context.platform || void 0,
            url: window.location.href,
            print: (context.api && context.api.system && context.api.system.print) || void 0,
            errorReporter: (context.api && context.api.errorReporter) || void 0,
            XMLHttpRequest: (context.api && context.api.XMLHttpRequest) || void 0,
            DEBUG: context.DEBUG || void 0
        };

        bravojs_init(bravojs, window);

        context.bravojs = bravojs;
    }
}
else
{
    if (typeof bravojs === "undefined")
      bravojs = {};
    bravojs_init(bravojs, (typeof window != "undefined")?window:this);
}

});
__loader__.memoize('bravojs/global-es5', function(__require__, module, exports) {
// ######################################################################
// # /bravojs/global-es5.js
// ######################################################################

// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson
// dantman Daniel Friesen

/*!
    Copyright (c) 2009, 280 North Inc. http://280north.com/
    MIT License. http://github.com/280north/narwhal/blob/master/README.md
*/

// Brings an environment as close to ECMAScript 5 compliance
// as is possible with the facilities of erstwhile engines.

// ES5 Draft
// http://www.ecma-international.org/publications/files/drafts/tc39-2009-050.pdf

// NOTE: this is a draft, and as such, the URL is subject to change.  If the
// link is broken, check in the parent directory for the latest TC39 PDF.
// http://www.ecma-international.org/publications/files/drafts/

// Previous ES5 Draft
// http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf
// This is a broken link to the previous draft of ES5 on which most of the
// numbered specification references and quotes herein were taken.  Updating
// these references and quotes to reflect the new document would be a welcome
// volunteer project.

//
// Array
// =====
//

// ES5 15.4.3.2 
if (!Array.isArray) {
    Array.isArray = function(obj) {
        return Object.prototype.toString.call(obj) == "[object Array]";
    };
}

// ES5 15.4.4.18
if (!Array.prototype.forEach) {
    Array.prototype.forEach =  function(block, thisObject) {
        var len = this.length >>> 0;
        for (var i = 0; i < len; i++) {
            if (i in this) {
                block.call(thisObject, this[i], i, this);
            }
        }
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

// ES5 15.4.4.20
if (!Array.prototype.filter) {
    Array.prototype.filter = function (block /*, thisp */) {
        var values = [];
        var thisp = arguments[1];
        for (var i = 0; i < this.length; i++)
            if (block.call(thisp, this[i]))
                values.push(this[i]);
        return values;
    };
}

// ES5 15.4.4.16
if (!Array.prototype.every) {
    Array.prototype.every = function (block /*, thisp */) {
        var thisp = arguments[1];
        for (var i = 0; i < this.length; i++)
            if (!block.call(thisp, this[i]))
                return false;
        return true;
    };
}

// ES5 15.4.4.17
if (!Array.prototype.some) {
    Array.prototype.some = function (block /*, thisp */) {
        var thisp = arguments[1];
        for (var i = 0; i < this.length; i++)
            if (block.call(thisp, this[i]))
                return true;
        return false;
    };
}

// ES5 15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(fun /*, initial*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value and an empty array
        if (len == 0 && arguments.length == 1)
            throw new TypeError();

        var i = 0;
        if (arguments.length >= 2) {
            var rv = arguments[1];
        } else {
            do {
                if (i in this) {
                    rv = this[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= len)
                    throw new TypeError();
            } while (true);
        }

        for (; i < len; i++) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }

        return rv;
    };
}

// ES5 15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function(fun /*, initial*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value, empty array
        if (len == 0 && arguments.length == 1)
            throw new TypeError();

        var i = len - 1;
        if (arguments.length >= 2) {
            var rv = arguments[1];
        } else {
            do {
                if (i in this) {
                    rv = this[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError();
            } while (true);
        }

        for (; i >= 0; i--) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }

        return rv;
    };
}

// ES5 15.4.4.14
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (value /*, fromIndex */ ) {
        var length = this.length;
        if (!length)
            return -1;
        var i = arguments[1] || 0;
        if (i >= length)
            return -1;
        if (i < 0)
            i += length;
        for (; i < length; i++) {
            if (!Object.prototype.hasOwnProperty.call(this, i))
                continue;
            if (value === this[i])
                return i;
        }
        return -1;
    };
}

// ES5 15.4.4.15
if (!Array.prototype.lastIndexOf) {
    Array.prototype.lastIndexOf = function (value /*, fromIndex */) {
        var length = this.length;
        if (!length)
            return -1;
        var i = arguments[1] || length;
        if (i < 0)
            i += length;
        i = Math.min(i, length - 1);
        for (; i >= 0; i--) {
            if (!Object.prototype.hasOwnProperty.call(this, i))
                continue;
            if (value === this[i])
                return i;
        }
        return -1;
    };
}

//
// Object
// ======
// 

// ES5 15.2.3.2
if (!Object.getPrototypeOf) {
    Object.getPrototypeOf = function (object) {
        return object.__proto__;
        // or undefined if not available in this engine
    };
}

// ES5 15.2.3.3
if (!Object.getOwnPropertyDescriptor) {
    Object.getOwnPropertyDescriptor = function (object) {
        return {}; // XXX
    };
}

// ES5 15.2.3.4
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function (object) {
        return Object.keys(object);
    };
}

// ES5 15.2.3.5 
if (!Object.create) {
    Object.create = function(prototype, properties) {
        if (typeof prototype != "object" || prototype === null)
            throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
        function Type() {};
        Type.prototype = prototype;
        var object = new Type();
        if (typeof properties !== "undefined")
            Object.defineProperties(object, properties);
        return object;
    };
}

// ES5 15.2.3.6
if (!Object.defineProperty) {
    Object.defineProperty = function(object, property, descriptor) {
        var has = Object.prototype.hasOwnProperty;
        if (typeof descriptor == "object" && object.__defineGetter__) {
            if (has.call(descriptor, "value")) {
                if (!object.__lookupGetter__(property) && !object.__lookupSetter__(property))
                    // data property defined and no pre-existing accessors
                    object[property] = descriptor.value;
                if (has.call(descriptor, "get") || has.call(descriptor, "set"))
                    // descriptor has a value property but accessor already exists
                    throw new TypeError("Object doesn't support this action");
            }
            // fail silently if "writable", "enumerable", or "configurable"
            // are requested but not supported
            /*
            // alternate approach:
            if ( // can't implement these features; allow false but not true
                !(has.call(descriptor, "writable") ? descriptor.writable : true) ||
                !(has.call(descriptor, "enumerable") ? descriptor.enumerable : true) ||
                !(has.call(descriptor, "configurable") ? descriptor.configurable : true)
            )
                throw new RangeError(
                    "This implementation of Object.defineProperty does not " +
                    "support configurable, enumerable, or writable."
                );
            */
            else if (typeof descriptor.get == "function")
                object.__defineGetter__(property, descriptor.get);
            if (typeof descriptor.set == "function")
                object.__defineSetter__(property, descriptor.set);
        }
        return object;
    };
}

// ES5 15.2.3.7
if (!Object.defineProperties) {
    Object.defineProperties = function(object, properties) {
        for (var property in properties) {
            if (Object.prototype.hasOwnProperty.call(properties, property))
                Object.defineProperty(object, property, properties[property]);
        }
        return object;
    };
}

// ES5 15.2.3.8
if (!Object.seal) {
    Object.seal = function (object) {
        return object;
    };
}

// ES5 15.2.3.9
if (!Object.freeze) {
    Object.freeze = function (object) {
        return object;
    };
}

// ES5 15.2.3.10
if (!Object.preventExtensions) {
    Object.preventExtensions = function (object) {
        return object;
    };
}

// ES5 15.2.3.11
if (!Object.isSealed) {
    Object.isSealed = function (object) {
        return false;
    };
}

// ES5 15.2.3.12
if (!Object.isFrozen) {
    Object.isFrozen = function (object) {
        return false;
    };
}

// ES5 15.2.3.13
if (!Object.isExtensible) {
    Object.isExtensible = function (object) {
        return true;
    };
}

// ES5 15.2.3.14
if (!Object.keys) {
    Object.keys = function (object) {
        var keys = [];
        for (var name in object) {
            if (Object.prototype.hasOwnProperty.call(object, name)) {
                keys.push(name);
            }
        }
        return keys;
    };
}

//
// Date
// ====
//

// ES5 15.9.5.43
// Format a Date object as a string according to a subset of the ISO-8601 standard.
// Useful in Atom, among other things.
if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function() {
        return (
            this.getFullYear() + "-" +
            (this.getMonth() + 1) + "-" +
            this.getDate() + "T" +
            this.getHours() + ":" +
            this.getMinutes() + ":" +
            this.getSeconds() + "Z"
        ); 
    }
}

// ES5 15.9.4.4
if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

// ES5 15.9.5.44
if (!Date.prototype.toJSON) {
    Date.prototype.toJSON = function (key) {
        // This function provides a String representation of a Date object for
        // use by JSON.stringify (15.12.3). When the toJSON method is called
        // with argument key, the following steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be ToPrimitive(O, hint Number).
        // 3. If tv is a Number and is not finite, return null.
        // XXX
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (typeof this.toISOString != "function")
            throw new TypeError();
        // 6. Return the result of calling the [[Call]] internal method of
        // toISO with O as the this value and an empty argument list.
        return this.toISOString();

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// 15.9.4.2 Date.parse (string)
// 15.9.1.15 Date Time String Format
// Date.parse
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
if (isNaN(Date.parse("T00:00"))) {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    Date = (function(NativeDate) {

        // Date.length === 7
        var Date = function(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            if (this instanceof NativeDate) {
                var date = length === 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(Date.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
                // Prevent mixups with unfixed Date object
                date.constructor = Date;
                return date;
            }
            return NativeDate.apply(this, arguments);
        };

        // 15.9.1.15 Date Time String Format
        var isoDateExpression = new RegExp("^" +
            "(?:" + // optional year-month-day
                "(" + // year capture
                    "(?:[+-]\\d\\d)?" + // 15.9.1.15.1 Extended years
                    "\\d\\d\\d\\d" + // four-digit year
                ")" +
                "(?:-" + // optional month-day
                    "(\\d\\d)" + // month capture
                    "(?:-" + // optional day
                        "(\\d\\d)" + // day capture
                    ")?" +
                ")?" +
            ")?" + 
            "(?:T" + // hour:minute:second.subsecond
                "(\\d\\d)" + // hour capture
                ":(\\d\\d)" + // minute capture
                "(?::" + // optional :second.subsecond
                    "(\\d\\d)" + // second capture
                    "(?:\\.(\\d\\d\\d))?" + // milisecond capture
                ")?" +
            ")?" +
            "(?:" + // time zone
                "Z|" + // UTC capture
                "([+-])(\\d\\d):(\\d\\d)" + // timezone offset
                // capture sign, hour, minute
            ")?" +
        "$");

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate)
            Date[key] = NativeDate[key];

        // Copy "native" methods explicitly; they may be non-enumerable
        Date.now = NativeDate.now;
        Date.UTC = NativeDate.UTC;
        Date.prototype = NativeDate.prototype;
        Date.prototype.constructor = Date;

        // Upgrade Date.parse to handle the ISO dates we use
        // TODO review specification to ascertain whether it is
        // necessary to implement partial ISO date strings.
        Date.parse = function(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                match.shift(); // kill match[0], the full match
                // recognize times without dates before normalizing the
                // numeric values, for later use
                var timeOnly = match[0] === undefined;
                // parse numerics
                for (var i = 0; i < 10; i++) {
                    // skip + or - for the timezone offset
                    if (i === 7)
                        continue;
                    // Note: parseInt would read 0-prefix numbers as
                    // octal.  Number constructor or unary + work better
                    // here:
                    match[i] = +(match[i] || (i < 3 ? 1 : 0));
                    // match[1] is the month. Months are 0-11 in JavaScript
                    // Date objects, but 1-12 in ISO notation, so we
                    // decrement.
                    if (i === 1)
                        match[i]--;
                }
                // if no year-month-date is provided, return a milisecond
                // quantity instead of a UTC date number value.
                if (timeOnly)
                    return ((match[3] * 60 + match[4]) * 60 + match[5]) * 1000 + match[6];

                // account for an explicit time zone offset if provided
                var offset = (match[8] * 60 + match[9]) * 60 * 1000;
                if (match[6] === "-")
                    offset = -offset;

                return NativeDate.UTC.apply(this, match.slice(0, 7)) + offset;
            }
            return NativeDate.parse.apply(this, arguments);
        };

        return Date;
    })(Date);
}

// 
// Function
// ========
// 

// ES-5 15.3.4.5
// http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf
var slice = Array.prototype.slice;
if (!Function.prototype.bind) {
    Function.prototype.bind = function (that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        // XXX this gets pretty close, for all intents and purposes, letting 
        // some duck-types slide
        if (typeof target.apply != "function" || typeof target.call != "function")
            return new TypeError();
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        var args = slice.call(arguments);
        // 4. Let F be a new native ECMAScript object.
        // 9. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 10. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 11. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 12. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        // 13. The [[Scope]] internal property of F is unused and need not
        //   exist.
        var bound = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.

                var self = Object.create(target.prototype);
                target.apply(self, args.concat(slice.call(arguments)));
                return self;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the list
                //   boundArgs in the same order followed by the same values as
                //   the list ExtraArgs in the same order. 5.  Return the
                //   result of calling the [[Call]] internal method of target
                //   providing boundThis as the this value and providing args
                //   as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.call.apply(
                    target,
                    args.concat(slice.call(arguments))
                );

            }

        };
        // 5. Set the [[TargetFunction]] internal property of F to Target.
        // extra:
        bound.bound = target;
        // 6. Set the [[BoundThis]] internal property of F to the value of
        // thisArg.
        // extra:
        bound.boundTo = that;
        // 7. Set the [[BoundArgs]] internal property of F to A.
        // extra:
        bound.boundArgs = args;
        bound.length = (
            // 14. If the [[Class]] internal property of Target is "Function", then
            typeof target == "function" ?
            // a. Let L be the length property of Target minus the length of A.
            // b. Set the length own property of F to either 0 or L, whichever is larger.
            Math.max(target.length - args.length, 0) :
            // 15. Else set the length own property of F to 0.
            0
        )
        // 16. The length own property of F is given attributes as specified in
        //   15.3.5.1.
        // TODO
        // 17. Set the [[Extensible]] internal property of F to true.
        // TODO
        // 18. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Value]]: null,
        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:
        //   false}, and false.
        // TODO
        // 19. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Value]]: null,
        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:
        //   false}, and false.
        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property.
        // XXX can't delete it in pure-js.
        return bound;
    };
}

//
// String
// ======
//

// ES5 15.5.4.20
if (!String.prototype.trim) {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    var trimBeginRegexp = /^\s\s*/;
    var trimEndRegexp = /\s\s*$/;
    String.prototype.trim = function () {
        return String(this).replace(trimBeginRegexp, '').replace(trimEndRegexp, '');
    };
}


});
__loader__.memoize('bravojs/plugins/packages/loader', function(__require__, module, exports) {
// ######################################################################
// # /bravojs/plugins/packages/loader.js
// ######################################################################
/**
 *  This file implements a bravojs core plugin to add
 *  dynamic module and package loading support where the server
 *  given a module or package ID will return the requested
 *  module (main module for package) and all dependencies
 *  in a single file.
 *
 *  Copyright (c) 2011, Christoph Dorn
 *  Christoph Dorn, christoph@christophdorn.com
 *  MIT License
 *
 *  To use: Load BravoJS, then layer this plugin in
 *  by loading it into the extra-module environment.
 */

(function packages_loader() {

bravojs.module.constructor.prototype.load = function packages_loader_load(moduleIdentifier, callback)
{
    var uri;

    if (typeof moduleIdentifier == "object")
    {
        if (typeof moduleIdentifier.location != "undefined")
        {
            uri = bravojs.mainModuleDir + "/package" + moduleIdentifier.location.substring(bravojs.mainModuleDir.length);
        }
        else
            throw new Error("NYI");
    }
    else
    if (moduleIdentifier.charAt(0) != "/")
    {
        throw new Error("Cannot load module by relative ID: " + moduleIdentifier);
    }
    else
    {
        uri = bravojs.mainModuleDir + "/module" + moduleIdentifier.substring(bravojs.mainModuleDir.length);
    }

    // Encode ../ as we need to preserve them (servers/browsers will automatically normalize these directory up path segments)
    uri = uri.replace(/\.{2}\//g, "__/");

    // WebWorker
    if (typeof importScripts === "function")
    {
        // Remove hostname
        uri = uri.replace(/^\/[^\/]*\//, "/");

        importScripts(uri);
        
        if (typeof __bravojs_loaded_moduleIdentifier == "undefined")
            throw new Error("__bravojs_loaded_moduleIdentifier not set by server!");

        var id = __bravojs_loaded_moduleIdentifier;

        delete __bravojs_loaded_moduleIdentifierl

        // all modules are memoized now so we can continue
        callback(id);
        return;
    }

    var URL = window.location.protocol + "/" + uri;

    // We expect a bunch of modules wrapped with:
    //  require.memoize('ID', [], function (require, exports, module) { ... });

    var script = document.createElement('SCRIPT');
    script.setAttribute("type","text/javascript");
    script.setAttribute("src", URL);

    /* Fake script.onload for IE6-8 */
    script.onreadystatechange = function()
    {
        var cb;        
        if (this.readyState === "loaded")
        {
            cb = this.onload;
            this.onload = null;
            setTimeout(cb,0);
        }
    }

    script.onload = function packages_loader_onload()
    {
        this.onreadystatechange = null;
        
        if (typeof window.__bravojs_loaded_moduleIdentifier == "undefined")
            throw new Error("__bravojs_loaded_moduleIdentifier not set by server!");
        
        var id = window.__bravojs_loaded_moduleIdentifier;
        
        delete window.__bravojs_loaded_moduleIdentifierl

        // all modules are memoized now so we can continue
        callback(id);
    }
    
    /* Supply errors on browsers that can */
    script.onerror = function fastload_script_error()
    {
        if (typeof console != "undefined")
            console.error("Error contacting server URL = " + script.src);
        else
            alert("Error contacting server\nURL=" + script.src);
    }

    document.getElementsByTagName("HEAD")[0].appendChild(script);
};

})();

});
__loader__.memoize('bravojs/plugins/packages/packages', function(__require__, module, exports) {
// ######################################################################
// # /bravojs/plugins/packages/packages.js
// ######################################################################
/**
 *  This file implements a bravojs core plugin to add
 *  package and package mappings support.
 *
 *  Copyright (c) 2011, Christoph Dorn
 *  Christoph Dorn, christoph@christophdorn.com
 *  MIT License
 *
 *  To use: Load BravoJS, then layer this plugin in
 *  by loading it into the extra-module environment.
 */

(function packages() {

var Plugin = function()
{
}

Plugin.prototype.init = function()
{
    var bravojs = this.bravojs;

    /** Get a context for a given module ID used to resolve the ID. If a package
     *  prefix is found a context specific to the package is returned, otherwise
     *  the default context is returned.
     */
    bravojs.contextForId = function packages_bravojs_contextForId(id, onlyCreateIfDelimited)
    {
        if (typeof id == "undefined")
            return bravojs.contexts["_"];

        id = id.replace(/^\w*!/, "");

        var parts = id.split("@/"),
            id = parts[0];

        if (/@$/.test(id))
            id = id.substring(0, id.length-1);

        var ret = bravojs.callPlugins("contextForId", [id]);
        if (typeof ret != "undefined")
            id = ret;

        if (parts.length == 1 && typeof bravojs.contexts[id] != "undefined")
            return bravojs.contexts[id];

        if (typeof bravojs.contexts[id] == "undefined")
        {
            if (onlyCreateIfDelimited === true && parts.length == 1)
                return bravojs.contexts["_"];

            bravojs.makeContext(id);
        }

        return bravojs.contexts[id];
    };

    bravojs.hasContextForId = function packages_bravojs_hasContext(id)
    {
        id = id.replace(/^\w*!/, "");
        var parts = id.split("@/");
        if (parts.length == 2)
            id = parts[0];
        if (/@$/.test(id))
            id = id.substring(0, id.length-1);
        return (typeof bravojs.contexts[id] != "undefined");
    }

    bravojs.makeContext = function packages_bravojs_makeContext(id)
    {
        id = id.replace(/^\w*!/, "");
        bravojs.contexts[id] = new bravojs.Context(id);
        /* The id so far is path-based. If the context/package descriptor specifies a UID we map
         * the same context to the UID as well.
         */
        if (typeof bravojs.contexts[id].uid != "undefined")
           bravojs.contexts[bravojs.contexts[id].uid] = bravojs.contexts[id];
        return bravojs.contexts[id];
    }

    bravojs.Context = function packages_bravojs_Context(id)
    {
        this.id = id;

        // We do not need to do anything for the default context
        if (this.id == "_")
            return;

        id = this.id + "@/package.json";

        if (bravojs.require.isMemoized(id))
        {
            this.descriptor = bravojs.require.getMemoized(id).moduleFactory();
        }
        else
        {
            this.descriptor = bravojs.callPlugins("loadPackageDescriptor", [id]);
            var self = this;
            bravojs.require.memoize(id, [], function()
            {
                return self.descriptor;
            });
        }

        this.libDir = this.descriptor.directories && this.descriptor.directories.lib;
        if (typeof this.libDir != "string")
            this.libDir = "lib";
    
        this.uid = this.descriptor.uid || void 0;
        if (typeof this.uid != "undefined")
        {
            var m = this.uid.match(/^https?:\/\/(.*)$/);
            if (!m)
                throw new Error("uid property '" + this.uid + "' must be a non-resolving or resolving URL with http or https protocol in: " + id);
            this.uid = m[1];  // strip the protocol prefix
        }
    }

    /** Get a map where labels point to package IDs for all declared mappings */
    bravojs.Context.prototype.getNormalizedMappings = function packages_bravojs_Context_getNormalizedMappings()
    {
        if (this.id == "_")
            throw new Error("Cannot get mappings for default context");
    
        if (typeof this.normalizedMappings != "undefined")
            return this.normalizedMappings;

        this.normalizedMappings = {};

        if (typeof this.descriptor.mappings != "undefined")
        {
            for (var label in this.descriptor.mappings)
            {
                this.normalizedMappings[label] = bravojs.callPlugins("normalizeLocator", [this.descriptor.mappings[label], this]).location;
            }
        }
        return this.normalizedMappings;
    }

    bravojs.Context.prototype.resolveId = function packages_bravojs_Context_resolveId(moduleIdentifier, relativeModuleDir, descriptor)
    {
        // Pull out plugin if applicable
        var plugin;
        if (typeof moduleIdentifier == "string")
        {
            var m = moduleIdentifier.match(/^(\w*)!(.*)$/);
            if (m)
            {
                plugin = m[1];
                moduleIdentifier = m[2];
            }
        }

        try {
            var ret = bravojs.callPlugins("normalizeModuleIdentifier", [moduleIdentifier, relativeModuleDir, descriptor, this]);
            if (typeof ret != "undefined")
                moduleIdentifier = ret;
        }
        catch(e)
        {
            var mappings = (typeof this.descriptor.mappings != "undefined")?JSON.stringify(this.descriptor.mappings):"{}";            
            throw new Error(e.stack + "\nUnable to resolve moduleIdentifier '" + JSON.stringify(moduleIdentifier) + "' against context '" + this.id + "' (mappings: " + mappings + ") and relativeModuleDir '" + relativeModuleDir + "'.");
        }

        if (moduleIdentifier === null || moduleIdentifier === "")
            return moduleIdentifier;

        if (moduleIdentifier.charAt(0) == "/")
            return ((typeof plugin != "undefined")?plugin+"!":"") + moduleIdentifier;

        if (moduleIdentifier.charAt(0) == ".")
            return ((typeof plugin != "undefined")?plugin+"!":"") + bravojs.realpath(relativeModuleDir + "/" + moduleIdentifier);

        if (this.id == "_")
            return ((typeof plugin != "undefined")?plugin+"!":"") + bravojs.realpath(bravojs.mainModuleDir + "/" + moduleIdentifier);

        return ((typeof plugin != "undefined")?plugin+"!":"") + bravojs.realpath(relativeModuleDir + "/" + moduleIdentifier);
    }

    /** Run just before providing Module to moduleFactory function in bravojs.initializeModule() */
    bravojs.Module.prototype.augment = function bravojs_Module_augment()
    {
        if (this._id === "")
            return;
    
        var context = bravojs.contextForId(this._id, true);
        /* Only add extra module properties if context represents a package (i.e. not default '_' context) */
        if (context.id == "_")
            return;
    
        /* If context supplies a UID use it over the path-based ID for the package ID */
        this.pkgId = context.id;
    
        /* Normalized mappings are simply a map where labels point to package IDs */
        this.mappings = context.getNormalizedMappings();
    }

    // We need to reset bravojs to use the Context object from above (but keep registered plugins)
    bravojs.reset(null, bravojs.plugins);
}

Plugin.prototype.requireModule = function(id)
{
    if (!id)
        return;
    
    // The text plugins need special handeling
    if (id.match(/^text!/))
    {
        if (!bravojs.requireMemo[id] && bravojs.pendingModuleDeclarations[id])
        {
            bravojs.requireMemo[id] = bravojs.pendingModuleDeclarations[id].moduleFactory();
        }
        if (!bravojs.requireMemo[id])
            throw new Error("Module " + id + " is not available.");
        return true;
    }
}

Plugin.prototype.newRequire = function(helpers)
{
    var bravojs = this.bravojs;

    var newRequire = function packages_require(moduleIdentifier) 
    {
        // RequireJS compatibility. Convert require([], callback) to module.load([], callback).
        if (Object.prototype.toString.call(moduleIdentifier) == "[object Array]" && arguments.length == 2)
        {
            if (moduleIdentifier.length > 1)
               throw new Error("require([], callback) with more than one module in [] is not supported yet!");
            if (typeof bravojs.mainContext == "undefined")
                throw new Error("Cannot resolve ID for ASYNC require. bravojs.mainContext used to resolve ID not set!");
            // Load IDs are resolved against the default context. To resolve against a different
            // context use module.load([], callback).
            moduleIdentifier = bravojs.contextForId(bravojs.mainContext).resolveId(moduleIdentifier[0], helpers.getContextSensitiveModuleDir());
            var callback = arguments[1];
            bravojs.module.load(moduleIdentifier, function(id)
            {
                callback(newRequire(id));
            });
            return;
        }
        if (helpers.deps && helpers.deps[moduleIdentifier])
            return helpers.deps[moduleIdentifier]();
        return bravojs.requireModule(helpers.getContextSensitiveModuleDir(), moduleIdentifier);
    };
    return newRequire;
}

Plugin.prototype.augmentNewRequire = function(newRequire, helpers)
{
    var bravojs = this.bravojs;

    newRequire.pkg = function packages_require_pkg(packageIdentifierPath)
    {
        if (typeof helpers.module != "undefined" && typeof helpers.module.mappings != "undefined")
        {
            if (typeof helpers.module.mappings[packageIdentifierPath] != "undefined")
                packageIdentifierPath = helpers.module.mappings[packageIdentifierPath];
        }
        var context = bravojs.contextForId(packageIdentifierPath);
        return {
            id: function(moduleIdentifier, unsanitized)
            {
                if (typeof moduleIdentifier == "undefined")
                    return context.id;
                else
                {
                    var id = context.resolveId(moduleIdentifier, helpers.getContextSensitiveModuleDir());
                    if (unsanitized)
                        return id;
                    return bravojs.callPlugins("sanitizeId", [id]) || id;
                }
            }
        }
    }

    newRequire.canonicalize = function packages_require_canonicalize(moduleIdentifier)
    {
        var id = bravojs.makeModuleId(helpers.getContextSensitiveModuleDir(), moduleIdentifier);

        if (id === '')
            throw new Error("Cannot canonically name the resource bearing this main module");

        /* Remove package/module ID delimiter */
        id = bravojs.callPlugins("sanitizeId", [id]) || id;

        /* Some IDs may refer to non-js files */
        if (bravojs.basename(id).indexOf(".") == -1)
            id += ".js";

        return bravojs.window.location.protocol + "/" + id;
    }

    newRequire.nameToUrl = function(moduleIdentifier)
    {
        if (arguments.length >= 2 && arguments[1] !== null)
            throw new Error("NYI - Second argument to require.nameToUrl() must be 'null'!");
        else
        if (arguments.length >= 3 && arguments[2] != "_")
            throw new Error("NYI - Third argument to require.nameToUrl() must be '_'!");
        throw new Error("NYI - require.nameToUrl()");
/*
        var parts = moduleIdentifier.split("/");
        if (parts.length == 0)
        {
        }
        else
        {
        }
*/
    }
}

Plugin.prototype.sanitizeId = function(id)
{
    return id.replace(/@\//, "/").replace(/@$/, "");
}

/**
 * Load a package descriptor from the server.
 * 
 * NOTE: This function will block until the server returns the response!
 *       Package descriptors should be memoized before booting the program
 *       for better loading performance.
 */
Plugin.prototype.loadPackageDescriptor = function(id)
{
    // NOTE: Do NOT use require.canonicalize(id) here as it will cause an infinite loop!
    var URL = window.location.protocol + "/" + bravojs.realpath(id.replace(/@\/+/g, "\/"));

    // TODO: Get this working in other browsers
    var req = new (this.bravojs.XMLHttpRequest || XMLHttpRequest)();
    req.open("GET", URL, false);
    req.send(null);
    if(req.status == 200)
    {
        try
        {
            return JSON.parse(req.responseText);
        }
        catch(e)
        {
            throw new Error("Error parsing package descriptor from URL '" + URL + "': " + e);
        }
    }
    else
        throw new Error("Error loading package descriptor from URL: " + URL);
}

/**
 * Given a mappings locator normalize it according to it's context by
 * setting an absolute path-based location property.
 */
Plugin.prototype.normalizeLocator = function(locator, context)
{
    if (typeof locator.provider != "undefined")
    {
        // do nothing
//        locator.location = locator.provider;
    }
    else
    if (typeof locator.location != "undefined")
    {
        if ((locator.location.indexOf("./") == 0) || (locator.location.indexOf("../") == 0))
        {
            locator.location = this.bravojs.realpath(((context.id!="_")?context.id:this.bravojs.mainModuleDir) + "/" + locator.location, false) + "/";
        }
    }
    else
    if (typeof locator.id != "undefined")
    {
        if (locator.id.charAt(0) != "/")
            locator.id = this.bravojs.mainModuleDir + "/" + locator.id;
    }
    else
    if (typeof locator.catalog != "undefined" || typeof locator.archive != "undefined")
    {
        if (typeof locator.catalog != "undefined" && typeof locator.name == "undefined")
            throw new Error("Catalog-based mappings locator does not specify 'name' property: " + locator);

        var ret = this.bravojs.callPlugins("resolveLocator", [locator]);
        if (typeof ret == "undefined")
            throw new Error("Unable to resolve package locator: " + JSON.stringify(locator));

        locator.location = ret;

        if (typeof id == "undefined")
            throw new Error("Mappings locator could not be resolved by plugins: " + locator);
    }

    if (typeof locator.location != "undefined" && locator.location.charAt(locator.location.length-1) == "/")
        locator.location = locator.location.substring(0, locator.location.length -1);

    return locator;
}

/**
 * Given a moduleIdentifier convert it to a top-level ID
 */
Plugin.prototype.normalizeModuleIdentifier = function(moduleIdentifier, relativeModuleDir, descriptor, context)
{
    if (moduleIdentifier === '')  /* Special case for main module */
        return '';

    var self = this,
        bravojs = this.bravojs,
        originalModuleIdentifier = moduleIdentifier;

    function finalNormalization(moduleIdentifier)
    {
        var parts = moduleIdentifier.replace(/\.js$/, "").split("@/");

        if (parts.length == 1)
            return moduleIdentifier;

        var context = bravojs.contextForId(parts[0]);
        // Resolve mapped modules
        if (typeof context.descriptor.modules != "undefined" && typeof context.descriptor.modules["/" + parts[1]] != "undefined")
        {
            var locator = self.normalizeLocator(context.descriptor.modules["/" + parts[1]], context);
            if (typeof locator.available != "undefined" && locator.available === false)
                return null;

            if (typeof locator.module != "undefined")
                moduleIdentifier = bravojs.contextForId(locator.location).resolveId("./" + locator.module);
        }

        // Give opportunity to verify resolved ID to discover missing mappings for example
        bravojs.callPlugins("verifyModuleIdentifier", [moduleIdentifier, {
            moduleIdentifier: originalModuleIdentifier,
            relativeModuleDir: relativeModuleDir,
            context: context
        }]);

        return moduleIdentifier;
    }

    if (moduleIdentifier === null)
    {
        if (typeof context.descriptor == "undefined" || typeof context.descriptor.main == "undefined")
            throw new Error("'main' property not set in package descriptor for: " + this.id);
        return finalNormalization(context.id + "@/" + context.descriptor.main);
    }
    else
    if (typeof moduleIdentifier === "object")
    {
        // We have a mappings locator object
        moduleIdentifier = this.normalizeLocator(moduleIdentifier, context);

        var id;
        if (typeof moduleIdentifier.location != "undefined")
        {
            id = moduleIdentifier.location;
        }
        else
        if (typeof moduleIdentifier.id != "undefined")
        {
            id = moduleIdentifier.id;
        }
        else
            throw new Error("Invalid mapping: " + moduleIdentifier);

        if (typeof moduleIdentifier.descriptor != "undefined" && typeof moduleIdentifier.descriptor.main != "undefined")
            return finalNormalization(this.bravojs.realpath(id + "@/" + moduleIdentifier.descriptor.main, false));

        var context = this.bravojs.contextForId(id);
        if (typeof context.descriptor == "undefined" || typeof context.descriptor.main == "undefined")
            throw new Error("'main' property not set in package descriptor for: " + context.id);

        return finalNormalization(this.bravojs.realpath(context.id + "@/" + context.descriptor.main, false));
    }

    // See if moduleIdentifier matches a mapping alias exactly
    if (typeof context.descriptor != "undefined" &&
        typeof context.descriptor.mappings != "undefined" &&
        typeof context.descriptor.mappings[moduleIdentifier] != "undefined")
    {
        if (typeof context.descriptor.mappings[moduleIdentifier].available != "undefined" && context.descriptor.mappings[moduleIdentifier].available === false)
        {
            // If mapping is not available we return a null ID
            return null;
        }
        else
        if (typeof context.descriptor.mappings[moduleIdentifier].module != "undefined")
        {
            var mappedContextId = this.normalizeLocator(context.descriptor.mappings[moduleIdentifier], context).location,
                mappedContext = this.bravojs.contextForId(mappedContextId),
                mappedModule = context.descriptor.mappings[moduleIdentifier].module;

            mappedModule = mappedModule.replace(/^\./, "");

            if (mappedModule.charAt(0) == "/")
            {
                return finalNormalization(mappedContext.id + "@" + mappedModule);
            }
            else
            {
                return mappedContext.resolveId("./" + context.descriptor.mappings[moduleIdentifier].module, null);
            }
        }
        else
            throw new Error("Unable to resolve ID '" + moduleIdentifier + "' for matching mapping as 'module' property not defined in mapping locator!");
    }

    var moduleIdentifierParts = moduleIdentifier.split("@/");

    // If module ID is absolute we get appropriate context
    if (moduleIdentifierParts.length == 2)
        context = this.bravojs.contextForId(moduleIdentifierParts[0]);

    // NOTE: relativeModuleDir is checked here so we can skip this if we want a module from the package
    if (typeof context.descriptor != "undefined" &&
        typeof context.descriptor["native"] != "undefined" &&
        context.descriptor["native"] === true &&
        relativeModuleDir)
    {
        return finalNormalization(moduleIdentifierParts.pop());
    }
    else
    if (moduleIdentifier.charAt(0) == "/")
        return finalNormalization(moduleIdentifier);

    // From now on we only deal with the relative (relative to context) ID
    moduleIdentifier = moduleIdentifierParts.pop();

    if (moduleIdentifier.charAt(0) == "." && relativeModuleDir)
        return finalNormalization(this.bravojs.realpath(relativeModuleDir + "/" + moduleIdentifier, false));
    else
    if (context && context.id == "_")
        return finalNormalization(this.bravojs.realpath(this.bravojs.mainModuleDir + "/" + moduleIdentifier, false));

    var parts;
    if (typeof context.descriptor != "undefined" &&
        typeof context.descriptor.mappings != "undefined" &&
        (parts = moduleIdentifier.split("/")).length > 1 &&
        typeof context.descriptor.mappings[parts[0]] != "undefined")
    {
        var normalizedLocator = this.normalizeLocator(context.descriptor.mappings[parts[0]], context),
            mappedContextId;

        if (typeof normalizedLocator.provider != "undefined")
            mappedContextId = normalizedLocator.id;
        else
            mappedContextId = normalizedLocator.location;

        var mappedContext = this.bravojs.contextForId(mappedContextId),
            mappedDescriptor = void 0;

        if (typeof context.descriptor.mappings[parts[0]].descriptor != "undefined")
            mappedDescriptor = context.descriptor.mappings[parts[0]].descriptor;

        // Make ID relative and do not pass relativeModuleDir so ID is resolved against root of package without checking mappings
        parts[0] = ".";
        return mappedContext.resolveId(parts.join("/"), null, mappedDescriptor);
    }

    var libDir = context.libDir;
    if (typeof descriptor != "undefined" && typeof descriptor.directories != "undefined" && typeof descriptor.directories.lib != "undefined")
    {
        libDir = descriptor.directories.lib;
    }

    return finalNormalization(this.bravojs.realpath(context.id + "@/" + ((libDir)?libDir+"/":"") + moduleIdentifier, false));
}

if (typeof bravojs != "undefined")
{
    // In Browser
    bravojs.registerPlugin(new Plugin());
}
else
if (typeof exports != "undefined")
{
    // On Server
    exports.Plugin = Plugin;
}

})();

});
__loader__.memoize('descriptors', function(__require__, module, exports) {
// ######################################################################
// # /descriptors.js
// ######################################################################
// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = __require__('api'),
    UTIL = API.UTIL,
    FILE = API.FILE,
    JSON = API.JSON;


// ######################################################################
// # Descriptor
// ######################################################################

var Descriptor = exports.Descriptor = function() {}

Descriptor.prototype.clone = function()
{
    // TODO: Make this more generic by using narwhals complete UTIL module?

    var self = this,
        descriptor = new self.cloneConstructor();
    UTIL.keys(self).forEach(function (key) {
        if (self.hasOwnProperty(key))
        {
            if (key == "json")
                descriptor[key] = UTIL.deepCopy(self[key]);
            else
                descriptor[key] = self[key];
        }
    });

    return descriptor;
}

Descriptor.prototype.load = function(path)
{
    if (this.filename && FILE.basename(path) != this.filename)
        path += this.filename;

    if (!/\.json$/.test(path))
        throw new Error("Descriptor file path does not end in '.json': " + path);

    this.path = path;
    try
    {
        this.json = JSON.parse(FILE.read(this.path));
    }
    catch(e)
    {
        throw new Error("Error parsing JSON file '" + this.path + "': " + e);
    }
}

Descriptor.prototype.save = function()
{
    if (!FILE.exists(this.path))
        throw new Error("Error saving descriptor. File does not exist: " + this.path);
    try
    {
        FILE.write(this.path, JSON.stringify(this.json, null, 4));
    }
    catch(e)
    {
        throw new Error("Error writing JSON file '" + this.path + "': " + e);
    }
}

Descriptor.prototype.validationError = function(message)
{
    return new Error("Validation Error (in " + this.path + "): " + message);
}

Descriptor.prototype._normalizeLocator = function(locator)
{
    if (typeof locator == "string")
    {
        // If a mapping locator is a simple string we need to determine if it is a
        // path, archive or ID
        if (/^(jar:)?https?:\/\//.test(locator))
        {
            locator = {
                "archive": locator
            };
        }
        else
        if (/^\.?\//.test(locator))
        {
            locator = {
                "location": locator
            };
        }
        else
        {
            locator = {
                "id": locator
            };
        }
    }

    if (typeof locator.location != "undefined")
    {
        if (locator.location.charAt(0) == ".")
            locator.location = FILE.realpath(FILE.dirname(this.path) + "/" + locator.location) + "/";
    }
    return locator;
}

Descriptor.prototype.toJSONObject = function()
{
    return this.json;
}


// ######################################################################
// # Program Descriptor
// ######################################################################

var Program = exports.Program = function(path)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Program;
    this.filename = "program.json";
    this.load(path);
    if (typeof this.json.uid != "undefined")
    {
        if (!this.json.uid.match(/^https?:\/\/(.*)\/$/))
            throw this.validationError("Value (" + this.json.uid + ") for property 'uid' is not a valid HTTP(s) URL");
    }
}
Program.prototype = new Descriptor();

Program.prototype.walkBoot = function(callback)
{
    if (typeof this.json.boot == "undefined")
        throw this.validationError("Property 'boot' is not defined");
    if (typeof this.json.boot == "string")
        callback(this._validateBoot(this.json.boot));
    else
    if (typeof this.json.boot == "array")
    {
        for (var i=0,ic=this.json.boot.length ; i<ic ; i++)
            callback(this._validateBoot(this.json.boot[i]));
    }
    else
        throw this.validationError("Property 'boot' must be a string or array of strings");
}

Program.prototype.walkPackages = function(callback)
{
    if (typeof this.json.packages == "undefined")
        return;
    if (typeof this.json.packages != "object")
        throw this.validationError("Property 'packages' must be an object");
    for (var id in this.json.packages)
        callback(id, UTIL.deepCopy(this.json.packages[id]));
}

Program.prototype._validateBoot = function(id)
{
    if (typeof this.json.packages == "undefined")
        throw this.validationError("Property 'packages' is not defined");
    if (typeof this.json.packages[id] == "undefined")
        throw this.validationError("Value (" + id + ") for property 'boot' not found as key in property 'packages'");
    return id;
}

Program.prototype.locatorForId = function(id)
{
    if (typeof this.json.packages == "undefined")
        throw this.validationError("Property 'packages' is not defined");
    if (typeof this.json.packages[id] == "undefined")
        throw this.validationError("Value (" + id + ") not found as key in property 'packages'");
    if (typeof this.json.packages[id].locator == "undefined")
        throw this.validationError("Package for id '" + id + "' does not specify a 'locator' property");
    return this._normalizeLocator(UTIL.deepCopy(this.json.packages[id].locator));
}

/**
 * Given a package locator we add or override any info we find for it.
 */
Program.prototype.augmentLocator = function(locator, options)
{
    if (typeof this.json.packages == "undefined")
        throw this.validationError("Property 'packages' is not defined");

    options = options || {};

    locator = UTIL.deepCopy(locator);

    var ids = [],
        enforce = false;

    function finalize(locator)
    {
        if (typeof options.sourceDescriptors != "undefined" && options.sourceDescriptors.length > 0)
        {
            for (var i=0, ic=options.sourceDescriptors.length, ret ; i<ic ; i++)
            {
                if (ret = options.sourceDescriptors[i].augmentLocator(locator))
                {
                    locator = ret;
                    break;
                }
            }
        }
        return locator;
    }        

    // First check if an ID matches exactly
    if (typeof locator.id != "undefined")
    {
        ids.push(locator.id);
        if (/\/$/.test(locator.id))
            ids.push(locator.id.substring(0, locator.id.length-1));
        enforce = true;
    }
    if (typeof locator.uid != "undefined")
    {
        ids.push(locator.uid);
        enforce = true;
    }
    if (typeof locator.catalog != "undefined")
    {
        var m;
        if (!(m = locator.catalog.match(/^https?:\/\/(.*)\.json$/)))
            throw new Error("Invalid catalog URL: "+ locator.catalog);
        var id = m[1] + ".json/" + locator.name + "/";
        if (typeof locator.revision != "undefined")
        {
            ids.push(id + locator.revision);
        }
        ids.push(id);
        enforce = true;
    }

    var found = false,
        foundId;
    for (var i=0,ic=ids.length ; i<ic ; i++ )
    {
        if (typeof this.json.packages[ids[i]] != "undefined")
        {
            foundId = ids[i];
            found = this.json.packages[foundId];
            break;
        }
    }

    if (!found)
    {
        // We only throw if package not found if we had a locator from which we could derive an ID
        // e.g. If we had a location only based locator we do not throw as we cannot find packages by path only
        if (enforce)
        {
            if (typeof options["discover-packages"] != "undefined" && options["discover-packages"])
            {
                // We are being asked to add the package
                this.json.packages[ids[0]] = {};
                foundId = ids[0];
                this.save();
            }
            else
                throw this.validationError("Derived package IDs '"+ids+"' for locator '"+UTIL.locatorToString(locator)+"' not found as key in property 'packages'");
        }
        else
            return finalize(locator);
    }

    if (typeof locator.id == "undefined")
        locator.id = foundId;

    if (typeof found.provider != "undefined")
    {
        return finalize(UTIL.deepMerge(locator, {"provider": found.provider}));
    }
    else
    {
        if (typeof found.locator == "undefined")
            return finalize(locator);

        return finalize(this._normalizeLocator(UTIL.deepMerge(locator, found.locator)));
    }
}


// ######################################################################
// # Package Descriptor
// ######################################################################

var Package = exports.Package = function(path)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Package;
    this.filename = "package.json";
    this.load(path);
    if (typeof this.json.uid != "undefined")
    {
        if (!this.json.uid.match(/^https?:\/\/(.*)\/$/))
            throw this.validationError("Value (" + this.json.uid + ") for property 'uid' is not a valid HTTP(s) URL");
    }
}
Package.prototype = new Descriptor();

Package.prototype.hasMappings = function()
{
    if (typeof this.json.mappings == "undefined")
        return false;
    return true;
}

Package.prototype.walkMappings = function(callback)
{
    if (typeof this.json.mappings == "undefined")
        return;
    if (typeof this.json.mappings != "object")
        throw this.validationError("Property 'mappings' must be an object");
    for (var alias in this.json.mappings)
        callback(alias, this._normalizeLocator(this.json.mappings[alias]));
}

Package.prototype.moduleIdToLibPath = function(moduleId)
{
    var libDir = this.json.directories && this.json.directories.lib;
    if (typeof libDir != "string")
        libDir = "lib";
    return ((libDir)?libDir+"/":"") + moduleId;
}


// ######################################################################
// # Catalog Descriptor
// ######################################################################

var Catalog = exports.Catalog = function(path)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Catalog;
    this.filename = FILE.basename(path);
    this.load(path);
}
Catalog.prototype = new Descriptor();

Catalog.prototype.packageLocatorForLocator = function(locator)
{
    if (typeof locator.name == "undefined")
        throw new Error("Catalog-based locator does not specify 'name' property: " + UTIL.locatorToString(locator));

    if (typeof locator.version != "undefined")
    {
        throw new Error("NYI");
    }
    else
    if (typeof locator.revision != "undefined")
    {
        if (typeof this.json.packages[locator.name] == "undefined")
            throw new Error("Package with name '" + locator.name + "' not found in catalog: " + this.path);

        // First try and match by exact revision (revision == branch in git repo)
        if (typeof this.json.packages[locator.name][locator.revision] != "undefined")
        {
            if (!Array.isArray(this.json.packages[locator.name][locator.revision].repositories))
                throw new Error("'repositories' property not found or not array for package '" + locator.name + "' -> '" + locator.revision + "' in: " + this.path);
            
            var repo = this.json.packages[locator.name][locator.revision].repositories[0];
            if (typeof repo.download == "undefined")
                throw new Error("No 'repositories[0].download' property found for package '" + locator.name + "' -> '" + locator.revision + "' in: " + this.path);

            if (typeof repo.download.url == "undefined")
                throw new Error("No 'repositories[0].download.url' property found for package '" + locator.name + "' -> '" + locator.revision + "' in: " + this.path);

            var newLocator = UTIL.deepCopy(locator);

            newLocator.archive = repo.download.url.replace("{rev}", locator.revision);

            if (typeof repo.path != "undefined")
                newLocator.path = repo.path;

            return newLocator;
        }
        else
            throw new Error("NYI");
    }
    else
        throw new Error("NYI");
}


// ######################################################################
// # Sources Descriptor
// ######################################################################

var Sources = exports.Sources = function(path)
{
    if (typeof path == "undefined")
        return;
    this.cloneConstructor = exports.Sources;
    this.load(path);
}
Sources.prototype = new Descriptor();

Sources.prototype.augmentLocator = function(locator)
{
    if (typeof this.json.packages != "object" ||
        typeof locator.id == "undefined" ||
        typeof this.json.packages[locator.id] == "undefined" ||
        typeof this.json.packages[locator.id].source == "undefined")
        return false;
    if (typeof this.json.packages[locator.id].source.location == "undefined")
        throw new Error("Source locator for package '" + locator.id + "' must specify 'location' property in: " + this.path);
    if (this.json.packages[locator.id].source.location.charAt(0) != "/")
        throw new Error("'location' property for source locator for package '" + locator.id + "' must be an absolute path (start with '/') in: " + this.path);

    locator = API.UTIL.deepCopy(locator);
    locator.location = this.json.packages[locator.id].source.location;
    if (!/\/$/.test(locator.location))
        locator.location += "/";
    return locator;
}

});
__loader__.memoize('downloader', function(__require__, module, exports) {
// ######################################################################
// # /downloader.js
// ######################################################################
// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = __require__('api'),
    SYSTEM = API.SYSTEM,
    FILE = API.FILE,
    NET = API.NET,
    DEBUG = API.DEBUG;

var MAX_PARALLEL_DOWNLOADS = 2,
    USE_CACHE = false;

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
    if (type=="cache")
    {
        return this.basePath + "/cache" + path;
    }
    else
        throw new Error("NYI");
}

var unzipping = false,
    unzipQueue = [];

Downloader.prototype.getForArchive = function(archive, callback)
{
    var self = this;
    var sourcePath = self.pathForURL(archive, "source");

    if (FILE.exists(sourcePath + "/package.json"))
    {
        callback(sourcePath);
        return;
    }
    
    function cleanup()
    {
        if (FILE.exists(archivePath))
            SYSTEM.exec("rm -f " + archivePath);
        if (FILE.exists(sourcePath))
            SYSTEM.exec("rm -Rf " + sourcePath);
    }

    function serialUnzip(archive, callback)
    {
        if (unzipping)
        {
            unzipQueue.push([archive, callback]);
            return;
        }
        var self = this;
        function unzip(archive, callback)
        {
            unzipping = true;
    
            doUnzip(archive, function(sourcePath)
            {
                callback(sourcePath);
    
                var info;
                if (unzipQueue.length == 0)
                {
                    unzipping = false;
                    return;
                }
                info = unzipQueue.shift();
                unzip(info[0], info[1]);
            });
        }
        unzip(archive, callback);
    }

    function doUnzip(archive, callback)
    {
        var sourcePath = self.pathForURL(archive, "source");
        var archivePath = self.pathForURL(archive, "archive");

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
                    {
                        callback(sourcePath);
                    }
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
                    {
                        callback(sourcePath);
                    }
                });
            }
        });
    }

    var archivePath = self.pathForURL(archive, "archive");

    if (!FILE.exists(archivePath))
    {
        FILE.mkdirs(FILE.dirname(archivePath), 0775);

        DEBUG.print("Downloading: " + archive);
        
        this.enqueueDownload(archive, archivePath, function()
        {
            serialUnzip(archive, callback);
        });
    }
    else
        serialUnzip(archive, callback);
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

    this.enqueueDownload(url, path, function()
    {
        callback(path);
    });
}

var downloadingCount = 0,
    downloadQueue = [];

Downloader.prototype.enqueueDownload = function(url, path, callback)
{
    if (downloadingCount >= MAX_PARALLEL_DOWNLOADS)
    {
        downloadQueue.push([url, path, callback]);
        return;
    }
    var self = this;
    function download(url, path, callback)
    {
        downloadingCount++;

        self.doDownload(url, path, function()
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

Downloader.prototype.doDownload = function(url, path, callback)
{
    var cachePath = this.pathForURL(url, "cache");
    if (USE_CACHE)
    {
        if (FILE.exists(cachePath))
        {
            API.FILE.mkdirs(API.FILE.dirname(path), 0775);
            SYSTEM.exec("cp " + cachePath + " " + path, function(stdout, stderr)
            {
                callback();
            });
            return;
        }
    }

    NET.download(url, path, function()
    {
        if (USE_CACHE)
        {
            API.FILE.mkdirs(API.FILE.dirname(cachePath), 0775);
            SYSTEM.exec("cp " + path + " " + cachePath, function(stdout, stderr)
            {
                callback();
            });
            return;
        }
        callback();
    });
}

});
__loader__.memoize('loader', function(__require__, module, exports) {
// ######################################################################
// # /loader.js
// ######################################################################
// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var boot = exports.boot = function(options)
{
    const VERSION = "0.0.2";
    var timers = {
        start: new Date().getTime(),
        loadAdditional: 0
    };

    try
    {

    options = options || {};


    // ######################################################################
    // # Adapter
    // ######################################################################

    // Before we can do anything we need to have a basic file and
    // system API available. Since this loader can be run in various
    // host environments we need to decide which adapter to load.

    var adapter;

    // TODO: Bypass the adapter selection if an option is provided

    if (typeof this.window == "undefined" || ""+this.window == "undefined")
    {
        // We are running on a server or headless environment

        // Test for NodeJS
        var httpId = "http";
        if (typeof process != "undefined" && typeof require(httpId).Server != "undefined")
        {
            adapter = "node";
        }
        else
        
        // Test for Jetpack
        if (typeof __url__ != "undefined" && typeof packaging != "undefined" && typeof memory != "undefined")
        {
            adapter = "jetpack";
        }
        else
        {
            // Test for Narwhal
            try
            {
                var narwhal = "narwhal";
                if (typeof require(narwhal).ensureEngine != "undefined")
                {
                    adapter = "narwhal";
                }
            }
            catch(e) {}
        }
    }
    else
    {
        // We are most likely running in a browser
    }
    if (!adapter)
        throw new Error("Cannot select platform adapter. Unable to identify host JavaScript platform.");

    // Normalize JS environment to ES5
    __require__('bravojs/global-es5');

    var API = __require__('api');
    API.SANDBOX = __require__('sandbox');

    API.ENV.timers = timers;
    API.DEBUG.enabled = options.debug || void 0;
    API.SYSTEM.print = options.print || void 0;
    API.ENV.platformRequire = options.platformRequire || void 0;
    API.ENV.mustClean = options.clean || false;

    // NOTE: If you modify this line you need to update: ../programs/bundle-loader/lib/bundler.js
    __require__("adapter/" + adapter).init(API);

    // Now that we have a basic file and system API available we can proceed


    // ######################################################################
    // # CLI
    // ######################################################################

    // Setup command line options

    API.ARGS = __require__('args');

    var optParser = new API.ARGS.Parser(),
        cliOptions;

    //command.help('Announce a new release of a package');
    optParser.arg(".../[program.json]").optional();
    optParser.help("Runs the PINF JavaScript Loader.");
    optParser.option("-v", "--verbose").bool().help("Enables progress messages");
    optParser.option("--platform").set().help("The platform to use");
    optParser.option("--sources").set().help("The path to a sources.json file to overlay source repositories");
    optParser.option("--test-platform").set().help("Make sure a platform is working properly");
    optParser.option("--discover-packages").bool().help("Discover all packages and add to program.json");
    optParser.option("--clean").bool().help("Removes all downloaded packages first");
    optParser.option("--terminate").bool().help("Asks program to terminate if it was going to deamonize (primarily used for testing)");
    optParser.option("-h", "--help").bool().help("Display usage information");

    if (typeof options.program != "undefined")
        cliOptions = optParser.parse(["pinf-loader"].concat([options.program]));
    else
        cliOptions = optParser.parse(["pinf-loader"].concat(API.SYSTEM.args));

    if (cliOptions.help === true)
    {
        optParser.printHelp(cliOptions);
        return;
    }
    if (typeof API.DEBUG.enabled == "undefined")
    {
        if (cliOptions.verbose === true)
            API.DEBUG.enabled = true;
    }
    if (cliOptions.terminate === true)
        API.ENV.mustTerminate = true;
    if (cliOptions.clean === true)
        API.ENV.mustClean = true;

    var knownCliPlatforms = [
        "node",
        "narwhal"
    ];

    function spawnForPlatform(platform)
    {
        // A different platform is requested than is running
        // TODO: Get this working with all adapters
        if (API.ENV.platform != "node")
            throw new Error("NYI - Spawning loader for platform '" + platform + "' from platform '" + API.ENV.platform + "'");

        if (knownCliPlatforms.indexOf(platform) === -1)
            throw new Error("Unknown command line platform: " + platform);

        API.SYSTEM.exec("which " + platform, function (stdout, stderr, error) {
            if (!stdout)
                throw new Error("Platform command '" + platform + "' not found via 'which'!");

            API.SYSTEM.spawn(stdout.split("\n").shift(), [API.ENV.loaderRoot + "/pinf-loader.js"].concat(API.SYSTEM.args));
        });
    }

    if (typeof cliOptions["test-platform"] != "undefined")
    {
        if (knownCliPlatforms.indexOf(cliOptions["test-platform"]) === -1)
            throw new Error("Unknown command line platform: " + cliOptions["test-platform"]);

        API.SYSTEM.exec("which " + cliOptions["test-platform"], function (stdout, stderr, error) {
            if (!stdout)
                API.SYSTEM.print("\0red(FAIL: 'which " + cliOptions["test-platform"] + "' did not locate command!\0)");
            else
            {
                var cmd = stdout.split("\n").shift();
                API.SYSTEM.exec(cmd + " -h", function (stdout, stderr, error) {
                    // TODO: This check should be more definitive
                    if (!stdout)
                        API.SYSTEM.print("\0red(FAIL: '" + cmd + " -h' did not yield expected output!\0)");
                    else
                        API.SYSTEM.print("\0green(OK\0)");
                });
            }
        });
        return;
    }
    else
    if (typeof cliOptions.platform != "undefined" && cliOptions.platform != API.ENV.platform)
    {
        spawnForPlatform(cliOptions.platform);
        return;
    }

    API.DEBUG.print("\0magenta(----------------------------------------------------------------------------");
    API.DEBUG.print("\0bold(|  PINF Loader v" + VERSION + "  ~  https://github.com/pinf/loader-js/\0)");
    API.DEBUG.print("----------------------------------------------------------------------------\0)");

    API.DEBUG.print("Loaded adapter: " + API.ENV.platform);


    // ######################################################################
    // # Locate Program Descriptor
    // ######################################################################

    var downloader = new (__require__('downloader').Downloader)({
        // TODO: Look for a better place first
        basePath: API.SYSTEM.pwd + "/.pinf-packages"
    });

    var assembler = API.ENV.assembler = new (__require__('assembler').Assembler)(downloader);

    var init = function(path)
    {
        path = path || "";
        if (path.charAt(0) != "/")
            path = API.SYSTEM.pwd + "/" + path;
        path = path.split("/");

        if (/\.zip$/.test(path[path.length-1]))
        {
            path[path.length-1] += "!/";
        }
        if (!path[path.length-1] || path[path.length-1] != "program.json")
        {
            API.DEBUG.print("No descriptor URI argument. Assuming: '[./]program.json'");
            path.push("program.json");
        }
        path = API.FILE.realpath(path.join("/"));
    
        API.DEBUG.print("Loading program descriptor from: " + path);

        downloader.basePath = path.substring(0, path.length-13) + "/.pinf-packages";
    
        API.DEBUG.print("Using program cache directory: " + downloader.basePath);


        // ######################################################################
        // # Source overlays
        // ######################################################################

        API.ENV.loadSourceDescriptorsForProgram = function(path)
        {
            var DESCRIPTORS = __require__('descriptors');
            var sourceDescriptors = [],
                files = [];
            if (cliOptions.sources)
            {
                if (!API.FILE.exists(cliOptions.sources))
                    throw new Error("Source repository overlay file specified via --sources not found at: " + cliOptions.sources);
                files.push(cliOptions.sources);
            }
            files.push(API.FILE.dirname(path) + "/sources.local.json");
            if (typeof API.SYSTEM.env.HOME != "undefined" && API.SYSTEM.env.HOME)
                files.push(API.SYSTEM.env.HOME + "/.pinf/config/sources.json");
            files.push(API.FILE.dirname(path) + "/sources.json");
            files.forEach(function(sourcesPath)
            {
                if (API.FILE.exists(sourcesPath))
                    sourceDescriptors.push(new DESCRIPTORS.Sources(sourcesPath));
            });
            if (API.DEBUG.enabled)
            {
                if (sourceDescriptors.length > 0)
                {
                    API.DEBUG.print("Using source overlay files:");
                    sourceDescriptors.forEach(function(sourceDescriptor)
                    {
                        API.DEBUG.print("  \0cyan(" + sourceDescriptor.path + "\0)");
                    });
                }
                else
                    API.DEBUG.print("Not using any source overlay files.");
            }
            return sourceDescriptors;
        }


        // ######################################################################
        // # Sandbox
        // ######################################################################

        var sandbox = new API.SANDBOX.Sandbox({
            mainModuleDir: API.FILE.dirname(path) + "/"
        });

        // ######################################################################
        // # Simple script
        // ######################################################################

        if (!API.FILE.isFile(path))
        {
            var scriptPath = cliOptions.args[0];

            if (scriptPath.charAt(0) == ".")
            {
                scriptPath = API.FILE.realpath(API.SYSTEM.pwd + "/" + scriptPath);
                if (!/\.js$/.test(scriptPath))
                    scriptPath += ".js";
            }

            if (!API.FILE.exists(scriptPath))
            {
                if (/\.js$/.test(scriptPath))
                    scriptPath = scriptPath.substring(0, scriptPath.length-3);

                if (!API.FILE.exists(scriptPath))
                    throw new Error("Script not found at: " + scriptPath);
            }

            sandbox.init();
            sandbox.declare([ scriptPath ], function(require, exports, module)
            {
                var scriptModule = require(scriptPath);
                if (typeof scriptModule.main == "undefined")
                    throw new Error("Script at '" + scriptPath + "' does not export 'main()'");

                API.DEBUG.print("Running script: " + scriptPath);

                API.DEBUG.print("\0magenta(\0:blue(----- | Script stdout & stderr follows ====>\0:)\0)");

                scriptModule.main({
                    bootProgram: function(options)
                    {
                        if (typeof options.platformRequire == "undefined")
                            options.platformRequire = API.ENV.platformRequire;
                        return boot(options);
                    },
                    args: cliOptions.args.slice(1, cliOptions.args.length)
                });
            });
            return;
        }

        // ######################################################################
        // # Program assembly
        // ######################################################################

        if (!API.FILE.exists(path))
        {
            API.SYSTEM.print("\0red(No program descriptor found at: " + path + "\0)\n");
            return;
        }

        // Assemble the program (making all code available on disk) by downloading all it's dependencies

        assembler.assembleProgram(sandbox, path, function(program)
        {
            var engines = program.getEngines();
            if (engines)
            {
                if (engines.indexOf(API.ENV.platform) === -1)
                {
                    API.DEBUG.print("\0yellow(Spawning platform: " + engines[0] + "\0)");
                    spawnForPlatform(engines[0]);
                    return false;
                }
            }
            return true;
        },
        function(program)
        {
            API.ENV.booting = false;

            // TODO: Keep these references elsewhere so we can have nested sandboxes
            API.ENV.program = program;
            API.ENV.sandbox = sandbox;
    
            // ######################################################################
            // # Booting
            // ######################################################################
    
            API.ENV.booting = true;

            var dependencies = program.getBootPackages();
    
            if (API.DEBUG.enabled) {
                API.DEBUG.print("Loading program's main packages:");
                for (var i=0, ic=dependencies.length ; i<ic ; i++ )
                {
                    if (typeof dependencies[i]["_package-" + i] != "undefined")
                        API.DEBUG.print("  " + dependencies[i]["_package-" + i].location);
                }
            }

            timers.load = new Date().getTime()

            var env = options.env || {};
            env.args = env.args || options.args || cliOptions.args.slice(1, cliOptions.args.length) || [];

            sandbox.declare(dependencies, function(require, exports, module)
            {
                timers.run = new Date().getTime()
    
                API.DEBUG.print("Booting program. Output for each boot package follows in green between ==> ... <==");
    
                // Run the program by calling main() on each packages' main module
                var pkg,
                    hl;
                for (var i=0, ic=dependencies.length ; i<ic ; i++ )
                {
                    var pkg = require("_package-" + i);
        
                    if (typeof pkg.main === "undefined")
                        throw new Error("Package's main module does not export main() in package: " + dependencies[i]["_package-" + i].location);
                    
                    if (API.DEBUG.enabled)
                    {
                        var h = "----- " + dependencies[i]["_package-" + i].location + " -> [package.json].main -> main() -----";
                        hl = h.length;
                        API.DEBUG.print("\0magenta(\0:blue(" + h + "\0:)");
                        API.SYSTEM.print("\0:blue(=====>\0:)\0)\0green(\0bold(", false, true);
                    }
        
                    pkg.main(env);
        
                    if (API.DEBUG.enabled)
                    {
                        API.SYSTEM.print("\0)\0)\0magenta(\0:blue(<=====\0:)\0)\n");
                        var f = "";
                        for (var i=0 ; i<hl-8 ; i++) f += "-";
                        API.DEBUG.print("\0magenta(\0:blue(----- ^ " + f + "\0:)\0)");
                    }
                }

                API.ENV.booting = false;

                timers.end = new Date().getTime()

                API.DEBUG.print("Program Booted  ~  Timing (Assembly: "+(timers.load-timers.start)/1000+", Load: "+(timers.run-timers.load)/1000+", Boot: "+(timers.end-timers.run-timers.loadAdditional)/1000+", Additional Load: "+(timers.loadAdditional)/1000+")");
                var f = "";
                for (var i=0 ; i<hl ; i++) f += "|";
                API.DEBUG.print("\0magenta(\0:blue(----- | Program stdout & stderr follows (if not already terminated) ====>\0:)\0)");

                if (typeof options.callback != "undefined")
                {
                    options.callback(sandbox, require);
                }
            });
        }, {
            "discover-packages": cliOptions["discover-packages"] || false,
            sourceDescriptors: API.ENV.loadSourceDescriptorsForProgram(path)
        });
    } // init()

    if (/^https?:\/\//.test(cliOptions.args[0]))
    {
        API.DEBUG.print("Boot cache directory: " + downloader.basePath);

        assembler.provisonProgramForURL(cliOptions.args[0], init);
    }
    else
        init(cliOptions.args[0]);

    }
    catch(e)
    {
        if (typeof options.print != "undefined")
            options.print("[pinf-loader] " + e + "\n\n  " + (e.stack || "").split("\n").join("\n  ") + "\n\n");
        else
        if (typeof API != "undefined" && typeof API.SYSTEM != "undefined" && typeof API.SYSTEM.print != "undefined")
            API.SYSTEM.print("[pinf-loader] " + e + "\n\n  " + (e.stack || "").split("\n").join("\n  ") + "\n\n");
        else
        if (typeof console != "undefined")
            console.log("[pinf-loader] " + e);
        else
        if( typeof print != "undefined")
            print("[pinf-loader] " + e + "\n");
    }
}

});
__loader__.memoize('modules/pinf/loader', function(__require__, module, exports) {
// ######################################################################
// # /modules/pinf/loader.js
// ######################################################################
// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = __require__('api'),
    LOADER = __require__('loader');

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

var Sandbox = exports.Sandbox = function Sandbox(options, callback)
{
    var self = this;

    options = options || {};

    if (typeof options.program != "undefined")
    {
        options.callback = function(sandbox, require)
        {
            callback(self, require);
        }
        LOADER.boot(options);
    }
    else
    if (typeof options.programPath != "undefined")
    {
        // Create a fresh sandbox for the program

        if (typeof callback == "undefined")
            throw new Error("Callback must be supplied when creating sandbox for program!");

        if (/\/program.json$/.test())
            throw new Error("Program path '" + options.programPath + "' must end in '/program.json'");

        if (!API.FILE.exists(options.programPath))
            throw new Error("Program path '" + options.programPath + "' does not exist!");

        var sandbox = new API.SANDBOX.Sandbox({
            mainModuleDir: API.FILE.dirname(options.programPath) + "/"
        });

        self.getMainModuleDir = function()
        {
            return sandbox.loader.bravojs.mainModuleDir;
        }

        self.packageForId = function(packageId)
        {
            packageId = packageId.replace(/^\w*!/, "");

            if (packageId.charAt(packageId.length-1) != "/")
                packageId += "/";

            return sandbox.packages[packageId];
        }

        self.packageForHash = function(packageHash)
        {
            for (var packageId in sandbox.packages)
            {
                if (sandbox.packages[packageId].getHashId() == packageHash)
                    return sandbox.packages[packageId];
            }
            return null;
        }

        self.forEachPackage = function(callback)
        {
            for (var packageId in sandbox.packages)
            {
                callback(packageId, sandbox.packages[packageId]);
            }
        }

        self.forEachModule = function(callback)
        {
            for (var moduleIdentifier in sandbox.loader.bravojs.pendingModuleDeclarations)
            {
                callback(
                    moduleIdentifier,
                    sandbox.loader.bravojs.pendingModuleDeclarations[moduleIdentifier].dependencies,
                    sandbox.loader.bravojs.pendingModuleDeclarations[moduleIdentifier].moduleFactory
                );
            }
        }

        self.load = function(moduleIdentifier, callback)
        {
            return sandbox.loader.bravojs.module.load(moduleIdentifier, callback);
        }

        // Inherit source descriptors from program
        var sourceDescriptors = API.ENV.sandbox.sourceDescriptors || [];
        sourceDescriptors = sourceDescriptors.concat(API.ENV.loadSourceDescriptorsForProgram(options.programPath));

        API.ENV.assembler.assembleProgram(sandbox, options.programPath, function() {}, function(program)
        {
            self.program = program;

            var dependencies = program.getBootPackages();

            // Declare program boot packages but do not call main() on them
            sandbox.declare(dependencies, function(require, exports, module)
            {            
                callback(self, require);
            });
        },        
        {
            sourceDescriptors: sourceDescriptors
        });
    }
    else
    {
        // Create a child sandbox by cloning our existing sandbox.
        // The child sandbox will hold all existing modules initially and allow
        // for loading of extra modules that are memoized only to the child sandbox.

        // TODO: Do not get our sandbox from API.ENV.sandbox as it will have the wrong
        //       one if we are running in a sandboxed program (see above).
        var sandbox = API.ENV.sandbox.clone();

        this.declare = function(dependencies, moduleFactory)
        {
            var cbt = new API.UTIL.CallbackTracker(function()
            {
                sandbox.declare(dependencies, moduleFactory);
            });
            for (var i=0,ic=dependencies.length ; i<ic ; i++)
                API.ENV.assembler.addPackageToProgram(sandbox, sandbox.program, dependencies[i][Object.keys(dependencies[i])[0]], cbt.add(), {
                    sourceDescriptors: API.ENV.loadSourceDescriptorsForProgram(sandbox.program.descriptor.path)
                });
            
            cbt.done();
        }
    }
}

});
__loader__.memoize('modules/pinf/program-server', function(__require__, module, exports) {
// ######################################################################
// # /modules/pinf/program-server.js
// ######################################################################

var API = __require__('api'),
    PINF_LOADER = __require__('modules/pinf/loader');

var JSGI = exports.JSGI = function(options)
{
    this.API = options.api;

    this.routes = {};
    for (var path in options.map)
    {
        if (path.charAt(0) != "/")
            throw new Error("Path must begin with '/'");

        if (!/\.js$/.test(path))
            throw new Error("Path must end in '.js'");

        if (typeof options.map[path].basePath != "undefined" && !/\/$/.test())
            options.map[path].basePath += "/";

        // Add the main program route
        this.routes[path] = {
            expr: new RegExp("^" + path.replace(/(\/|\\)/g, "\\$1") + "$"),
            path: path,
            options: options.map[path]
        }
        
        // Add a route to load extra modules
        this.routes[path + "/module/"] = {
            expr: new RegExp("^" + path.replace(/(\/|\\)/g, "\\$1") + "\/module\/(.*)$"),
            path: path,
            options: options.map[path],
            load: "module"
        }
        
        // Add a route to load extra packages
        this.routes[path + "/package/"] = {
            expr: new RegExp("^" + path.replace(/(\/|\\)/g, "\\$1") + "\/package\/(.*)$"),
            path: path,
            options: options.map[path],
            load: "package"
        }
    }
}

JSGI.prototype.responder = function(app)
{
    var self = this;
    
    return function(request)
    {
        var deferred = self.API.PROMISE.defer();

        var responding;

        try
        {
            responding = self.respond(request, function(response)
            {
                deferred.resolve(response);
            });
        }
        catch(e)
        {
            // TODO: Use error reporter here instead of print
            API.SYSTEM.print("\0red(" + e + "\n\n" + e.stack + "\0)\n");
            throw e;
        }

        if (!responding)
        {
            if (typeof app != "undefined")
                deferred.resolve(app(request));
            else
                deferred.resolve({
                    status: 404,
                    headers: {
                        "content-type": "text/plain"
                    },
                    body: [
                        "File not found!"
                    ]
                });
        }

        return deferred.promise;
    }
}

JSGI.prototype.respond = function(request, callback)
{
    var route;
    for (route in this.routes)
    {
        if (this.routes[route].expr.test(request.pathInfo))
        {
            route = this.routes[route];
            break;
        }
        else
            route = void 0;
    }
    if (typeof route == "undefined")
        return false;

    function sendResponse(body)
    {
        callback({
            status: 200,
            headers: {
                "content-type": "text/javascript",
                "transfer-encoding": "chunked"
                // NOTE: Do not set content length as length is not accurate for some JS files                
//                "content-length": (body = body.join("\n")).length
            },
            body: [
                body.join("\n")
            ]
        });
    }

    if (typeof route.options.programPath != "undefined")
    {
        function send(sandbox)
        {
            var body = [],
                path,
                deps,
                parts,
                descriptor,
                pkg,
                modules,
                id;

            var port = ((request.port)?request.port:80);

            var basePath = route.options.basePath || sandbox.getMainModuleDir();

            var config = {
                url: "http" + ((port==80)?"":"s") + "://" + request.host + ":" + port + request.pathInfo,
                mainModuleDir: "/" + request.host + ":" + port + route.path
            }
            config.mainContext = config.mainModuleDir + "/" + sandbox.packageForId(sandbox.program.getBootPackages()[0]["_package-0"].location).getHashId();

            function rewritePath(path, packageIDOnly)
            {
                var parts = path.split("@/");
                if (parts.length == 2)
                {
                    var pkg = sandbox.packageForId(parts[0]);
                    if (pkg)
                        return pkg.getHashId() + "@/" + parts[1];
                }
                
                if (path.substring(0, basePath.length) == basePath)
                    return path.substring(basePath.length);

                var pkg = sandbox.packageForId(path);
                if (pkg)
                {
                    if (packageIDOnly)
                        return pkg.getHashId();
                    else
                        return rewritePath(pkg.getMainId());
                }

                if (typeof route.options.rewritePaths == "undefined")
                    throw new Error("Path '" + path + "' must be rewritten via 'rewritePaths' map property. Property is not set!");

                var paths = route.options.rewritePaths.filter(function(filterPath)
                {
                    return (path.substring(0, filterPath[0].length) == filterPath[0]);
                });

                if (paths.length == 0)
                    throw new Error("No matching path in 'rewritePaths' map property found for path '" + path + "'.");

                return paths[0][1] + path.substring(paths[0][0].length);
            }

            var packageDescriptors = {
                "mapped": {},
                "sent": {}
            };

            function memoizeModule(moduleIdentifier, dependencies, moduleFactory)
            {
                // Pull out plugin if applicable
                var plugin;
                if (typeof moduleIdentifier == "string")
                {
                    var m = moduleIdentifier.match(/^(\w*)!(.*)$/);
                    if (m)
                    {
                        plugin = m[1];
                        moduleIdentifier = m[2];
                    }
                }

                parts = moduleIdentifier.split("@/");

                deps = "";
                if (dependencies.length > 0)
                    deps = "'" + dependencies.join("','") + "'";

                // Rewrite package modules and mappings
                if (parts[1] == "package.json")
                {
                    packageDescriptors.sent[rewritePath(parts[0], true)] = true;
                    descriptor = API.UTIL.deepCopy(moduleFactory());
                    if (typeof descriptor.modules != "undefined")
                    {
                        for( var path in descriptor.modules)
                        {
                            if (typeof descriptor.modules[path].location == "undefined")
                                throw new Error("There should be a location property in the mapping locator by now!");
                            packageDescriptors.mapped[rewritePath(descriptor.modules[path].location, true)] = true;
                            descriptor.modules[path].location = config.mainModuleDir + "/" + rewritePath(descriptor.modules[path].location, true);
                            delete descriptor.modules[path].id;
                        }
                    }
                    if (typeof descriptor.mappings != "undefined")
                    {
                        for( var alias in descriptor.mappings)
                        {
                            if (typeof descriptor.mappings[alias].location == "undefined")
                                throw new Error("There should be a location property in the mapping locator by now!");
                            packageDescriptors.mapped[rewritePath(descriptor.mappings[alias].location, true)] = true;
                            descriptor.mappings[alias].location = config.mainModuleDir + "/" + rewritePath(descriptor.mappings[alias].location, true);
                            delete descriptor.mappings[alias].id;
                        }
                    }
                    moduleFactory = "function() { return " + API.JSON.stringify(descriptor) + "; }";
                }

                pkg = sandbox.packageForId(parts[0]);
                if (pkg)
                {
                    id = config.mainModuleDir + "/" + pkg.getHashId() + "@/" + parts[1];
                }
                else
                if (parts.length == 1)
                {
                    id = config.mainModuleDir + rewritePath(API.FILE.realpath(parts[0]));
                }
                else
                    throw new Error("NYI - " + parts);

                body.push("require.memoize(" + ((typeof plugin != "undefined")?"'"+plugin+"!'+":"") + "bravojs.realpath('" + id + "'), [" + deps + "], " + moduleFactory + ");");
            }
            
            function memoizeMissingPackageDescriptors()
            {
                for (var pkgId in packageDescriptors.mapped)
                {
                    if (typeof packageDescriptors.sent[pkgId] == "undefined")
                    {
                        pkg = sandbox.packageForHash(pkgId);
                        memoizeModule(pkg.path + "@/package.json", [], function()
                        {
                            return pkg.normalizedDescriptor.json;
                        });
                    }
                }
            }

            if (typeof route.load != "undefined")
            {
                // Prepare extra load payload

                var pathInfoParts = route.expr.exec(request.pathInfo),
                    pathParts = pathInfoParts[1].split("@/");
                if (pathParts.length == 2 && (pkg = sandbox.packageForHash(pathParts[0])))
                {
                    path = pkg.path + "@/" + pathParts[1];
                }
                else
                {
                    // The client converted ../ to __/ to keep the directory up path segments in tact
                    path = basePath + pathInfoParts[1].replace(/_{2}\//g, "../");
                }

                // Collect all existing modules so we can determine new ones
                modules = {};
                sandbox.forEachModule(function(moduleIdentifier)
                {
                    modules[moduleIdentifier] = true;
                });

                function sendModules(loadedId)
                {
                    // Memoize new modules

                    sandbox.forEachModule(function(moduleIdentifier, dependencies, moduleFactory)
                    {
                        if(!modules[moduleIdentifier])
                            memoizeModule(moduleIdentifier, dependencies, moduleFactory);
                    });
                    memoizeMissingPackageDescriptors();

                    // Set loaded ID if applicable
                    
                    if (typeof loadedId != "undefined")
                        body.push("__bravojs_loaded_moduleIdentifier = bravojs.realpath('" + config.mainModuleDir + "/" + rewritePath(loadedId) + "');");

                    // Send response

                    sendResponse(body);
                }

                if (route.load === "module")
                {
                    sandbox.load(path, sendModules);
                }
                else
                if (route.load === "package")
                {
                    sandbox.load({
                        location: path
                    }, sendModules);
                }
                else
                    throw new Error("NYI");
            }
            else
            {
                // Prepare initial program payload
                
                // Configure BravoJS

                body.push("bravojs = " + API.JSON.stringify(config) + ";");

                // Pull in BravoJS and plugins

                path = API.ENV.loaderRoot + "/lib/pinf-loader-js/bravojs/global-es5.js";
                body.push(API.FILE.read(path));

                path = API.ENV.loaderRoot + "/lib/pinf-loader-js/bravojs/bravo.js";
                body.push(API.FILE.read(path));

                path = API.ENV.loaderRoot + "/lib/pinf-loader-js/bravojs/plugins/packages/packages.js";
                body.push(API.FILE.read(path));

                path = API.ENV.loaderRoot + "/lib/pinf-loader-js/bravojs/plugins/packages/loader.js";
                body.push(API.FILE.read(path));

                // Memoize modules

                sandbox.forEachModule(memoizeModule);
                memoizeMissingPackageDescriptors();
    
                // Boot the program
    
                var dependencies = sandbox.program.getBootPackages();
                for (var i=0, ic=dependencies.length ; i<ic ; i++ )
                {
                    if (typeof dependencies[i]["_package-" + i].location != "undefined")
                    {
                        pkg = sandbox.packageForId(dependencies[i]["_package-" + i].location);
                        dependencies[i]["_package-" + i] = {
                            id: pkg.getHashId()
                        }
                    }
                    else
                        throw new Error("NYI");
                }
    
                body.push("(function() {");
                    body.push("var env = {};");
                    body.push("module.declare(" + API.JSON.stringify(dependencies) + ", function(require, exports, module) {");
                        for (var i=0, ic=dependencies.length ; i<ic ; i++ )
                            body.push("require('_package-" + i + "').main(env);");
                    body.push("});");
                body.push("})();");

                // Send response

                sendResponse(body);
            }
        }

        // Always create a new sandbox for the request
        // TODO: Config to exclude modules
        new PINF_LOADER.Sandbox(
        {
            programPath: route.options.programPath
        },
        function done(sandbox)
        {
            send(sandbox);
        });
    }
    else
        throw new Error("Unrecognized route target options '" + Object.keys(route.options) + "'");

    return true;
}

});
__loader__.memoize('modules/pinf/protocol-handler', function(__require__, module, exports) {
// ######################################################################
// # /modules/pinf/protocol-handler.js
// ######################################################################

var PROTOCOL;
if (typeof __require__ != "undefined")
    PROTOCOL = __require__("platform/" + __require__.platform + "/protocol");
else
    PROTOCOL = require("../../platform/" + require.platform + "/protocol");


/**
 * @see http://wiki.commonjs.org/wiki/JSGI/Level0/A/Draft2
 * @see http://mail.python.org/pipermail/web-sig/2007-January/002475.html
 * @see http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
 */
var JSGI = exports.JSGI = function(options)
{
    // TODO: Ensure only one protocol handler per scheme

    var protocolHandler = PROTOCOL.Handler(
    {
        onRequest: function(upstreamRequest, upstreamResponse)
        {
            try {
                // jedi://hostname:80/path/to/file.ext?query=string&another=one
                var uriParts = upstreamRequest.uri.match(/^([^:]*):\/\/(([^\/:]*)(:([^\/]*))?)((\/[^\?]*)(\?(.*))?)?$/);
                // uriParts[0] - jedi://hostname/path/to/file.ext?query=string&another=one
                // uriParts[1] - jedi
                // uriParts[2] - hostname:80
                // uriParts[3] - hostname
                // uriParts[4] - :80
                // uriParts[5] - 80
                // uriParts[6] - /path/to/file.ext?query=string&another=one
                // uriParts[7] - /path/to/file.ext
                // uriParts[8] - ?query=string&another=one
                // uriParts[9] - query=string&another=one
                if (!uriParts)
                    throw new Error("Could not parse URI '" + upstreamRequest.uri + "'!");

                var request = {
                    method: "GET",
                    scriptName: "",
                    pathInfo: uriParts[7],
                    queryString: uriParts[9] || "",
                    host: uriParts[3],
                    port: uriParts[5] || 80,
                    scheme: uriParts[1],
                    input: null,
                    headers: {},
                    jsgi: {
                        version: [0,3],
                        errors: void 0,
                        multithread: true,  // ?
                        multiprocess: true, // ?
                        runOnce: false,
                        cgi: false,
                        ext: {}
                    },
                    env: {}
                };

                var response = options.app(request);

                if (!response)
                    throw new Error("Empty response object!");
                if (typeof response != "object")
                    throw new Error("Response is not an object!");
                if (typeof response.status == "undefined")
                    throw new Error("Response object does not contain a 'status' property!");
                if (typeof response.headers == "undefined")
                    throw new Error("Response object does not contain a 'headers' property!");
                if (typeof response.headers != "object")
                    throw new Error("'headers' property in response object is not an object!");
                if (typeof response.body == "undefined")
                    throw new Error("Response object does not contain a 'body' property!");

                var contentType,
                    contentLength;
                
                for (var name in response.headers)
                {
                    name = name.toLowerCase();
                    if (name == "status")
                        throw new Error("'status' response header not allowed! Use the 'status' response property.");
                    if (name.charAt(name.length-1) == "-" || name.charAt(name.length-1) == "_")
                        throw new Error("Response header names may not end in '-' or '_'!");
                    // TODO: It MUST contain keys that consist of letters, digits, `_` or `-` and start with a letter.
                    //       Header values MUST NOT contain characters below 037.
                    if (name == "content-type")
                        contentType = response.headers[name];
                    if (name == "content-length")
                        contentLength = response.headers[name];
                }

                // Informational 1xx
                if (response.status >= 100 && response.status <= 199)
                {
                    if (typeof contentType != "undefined")
                        throw new Error("'content-type' response header not allowed when status is: " + response.status);
                    if (typeof contentType == "undefined")
                        throw new Error("'content-type' response header not set!");
                    if (typeof contentLength != "undefined")
                        throw new Error("'content-length' response header not allowed when status is: " + response.status);
//                    if (typeof contentLength == "undefined")
//                        throw new Error("'content-length' response header not set!");
                }
                else
                // Successful 2xx
                if (response.status >= 200 && response.status <= 299)
                {
                    if (typeof contentType != "undefined" && response.status == 204)
                        throw new Error("'content-type' response header not allowed when status is: " + response.status);
                    if (typeof contentType == "undefined")
                        throw new Error("'content-type' response header not set!");
                    if (typeof contentLength != "undefined" && response.status == 204)
                        throw new Error("'content-length' response header not allowed when status is: " + response.status);
//                    if (typeof contentLength == "undefined")
//                        throw new Error("'content-length' response header not set!");
                    
                }
                else
                // Redirection 3xx
                if (response.status >= 300 && response.status <= 399)
                {
                    if (typeof contentType != "undefined" && response.status == 304)
                        throw new Error("'content-type' response header not allowed when status is: " + response.status);
                    if (typeof contentType == "undefined")
                        throw new Error("'content-type' response header not set!");
                    if (typeof contentLength != "undefined" && response.status == 304)
                        throw new Error("'content-length' response header not allowed when status is: " + response.status);
//                    if (typeof contentLength == "undefined")
//                        throw new Error("'content-length' response header not set!");
                    
                }
                else
                // Client Error 4xx
                if (response.status >= 400 && response.status <= 499)
                {
                    if (typeof contentType == "undefined")
                        throw new Error("'content-type' response header not set!");
//                    if (typeof contentLength == "undefined")
//                        throw new Error("'content-length' response header not set!");
                    
                }
                else
                // Server Error 5xx
                if (response.status >= 500 && response.status <= 599)
                {
                    if (typeof contentType == "undefined")
                        throw new Error("'content-type' response header not set!");
//                    if (typeof contentLength == "undefined")
//                        throw new Error("'content-length' response header not set!");
                    
                }
                else
                    throw new Error("Status code '" + response.status + "' must be between 1xx and 5xx.");


                upstreamResponse.contentType = contentType;
                upstreamResponse.content = [];

                if (typeof response.body == "object" && typeof response.body.forEach != "undefined")
                {
                    response.body.forEach(function(str)
                    {
                        upstreamResponse.content.push(str);
                    });
                }
                else
                if (Array.isArray(response.body))
                {
                    upstreamResponse.content = response.body;
                }
                else
                    throw new Error("'body' property in response object not a forEach()able object nor array!");

                upstreamResponse.content = upstreamResponse.content.join("");
            }
            catch(e)
            {
                upstreamResponse.content = "[Internal Error] " + e.message + "\n\n" + e.stack;
                upstreamResponse.contentType = 'text/plain';
                return;
            }
        }
    });

    protocolHandler.listen({
        scheme: options.scheme
    });
}

});
__loader__.memoize('package', function(__require__, module, exports) {
// ######################################################################
// # /package.js
// ######################################################################
// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = __require__('api'),
    UTIL = API.UTIL,
    FILE = API.FILE,
    DEBUG = API.DEBUG;



/**
 * A special kind of package that calls handlers for various module tasks vs using native handlers
 */
var ProviderPackage = exports.ProviderPackage = function(id, info)
{
    this.descriptor = null;
    this.path = id;
    this.discovering = true;
    this.normalizedDescriptor = {
        toJSONObject: function()
        {
            return {
                "directories": {
                    "lib": ""
                }
            };
        }
    };
    this.uid = id;
    this.isProviderPackage = true;
    this.providerId = info.provider;
}
ProviderPackage.prototype.getIsNative = function()
{
    return false;
}
ProviderPackage.prototype.requireModule = function(id)
{
    id = id.split("@/").pop();
    if (typeof API.ENV.packageProviders == "undefined")
        throw new Error("API.ENV.packageProviders not set. Needed by provider package '"+this.uid+"' for provider '"+this.providerId+"' for module '"+id+"'.");
    if (typeof API.ENV.packageProviders[this.providerId] == "undefined")
        throw new Error("API.ENV.packageProviders not set for id '"+this.providerId+"' needed for module '"+id+"'.");

    return API.ENV.packageProviders[this.providerId].requireModule(id);
}

ProviderPackage.prototype.getModuleSource = function(sandbox, resourceURI, callback)
{
    var id = resourceURI.split("@/").pop();
    if (typeof API.ENV.packageProviders == "undefined")
        throw new Error("API.ENV.packageProviders not set. Needed by provider package '"+this.uid+"' for provider '"+this.providerId+"' for module '"+id+"'.");
    if (typeof API.ENV.packageProviders[this.providerId] == "undefined")
        throw new Error("API.ENV.packageProviders not set for id '"+this.providerId+"' needed for module '"+id+"'.");

    return API.ENV.packageProviders[this.providerId].getModuleSource(sandbox, resourceURI, callback);
}



var Package = exports.Package = function(descriptor)
{
    this.descriptor = descriptor;
    this.path = FILE.dirname(this.descriptor.path);
    this.discovering = false;
    this.normalizedDescriptor = this.descriptor.clone();
    if (typeof this.normalizedDescriptor.json.uid != "undefined")
    {
        this.uid = this.normalizedDescriptor.json.uid.match(/^https?:\/\/(.*)\/$/)[1] + "/";
    }
    this.preloaders = null;
    if (typeof this.normalizedDescriptor.json.engine != "undefined")
    {
        if (this.normalizedDescriptor.json.engine.indexOf(API.ENV.platform) === -1)
            throw new Error("Cannot run package '"+this.path+"' (supporting engines '"+this.normalizedDescriptor.json.engine+"') on platform '" + API.ENV.platform + "'");
    }
}

Package.prototype.getHashId = function()
{
    if (!this.hashId)
        this.hashId = __require__('sha1').hex_sha1(this.path);
    return this.hashId;
}

Package.prototype.discoverMappings = function(fetcher, callback)
{
    this.discovering = true;
    var self = this;

    if (!this.normalizedDescriptor.hasMappings())
    {
        DEBUG.print("Mappings: None");
        callback();
        return;
    }
    
    DEBUG.print("Mappings:");
    var di = DEBUG.indent() + 1;

    var cbt = new UTIL.CallbackTracker(callback);

    var self = this;

    self.normalizedDescriptor.walkMappings(function(alias, locator)
    {
        DEBUG.indent(di).print("\0yellow(" + alias + "\0) <- " + UTIL.locatorToString(locator)).indent(di+1);

        fetcher(locator, cbt.add(function(pkg, locator)
        {
            // This may happen if locator specifies "available" = false
            if(!pkg)
                return;

            DEBUG.indent(di+1).print("ID: \0cyan(" + locator.id + "\0)");
            DEBUG.indent(di+1).print("Path: \0cyan(" + (locator.location || pkg.path) + "\0)");

            // Update the mapping locator to be absolute path location-based
            if (typeof self.normalizedDescriptor.json.mappings[alias] != "object")
                self.normalizedDescriptor.json.mappings[alias] = {};

            self.normalizedDescriptor.json.mappings[alias].location = pkg.path;

            if (typeof locator.module != "undefined")
            {
                self.normalizedDescriptor.json.mappings[alias].module = locator.module;
            }

            if (pkg.discovering)
            {
                DEBUG.indent(di+1).print("... skip second pass ...");
                return;
            }

            pkg.discoverMappings(fetcher, cbt.add());
        }));
    });

    cbt.done();
}

Package.prototype.getMainId = function(locator)
{
    if (typeof locator != "undefined" && typeof locator.descriptor != "undefined" && typeof locator.descriptor.main != "undefined")
    {
        return this.path + "/@/" + locator.descriptor.main;
    }
    if (typeof this.normalizedDescriptor.json.main == "undefined")
        throw new Error("Package at path '" + this.path + "' does not have the 'main' property set in its package descriptor.");
    return this.path + "/@/" + this.normalizedDescriptor.json.main;
}

Package.prototype.getIsNative = function(locator)
{
    if (typeof locator != "undefined" && typeof locator.descriptor != "undefined" && typeof locator.descriptor["native"] != "undefined")
    {
        throw new Error("NYI");
    }
    if (typeof this.normalizedDescriptor.json["native"] != "undefined")
        return this.normalizedDescriptor.json["native"];
    return false;
}

Package.prototype.moduleSourceExists = function(resourceURI)
{
    var modulePath = resourceURI,
        parts = resourceURI.split("@/");
    if (parts.length == 2)
    {
        if (parts[0].replace(/\/$/, "") != this.path)
            throw new Error("Cannot require module '" + resourceURI + "' from package '" + this.path + "'");
        modulePath = parts[1];
    }
    var path = this.path + "/" + modulePath;
    if (!/\/[^\.]*\.[\w\d]*$/.test(path))
        path += ".js";
    return API.FILE.exists(path);
}

/**
 * Get the source code of a module calling all preloaders if applicable.
 */
Package.prototype.getModuleSource = function(sandbox, resourceURI, callback)
{
    resourceURI = resourceURI.replace(/^\w*!/, "");

    var modulePath = resourceURI,
        parts = resourceURI.split("@/");
    if (parts.length == 2)
    {
        if (parts[0].replace(/\/$/, "") != this.path)
            throw new Error("Cannot require module '" + resourceURI + "' from package '" + this.path + "'");
        modulePath = parts[1];
    }

    var path = this.path + "/" + modulePath;
    if (!/\/[^\.]*\.[\w\d]*$/.test(path))
        path += ".js";

    var context = {
        pkgPath: this.path,
        resourcePath: path,
        api: {
            file: {
                read: API.FILE.read,
                exists: API.FILE.exists
            }
        }
    };

    var self = this;

    var cbt = new UTIL.CallbackTracker(function()
    {
        if (self.preloaders)
        {
            var ret;
            for (var i=0,ic=self.preloaders.length ; i<ic ; i++ )
            {
                if (typeof self.preloaders[i].getModuleSource != "undefined")
                {
                    ret = self.preloaders[i].getModuleSource(context, modulePath);
                    if (typeof ret != "undefined")
                    {
                        callback(ret);
                        return;
                    }
                }
            }
        }
        var data;
        try {
            data = API.FILE.read(context.resourcePath);
        }
        catch(e)
        {
            throw new Error(e.stack + "\nError loading resource URI '" + resourceURI + "'.");
        }
        callback(data);
    });

    if (!self.preloaders && typeof self.normalizedDescriptor.json.preload != "undefined")
    {
        self.preloaders = [];
        self.normalizedDescriptor.json.preload.forEach(function(moduleId)
        {
            // NOTE: This calls the preload module in the context of the same sandbox
            //       as the program.
            // TODO: Do this in an isolated context?
            self.loadRequireModule(sandbox, moduleId, cbt.add(function(module)
            {
                self.preloaders.push(module.main(context));
            }));
        });
    }

    cbt.done();
}

/**
 * Load the given module (resolving all dependencies) and require() it
 */
Package.prototype.loadRequireModule = function(sandbox, moduleId, callback)
{
    // TODO: Match mappings if applicable

    if (moduleId.charAt(0) == ".")
    {
        if (moduleId.charAt(1) != "/")
            throw new Error("ModuleId must begin with './' if relative to package root.");
        moduleId = moduleId.substring(2);
    }
    else
        moduleId = this.normalizedDescriptor.moduleIdToLibPath(moduleId);

    var self = this;

    sandbox.loader.bravojs.module.load(self.path + "/@/" + moduleId, function(id)
    {
        callback(sandbox.loader.bravojs.require(id));       
    });
}

});
__loader__.memoize('platform/jetpack/light-traits', function(__require__, module, exports) {
// ######################################################################
// # /platform/jetpack/light-traits.js
// ######################################################################
/**
 * @source https://github.com/Gozala/light-traits/blob/master/lib/light-traits.js
 */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Irakli Gozalishvili <rfobic@gmail.com> (Original author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
'use strict'

// shortcuts
var _getOwnPropertyNames = Object.getOwnPropertyNames
,   _getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
,   _defineProperty = Object.defineProperty
,   _getPrototypeOf = Object.getPrototypeOf
,   _keys = Object.keys
,   _create = Object.create
,   _freeze = Object.freeze
,   _prototype = Object.prototype
,   _hasOwn = Object.prototype.hasOwnProperty
,   _toString = Object.prototype.toString
,   _forEach = Array.prototype.forEach
,   _slice = Array.prototype.slice
// constants
,   ERR_CONFLICT = 'Remaining conflicting property: '
,   ERR_REQUIRED = 'Missing required property: '

function _getPropertyDescriptor(object, name) {
  var descriptor = _getOwnPropertyDescriptor(object, name)
  ,   proto = _getPrototypeOf(object)
  return !descriptor && proto ? _getPropertyDescriptor(proto, name) : descriptor
}
/**
 * Compares two trait custom property descriptors if they are the same. If
 * both are `conflict` or all the properties of descriptor are equal returned
 * value will be `true`, otherwise it will be `false`.
 * @param {Object} actual
 * @param {Object} expected
 */
function areSame(actual, expected) {
  return (actual.conflict && expected.conflict ) ||
  (   actual.get === expected.get
  &&  actual.set === expected.set
  &&  actual.value === expected.value
  &&  (true !== actual.enumerable) === (true !== expected.enumerable)
  &&  (true !== actual.required) === (true !== expected.required)
  &&  (true !== actual.conflict) === (true !== expected.conflict)
  )
}
/**
 * Converts array to an object whose own property names represent
 * values of array.
 * @param {String[]} names
 * @returns {Object}
 * @example
 *  Map(['foo', ...]) => { foo: true, ...}
 */
function Map(names) {
  var map = {}
  names.forEach(function(name) { map[name] = true })
  return map
}
/**
 * Generates custom **required** property descriptor. Descriptor contains
 * non-standard property `required` that is equal to `true`.
 * @param {String} name
 *    property name to generate descriptor for.
 * @returns {Object}
 *    custom property descriptor
 */
function Required(name) {
  function required() { throw new Error(ERR_REQUIRED + '`' + name + '`') }
  return (
  { get: required
  , set: required
  , required: true
  })
}
/**
 * Generates custom **conflicting** property descriptor. Descriptor contains
 * non-standard property `conflict` that is equal to `true`.
 * @param {String} name
 *    property name to generate descriptor for.
 * @returns {Object}
 *    custom property descriptor
 */
function Conflict(name) {
  function conflict() { throw new Error(ERR_CONFLICT + '`' + name + '`') }
  return (
  { get: conflict
  , set: conflict
  , conflict: true
  })
}
/**
 * Composes new trait with the same own properties as the original trait,
 * except that all property names appearing in the first argument are replaced
 * by 'required' property descriptors.
 * @param {String[]} keys
 *    Array of strings property names.
 * @param {Object} trait
 *    A trait some properties of which should be excluded.
 * @returns {Object}
 * @example
 *    var newTrait = exclude(['name', ...], trait)
 */
function exclude(keys, trait) {
  var exclusions = Map(keys)
  ,   result = {}
  ,   keys = _keys(trait)
  keys.forEach(function(key) {
    if (!_hasOwn.call(exclusions, key) || trait[key].required)
      result[key] = trait[key]
    else
      result[key] = Required(key)
  })
  return result
}
/**
 * Composes a new trait with the same properties as the original trait, except
 * that all properties whose name is an own property of map will be renamed to
 * map[name], and a 'required' property for name will be added instead.
 * @param {Object} map
 *    An object whose own properties serve as a mapping from old names to new
 *    names.
 * @param {Object} trait
 *    A trait object
 * @returns {Object}
 * @example
 *    var newTrait = rename(map, trait)
 */
function rename(map, trait) {
  var result = _create(Trait.prototype, {}),
      keys = _keys(trait)
  keys.forEach(function(key) {
    // must be renamed & it's not requirement
    if (_hasOwn.call(map, key) && !trait[key].required) {
      var alias = map[key]
      if (_hasOwn.call(result, alias) && !result[alias].required)
        result[alias] = Conflict(alias)
      else
        result[alias] = trait[key]
      if (!_hasOwn.call(result, key))
        result[key] = Required(key)
    } else { // must not be renamed or its a requirement
      // property is not in result trait yet
      if (!_hasOwn.call(result, key))
        result[key] = trait[key]
      // property is already in resulted trait & it's not requirement
      else if (!trait[key].required)
        result[key] = Conflict(key)
    }
  })
  return result
}
/**
 * Function generates custom properties descriptor of the `object`s own
 * properties. All the inherited properties are going to be ignored.
 * Properties with values matching `required` singleton will be marked as
 * 'required' properties.
 * @param {Object} object
 *    Set of properties to generate trait from.
 * @returns {Object}
 *    Properties descriptor of all of the `object`'s own properties.
 */
function toTrait(properties) {
  if (properties instanceof Trait) return properties
  var trait = _create(Trait.prototype)
  ,   keys = _getOwnPropertyNames(properties)
  keys.forEach(function(key) {
    var descriptor = _getOwnPropertyDescriptor(properties, key)
    trait[key] = (required === descriptor.value) ? Required(key) : descriptor
  })
  return trait
}

function compose(trait1, trait2/*, ...*/) {
  var result = _create(Trait.prototype)
  _forEach.call(arguments, function(trait) {
    if (!trait) return
    trait = trait instanceof Trait ? trait : toTrait(Object.create({}, trait))
    _keys(trait).forEach(function(key) {
      var descriptor = trait[key]
      // if property already exists and it's not a requirement
      if (_hasOwn.call(result, key) && !result[key].required) {
        if (descriptor.required) return
        if (!areSame(descriptor, result[key])) result[key] = Conflict(key)
      } else {
        result[key] = descriptor
      }
    })
  })
  return result
}
/**
 * Composes new trait. If two or more traits have own properties with the
 * same name, the new trait will contain a 'conflict' property for that name.
 * 'compose' is a commutative and associative operation, and the order of its
 * arguments is not significant.
 *
 * @params {Object} trait
 *    Takes traits as an arguments
 * @returns {Object}
 *    New trait containing the combined own properties of all the traits.
 * @example
 *    var newTrait = compose(trait_1, trait_2, ..., trait_N)
 */
function Trait(trait1, trait2) {
  return undefined === trait2 ? toTrait(trait1) : compose.apply(null, arguments)
}
var TraitProto = Trait.prototype = _create(Trait.prototype,
{ toString: { value: function toString() {
    return '[object ' + this.constructor.name + ']'
  }}
  /**
   * `create` is like `Object.create`, except that it ensures that:
   *    - an exception is thrown if 'trait' still contains required properties
   *    - an exception is thrown if 'trait' still contains conflicting
   *      properties
   * @param {Object}
   *    prototype of the compared object
   * @param {Object} trait
   *    trait object to be turned into a compare object
   * @returns {Object}
   *    An object with all of the properties described by the trait.
   */
, create: { value: function create(proto) {
    var properties = {}
    ,   keys = _keys(this)
    if (undefined === proto) proto = _prototype
    if (proto) {
      if ('' + proto.toString == '' + _toString) {
        _defineProperty(proto, 'toString',  {
          value: TraitProto.toString
        })
      }
      if ('' + proto.constructor == '' + Object) {
        _defineProperty(proto, 'constructor', {
          value: Trait.prototype.constructor
        })
      }
    }
    keys.forEach(function(key) {
      var descriptor = this[key]
      if (descriptor.required) {
        if (key in proto) {
          return properties[key] = _getPropertyDescriptor(proto, key)
        }
        else throw new Error(ERR_REQUIRED + '`' + key + '`')
      } else if (descriptor.conflict) {
        throw new Error(ERR_CONFLICT + '`' + key + '`')
      } else {
        properties[key] = descriptor
      }
    }, this)
    return _create(proto, properties)
  }, enumerable: true }
  /**
   * Composes new resolved trait, with all the same properties as the original
   * trait, except that all properties whose name is an own property of
   * resolutions will be renamed to `resolutions[name]`. If it is
   * `resolutions[name]` is `null` value is changed into a required property
   * descriptor.
   * function can be implemented as `rename(map,exclude(exclusions, trait))`
   * where map is the subset of mappings from oldName to newName and exclusions
   * is an array of all the keys that map to `null`.
   * Note: it's important to **first** `exclude`, **then** `rename`, since
   * `exclude` and rename are not associative.
   * @param {Object} resolutions
   *   An object whose own properties serve as a mapping from old names to new
   *   names, or to `null` if the property should be excluded.
   * @param {Object} trait
   *   A trait object
   * @returns {Object}
   *   Resolved trait with the same own properties as the original trait.
   */
, resolve: { value: function resolve(resolutions) {
    var renames = {},
        exclusions = [],
        keys = _getOwnPropertyNames(resolutions)
    keys.forEach(function(key) {  // pre-process renamed and excluded properties
      if (resolutions[key])       // old name -> new name
        renames[key] = resolutions[key]
      else                        // name -> undefined
        exclusions.push(key)
    })
    return rename(renames, exclude(exclusions, this))
  }, enumerable: true }
})
/**
 * Constant singleton, representing placeholder for required properties.
 * @type {Object}
 */
var required = Trait.required = { toString: function() { return '<Trait.required>' } }
exports.Trait = Trait

});
__loader__.memoize('platform/jetpack/protocol', function(__require__, module, exports) {
// ######################################################################
// # /platform/jetpack/protocol.js
// ######################################################################
/**
 * @source https://github.com/Gozala/jetpack-protocol/blob/master/lib/protocol.js
 */

'use strict'

const { Cc, Ci, Cu, Cm } = require("chrome")
  ,   { MatchPattern } = require('match-pattern')
  ,   { Trait } = __require__('platform/jetpack/light-traits')
  ,   xpcom = require("xpcom")

  ,   { XPCOMUtils } = Cu.import("resource://gre/modules/XPCOMUtils.jsm")

  ,   IOService = Cc["@mozilla.org/network/io-service;1"].
                  getService(Ci.nsIIOService)
  ,   uuidGenerator = Cc["@mozilla.org/uuid-generator;1"].
                      getService(Ci.nsIUUIDGenerator)
  ,   streamChannel = Cc["@mozilla.org/network/input-stream-channel;1"]
  ,   inputStream = Cc["@mozilla.org/io/string-input-stream;1"]
  ,   SimpleURI = Cc["@mozilla.org/network/simple-uri;1"]
  ,   securityManager = Cc["@mozilla.org/scriptsecuritymanager;1"].
                        getService(Ci.nsIScriptSecurityManager)


function identity(value) value

const TXPCOM = Trait(
  Trait({
    interfaces: Trait.required,
    contractID: Trait.required,
  }),
  {
    QueryInterface: { get: function QueryInterface() {
      Object.defineProperty(this, 'QueryInterface', {
        value: XPCOMUtils.generateQI(this.interfaces),
        configurable: false
      })
      return this.QueryInterface
    }, configurable: true },
    classID: { get: function classID() {
      Object.defineProperty(this, 'classID', {
        value: uuidGenerator.generateUUID(),
        configurable: false
      })
      return this.classID
    }, configurable: true },
    classDescription: { get: function classDescription() {
      Object.defineProperty(this, 'classDescription', {
        value: this.description || "Jetpack generated class",
        configurable: false
      })
      return this.classDescription
    }, configurable: true }
  }
)

/**
 * Function takes `handler` object implementing a protocol, and `uri` from
 * that protocol, performs request operation on handler and returns `response`
 * object that contains `channel` of the requested `uri`.
 * @param {Object} handler
 *    Protocol handler
 * @param {nsIURI|String} uri
 *    Requested URI
 * @param {nsIURI} [baseURI]
 *    Base URI. Necessary when given `uri` is relative.
 */
function request(handler, uri, baseURI, charset) {
  // Creating `request` and `response` objects that are passed to a `handler`'s
  // `onRequest` method. Also note that `response` object inherits from
  // `request`, this way `response`'s properties will fall back to the
  // `request`'s same named properties.
  let channel, request = {}, response = Object.create(request)
  // If `baseURI` is provided then given `uri` is relative to it, there for
  // we set `referer` property on request to allow protocol handler to resolve
  // absolute URI.
  if (baseURI) request.referer = baseURI.spec
  // Stringifying `uri` to a string and setting it as property on `request`.
  request.uri = request.originalURI = uri.spec || uri

  handler.onRequest(request, response)

  // If response contains `content` property it's not a simple redirect. In
  // this case we create channel from the given content.
  if (response.content) {
    // Creating input stream out of the `response.content` and then creating
    // `channel` with that content stream.
    let stream = inputStream.createInstance(Ci.nsIStringInputStream)
    let content = response.content
    stream.setData(content, response.contentLength || content.length)
    channel = streamChannel.createInstance(Ci.nsIInputStreamChannel)
    channel.contentStream = stream
    channel.QueryInterface(Ci.nsIChannel)
    // If `uri.spec` is different form `response.uri` it means that either
    // `request` was just redirected to a different uri from the existing
    // protocol or given `uri` was string, in both cases we need to create
    // `uri` that is `nsIURI` since it has to be set on the `channel`.
    if (uri.spec !== response.uri) {
      uri = SimpleURI.createInstance(Ci.nsIURI)
      uri.spec = response.uri
    }
    // Setting response URI on the channel.
    channel.setURI(uri)
  }
  // Otherwise it's a redirect to an URI from the existing protocol, in such
  // case we just use `nsIIOService` to create `channel` straight out of
  // `response.uri`
  else {
    if (response.uri !== request.uri)
      uri = IOService.newURI(response.uri, null, null)
    channel = IOService.newChannel(response.uri, null, null)
  }


  // Also setting `contentType` and `contentLength` if they were provided to the
  // response.
  if (response.contentType)
    channel.contentType = response.contentType
  if (response.contentLength)
    channel.contentLength = response.contentLength

  return Object.create(response, {
    channel: { value: channel },
    uri: { value: uri }
  })
}

const THandler = Trait({
  onRequest: Trait.required,
  listen: function listen(options) {
    let handler
    if (options.about) {
      handler = Object.create(this, { about: { value: options.about } })
      handler = TAboutHandler.create(handler)
    } else {
      handler = Object.create(this, { scheme: { value: options.scheme } })
      handler = TProtocolHandler.create(handler)
    }

    xpcom.register({
      uuid: handler.classID,
      name: handler.classDescription,
      contractID: handler.contractID,
      create: identity.bind(null, handler)
    })
  }
})

const TAboutHandler = Trait(
  TXPCOM,
  Trait({
    about: Trait.required,
    onRequest: Trait.required,
    interfaces: [ Ci.nsIAboutModule ],
    get description() {
      return 'Protocol handler for "about:' + this.about + '"'
    },
    get contractID() {
      return "@mozilla.org/network/protocol/about;1?what=" + this.about
    },
    getURIFlags: function(uri) {
      return Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT
    },
    newChannel: function(uri) {
      return request(this, uri).channel
    }
  })
)

const TProtocolHandler = Trait(
  TXPCOM,
  Trait({
    scheme: Trait.required,
    onRequest: Trait.required,
    interfaces: [ Ci.nsIProtocolHandler ],
    // For more information on what these flags mean,
    // see caps/src/nsScriptSecurityManager.cpp.
    protocolFlags:  Ci.nsIProtocolHandler.URI_IS_UI_RESOURCE |
                    Ci.nsIProtocolHandler.URI_STD |
                    Ci.nsIProtocolHandler.URI_DANGEROUS_TO_LOAD,
    defaultPort: -1,
    allowPort: function allowPort(port, scheme) false,
    newURI: function newURI(relativeURI, charset, baseURI) {
      let response = request(this, relativeURI, baseURI, charset)
      // If handler have not redirected to another protocol we know that
      // `newChannel` method will be called later so we save response so that
      // it will be able to use it and then delete it.
      if (response.uri.scheme == this.scheme)
        (this.responses || (this.responses = {}))[response.uri.spec] = response

      return response.uri
    },
    newChannel: function newChannel(uri) {
      // Taking response for this request (`newURI` saved it) from the responses
      // map and removing it after, since we don't need memory leaks.
      let response = this.responses[uri.spec]
      let channel = response.channel
      delete this.responses[uri.spec]
      // If `originalURI` of the response is different from the `uri` either
      // it means that handler just maps `originalURI`. In such case we set
      // owner of the channel to the same principal as `originalURI` has in
      // order to allow access to the other mapped resources.
      if (response.originalURI !== response.uri) {
        let originalURI = IOService.newURI(response.originalURI, null, null)
        channel.originalURI = originalURI
        channel.owner = securityManager.getCodebasePrincipal(originalURI)
      }
      return channel
    },
    get contractID() {
      return "@mozilla.org/network/protocol;1?name=" + this.scheme
    },
    get description() {
      return 'Protocol handler for "' + this.scheme + ':*"'
    }
  })
)

exports.Handler = function Handler(options) {
  return THandler.create(options)
}

});
__loader__.memoize('program', function(__require__, module, exports) {
// ######################################################################
// # /program.js
// ######################################################################

var API = __require__('api'),
    UTIL = API.UTIL,
    FILE = API.FILE,
    DEBUG = API.DEBUG,
    DESCRIPTORS = __require__('descriptors');

var Program = exports.Program = function(descriptor)
{
    this.descriptor = descriptor;
}

Program.prototype.discoverPackages = function(fetcher, callback)
{
    DEBUG.print("Boot packages:");
    var di = DEBUG.indent() + 1;
    
    var cbt = new UTIL.CallbackTracker(callback);

    var self = this;
    self.descriptor.walkBoot(function(id)
    {
        DEBUG.indent(di).print("ID: " + id).indent(di+1);

        fetcher(self.descriptor.locatorForId(id), cbt.add(function(pkg, locator)
        {
            // This should only happen if locator points to a provider
//            if(!pkg)
//                return;

            DEBUG.indent(di+1).print("ID: \0cyan(" + locator.id + "\0)");
            DEBUG.indent(di+1).print("Path: \0cyan(" + (locator.location || pkg.path) + "\0)");
            if (pkg.discovering)
            {
                DEBUG.indent(di+1).print("... skip second pass ...");
                return;
            }

            pkg.discoverMappings(fetcher, cbt.add());
        }));
    });

    cbt.done();
}

Program.prototype.getProviderPackages = function()
{
    var self = this,
        packages =  {};
    self.descriptor.walkPackages(function(id, info)
    {
        if (typeof info.provider != "undefined")
        {
            packages[id] = info;
        }
    });
    return packages;
}

Program.prototype.getEngines = function()
{
    if (typeof this.descriptor.json.engine == "undefined")
        return false;
    return this.descriptor.json.engine;
}

Program.prototype.getBootPackages = function()
{
    var self = this,
        dependencies = [],
        i = 0;
    self.descriptor.walkBoot(function(id)
    {
        var dep = {};
        dep["_package-" + i] = self.descriptor.locatorForId(id);
        dependencies.push(dep);
        i++;
    });
    return dependencies;
}

/**
 * Given any mappings locator return an absolute path location-based locator.
 */
Program.prototype.resolveLocator = function(assembler, locator, callback, options)
{
    var self = this;
    var descriptor = locator.descriptor;

    function finalize(locator)
    {
        // Make sure location path is always absolute and clean
        if (typeof locator.location != "undefined")
        {
            if (locator.location.charAt(0) == "/")
                locator.location = FILE.realpath(locator.location) + "/";
        }
        if ((typeof locator.available == "undefined" || locator.available === true) && typeof locator.provider == "undefined")
        {
            // If we do not have an absolute path location-based locator by now we cannot proceed
            if (typeof locator.location == "undefined" || locator.location.charAt(0) != "/")
                throw new Error("Resolved locator is not absolute path location-based: " + UTIL.locatorToString(locator));

            // If locator specifies a path we add it to the location.
            // This is typically needed to get the paths to packages in a multi-package archive
            if (typeof locator.path != "undefined")
                locator.location = API.FILE.realpath(locator.location + "/" + locator.path) + "/";
    
            // Pass through the original descriptor unchanged
            if (typeof descriptor != "undefined")
                locator.descriptor = descriptor;
        }
        callback(locator);
    }
    
    if (typeof locator.archive != "undefined")
    {
        var m;

        if (m = locator.archive.match(/^jar:(https?):\/\/([^!]*)!\/(.*?)(\/?)$/))
        {
            locator.id = m[2];
            locator.archive = m[1] + "://" + m[2];
            // Check if we are referring to a module that should be mapped to the alias
            if (/\.js$/.test(m[3]) && !m[4])
            {
                locator.module = "/" + m[3];
            }
            else
                locator.path = m[3]
            locator = this.descriptor.augmentLocator(locator, options);
        }
        else
        if (m = locator.archive.match(/^https?:\/\/(.*)$/))
        {
            if (typeof locator.id == "undefined")
                locator.id = m[1];
        }
        else
            throw new Error("Invalid archive URL: "+ locator.archive);

        assembler.downloader.getForArchive(locator.archive, function(path)
        {
            locator.location = path + "/";

            finalize(locator);
        });
        return;
    }
    else
    if (typeof locator.catalog != "undefined")
    {
        locator = this.descriptor.augmentLocator(locator, options);

        // Only query catalog if program descriptor does not already set a location for the
        // package referenced by the locator.
        if (typeof locator.location == "undefined")
        {
            assembler.downloader.getCatalogForURL(locator.catalog, function(path)
            {
                var catalogDescriptor = new DESCRIPTORS.Catalog(path);
    
                locator = catalogDescriptor.packageLocatorForLocator(locator);
    
                // NOTE: locator now contains an 'archive' property
                if (typeof locator.archive == "undefined")
                    throw new Error("Unable to resolve catalog-based locator.");
    
                self.resolveLocator(assembler, locator, callback);
            });
            return;
        }
    }
    else
    if (typeof locator.id != "undefined")
    {
        locator = this.descriptor.augmentLocator(locator, options);

        if (typeof locator.location == "undefined" &&
            (typeof locator.archive != "undefined" || typeof locator.catalog != "undefined"))
        {
            this.resolveLocator(assembler, locator, finalize, options);
            return;
        }
    }
    else
    if (typeof locator.location != "undefined")
    {
        // do nothing for now
    }
    else
    if (typeof locator.available != "undefined")
    {
        // do nothing for now
    }
    else
        throw new Error("NYI - " + UTIL.locatorToString(locator));

    finalize(locator);
}

});
__loader__.memoize('sandbox', function(__require__, module, exports) {
// ######################################################################
// # /sandbox.js
// ######################################################################
// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

var API = __require__('api'),
    DESCRIPTORS = __require__('descriptors'),
    PACKAGE = __require__('package');

var Sandbox = exports.Sandbox = function Sandbox(options)
{
    this.options = options;
    this.loader = null;
    this.packages = {};
}

Sandbox.prototype.clone = function()
{
    var sandbox = new Sandbox(this.options);
    sandbox.packages = this.packages;
    sandbox.setProgram(this.program);
    return sandbox;
}

Sandbox.prototype.setProgram = function(program)
{
    this.program = program;
    
    // Add provider packages
    var packages = this.program.getProviderPackages();
    for (var id in packages)
    {
        this.packages[id] = new PACKAGE.ProviderPackage(id, packages[id]);
    }
    this.init();
}

Sandbox.prototype.init = function()
{
    var self = this;


    // ######################################################################
    // # BravoJS
    // ######################################################################

    var loader = self.loader = {
        mainModuleDir: self.options.mainModuleDir,
        platform: API.ENV.platform,
        api: {
            system: API.SYSTEM,
            errorReporter: function(e)
            {
                API.SYSTEM.print("[BravoJS] " + e + "\n" + e.stack);
            }
        }
    };

    __require__('bravojs/bravo').BravoJS(loader);


    // ######################################################################
    // # BravoJS - Plugins
    // ######################################################################

    var Plugin = function() {}

    Plugin.prototype.requireModule = function(id)
    {
        if (!id)
            return;

        // Determine if we are dealing with a provider package
        var pkg = self.packageForId(id, true);
        if (pkg && typeof pkg.isProviderPackage != "undefined" && pkg.isProviderPackage === true)
        {
            return pkg.requireModule(id);
        }

        // If it is a native package we let the platform's require handle it
        if (pkg && pkg.getIsNative() === true)
            return API.ENV.platformRequire(id.replace(/@\//g, "\/"));
    }
    Plugin.prototype.contextForId = function(id)
    {
        if (!id) return;
        try
        {
            var id = self.packageForId(id).path;

            if (typeof this.bravojs.contexts[id] == "undefined")
            {
                this.bravojs.makeContext(id);
            }
            return id;
        }
        catch(e)
        {
            // If this throws the ID was likely a non-packaged module ID
            // We only throw if we should have found a package
            if (id.indexOf("@/") !== -1)
                throw new Error("Unable to find package for ID: " + id);
        }
    }
    Plugin.prototype.loadPackageDescriptor = function(id)
    {
        return self.packageForId(id).normalizedDescriptor.toJSONObject();          
    }
    /**
     * This is called after normalizing the moduleIdentifier and gives the opportunity
     * to throw if an ID was resolved incorrectly due to a missing mapping for example.
     */
    Plugin.prototype.verifyModuleIdentifier = function(moduleIdentifier, args)
    {
        var pkg = self.packageForId(moduleIdentifier, true);

        if (typeof pkg.isProviderPackage != "undefined" && pkg.isProviderPackage === true)
        {
            // ignore for now
        }
        else
        if (typeof pkg.normalizedDescriptor.json.preload != "undefined")
        {
            // ignore for now
            // TODO: Ask preloaders to verify that the source exists
        }
        else
        {
            if (!pkg.moduleSourceExists(moduleIdentifier))
            {
                throw new Error("Incorrectly resolved (file does not exist) moduleIdentifier '" + API.UTIL.locatorToString(args.moduleIdentifier) + "' to '" + API.UTIL.locatorToString(moduleIdentifier) + "' against context '" + args.context.id + "' and relativeModuleDir '" + args.relativeModuleDir + "'.");
            }
        }
    }
    loader.bravojs.registerPlugin(new Plugin());
    loader.bravojs.registerPlugin(new (__require__('bravojs/plugins/packages/packages').Plugin)());


    // ######################################################################
    // # BravoJS - Module constructor prototypes
    // ######################################################################

    var loading;

    loader.bravojs.module.constructor.prototype.load = function pinf_loader_load(moduleIdentifier, callback)
    {
        if (typeof moduleIdentifier == "object")
        {
            if (API.DEBUG.enabled)
                if (API.ENV.booting)
                    API.SYSTEM.print("\0)\0)\0magenta(\0:blue(<=====\0:)\0)\n");
                else
                    API.SYSTEM.print("\0magenta(\n");

            var t = new Date().getTime();

            // Load an extra package into the program including all its dependencies
            // and start with the main module
            self.program.assembler.addPackageToProgram(self, self.program, moduleIdentifier, function(pkg)
            {
                loader.bravojs.module.constructor.prototype.load(pkg.getMainId(moduleIdentifier), function(moduleIdentifier)
                {
                    if (API.DEBUG.enabled)
                        if (API.ENV.booting)
                            API.SYSTEM.print("\0magenta(\0:blue(=====>\0:)\0)\0green(\0bold(", false, true);
                        else
                            API.SYSTEM.print("\0)");

                    API.ENV.timers.loadAdditional += new Date().getTime() - t;

                    callback(moduleIdentifier);
                });
            })
            return;
        }
        else
        if (moduleIdentifier.charAt(0)==".")
        {
            throw new Error("Relative IDs '" + moduleIdentifier + "' to module.load() not supported at this time.");
        }

        var context = loader.bravojs.contextForId(moduleIdentifier, true);
        moduleIdentifier = context.resolveId(moduleIdentifier);

        function load(data)
        {
            loading = {
                id: moduleIdentifier,
                callback: function()
                {
                    callback(moduleIdentifier);
                }
            };

            try
            {
                // Remove shebang line if present
                data = data.replace(/^#!(.*?)\n/, "");

                var m;
                if (/^text!/.test(moduleIdentifier))
                {
                    // text plugin
                    eval(
                        "loader.bravojs.module.declare([], function() {\n" +
                        'return ["' + data.replace(/"/g, '\\"').replace(/\n/g, '","') + '"].join("\\n");' +
                        "\n});"
                    );
                }
                else
                if (m = data.match(/(^|[\r\n])\s*define\(\[([^\]]*)\].*/))
                {
                    // AMD with dependencies

                    var deps = m[2].split(",").map(function(dep)
                    {
                        return "'" + dep.replace(/^\s*"|^\s*'|"\s*$|'\s*$/g, "") + "'";
                    });

                    // strip all data prior to define()
                    var parts = data.split(m[0]);
                    if (parts.length != 2)
                        throw new Error("Unable to fix define() wrapper for module: " + moduleIdentifier);
                    data = m[0].replace(/^[\r\n]\s*/, "") + parts[1];

                    eval(
                        "loader.bravojs.module.declare([" +
                        deps.filter(function(dep)
                        {
                            return (!/^'(require|module|exports)'$/.test(dep));
                        }).join(",") +
                        "], function(require, exports, module) {\n" + 
                        "({define:function(deps, factory){module.exports = factory(" +
                        deps.map(function(dep)
                        {
                            if (/^'(require|module|exports)'$/.test(dep))
                                return dep.substring(1, dep.length-1);
                            else
                                return "require(" + dep + ")";
                        }).join(",") +
                        ");}})." +
                        data +
                        "\n});"
                    );
                }
                else
                if (m = data.match(/(^|[\r\n])\s*define\(\s*function\s*\(\s*require\s*,\s*exports\s*,\s*module\s*\)\s*{.*/))
                {
                    // AMD without dependencies

                    // strip all data prior to define()
                    var parts = data.split(m[0]);
                    if (parts.length != 2)
                        throw new Error("Unable to fix define() wrapper for module: " + moduleIdentifier);
                    data = parts[1];

                    eval(
                        "loader.bravojs.module.declare([" +
                        API.UTIL.scrapeDeps(data).join(',') +
                        "], function(require, exports, module) {\n" + 
                        data
                    );
                }
                else
                if ((typeof loader.bravojs.module.constructor.prototype.load != "undefined" &&
                     typeof loader.bravojs.module.constructor.prototype.load.modules11 != "undefined" &&
                     loader.bravojs.module.constructor.prototype.load.modules11 === false) || data.match(/(^|[\r\n])\s*module.declare\s*\(/))
                {
                    // Modules/2
                    eval("loader.bravojs." + data.replace(/^\s\s*/g, ""));
                }
                else
                {
                    // Modules/1.1
                    eval("loader.bravojs.module.declare([" + API.UTIL.scrapeDeps(data).join(',') + "], function(require, exports, module) {\n" + data + "\n});");
                }
            }
            catch(e)
            {
                e.message += "\n in module " + moduleIdentifier;
                throw e;
            }
        }

        var pkg = self.packageForId(moduleIdentifier, true);
        if (pkg)
        {
            // We do not need to load native modules. See Plugin.prototype.requireModule above.
            if (pkg.getIsNative())
            {
                callback(moduleIdentifier);
            }
            else
            if (pkg.getModuleSource(self, moduleIdentifier, load) === false)
            {
                callback(moduleIdentifier);
            }
        }
        else
        {
            var URL = loader.bravojs.require.canonicalize(moduleIdentifier),
                m = URL.match(/^memory:\/(.*)$/),
                path = m[1];

            path = path.replace(/^\w*!/, "");

            if (/\.js$/.test(path) && !API.FILE.exists(path))
                path = path.substring(0, path.length-3);

            load(API.FILE.read(path));
        }
    }

    loader.bravojs.module.constructor.prototype.declare = function pinf_loader_declare(dependencies, moduleFactory)
    {
        var id    = loading.id;
        var callback  = loading.callback;

        loading = void 0;

        if (typeof dependencies === "function")
        {
          moduleFactory = dependencies;
          dependencies = [];
        }

        loader.bravojs.provideModule(dependencies, moduleFactory, id, callback);
    }


    // ######################################################################
    // # Sandbox API
    // ######################################################################
    
    self.declare = loader.bravojs.module.declare;
}

/**
 * Create or get existing package for path
 * 
 * NOTE: The 'locator' argument gets modified!
 * TODO: Refactor so 'locator' argument does not get modified.
 */
Sandbox.prototype.ensurePackageForLocator = function(locator, options)
{
    var self = this;
    var locatorDescriptor = locator.descriptor || void 0;
    delete locator.descriptor;

    function finalize(packageId, newLocator)
    {
        if (typeof newLocator == "undefined")
        {
            if (typeof self.packages[packageId].uid != "undefined")
                locator.uid = self.packages[packageId].uid;
            newLocator = self.program.descriptor.augmentLocator(locator, options);
        }
        for (var key in newLocator)
            locator[key] = newLocator[key];
        if (typeof locatorDescriptor != "undefined")
            locator.descriptor = locatorDescriptor;
        return self.packages[packageId];
    }

    if (typeof locator.id != "undefined" && typeof this.packages[locator.id] != "undefined")
    {
        return finalize(locator.id);
    }
    else
    if (typeof locator.uid != "undefined" && typeof this.packages[locator.uid] != "undefined")
    {
        return finalize(locator.uid);
    }
    var path = locator.location;
    if (typeof this.packages[path] == "undefined")
    {
        this.packages[path] = new PACKAGE.Package(new DESCRIPTORS.Package(path));

        // If package has a UID set we also index our packages by it
        // TODO: Add version to key if applicable
        if (typeof this.packages[path].uid != "undefined")
        {
            locator.id = this.packages[path].uid;
            this.packages[this.packages[path].uid] = this.packages[path];
        }

        // If locator has an ID set we also index our packages by it
        if (typeof locator.id != "undefined")
            this.packages[locator.id] = this.packages[path];

        // Merge descriptor information from the locator onto the package descriptor if applicable
        // We first ask the program descriptor to augment the locator with any additional info
        var newLocator = this.program.descriptor.augmentLocator(locator, options);

        if (typeof newLocator.descriptor != "undefined")
        {
            API.UTIL.deepMerge(this.packages[path].normalizedDescriptor.json, newLocator.descriptor);
        }

        // Convert mapped module IDs to paths
        if (typeof this.packages[path].normalizedDescriptor.json.modules != "undefined")
        {
            var libDir = this.packages[path].normalizedDescriptor.json.directories && this.packages[path].normalizedDescriptor.json.directories.lib;
            if (typeof this.libDir != "string")
                libDir = "lib";

            var modules = {};
            for (var id in this.packages[path].normalizedDescriptor.json.modules)
            {
                if (id.charAt(0) == "." || id.charAt(0) == "/")
                    modules[id.replace(/^\./, "")] = this.program.descriptor.augmentLocator(this.packages[path].normalizedDescriptor.json.modules[id], options);
                else
                    modules["/" + libDir + "/" + id] = this.program.descriptor.augmentLocator(this.packages[path].normalizedDescriptor.json.modules[id], options);
            }
            this.packages[path].normalizedDescriptor.json.modules = modules;
        }
        return finalize(path, newLocator);
    }
    else
        return finalize(path);
}

/**
 * Get an existing package for id
 */
Sandbox.prototype.packageForId = function(id, silent)
{
    if (!id)
        throw new Error("Empty ID!");

    var m = id.match(/^(\/?)(.*?)(@\/(.*))?$/),
        lookupIds;

    // m[1] - '/' prefix
    // m[2] - path
    // m[3] -
    // m[4] - after @/

    if (!m[1] && m[2])
        lookupIds = [ m[2] + "/", m[2] ];
    else
    if (m[1] == "/" && m[2])
        lookupIds = [ "/" + m[2] + "/", m[2] + "/", "/" + m[2], m[2]];

    var lookupId;
    if (!lookupIds || lookupIds.length==0 || (lookupId = Object.keys(this.packages).filter(function(id) { return (lookupIds.indexOf(id)>-1); })).length == 0)
    {
        if (silent)
            return null;
        throw new Error("Package for id '" + id + "' not found via lookup IDs '" + lookupIds + "' in packages: " + Object.keys(this.packages));
    }
    return this.packages[lookupId[0]];
}

});
__loader__.memoize('sha1', function(__require__, module, exports) {
// ######################################################################
// # /sha1.js
// ######################################################################
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS 180-1
 * Version 2.2 Copyright Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
exports.hex_sha1 = function hex_sha1(s)    { return rstr2hex(rstr_sha1(str2rstr_utf8(s))); }
function b64_sha1(s)    { return rstr2b64(rstr_sha1(str2rstr_utf8(s))); }
function any_sha1(s, e) { return rstr2any(rstr_sha1(str2rstr_utf8(s)), e); }
function hex_hmac_sha1(k, d)
  { return rstr2hex(rstr_hmac_sha1(str2rstr_utf8(k), str2rstr_utf8(d))); }
function b64_hmac_sha1(k, d)
  { return rstr2b64(rstr_hmac_sha1(str2rstr_utf8(k), str2rstr_utf8(d))); }
function any_hmac_sha1(k, d, e)
  { return rstr2any(rstr_hmac_sha1(str2rstr_utf8(k), str2rstr_utf8(d)), e); }

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test()
{
  return hex_sha1("abc").toLowerCase() == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA1 of a raw string
 */
function rstr_sha1(s)
{
  return binb2rstr(binb_sha1(rstr2binb(s), s.length * 8));
}

/*
 * Calculate the HMAC-SHA1 of a key and some data (raw strings)
 */
function rstr_hmac_sha1(key, data)
{
  var bkey = rstr2binb(key);
  if(bkey.length > 16) bkey = binb_sha1(bkey, key.length * 8);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = binb_sha1(ipad.concat(rstr2binb(data)), 512 + data.length * 8);
  return binb2rstr(binb_sha1(opad.concat(hash), 512 + 160));
}

/*
 * Convert a raw string to a hex string
 */
function rstr2hex(input)
{
  try { hexcase } catch(e) { hexcase=0; }
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var output = "";
  var x;
  for(var i = 0; i < input.length; i++)
  {
    x = input.charCodeAt(i);
    output += hex_tab.charAt((x >>> 4) & 0x0F)
           +  hex_tab.charAt( x        & 0x0F);
  }
  return output;
}

/*
 * Convert a raw string to a base-64 string
 */
function rstr2b64(input)
{
  try { b64pad } catch(e) { b64pad=''; }
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var output = "";
  var len = input.length;
  for(var i = 0; i < len; i += 3)
  {
    var triplet = (input.charCodeAt(i) << 16)
                | (i + 1 < len ? input.charCodeAt(i+1) << 8 : 0)
                | (i + 2 < len ? input.charCodeAt(i+2)      : 0);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > input.length * 8) output += b64pad;
      else output += tab.charAt((triplet >>> 6*(3-j)) & 0x3F);
    }
  }
  return output;
}

/*
 * Convert a raw string to an arbitrary string encoding
 */
function rstr2any(input, encoding)
{
  var divisor = encoding.length;
  var remainders = Array();
  var i, q, x, quotient;

  /* Convert to an array of 16-bit big-endian values, forming the dividend */
  var dividend = Array(Math.ceil(input.length / 2));
  for(i = 0; i < dividend.length; i++)
  {
    dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);
  }

  /*
   * Repeatedly perform a long division. The binary array forms the dividend,
   * the length of the encoding is the divisor. Once computed, the quotient
   * forms the dividend for the next step. We stop when the dividend is zero.
   * All remainders are stored for later use.
   */
  while(dividend.length > 0)
  {
    quotient = Array();
    x = 0;
    for(i = 0; i < dividend.length; i++)
    {
      x = (x << 16) + dividend[i];
      q = Math.floor(x / divisor);
      x -= q * divisor;
      if(quotient.length > 0 || q > 0)
        quotient[quotient.length] = q;
    }
    remainders[remainders.length] = x;
    dividend = quotient;
  }

  /* Convert the remainders to the output string */
  var output = "";
  for(i = remainders.length - 1; i >= 0; i--)
    output += encoding.charAt(remainders[i]);

  /* Append leading zero equivalents */
  var full_length = Math.ceil(input.length * 8 /
                                    (Math.log(encoding.length) / Math.log(2)))
  for(i = output.length; i < full_length; i++)
    output = encoding[0] + output;

  return output;
}

/*
 * Encode a string as utf-8.
 * For efficiency, this assumes the input is valid utf-16.
 */
function str2rstr_utf8(input)
{
  var output = "";
  var i = -1;
  var x, y;

  while(++i < input.length)
  {
    /* Decode utf-16 surrogate pairs */
    x = input.charCodeAt(i);
    y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
    if(0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF)
    {
      x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
      i++;
    }

    /* Encode output as utf-8 */
    if(x <= 0x7F)
      output += String.fromCharCode(x);
    else if(x <= 0x7FF)
      output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F),
                                    0x80 | ( x         & 0x3F));
    else if(x <= 0xFFFF)
      output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                                    0x80 | ((x >>> 6 ) & 0x3F),
                                    0x80 | ( x         & 0x3F));
    else if(x <= 0x1FFFFF)
      output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                                    0x80 | ((x >>> 12) & 0x3F),
                                    0x80 | ((x >>> 6 ) & 0x3F),
                                    0x80 | ( x         & 0x3F));
  }
  return output;
}

/*
 * Encode a string as utf-16
 */
function str2rstr_utf16le(input)
{
  var output = "";
  for(var i = 0; i < input.length; i++)
    output += String.fromCharCode( input.charCodeAt(i)        & 0xFF,
                                  (input.charCodeAt(i) >>> 8) & 0xFF);
  return output;
}

function str2rstr_utf16be(input)
{
  var output = "";
  for(var i = 0; i < input.length; i++)
    output += String.fromCharCode((input.charCodeAt(i) >>> 8) & 0xFF,
                                   input.charCodeAt(i)        & 0xFF);
  return output;
}

/*
 * Convert a raw string to an array of big-endian words
 * Characters >255 have their high-byte silently ignored.
 */
function rstr2binb(input)
{
  var output = Array(input.length >> 2);
  for(var i = 0; i < output.length; i++)
    output[i] = 0;
  for(var i = 0; i < input.length * 8; i += 8)
    output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (24 - i % 32);
  return output;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2rstr(input)
{
  var output = "";
  for(var i = 0; i < input.length * 32; i += 8)
    output += String.fromCharCode((input[i>>5] >>> (24 - i % 32)) & 0xFF);
  return output;
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function binb_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = bit_rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(bit_rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = bit_rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

});
__loader__.memoize('term', function(__require__, module, exports) {
// ######################################################################
// # /term.js
// ######################################################################
// @see https://github.com/280north/narwhal/blob/master/packages/narwhal-lib/lib/narwhal/term.js
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// reference: http://ascii-table.com/ansi-escape-sequences-vt-100.php

var API = __require__('api'),
    SYSTEM = API.SYSTEM,
    UTIL = __require__('util');

var terms = [
    'ansi',
    'vt100',
    'xterm',
    'xtermc',
    'xterm-color',
    'gnome-terminal'
];

exports.Stream = function (system) {
    var self = Object.create(system.stdout);
    var output = system.stdout;
    var errput = system.stderr;
    var fore = "";
    var back = "";
    var bold = "0";
    var stack = [];
    var enabled = UTIL.has(terms, SYSTEM.env.TERM);

    self.enable = function () {
        enabled = true;
    };

    self.disable = function () {
        enabled = false;
    };

    self.writeCode = function (code) {
        if (enabled) {
            output.flush();
            errput.write(code).flush();
        }
        return self;
    };

    self.print = function () {
        // todo recordSeparator, fieldSeparator
        self.write(Array.prototype.join.call(arguments, " ") + "\n");
        self.flush();
        return self;
    };

    self.printError = function () {
        // todo recordSeparator, fieldSeparator
        self.write(Array.prototype.join.call(arguments, " ") + "\n", true);
        self.flush();
        return self;
    };

    self.write = function (string, error, noclear) {
        var toput = error ? errput : output;
        var at = 0;
        self.update(bold, fore, back);
        while (at < string.length) {
            var pos = string.indexOf("\0", at);
            if (pos == -1) {
                // no additional marks, advanced to end
                toput.write(string.substring(at, string.length));
                at = string.length;
            } else {
                toput.write(string.substring(at, pos));
                at = pos + 1;
                if (string.charAt(at) == ")" || string.substring(at, at+2) == ":)" ) {
                    if (!stack.length)
                        throw new Error("No colors on the stack at " + at);
                    var pair = stack.pop();
                    bold = pair[0];
                    if(string.charAt(at) == ")") {
                        fore = pair[1];
                    } else {
                        back = pair[2];
                        at = at + 1;
                    }
                    at = at + 1;
                    self.update(bold, fore, back);
                } else {
                    var paren = string.indexOf("(", at);
                    stack.push([bold, fore, back]);
                    var command = string.substring(at, paren);
                    if (command == "bold") {
                        bold = "1";
                    } else if (Object.prototype.hasOwnProperty.call(exports.colors, command)) {
                        fore = exports.colors[command];
                    } else if (
                        /^:/.test(command) &&
                        Object.prototype.hasOwnProperty.call(exports.colors, command.substring(1))
                    ) {
                        back = exports.colors[command.substring(1)];
                    } else {
                        throw new Error("No such command: " + command);
                    }
                    self.update(bold, fore, back);
                    at = paren + 1;
                }
            }
        }
        if(!noclear)
            self.update("0", "", "");
        return self;
    };

    self.update = function (bold, fore, back) {
        return self.writeCode(
            "\033[" + [
                bold,
                (fore.length ? "3" + fore : ""),
                (back.length ? "4" + back : ""),
            ].filter(function (string) {
                return string.length;
            }).join(";") + "m"
        );
    };
    
    self.moveTo = function (y, x) {
        return self.writeCode("\033[" + y + ";" + x + "H");
    };

    self.moveBy = function (y, x) {
        if (y == 0) {
        } else if (y < 0) {
            self.writeCode("\033[" + (-y) + "A");
        } else {
            self.writeCode("\033[" + y + "B");
        }
        if (x == 0) {
        } else if (x > 0) {
            self.writeCode("\033[" + x + "C");
        } else {
            self.writeCode("\033[" + (-x) + "D");
        }
        errput.flush();
        return self;
    };

    self.home = function () {
        return self.writeCode("\033[H");
    };

    self.clear = function () {
        return self.writeCode("\033[2J");
    };
    self.clearUp = function () {
        return self.writeCode("\033[1J");
    };
    self.cearDown = function () {
        return self.writeCode("\033[J");
    };
    self.clearLine = function () {
        return self.writeCode("\033[2K");
    };
    self.clearLeft = function () {
        return self.writeCode("\033[1K");
    };
    self.clearRight = function () {
        return self.writeCode("\033[K");
    };

    self.update(bold, fore, back);

    self.error = {};

    self.error.print = function () {
        return self.printError.apply(self, arguments);
    };

    self.error.write = function (message) {
        return self.write(message, true);
    };

    return self;
};

exports.colors = {
    "black": "0",
    "red": "1",
    "green": "2",
    "orange": "3",
    "yellow": "3",
    "blue": "4",
    "violet": "5",
    "magenta": "5",
    "purple": "5",
    "cyan": "6",
    "white": "7"
}

});
__loader__.memoize('util', function(__require__, module, exports) {
// ######################################################################
// # /util.js
// ######################################################################
// @see https://github.com/280north/narwhal/blob/master/packages/narwhal-lib/lib/narwhal/util.js
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- isaacs Isaac Schlueter
// -- nrstott Nathan Stott
// -- fitzgen Nick Fitzgerald
// -- nevilleburnell Neville Burnell
// -- cadorn Christoph Dorn

// a decorator for functions that curry "polymorphically",
// that is, that return a function that can be tested
// against various objects if they're only "partially
// completed", or fewer arguments than needed are used.
//
// this enables the idioms:
//      [1, 2, 3].every(lt(4)) eq true
//      [1, 2, 3].map(add(1)) eq [2, 3, 4]
//      [{}, {}, {}].forEach(set('a', 10))
//
exports.operator = function (name, length, block) {
    var operator = function () {
        var args = exports.array(arguments);
        var completion = function (object) {
            if (
                typeof object == "object" &&
                object !== null && // seriously?  typeof null == "object"
                name in object && // would throw if object === null
                // not interested in literal objects:
                !Object.prototype.hasOwnProperty.call(object, name)
            )
                return object[name].apply(object, args);
            return block.apply(
                this,
                [object].concat(args)
            );
        };
        if (arguments.length < length) {
            // polymoprhic curry, delayed completion
            return completion;
        } else {
            // immediate completion
            return completion.call(this, args.shift());
        }
    };
//    operator.name = name;
//    operator.length = length;
    operator.displayName = name;
    operator.operator = block;
    return operator;
};

exports.no = function (value) {
    return value === null || value === undefined;
};

// object

exports.object = exports.operator('toObject', 1, function (object) {
    var items = object;
    if (!items.length)
        items = exports.items(object);
    var copy = {};
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var key = item[0];
        var value = item[1];
        copy[key] = value;
    }
    return copy;
});

exports.object.copy = function (object) {
    var copy = {};
    exports.object.keys(object).forEach(function (key) {
        copy[key] = object[key];
    });
    return copy;
};

exports.object.deepCopy = function (object) {
    var copy = {};
    exports.object.keys(object).forEach(function (key) {
        copy[key] = exports.deepCopy(object[key]);
    });
    return copy;
};

exports.object.eq = function (a, b, stack) {
    return (
        !exports.no(a) && !exports.no(b) &&
        exports.array.eq(
            exports.sort(exports.object.keys(a)),
            exports.sort(exports.object.keys(b))
        ) &&
        exports.object.keys(a).every(function (key) {
            return exports.eq(a[key], b[key], stack);
        })
    );
};

exports.object.len = function (object) {
    return exports.object.keys(object).length;
};

exports.object.has = function (object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
};

exports.object.keys = function (object) {
    var keys = [];
    for (var key in object) {
        if (exports.object.has(object, key))
            keys.push(key);
    }
    return keys;
};

exports.object.values = function (object) {
    var values = [];
    exports.object.keys(object).forEach(function (key) {
        values.push(object[key]);
    });
    return values;
};

exports.object.items = function (object) {
    var items = [];
    exports.object.keys(object).forEach(function (key) {
        items.push([key, object[key]]);
    });
    return items;
};

/**
 * Updates an object with the properties from another object.
 * This function is variadic requiring a minimum of two arguments.
 * The first argument is the object to update.  Remaining arguments
 * are considered the sources for the update.  If multiple sources
 * contain values for the same property, the last one with that
 * property in the arguments list wins.
 *
 * example usage:
 * util.update({}, { hello: "world" });  // -> { hello: "world" }
 * util.update({}, { hello: "world" }, { hello: "le monde" }); // -> { hello: "le monde" }
 *
 * @returns Updated object
 * @type Object
 *
 */
exports.object.update = function () {
    return variadicHelper(arguments, function(target, source) {
        var key;
        for (key in source) {
            if (exports.object.has(source, key)) {
                target[key] = source[key];
            }
        }
    });
};

exports.object.deepUpdate = function (target, source) {
    var key;
    for (key in source) {
        if(exports.object.has(source, key)) {
            if(typeof source[key] == "object" && exports.object.has(target, key)) {
                exports.object.deepUpdate(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
};

/**
 * Updates an object with the properties of another object(s) if those
 * properties are not already defined for the target object. First argument is
 * the object to complete, the remaining arguments are considered sources to
 * complete from. If multiple sources contain the same property, the value of
 * the first source with that property will be the one inserted in to the
 * target.
 *
 * example usage:
 * util.complete({}, { hello: "world" });  // -> { hello: "world" }
 * util.complete({ hello: "narwhal" }, { hello: "world" }); // -> { hello: "narwhal" }
 * util.complete({}, { hello: "world" }, { hello: "le monde" }); // -> { hello: "world" }
 *
 * @returns Completed object
 * @type Object
 *
 */
exports.object.complete = function () {
    return variadicHelper(arguments, function(target, source) {
        var key;
        for (key in source) {
            if (
                exports.object.has(source, key) &&
                !exports.object.has(target, key)
            ) {
                target[key] = source[key];
            }
        }
    });
};

exports.object.deepComplete = function () {
    return variadicHelper(arguments, function (target, source) {
        var key;
        for (key in source) {
            if (
                exports.object.has(source, key) &&
                !exports.object.has(target, key)
            ) {
                target[key] = exports.deepCopy(source[key]);
            }
        }
    });
};

exports.object.repr = function (object) {
    return "{" +
        exports.object.keys(object)
        .map(function (key) {
            return exports.enquote(key) + ": " +
                exports.repr(object[key]);
        }).join(", ") +
    "}";
};

/**
 * @param args Arguments list of the calling function
 * First argument should be a callback that takes target and source parameters.
 * Second argument should be target.
 * Remaining arguments are treated a sources.
 *
 * @returns Target
 * @type Object
 */
var variadicHelper = function (args, callback) {
    var sources = Array.prototype.slice.call(args);
    var target = sources.shift();

    sources.forEach(function(source) {
        callback(target, source);
    });

    return target;
};

// array

exports.array = function (array) {
    if (exports.no(array))
        return [];
    if (!exports.isArrayLike(array)) {
        if (
            array.toArray &&
            !Object.prototype.hasOwnProperty.call(array, 'toArray')
        ) {
            return array.toArray();
        } else if (
            array.forEach &&
            !Object.prototype.hasOwnProperty.call(array, 'forEach')
        ) {
            var results = [];
            array.forEach(function (value) {
                results.push(value);
            });
            return results;
        } else if (typeof array === "string") {
            return Array.prototype.slice.call(array);
        } else {
            return exports.items(array);
        }
    }
    return Array.prototype.slice.call(array);
};

exports.array.coerce = function (array) {
    if (!Array.isArray(array))
        return exports.array(array);
    return array;
};

exports.isArrayLike = function(object) {
    return Array.isArray(object) || exports.isArguments(object);
};

// from http://code.google.com/p/google-caja/wiki/NiceNeighbor
// by "kangax"
//
// Mark Miller posted a solution that will work in ES5 compliant
// implementations, that may provide future insight:
// (http://groups.google.com/group/narwhaljs/msg/116097568bae41c6)
exports.isArguments = function (object) {
    // ES5 reliable positive
    if (Object.prototype.toString.call(object) == "[object Arguments]")
        return true;
    // for ES5, we will still need a way to distinguish false negatives
    //  from the following code (in ES5, it is possible to create
    //  an object that satisfies all of these constraints but is
    //  not an Arguments object).
    // callee should exist
    if (
        !typeof object == "object" ||
        !Object.prototype.hasOwnProperty.call(object, 'callee') ||
        !object.callee ||
        // It should be a Function object ([[Class]] === 'Function')
        Object.prototype.toString.call(object.callee) !== '[object Function]' ||
        typeof object.length != 'number'
    )
        return false;
    for (var name in object) {
        // both "callee" and "length" should be { DontEnum }
        if (name === 'callee' || name === 'length') return false;
    }
    return true;
};

exports.array.copy = exports.array;

exports.array.deepCopy = function (array) {
    return array.map(exports.deepCopy);
};

exports.array.len = function (array) {
    return array.length;
};

exports.array.has = function (array, value) {
    return Array.prototype.indexOf.call(array, value) >= 0;
};

exports.array.put = function (array, key, value) {
    array.splice(key, 0, value);
    return array;
};

exports.array.del = function (array, begin, end) {
    array.splice(begin, end === undefined ? 1 : (end - begin));
    return array;
};

exports.array.eq = function (a, b, stack) {
    return exports.isArrayLike(b) &&
        a.length == b.length &&
        exports.zip(a, b).every(exports.apply(function (a, b) {
            return exports.eq(a, b, stack);
        }));
};

exports.array.lt = function (a, b) {
    var length = Math.max(a.length, b.length);
    for (var i = 0; i < length; i++)
        if (!exports.eq(a[i], b[i]))
            return exports.lt(a[i], b[i]);
    return false;
};

exports.array.repr = function (array) {
    return "[" + exports.map(array, exports.repr).join(', ') + "]";
};

exports.array.first = function (array) {
    return array[0];
};

exports.array.last = function (array) {
    return array[array.length - 1];
};

exports.apply = exports.operator('apply', 2, function (args, block) {
    return block.apply(this, args);
});

exports.copy = exports.operator('copy', 1, function (object) {
    if (exports.no(object))
        return object;
    if (exports.isArrayLike(object))
        return exports.array.copy(object);
    if (object instanceof Date)
        return object;
    if (typeof object == 'object')
        return exports.object.copy(object);
    return object;
});

exports.deepCopy = exports.operator('deepCopy', 1, function (object) {
    if (exports.no(object))
        return object;
    if (exports.isArrayLike(object))
        return exports.array.deepCopy(object);
    if (typeof object == 'object')
        return exports.object.deepCopy(object);
    return object;
});

exports.repr = exports.operator('repr', 1, function (object) {
    if (exports.no(object))
        return String(object);
    if (exports.isArrayLike(object))
        return exports.array.repr(object);
    if (typeof object == 'object' && !(object instanceof Date))
        return exports.object.repr(object);
    if (typeof object == 'string')
        return exports.enquote(object);
    return object.toString();
});

exports.keys = exports.operator('keys', 1, function (object) {
    if (exports.isArrayLike(object))
        return exports.range(object.length);
    else if (typeof object == 'object')
        return exports.object.keys(object);
    return [];
});

exports.values = exports.operator('values', 1, function (object) {
    if (exports.isArrayLike(object))
        return exports.array(object);
    else if (typeof object == 'object')
        return exports.object.values(object);
    return [];
});

exports.items = exports.operator('items', 1, function (object) {
    if (exports.isArrayLike(object) || typeof object == "string")
        return exports.enumerate(object);
    else if (typeof object == 'object')
        return exports.object.items(object);
    return [];
});

exports.len = exports.operator('len', 1, function (object) {
    if (exports.isArrayLike(object))
        return exports.array.len(object);
    else if (typeof object == 'object')
        return exports.object.len(object);
});

exports.has = exports.operator('has', 2, function (object, value) {
    if (exports.isArrayLike(object))
        return exports.array.has(object, value);
    else if (typeof object == 'object')
        return exports.object.has(object, value);
    return false;
});

exports.get = exports.operator('get', 2, function (object, key, value) {
    if (typeof object == "string") {
        if (!typeof key == "number")
            throw new Error("TypeError: String keys must be numbers");
        if (!exports.has(exports.range(object.length), key)) {
            if (arguments.length == 3)
                return value;
            throw new Error("KeyError: " + exports.repr(key));
        }
        return object.charAt(key);
    }
    if (typeof object == "object") {
        if (!exports.object.has(object, key)) {
            if (arguments.length == 3)
                return value;
            throw new Error("KeyError: " + exports.repr(key));
        }
        return object[key];
    }
    throw new Error("Object does not have keys: " + exports.repr(object));
});

exports.set = exports.operator('set', 3, function (object, key, value) {
    object[key] = value;
    return object;
});

exports.getset = exports.operator('getset', 3, function (object, key, value) {
    if (!exports.has(object, key))
        exports.set(object, key, value);
    return exports.get(object, key);
});

exports.del = exports.operator('del', 2, function (object, begin, end) {
    if (exports.isArrayLike(object))
        return exports.array.del(object, begin, end);
    delete object[begin];
    return object;
});

exports.cut = exports.operator('cut', 2, function (object, key) {
    var result = exports.get(object, key);
    exports.del(object, key);
    return result;
});

exports.put = exports.operator('put', 2, function (object, key, value) {
    if (exports.isArrayLike(object))
        return exports.array.put(object, key, value);
    return exports.set(object, key, value);
});

exports.first = exports.operator('first', 1, function (object) {
    return object[0];
});

exports.last = exports.operator('last', 1, function (object) {
    return object[object.length - 1];
});

exports.update = exports.operator('update', 2, function () {
    var args = Array.prototype.slice.call(arguments);
    return exports.object.update.apply(this, args);
});

exports.deepUpdate = exports.operator('deepUpdate', 2, function (target, source) {
    exports.object.deepUpdate(target, source);
});

exports.complete = exports.operator('complete', 2, function (target, source) {
    var args = Array.prototype.slice.call(arguments);
    return exports.object.complete.apply(this, args);
});

exports.deepComplete = exports.operator('deepComplete', 2, function (target, source) {
    var args = Array.prototype.slice.call(arguments);
    return exports.object.deepComplete.apply(this, args);
});

exports.remove = exports.operator('remove', 2, function (list, value) {
    var index;
    if ((index = list.indexOf(value))>-1)
        list.splice(index,1);
    return list;
});

// TODO insert
// TODO discard

exports.range = function () {
    var start = 0, stop = 0, step = 1;
    if (arguments.length == 1) {
        stop = arguments[0];
    } else {
        start = arguments[0];
        stop = arguments[1];
        step = arguments[2] || 1;
    }
    var range = [];
    for (var i = start; i < stop; i += step)
        range.push(i);
    return range;
};

exports.forEach = function (array, block) {
    Array.prototype.forEach.call(
        exports.array.coerce(array),
        block
    );
};

exports.forEachApply = function (array, block) {
    Array.prototype.forEach.call(
        exports.array.coerce(array),
        exports.apply(block)
    );
};

exports.map = function (array, block, context) {
    return Array.prototype.map.call(
        exports.array.coerce(array),
        block,
        context
    );
};

exports.mapApply = function (array, block) {
    return Array.prototype.map.call(
        exports.array.coerce(array),
        exports.apply(block)
    );
};

exports.every = exports.operator('every', 2, function (array, block, context) {
    return exports.all(exports.map(array, block, context));
});

exports.some = exports.operator('some', 2, function (array, block, context) {
    return exports.any(exports.map(array, block, context));
});

exports.all = exports.operator('all', 1, function (array) {
    array = exports.array.coerce(array);
    for (var i = 0; i < array.length; i++)
        if (!array[i])
            return false;
    return true;
});

exports.any = exports.operator('any', 1, function (array) {
    array = exports.array.coerce(array);
    for (var i = 0; i < array.length; i++)
        if (array[i])
            return true;
    return false;
});

exports.reduce = exports.operator('reduce', 2, function (array, block, basis) {
    array = exports.array.coerce(array);
    return array.reduce.apply(array, arguments);
});

exports.reduceRight = exports.operator('reduceRight', 2, function (array, block, basis) {
    array = exports.array.coerce(array);
    return array.reduceRight.apply(array, arguments);
});

exports.zip = function () {
    return exports.transpose(arguments);
};

exports.transpose = function (array) {
    array = exports.array.coerce(array);
    var transpose = [];
    var length = Math.min.apply(this, exports.map(array, function (row) {
        return row.length;
    }));
    for (var i = 0; i < array.length; i++) {
        var row = array[i];
        for (var j = 0; j < length; j++) {
            var cell = row[j];
            if (!transpose[j])
                transpose[j] = [];
            transpose[j][i] = cell;
        }
    }
    return transpose;
};

exports.enumerate = function (array, start) {
    array = exports.array.coerce(array);
    if (exports.no(start))
        start = 0;
    return exports.zip(
        exports.range(start, start + array.length),
        array
    );
};

// arithmetic, transitive, and logical operators

exports.is = function (a, b) {
    // <Mark Miller>
    if (a === b)
        // 0 === -0, but they are not identical
        return a !== 0 || 1/a === 1/b;
    // NaN !== NaN, but they are identical.
    // NaNs are the only non-reflexive value, i.e., if a !== a,
    // then a is a NaN.
    return a !== a && b !== b;
    // </Mark Miller>
};

exports.eq = exports.operator('eq', 2, function (a, b, stack) {
    if (!stack)
        stack = [];
    if (a === b)
        return true;
    if (typeof a !== typeof b)
        return false;
    if (exports.no(a))
        return exports.no(b);
    if (a instanceof Date)
        return a.valueOf() === b.valueOf();
    if (a instanceof RegExp)
        return a.source === b.source &&
            a.global === b.global &&
            a.ignoreCase === b.ignoreCase &&
            a.multiline === b.multiline;
    if (typeof a === "function") {
        var caller = stack[stack.length - 1];
        // XXX what is this for?  can it be axed?
        // it comes from the "equiv" project code
        return caller !== Object &&
            typeof caller !== "undefined";
    }
    if (exports.isArrayLike(a))
        return exports.array.eq(
            a, b,
            stack.concat([a.constructor])
        );
    if (typeof a === 'object')
        return exports.object.eq(
            a, b,
            stack.concat([a.constructor])
        );
    return false;
});

exports.ne = exports.operator('ne', 2, function (a, b) {
    return !exports.eq(a, b);
});

exports.lt = exports.operator('lt', 2, function (a, b) {
    if (exports.no(a) != exports.no(b))
        return exports.no(a) > exports.no(b);
    if (exports.isArrayLike(a) && exports.isArrayLike(b))
        return exports.array.lt(a, b);
    return a < b;
});

exports.gt = exports.operator('gt', 2, function (a, b) {
    return !(exports.lt(a, b) || exports.eq(a, b));
});

exports.le = exports.operator('le', 2, function (a, b) {
    return exports.lt(a, b) || exports.eq(a, b);
});

exports.ge = exports.operator('ge', 2, function (a, b) {
    return !exports.lt(a, b);
});

exports.mul = exports.operator('mul', 2, function (a, b) {
    if (typeof a == "string")
        return exports.string.mul(a, b);
    return a * b;
});

/*** by
    returns a `comparator` that compares
    values based on the values resultant from
    a given `relation`.
    accepts a `relation` and an optional comparator.

    To sort a list of objects based on their
    "a" key::

        objects.sort(by(get("a")))

    To get those in descending order::

        objects.sort(by(get("a")), desc)

    `by` returns a comparison function that also tracks
    the arguments you used to construct it.  This permits
    `sort` and `sorted` to perform a Schwartzian transform
    which can increase the performance of the sort
    by a factor of 2.
*/
exports.by = function (relation) {
    var compare = arguments[1];
    if (exports.no(compare))
        compare = exports.compare;
    var comparator = function (a, b) {
        a = relation(a);
        b = relation(b);
        return compare(a, b);
    };
    comparator.by = relation;
    comparator.compare = compare;
    return comparator;
};

exports.compare = exports.operator('compare', 2, function (a, b) {
    if (exports.no(a) !== exports.no(b))
        return exports.no(b) - exports.no(a);
    if (typeof a === "number" && typeof b === "number")
        return a - b;
    return exports.eq(a, b) ? 0 : exports.lt(a, b) ? -1 : 1;
});

/*** sort
    an in-place array sorter that uses a deep comparison
    function by default (compare), and improves performance if
    you provide a comparator returned by "by", using a
    Schwartzian transform.
*/
exports.sort = function (array, compare) {
    if (exports.no(compare))
        compare = exports.compare;
    if (compare.by) {
        /* schwartzian transform */
        array.splice.apply(
            array,
            [0, array.length].concat(
                array.map(function (value) {
                    return [compare.by(value), value];
                }).sort(function (a, b) {
                    return compare.compare(a[0], b[0]);
                }).map(function (pair) {
                    return pair[1];
                })
            )
        );
    } else {
        array.sort(compare);
    }
    return array;
};

/*** sorted
    returns a sorted copy of an array using a deep
    comparison function by default (compare), and
    improves performance if you provide a comparator
    returned by "by", using a Schwartzian transform.
*/
exports.sorted = function (array, compare) {
    return exports.sort(exports.array.copy(array), compare);
};

exports.reverse = function (array) {
    return Array.prototype.reverse.call(array);
};

exports.reversed = function (array) {
    return exports.reverse(exports.array.copy(array));
};

exports.hash = exports.operator('hash', 1, function (object) {
    return '' + object;
});

exports.unique = exports.operator('unique', 1, function (array, eq, hash) {
    var visited = {};
    if (!eq) eq = exports.eq;
    if (!hash) hash = exports.hash;
    return array.filter(function (value) {
        var bucket = exports.getset(visited, hash(value), []);
        var finds = bucket.filter(function (other) {
            return eq(value, other);
        });
        if (!finds.length)
            bucket.push(value);
        return !finds.length;
    });
});

// string

exports.string = exports.operator('toString', 1, function (object) {
    return '' + object;
});

exports.string.mul = function (string, n) {
    return exports.range(n).map(function () {
        return string;
    }).join('');
};

/*** escape
    escapes all characters of a string that are
    special to JavaScript and many other languages.
    Recognizes all of the relevant
    control characters and formats all other
    non-printable characters as Hex byte escape
    sequences or Unicode escape sequences depending
    on their size.

    Pass ``true`` as an optional second argument and
    ``escape`` produces valid contents for escaped
    JSON strings, wherein non-printable-characters are
    all escaped with the Unicode ``\u`` notation.
*/
/* more Steve Levithan flagrence */
var escapeExpression = /[^ !#-[\]-~]/g;
/* from Doug Crockford's JSON library */
var escapePatterns = {
    '\b': '\\b',    '\t': '\\t',
    '\n': '\\n',    '\f': '\\f',    '\r': '\\r',
    '"' : '\\"',    '\\': '\\\\'
};
exports.escape = function (value, strictJson) {
    if (typeof value != "string")
        throw new Error(
            module.path +
            "#escape: requires a string.  got " +
            exports.repr(value)
        );
    return value.replace(
        escapeExpression,
        function (match) {
            if (escapePatterns[match])
                return escapePatterns[match];
            match = match.charCodeAt();
            if (!strictJson && match < 256)
                return "\\x" + exports.padBegin(match.toString(16), 2);
            return '\\u' + exports.padBegin(match.toString(16), 4);
        }
    );
};

/*** enquote
    transforms a string into a string literal, escaping
    all characters of a string that are special to
    JavaScript and and some other languages.

    ``enquote`` uses double quotes to be JSON compatible.

    Pass ``true`` as an optional second argument to
    be strictly JSON compliant, wherein all
    non-printable-characters are represented with
    Unicode escape sequences.
*/
exports.enquote = function (value, strictJson) {
    return '"' + exports.escape(value, strictJson) + '"';
};

/**
 * remove adjacent characters
 * todo: i'm not sure if this works correctly without the second argument
 */
exports.squeeze = function (s) {
    var set = arguments.length > 0 ? "["+Array.prototype.slice.call(arguments, 1).join('')+"]" : ".|\\n",
        regex = new RegExp("("+set+")\\1+", "g");

    return s.replace(regex, "$1");
};

/*** expand
    transforms tabs to an equivalent number of spaces.
*/
// TODO special case for \r if it ever matters
exports.expand = function (str, tabLength) {
    str = String(str);
    tabLength = tabLength || 4;
    var output = [],
        tabLf = /[\t\n]/g,
        lastLastIndex = 0,
        lastLfIndex = 0,
        charsAddedThisLine = 0,
        tabOffset, match;
    while (match = tabLf.exec(str)) {
        if (match[0] == "\t") {
            tabOffset = (
                tabLength - 1 -
                (
                    (match.index - lastLfIndex) +
                    charsAddedThisLine
                ) % tabLength
            );
            charsAddedThisLine += tabOffset;
            output.push(
                str.slice(lastLastIndex, match.index) +
                exports.mul(" ", tabOffset + 1)
            );
        } else if (match[0] === "\n") {
            output.push(str.slice(lastLastIndex, tabLf.lastIndex));
            lastLfIndex = tabLf.lastIndex;
            charsAddedThisLine = 0;
        }
        lastLastIndex = tabLf.lastIndex;
    }
    return output.join("") + str.slice(lastLastIndex);
};

var trimBeginExpression = /^\s\s*/g;
exports.trimBegin = function (value) {
    return String(value).replace(trimBeginExpression, "");
};

var trimEndExpression = /\s\s*$/g;
exports.trimEnd = function (value) {
    return String(value).replace(trimEndExpression, "");
};

exports.trim = function (value) {
    return String(value).replace(trimBeginExpression, "").replace(trimEndExpression, "");
};

/* generates padBegin and padEnd */
var augmentor = function (augment) {
    return function (value, length, pad) {
        if (exports.no(pad)) pad = '0';
        if (exports.no(length)) length = 2;
        value = String(value);
        while (value.length < length) {
            value = augment(value, pad);
        }
        return value;
    };
};

/*** padBegin

    accepts:
     - a `String` or `Number` value
     - a minimum length of the resultant `String`:
       by default, 2
     - a pad string: by default, ``'0'``.

    returns a `String` of the value padded up to at least
    the minimum length.  adds the padding to the begining
    side of the `String`.

*/
exports.padBegin = augmentor(function (value, pad) {
    return pad + value;
});

/*** padEnd

    accepts:
     - a `String` or `Number` value
     - a minimum length of the resultant `String`:
       by default, 2
     - a pad string: by default, ``'0'``.

    returns a `String` of the value padded up to at least
    the minimum length.  adds the padding to the end
    side of the `String`.

*/
exports.padEnd = augmentor(function (value, pad) {
    return value + pad;
});

/*** splitName
    splits a string into an array of words from an original
    string.
*/
// thanks go to Steve Levithan for this regular expression
// that, in addition to splitting any normal-form identifier
// in any case convention, splits XMLHttpRequest into
// "XML", "Http", and "Request"
var splitNameExpression = /[a-z]+|[A-Z](?:[a-z]+|[A-Z]*(?![a-z]))|[.\d]+/g;
exports.splitName = function (value) {
    return String(value).match(splitNameExpression);
};

/*** joinName
    joins a list of words with a given delimiter
    between alphanumeric words.
*/
exports.joinName = function (delimiter, parts) {
    if (exports.no(delimiter)) delimiter = '_';
    parts.unshift([]);
    return parts.reduce(function (parts, part) {
        if (
            part.match(/\d/) &&
            exports.len(parts) && parts[parts.length-1].match(/\d/)
        ) {
            return parts.concat([delimiter + part]);
        } else {
            return parts.concat([part]);
        }
    }).join('');
};

/*** upper
    converts a name to ``UPPER CASE`` using
    a given delimiter between numeric words.

    see:
     - `lower`
     - `camel`
     - `title`

*/
exports.upper = function (value, delimiter) {
    if (exports.no(delimiter))
        return value.toUpperCase();
    return exports.splitName(value).map(function (part) {
        return part.toUpperCase();
    }).join(delimiter);
};

/*** lower
    converts a name to a ``lower case`` using
    a given delimiter between numeric words.

    see:
     - `upper`
     - `camel`
     - `title`

*/
exports.lower = function (value, delimiter) {
    if (exports.no(delimiter))
        return String(value).toLowerCase();
    return exports.splitName(value).map(function (part) {
        return part.toLowerCase();
    }).join(delimiter);
};

/*** camel
    converts a name to ``camel Case`` using
    a given delimiter between numeric words.

    see:
     - `lower`
     - `upper`
     - `title`

*/
exports.camel = function (value, delimiter) {
    return exports.joinName(
        delimiter,
        exports.mapApply(
            exports.enumerate(exports.splitName(value)),
            function (n, part) {
                if (n) {
                    return (
                        part.substring(0, 1).toUpperCase() +
                        part.substring(1).toLowerCase()
                    );
                } else {
                    return part.toLowerCase();
                }
            }
        )
    );
};

/*** title
    converts a name to ``Title Case`` using
    a given delimiter between numeric words.

    see:
     - `lower`
     - `upper`
     - `camel`

*/
exports.title = function (value, delimiter) {
    return exports.joinName(
        delimiter,
        exports.splitName(value).map(function (part) {
            return (
                part.substring(0, 1).toUpperCase() +
                part.substring(1).toLowerCase()
            );
        })
    );
};


});
__pinf_loader_scope__.boot = __loader__.__require__('loader').boot;
};
if(typeof exports != 'undefined') { __pinf_loader__(exports); } else { throw new Error('NYI'); }
})();