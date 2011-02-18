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

    if (typeof api.SYSTEM.print == "undefined")
    {
        api.SYSTEM.print = function(msg)
        {
            dump(msg);
        }
    }

    api.ENV.packageProviders = {
        "mozilla.org/labs/jetpack/":
        {
            requireModule: function(id)
            {
                return api.ENV.platformRequire(id);
            }
        }
    }

    api.SYSTEM.pwd = "__PWD__";

    api.SYSTEM.env = {
        TERM: ""
    };

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

Assembler.prototype.assembleProgram = function(sandbox, uri, callback)
{
    var self = this;

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

        sandbox.setProgram(program);

        program.assembler = self;

        // This will download all packages and make them available on disk
        program.discoverPackages(function assembler_assembleProgram_lambda_discoverPackages_packageForLocator(locator, callback)
        {
            program.resolveLocator(self, locator, function(locator)
            {
                if (typeof locator.location != "undefined" && !FILE.exists(locator.location))
                    throw new Error("This should not happen");
//                else
                // We do not need to follow locators (in order to discover requires()) that map to providers.
//                if (typeof locator.provider != "undefined")
//                    callback(null);
                else
                    callback(sandbox.ensurePackageForLocator(locator));
            });
        }, function assembler_assembleProgram_lambda_discoverPackages_done()
        {
            DEBUG.indent(di);

            callback(program);
        });
    }

    if (ENV.mustClean && !this.cleaned[this.downloader.basePath])
    {
        this.cleaned[this.downloader.basePath] = true;

        DEBUG.print("Removing downloaded packages from: " + this.downloader.basePath);
        
        SYSTEM.exec("rm -Rf " + this.downloader.basePath, function(stdout, stderr)
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
 * @throws If package is not listed (by UID) in program's descriptor
 */
Assembler.prototype.addPackageToProgram = function(sandbox, program, locator, callback)
{
    var self = this;

    var di = DEBUG.indent();
    DEBUG.print("Load additional package into program:").indent(di+1);
    DEBUG.print("Locator(original): " + UTIL.locatorToString(locator));

    program.resolveLocator(self, locator, function(locator)
    {
        DEBUG.print("Locator(resolved): " + UTIL.locatorToString(locator));

        var pkg = sandbox.ensurePackageForLocator(locator);

        if (pkg.discovering)
        {
            DEBUG.indent(di+1).print("... skip second pass ...");
            DEBUG.indent(di);
            callback(pkg);
            return;
        }

        pkg.discoverMappings(function assembler_assembleProgram_lambda_addPackageToProgram_packageForLocator(locator, callback)
        {
            program.resolveLocator(self, locator, function(locator)
            {
                if (!FILE.exists(locator.location))
                {
                    throw new Error("This should not happen");
                }
                else
                {
                    callback(sandbox.ensurePackageForLocator(locator));
                }
            });
            
        }, function assembler_assembleProgram_lambda_addPackageToProgram_done()
        {
            DEBUG.indent(di);
            callback(pkg);
        });
    });
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

    if (ENV.mustClean && !this.cleaned[this.downloader.basePath])
    {
        this.cleaned[this.downloader.basePath] = true;

        DEBUG.print("Removing downloaded packages from: " + this.downloader.basePath);
        
        SYSTEM.exec("rm -Rf " + this.downloader.basePath, function(stdout, stderr)
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

var require, module;

if (!bravojs.hasOwnProperty("errorReporter"))
{
  bravojs.errorReporter = function bravojs_defaultDrrorReporter(e)
  {
    alert(" * BravoJS: " + e + "\n" + e.stack);
    throw(e);
  }
}

/** Reset the environment so that a new main module can be loaded */
bravojs.reset = function bravojs_reset(mainModuleDir)
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
  bravojs.plugins = [];
  bravojs.contexts = {};
  bravojs.activeContexts = [];

  delete bravojs.Module.prototype.main;
  delete bravojs.scriptTagMemo;
  delete bravojs.scriptTagMemoIE;

  /* The default context. Needed before bravojs.Module() can be called. */
  bravojs.makeContext("_");

  /** Extra-module environment */
  require = window.require = bravojs.requireFactory(bravojs.mainModuleDir);
  module = window.module  = new bravojs.Module('', []);
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

  if ((stdout = document.getElementById('stdout')))
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
  else 
    alert(" * BravoJS stdout: " + output);
}
if (typeof bravojs.print === "undefined")
    bravojs.print = bravojs_print;

bravojs.registerPlugin = function(plugin)
{
    bravojs.plugins.push(plugin);
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
bravojs.realpath = function bravojs_realpath(path)
{
  if (typeof path !== "string")
    path = path.toString();

  var oldPath = path.split('/');
  var newPath = [];
  var i;

  if (path.charAt(path.length - 1) === '/')
    oldPath.push("INDEX");

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

  /* If path ends in "/@/xxx.js" then s will end in /@ which needs to be fixed */
  if (s.charAt(s.length-1)=="@")
    s += "/";

  return s;
}

/** Turn a module identifier and module directory into a canonical
 *  module.id.
 */
bravojs.makeModuleId = function makeModuleId(relativeModuleDir, moduleIdentifier)
{
  var id;

  if (moduleIdentifier === '')	/* Special case for main module */
    return '';

  if (typeof moduleIdentifier === "object")
  {
    id = bravojs.makeModuleIdFromMapping(relativeModuleDir, moduleIdentifier);
  }
  else
  {
    /* <packageID>@/<moduleID> */
    var parts = moduleIdentifier.split("@/");
    if (parts.length==1)
    {
      if (moduleIdentifier.charAt(0) === '/')
      {
        /* Absolute path. Not required by CommonJS but it makes dependency list optimization easier */
        id = moduleIdentifier;
      }
      else
      if ((moduleIdentifier.indexOf("./") == 0) || (moduleIdentifier.indexOf("../") == 0))
      {
        id = relativeModuleDir + "/" + moduleIdentifier;
      }
      else
      {
        id = bravojs.contextForId(relativeModuleDir).resolveAbsoluteId(relativeModuleDir, moduleIdentifier);
      }
    }
    else
    if (parts.length==2)
    {
        /* Reference a module irrespective of relativeModuleDir as moduleIdentifier includes a packageID.
         * If packageID is a known UID we convert it to it's path-based ID by checking the registered contexts.
         * This means a UID-based moduleId conversion will only be successful if the context is already loaded
         * and should thus only be used within a running program.
         */
        if (bravojs.hasContextForId(parts[0]))
        {
            id = bravojs.contextForId(parts[0]).id + "@/" + parts[1];
        }
        else
        {
          /* Do not change anything as the packageID is already unique and path-based */
          id = moduleIdentifier;
        }
    }
    else
      throw new Error("Invalid module identifier: " + moduleIdentifier);
  }
  return bravojs.realpath(id);
}

/** Turn a package mapping and module directory into a canonical
 *  module.id.
 *  If (moduleIdentifier === false) will return a package ID instead.
 */
bravojs.makeModuleIdFromMapping = function makeModuleIdFromMapping(relativeModuleDir, mapping, moduleIdentifier)
{
  var id;
  if (typeof mapping == "string")
  {
      mapping = {
          location: mapping
      };
  }
  if (typeof mapping.id != "undefined")
  {
      id = mapping.id;
  }
  else
  if (typeof mapping.catalog != "undefined" || typeof mapping.archive != "undefined")
  {
    if (typeof mapping.catalog != "undefined" && typeof mapping.name == "undefined")
      throw new Error("Catalog-basd mapping does not specify 'name' property: " + mapping);
    id = bravojs.callPlugins("resolvePackageMapping", [mapping]);
    if (typeof id == "undefined")
      throw new Error("Mapping could not be resolved by plugins: " + ((mapping.toSource)?mapping.toSource():mapping));
  }
  else
  if (typeof mapping.location != "undefined")
  {
    if ((mapping.location.indexOf("./") == 0) || (mapping.location.indexOf("../") == 0))
    {
      /* Relative package path -- relative to relativeModuleDir */
      id = relativeModuleDir + "/" + mapping.location;
    }
    else
    if (mapping.location.indexOf("/") == 0)
    {
      id = mapping.location;
    }
    else
    {
      id = mapping.location;
    }
  }
  else
    throw new Error("Invalid mapping: " + ((mapping.toSource)?mapping.toSource():mapping));

  /* Separate the package ID from the module ID so we know where to look for the package root */
  id += "@/";

  if (typeof moduleIdentifier == "undefined")
  {
    if (typeof mapping.descriptor =="undefined" || typeof mapping.descriptor.main == "undefined")
      return bravojs.contextForId(bravojs.realpath(id)).resolveRelativeId(relativeModuleDir, null);
    else
      return id + mapping.descriptor.main;
  }
  else
  if (moduleIdentifier === false)
  {
    return bravojs.contextForId(bravojs.realpath(id)).id;  /* This is a package ID */
  }
  else
    return bravojs.contextForId(bravojs.realpath(id + moduleIdentifier)).resolveRelativeId(relativeModuleDir, moduleIdentifier);
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
    /* Needed to resolve relative dependencies when using module.declare() */
    if (typeof relativeModuleDir != "undefined" && typeof moduleIdentifier == "string" && moduleIdentifier.charAt(0) == ".")
      moduleIdentifier = bravojs.realpath(bravojs.dirname(relativeModuleDir) + "/" + moduleIdentifier);

    var id = require.id(moduleIdentifier);
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

bravojs.loadPackageDescriptor = function bravojs_loadPackageDescriptor(id)
{
  var ret = bravojs.callPlugins("loadPackageDescriptor", [id]);
  if (typeof ret != "undefined")
    return ret;

  /* NOTE: The following request is SYNC and will block. Package descriptors
   * should be memoized before booting the program for better loading performance.
   */
  var URL = require.canonicalize(id);
  // TODO: Get this working in other browsers
  var req = new (bravojs.XMLHttpRequest || XMLHttpRequest)();
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

bravojs.normalizePackageDescriptor = function bravojs_normalizePackageDescriptor(descriptor)
{
  var ret = bravojs.callPlugins("normalizePackageDescriptor", [descriptor]);
  if (typeof ret != "undefined")
    descriptor = ret;
  return descriptor;
}

/** Get a context for a given module ID used to resolve the ID. If a package
 *  prefix is found a context specific to the package is returned, otherwise
 *  the default context is returned.
 */
bravojs.contextForId = function bravojs_contextForId(id)
{
  var parts = id.split("@/"),
      id = parts[0];

  var ret = bravojs.callPlugins("contextForId", [id]);
  if (typeof ret != "undefined")
    id = ret;

  /* Return the default context if no package delimiter found */
  if (parts.length == 1)
  {
    if(typeof bravojs.contexts[id] != "undefined")
      return bravojs.contexts[id];
    else
      return bravojs.contexts["_"];
  }
  if (typeof bravojs.contexts[id] == "undefined")
    bravojs.makeContext(id);
  return bravojs.contexts[id];
}

bravojs.hasContextForId = function bravojs_hasContext(id)
{
  var parts = id.split("@/");
  if (parts.length == 2)
    id = parts[0];
  return (typeof bravojs.contexts[id] != "undefined");
}

/** Make a new context used to resolve module IDs
 */
bravojs.makeContext = function bravojs_makeContext(id)
{
  bravojs.contexts[id] = new bravojs.Context(id);
  /* The id so far is path-based. If the context/package descriptor specifies a UID we map
   * the same context to the UID as well.
   */
  if (typeof bravojs.contexts[id].uid != "undefined")
    bravojs.contexts[bravojs.contexts[id].uid] = bravojs.contexts[id];
  return bravojs.contexts[id];
}

/**
 * A Context object represents the root of a package and is used to resolve
 * IDs for packages.
 */
bravojs.Context = function bravojs_Context(id)
{
  this.id = id;
  if (this.id=="_")
    return;

  id = this.id + "@/package.json";

  if (require.isMemoized(id))
  {
    this.descriptor = require.getMemoized(id).moduleFactory();
  }
  else
  {
    this.descriptor = bravojs.normalizePackageDescriptor(bravojs.loadPackageDescriptor(id), id);
    var self = this;
    require.memoize(id, [], function() { return self.descriptor; });
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
bravojs.Context.prototype.getNormalizedMappings = function bravojs_Context_getNormalizedMappings() {
  if (this.id == "_")
    throw new Error("Cannot get mappings for default context");

  if (typeof this.normalizedMappings != "undefined")
    return this.normalizedMappings;

  this.normalizedMappings = {};
  if (typeof this.descriptor.mappings != "undefined")
  {
    for (var label in this.descriptor.mappings)
    {
      this.normalizedMappings[label] = bravojs.makeModuleIdFromMapping(this.id, this.descriptor.mappings[label], false);
    }
  }
  return this.normalizedMappings;
}

bravojs.Context.prototype.resolveRelativeId = function bravojs_Context_resolveRelativeId(relativeModuleDir, moduleIdentifier) {
  /* Relative module path -- relative to relativeModuleDir */
  if (this.id == "_")
    return relativeModuleDir + "/" + moduleIdentifier;
  if (moduleIdentifier === null)
  {
    if (typeof this.descriptor == "undefined" ||
        typeof this.descriptor.main == "undefined")
      throw new Error("'main' property not set in package descriptor for: " + this.id);
    return this.id + "@/" + this.descriptor.main;
  }
  else
    return this.id + "@/" + this.libDir + "/" + moduleIdentifier;
}

bravojs.Context.prototype.resolveAbsoluteId = function bravojs_Context_resolveAbsoluteId(relativeModuleDir, moduleIdentifier) {
  var parts;
  if (
    /* Top-level module. Since we don't implement require.paths,
     * make it relative to the main module.
     */
    this.id == "_" ||

    /* If no descriptor nor mappings we are not interested */
    typeof this.descriptor == "undefined" ||
    typeof this.descriptor.mappings == "undefined" ||

    /* If id does not have at least two terms we are not interested */
    (parts = moduleIdentifier.split("/")).length == 1 ||

    /* If no mapping for first term we are not interested */
    typeof this.descriptor.mappings[parts[0]] == "undefined"
  )
    return bravojs.mainModuleDir + "/" + moduleIdentifier;

  return bravojs.makeModuleIdFromMapping(this.id, this.descriptor.mappings[parts[0]], "./" + parts.slice(1).join("/"));
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
    require.memoize(id, dependencies, moduleFactory);

  if (dependencies)
  {
    module.provide(bravojs.normalizeDependencyArray(dependencies, id?id:bravojs.mainModuleDir+"/"), callback);
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
  var require, module;

  delete bravojs.pendingModuleDeclarations[id];

  require = bravojs.requireFactory(moduleDir, dependencies);
  exports = bravojs.requireMemo[id] = {};
  module  = new bravojs.Module(id, dependencies);

  module.augment();

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
    if (exports===true)
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
bravojs.requireFactory = function bravojs_requireFactory(moduleDir, dependencies)
{
  var deps, i, label;

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

  function getContextSensitiveModuleDir() {
    var dir;
    if (bravojs.activeContexts.length>0)
      dir = bravojs.activeContexts[bravojs.activeContexts.length-1].id;
    if(typeof dir == "undefined" || dir == "_")
      dir = moduleDir;
    return dir;
  }

  var newRequire = function require(moduleIdentifier) 
  {
    if (deps && deps[moduleIdentifier])
      return deps[moduleIdentifier]();
    return bravojs.requireModule(getContextSensitiveModuleDir(), moduleIdentifier);
  }

  newRequire.paths = [bravojs.mainModuleDir];

  if (typeof bravojs.platform != "undefined")
  {
      newRequire.platform = bravojs.platform;
  }

  newRequire.id = function require_id(moduleIdentifier)
  {
    return bravojs.makeModuleId(getContextSensitiveModuleDir(), moduleIdentifier);
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

    /* Remove package/module ID delimiter */
    id = id.replace(/\/*@?\/+/g, "\/");

    /* Some IDs may refer to non-js files */
    if (bravojs.basename(id).indexOf(".") == -1)
      id += ".js";

    return window.location.protocol + "/" + id;
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

  return newRequire;
}

/** Module object constructor 
 *
 *  @param	id		The canonical module id
 *  @param	dependencies	The dependency list passed to module.declare
 */
bravojs.Module = function bravojs_Module(id, dependencies)
{
  this.id   	 = id;
  this.protected = void 0;
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
	  bravojs.requireModule(bravojs.dirname(this.id), dependencies[i][label]);
        };
      }
    }
  }
}

/** Run just before providing Module to moduleFactory function in bravojs.initializeModule() */
bravojs.Module.prototype.augment = function bravojs_Module_augment()
{
  var context = bravojs.contextForId(this.id);
  /* Only add extra module properties if context represents a package (i.e. not default '_' context) */
  if (context.id == "_")
    return;

  /* If context supplies a UID use it over the path-based ID for the package ID */
  this.pkgId = context.uid || context.id;

  /* Normalized mappings are simply a map where labels point to package IDs */
  this.mappings = context.getNormalizedMappings();
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

  dependencies = bravojs.normalizeDependencyArray(dependencies);

  if (dependencies.length === 0)
  {
    if (callback)
      callback();
    return;
  }

  bravojs.activeContexts.push(bravojs.contextForId(dependencies[0]));

  module.load(dependencies[0], function bravojs_lambda_provideNextDep() { self(dependencies.slice(1), callback) });

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
  script.setAttribute("src", require.canonicalize(moduleIdentifier) + "?1");

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
        /* The id is a mapping that needs to be resolved against bravojs.mainModuleDir if applicable. */
        moduleIdentifier = bravojs.makeModuleIdFromMapping(bravojs.mainModuleDir, moduleIdentifier);
      }

      bravojs.activeContexts.push(bravojs.contextForId(moduleIdentifier));

      bravojs.provideModule(stm.dependencies, stm.moduleFactory, require.id(moduleIdentifier), function() {
          callback(moduleIdentifier);
      });

      bravojs.activeContexts.pop();
    }

    script.onerror = function bravojs_lambda_script_onerror() 
    { 
      var id = require.id(moduleIdentifier);
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
      var id = require.id(moduleIdentifier);

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
  module.provide([id], callback);
}

/** Main module bootstrap */
bravojs.initializeMainModule = function bravojs_initializeMainModule(dependencies, moduleFactory, moduleIdentifier)
{
  if (module.hasOwnProperty("declare"))		/* special extra-module environment bootstrap declare needs to go */
    delete module.declare;

  if (module.constructor.prototype.main)
    throw new Error("Main module has already been initialized!");

  bravojs.es5_shim_then
  (
    (function() 
     {
       bravojs.provideModule(dependencies, moduleFactory, moduleIdentifier, function bravojs_lambda_requireMain() { module.constructor.prototype.main = require(moduleIdentifier); })
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

  delete module.declare;

  if (moduleIdentifier.charAt(0) === '/')
    bravojs.mainModuleDir = bravojs.dirname(moduleIdentifier);
  else
    bravojs.mainModuleDir = bravojs.dirname(bravojs.URL_toId(window.location.href + ".js"), true) + "/" + bravojs.dirname(moduleIdentifier);

  moduleIdentifier = bravojs.basename(moduleIdentifier);

  bravojs.es5_shim_then(
      function() {
	module.provide(dependencies.concat([moduleIdentifier]), 
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
  var script;

  script = document.getElementById("BravoJS");
  if (!script)
    script = document.getElementsByTagName("SCRIPT")[0];

  bravojs.url = script.src;
  i = bravojs.url.indexOf("?");
  if (i !== -1)
    bravojs.url = bravojs.url.slice(0,i);
  i = bravojs.url.indexOf("#");
  if (i !== -1)
    bravojs.url = bravojs.url.slice(0,i);

  if (bravojs.basename(bravojs.url) !== "bravo.js")
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

/* Module.declare function which handles main modules inline SCRIPT tags.
 * This function gets deleted as soon as it runs, allowing the module.declare
 * from the prototype take over. Modules created from this function have
 * the empty string as module.id.
 */
module.declare = function main_module_declare(dependencies, moduleFactory)
{
  if (typeof dependencies === "function")
  {
    moduleFactory = dependencies;
    dependencies = [];
  }

  bravojs.initializeMainModule(dependencies, moduleFactory, '');
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
            XMLHttpRequest: (context.api && context.api.XMLHttpRequest) || void 0
        };

        bravojs_init(bravojs, window);

        context.require = window.require;
        context.module = window.module;
        context.requireMemo = bravojs.requireMemo;
        context.initializeModule = bravojs.initializeModule;
        context.registerPlugin = bravojs.registerPlugin;
        context.makeModuleId = bravojs.makeModuleId;
        context.makeModuleIdFromMapping = bravojs.makeModuleIdFromMapping;
        context.normalizeDependencyArray = bravojs.normalizeDependencyArray;
        context.activeContexts = bravojs.activeContexts;
        context.contextForId = bravojs.contextForId;
    }
}
else
{
    if (typeof bravojs === "undefined")
      bravojs = {};
    bravojs_init(bravojs, window);
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
    if (FILE.basename(path) != this.filename)
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

Descriptor.prototype.validationError = function(message)
{
    return new Error("Validation Error (in " + this.path + "): " + message);
}

Descriptor.prototype._normalizeLocator = function(locator)
{
    if (typeof locator == "string")
    {
        locator = {
            "id": locator
        };
    }
    else
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
        callback(id, this.json.packages[id]);
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
    return this._normalizeLocator(this.json.packages[id].locator);
}

Program.prototype.augmentLocator = function(locator)
{
    if (typeof this.json.packages == "undefined")
        throw this.validationError("Property 'packages' is not defined");
    var ids = [],
        enforce = false;

    // First check if an ID matches exactly
    if (typeof locator.id != "undefined")
    {
        ids.push(locator.id);
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
            throw this.validationError("Derived package IDs '"+ids+"' for locator '"+UTIL.locatorToString(locator)+"' not found as key in property 'packages'");
        else
            return locator;
    }

    if (typeof locator.id == "undefined")
        locator.id = foundId;

    if (typeof found.provider != "undefined")
    {
        return UTIL.deepMerge(locator, {"provider": found.provider});
    }
    else
    {
        if (typeof found.locator == "undefined")
            return locator;
    
        return this._normalizeLocator(UTIL.deepMerge(locator, found.locator));
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
        throw new Error("NYI");
}

Downloader.prototype.getForArchive = function(archive, callback)
{
    var self = this;
    var sourcePath = self.pathForURL(archive, "source");

    if (FILE.exists(sourcePath))
    {
        callback(sourcePath);
        return;
    }

    var archivePath = self.pathForURL(archive, "archive");

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

    NET.download(url, path, function()
    {
        callback(path);
    });
}

});
__loader__.memoize('loader', function(__require__, module, exports) {
// ######################################################################
// # /loader.js
// ######################################################################
// Authors:
//  - cadorn, Christoph Dorn <christoph@christophdorn.com>, Copyright 2011, MIT License

exports.boot = function(options)
{
    const VERSION = "v0.1dev";
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
            adapter = "nodejs";
        }
        else
        
        // Test for Jetpack
        if (typeof __url__ != "undefined" && typeof packaging != "undefined" && typeof memory != "undefined")
        {
            adapter = "jetpack";
        }
    }
    else
    {
        // We are most likely running in a browser
    }
    if (!adapter)
        throw new Error("Cannot select platform adapter. Unable to identify host JavaSvript platform.");

    var API = __require__('api');

    API.ENV.timers = timers;
    API.DEBUG.enabled = options.debug || void 0;
    API.SYSTEM.print = options.print || void 0;

    // NOTE: If you modify this line you need to update: ../programs/bundle-loader/lib/bundler.js
    __require__("adapter/" + adapter).init(API);
    
    __require__('bravojs/global-es5');

    API.PINF_LOADER = __require__('modules/pinf/loader');
    API.SANDBOX = __require__('sandbox');


    // ######################################################################
    // # CLI
    // ######################################################################

    // Setup colored printing

    var TERM = __require__('term'),
        writer = {
            write: function()
            {
                API.SYSTEM.print.apply(null, arguments);
                return writer;
            },
            flush: function() {}
        };
    var termStream = API.DEBUG.termStream = new TERM.Stream({
        stdout: writer,
        stderr: writer
    });

    // Now that we have a basic file and system API available we can proceed
    
    // Setup command line options

    API.OPT_PARSE = __require__('optparse');
    var optParser = new API.OPT_PARSE.OptionParser([
            ['-v', '--verbose', "Enables progress messages"],
//            ['-t', '--test', "Runs tests instead"],
            ['--clean', "Removes all downloaded packages first"],
            ['--terminate', "Asks program to terminate if it was going to deamonize"],
            ['-h', '--help', "Shows this help screen"]
        ]),
        optPrintUsage = false,
        optFirstArg = "";
    optParser.banner = "\n" + "\0magenta(\0bold(PINF Loader "+VERSION+"  ~  https://github.com/pinf/loader-js/\0)\0)" + "\n\n" +
                       "Usage: [commonjs] pinf-loader [options] .../[program.json]";
    optParser.on(0, function(value)
    {
        optFirstArg = value;
    });
    if (typeof API.DEBUG.enabled == "undefined")
        optParser.on('verbose', function()
        {
            API.DEBUG.enabled = true;
        });
    optParser.on('terminate', function()
    {
        API.ENV.mustTerminate = true;
    });
    optParser.on('clean', function()
    {
        API.ENV.mustClean = true;
    });
    optParser.on('help', function()
    {
        optPrintUsage = true;
    });

    if (typeof options.program != "undefined")
    {
        optParser.parse([options.program]);
    }
    else
    {
        optParser.parse(API.SYSTEM.args);
    }

    if (optPrintUsage)
    {
        termStream.print(optParser.toString() + "\n");
        return;
    }

    API.DEBUG.print("\0magenta(----------------------------------------------------------------------------");
    API.DEBUG.print("\0bold(|  PINF Loader " + VERSION + "  ~  https://github.com/pinf/loader-js/\0)");
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
        if (path.charAt(0) != "/")
            path = API.SYSTEM.pwd + "/" + path;
        path = path.split("/");

        if (/\.zip$/.test(path[path.length-1]))
        {
            path[path.length-1] += "!/";
        }
        if (!path[path.length-1] || path[path.length-1] != "program.json")
        {
            API.DEBUG.print("No descriptor URI argument. Assuming: './program.json'");
            path.push("program.json");
        }
        path = API.FILE.realpath(path.join("/"));
    
        API.DEBUG.print("Loading program descriptor from: " + path);
    
        downloader.basePath = path.substring(0, path.length-13) + "/.pinf-packages";
    
        API.DEBUG.print("Using program cache directory: " + downloader.basePath);
    
        if (!API.FILE.isFile(path))
            throw new Error("No program descriptor found at: " + path);
    
    
        // ######################################################################
        // # Sandbox
        // ######################################################################
    
        var sandbox = new API.SANDBOX.Sandbox({
            mainModuleDir: API.FILE.dirname(path) + "/"
        });
    
    
        // ######################################################################
        // # Assembly
        // ######################################################################
    
        // Assemble the program (making all code available on disk) by downloading all it's dependencies
    
        assembler.assembleProgram(sandbox, path, function(program)
        {
            API.ENV.booting = false;
    
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
                        termStream.write("\0:blue(=====>\0:)\0)\0green(\0bold(", false, true);
                    }
        
                    pkg.main(env);
        
                    if (API.DEBUG.enabled)
                    {
                        termStream.write("\0)\0)\0magenta(\0:blue(<=====\0:)\0)\n");
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
                API.DEBUG.print("\0magenta(\0:blue(----- | Program stdout & stderr follows (if not already terminated) ====>\0:)");
            });
        });
    } // init()

    if (/^https?:\/\//.test(optFirstArg))
    {
        API.DEBUG.print("Boot cache directory: " + downloader.basePath);

        assembler.provisonProgramForURL(optFirstArg, init);
    }
    else
        init(optFirstArg);

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

var API = __require__('api');

exports.getPlatformRequire = function()
{
    return API.ENV.platformRequire;
}

exports.mustTerminate = function()
{
    return API.ENV.mustTerminate;
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
__loader__.memoize('optparse', function(__require__, module, exports) {
// ######################################################################
// # /optparse.js
// ######################################################################
//  Optparse.js 1.0.2 - Option Parser for Javascript 
// 
//  Copyright (c) 2009 Johan Dahlberg
// 
//  License: MIT
//  See: https://github.com/jfd/optparse-js
//                                                        
var optparse = {};
try{ optparse = exports } catch(e) {}; // Try to export the lib for node.js
(function(self) {
var VERSION = '1.0.2';
var LONG_SWITCH_RE = /^--\w/;
var SHORT_SWITCH_RE = /^-\w/;
var NUMBER_RE = /^(0x[A-Fa-f0-9]+)|([0-9]+\.[0-9]+)|(\d+)$/;
var DATE_RE = /^\d{4}-(0[0-9]|1[0,1,2])-([0,1,2][0-9]|3[0,1])$/;
var EMAIL_RE = /^([0-9a-zA-Z]+([_.-]?[0-9a-zA-Z]+)*@[0-9a-zA-Z]+[0-9,a-z,A-Z,.,-]*(.){1}[a-zA-Z]{2,4})+$/;
var EXT_RULE_RE = /(\-\-[\w_-]+)\s+([\w\[\]_-]+)|(\-\-[\w_-]+)/;
var ARG_OPTIONAL_RE = /\[(.+)\]/;

// The default switch argument filter to use, when argument name doesnt match
// any other names. 
var DEFAULT_FILTER = '_DEFAULT';
var PREDEFINED_FILTERS = {};

// The default switch argument filter. Parses the argument as text.
function filter_text(value) {
    return value;
}

// Switch argument filter that expects an integer, HEX or a decimal value. An 
// exception is throwed if the criteria is not matched. 
// Valid input formats are: 0xFFFFFFF, 12345 and 1234.1234
function filter_number(value) {
    var m = NUMBER_RE(value);
    if(m == null) throw OptError('Expected a number representative');
    if(m[1]) {
        // The number is in HEX format. Convert into a number, then return it
        return parseInt(m[1], 16);
    } else {
        // The number is in regular- or decimal form. Just run in through 
        // the float caster.
        return parseFloat(m[2] || m[3]);
    }
};

// Switch argument filter that expects a Date expression. The date string MUST be
// formated as: "yyyy-mm-dd" An exception is throwed if the criteria is not 
// matched. An DATE object is returned on success. 
function filter_date(value) {
    var m = DATE_RE(value);
    if(m == null) throw OptError('Expected a date representation in the "yyyy-mm-dd" format.');
    return new Date(parseInt(m[0]), parseInt(m[1]), parseInt(m[2]));
};

// Switch argument filter that expects an email address. An exception is throwed
// if the criteria doesn`t match. 
function filter_email(value) {
    var m = EMAIL_RE(value);
    if(m == null) throw OptError('Excpeted an email address.');
    return m[1];
}

// Register all predefined filters. This dict is used by each OptionParser 
// instance, when parsing arguments. Custom filters can be added to the parser 
// instance by calling the "add_filter" -method. 
PREDEFINED_FILTERS[DEFAULT_FILTER] = filter_text;
PREDEFINED_FILTERS['TEXT'] = filter_text;
PREDEFINED_FILTERS['NUMBER'] = filter_number;
PREDEFINED_FILTERS['DATE'] = filter_date;
PREDEFINED_FILTERS['EMAIL'] = filter_email;

//  Buildes rules from a switches collection. The switches collection is defined
//  when constructing a new OptionParser object. 
function build_rules(filters, arr) {
    var rules = [];
    for(var i=0; i<arr.length; i++) {
        var r = arr[i], rule
        if(!contains_expr(r)) throw OptError('Rule MUST contain an option.');
        switch(r.length) {
            case 1:
                rule = build_rule(filters, r[0]);
                break;
            case 2:
                var expr = LONG_SWITCH_RE(r[0]) ? 0 : 1;
                var alias = expr == 0 ? -1 : 0;
                var desc = alias == -1 ? 1 : -1;
                rule = build_rule(filters, r[alias], r[expr], r[desc]);
                break;
            case 3:
                rule = build_rule(filters, r[0], r[1], r[2]);
                break;
            default:
            case 0:
                continue;
        }
        rules.push(rule)
    }
    return rules;
}

//  Builds a rule with specified expression, short style switch and help. This 
//  function expects a dict with filters to work correctly. 
//
//  Return format:
//      name               The name of the switch.
//      short              The short style switch
//      long               The long style switch
//      decl               The declaration expression (the input expression)
//      desc               The optional help section for the switch
//      optional_arg       Indicates that switch argument is optional
//      filter             The filter to use when parsing the arg. An 
//                         <<undefined>> value means that the switch does 
//                         not take anargument.
function build_rule(filters, short, expr, desc) {
    var optional, filter;
    var m = expr.match(EXT_RULE_RE);
    if(m == null) throw OptError('The switch is not well-formed.');
    var long = m[1] || m[3];
    if(m[2] != undefined) {
        // A switch argument is expected. Check if the argument is optional,
        // then find a filter that suites.
        var optional_match = ARG_OPTIONAL_RE(m[2]);
        var filter_name = optional_match === null ? m[2] : optional_match[1];
        optional = optional_match !== null;
        filter = filters[filter_name];
        if(filter === undefined) filter = filters[DEFAULT_FILTER];
    }
    return {
        name: long.substr(2),       
        short: short,               
        long: long,
        decl: expr,
        desc: desc,                 
        optional_arg: optional,
        filter: filter              
    }
}

// Loop's trough all elements of an array and check if there is valid
// options expression within. An valid option is a token that starts 
// double dashes. E.G. --my_option
function contains_expr(arr) {
    if(!arr || !arr.length) return false;
    var l = arr.length;
    while(l-- > 0) if(LONG_SWITCH_RE(arr[l])) return true;
    return false;
}

// Extends destination object with members of source object
function extend(dest, src) {
    var result = dest;
    for(var n in src) {
        result[n] = src[n];
    }
    return result;
}

// Appends spaces to match specified number of chars
function spaces(arg1, arg2) {
    var l, builder = [];
    if(arg1.constructor === Number) {
        l = arg1;  
    } else {
        if(arg1.length == arg2) return arg1;
        l = arg2 - arg1.length;
        builder.push(arg1);
    }
    while(l-- > 0) builder.push(' ');
    return builder.join('');
}

//  Create a new Parser object that can be used to parse command line arguments.
//
//
function Parser(rules) {
    return new OptionParser(rules);
}

// Creates an error object with specified error message.
function OptError(msg) {
    return new function() {
        this.msg = msg;
        this.toString = function() {
            return this.msg;
        }
    }
}

function OptionParser(rules) {
    this.banner = 'Usage: [Options]';
    this.options_title = 'Available options:'
    this._rules = rules;
    this._halt = false;
    this.filters = extend({}, PREDEFINED_FILTERS);
    this.on_args = {};
    this.on_switches = {};
    this.on_halt = function() {};
    this.default_handler = function() {};
}

OptionParser.prototype = {
    
    // Adds args and switchs handler.
    on: function(value, fn) {
        if(value.constructor === Function ) {
            this.default_handler = value;
        } else if(value.constructor === Number) {
            this.on_args[value] = fn;
        } else {
            this.on_switches[value] = fn;
        }
    },
    
    // Adds a custom filter to the parser. It's possible to override the
    // default filter by passing the value "_DEFAULT" to the ´´name´´
    // argument. The name of the filter is automatically transformed into 
    // upper case. 
    filter: function(name, fn) {
        this.filters[name.toUpperCase()] = fn;
    },
    
    // Parses specified args. Returns remaining arguments. 
    parse: function(args) {
        var result = [], callback;
        var rules = build_rules(this.filters, this._rules);
        var tokens = args.concat([]);
        var token;
        while((token = tokens.shift()) && this._halt == false) {
            if(LONG_SWITCH_RE(token) || SHORT_SWITCH_RE(token)) {
                var arg = undefined;
                // The token is a long or a short switch. Get the corresponding 
                // rule, filter and handle it. Pass the switch to the default 
                // handler if no rule matched.
                for(var i = 0; i < rules.length; i++) {
                    var rule = rules[i];
                    if(rule.long == token || rule.short == token) {
                        if(rule.filter !== undefined) {
                            arg = tokens.shift();
                            if(!LONG_SWITCH_RE(arg) && !SHORT_SWITCH_RE(arg)) {
                                try {
                                    arg = rule.filter(arg);
                                } catch(e) {
                                    throw OptError(token + ': ' + e.toString());
                                }
                            } else if(rule.optional_arg) {
                                tokens.unshift(arg);
                            } else {
                                throw OptError('Expected switch argument.');
                            }
                        } 
                        callback = this.on_switches[rule.name];
                        if (!callback) callback = this.on_switches['*'];
                        if(callback) callback.apply(this, [rule.name, arg]);
                        break;
                    } 
                }
                if(i == rules.length) this.default_handler.apply(this, [token]);
            } else {
                // Did not match long or short switch. Parse the token as a 
                // normal argument.
                callback = this.on_args[result.length];
                result.push(token);
                if(callback) callback.apply(this, [token]);
            }
        }
        return this._halt ? this.on_halt.apply(this, []) : result;
    },
    
    // Returns an Array with all defined option rules 
    options: function() {
        return build_rules(this.filters, this._rules);
    },

    // Add an on_halt callback if argument ´´fn´´ is specified. on_switch handlers can 
    // call instance.halt to abort the argument parsing. This can be useful when
    // displaying help or version information.
    halt: function(fn) {
        this._halt = fn === undefined
        if(fn) this.on_halt = fn;
    },
    
    // Returns a string representation of this OptionParser instance.
    toString: function() {
        var builder = [this.banner, '', this.options_title], 
            shorts = false, longest = 0, rule;
        var rules = build_rules(this.filters, this._rules);
        for(var i = 0; i < rules.length; i++) {
            rule = rules[i];
            // Quick-analyze the options. 
            if(rule.short) shorts = true;
            if(rule.decl.length > longest) longest = rule.decl.length;
        }
        for(var i = 0; i < rules.length; i++) {
            var text; 
            rule = rules[i];
            if(shorts) {
                if(rule.short) text = spaces(2) + rule.short + ', ';
                else text = spaces(6);
            }
            text += spaces(rule.decl, longest) + spaces(3);
            text += rule.desc;
            builder.push(text);
        }
        return builder.join('\n');
    }
}

self.VERSION = VERSION;
self.OptionParser = OptionParser;

})(optparse);
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
var Package = exports.ProviderPackage = function(id, info)
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
}
Package.prototype.getIsNative = function()
{
    return false;
}
Package.prototype.requireModule = function(id)
{
    id = id.split("@/").pop();
    if (typeof API.ENV.packageProviders == "undefined")
        throw new Error("API.ENV.packageProviders not set. Needed by provider package '"+this.uid+"' for module '"+id+"'.");
    if (typeof API.ENV.packageProviders[this.uid] == "undefined")
        throw new Error("API.ENV.packageProviders not set for package '"+this.uid+"' needed for module '"+id+"'.");

    return API.ENV.packageProviders[this.uid].requireModule(id);
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
}

Package.prototype.discoverMappings = function(fetcher, callback)
{
    this.discovering = true;

    if (!this.descriptor.hasMappings())
    {
        DEBUG.print("Mappings: None");
        callback();
        return;
    }
    
    DEBUG.print("Mappings:");
    var di = DEBUG.indent() + 1;

    var cbt = new UTIL.CallbackTracker(callback);

    var self = this;

    self.descriptor.walkMappings(function(alias, locator)
    {
        DEBUG.indent(di).print("\0yellow(" + alias + "\0) <- " + UTIL.locatorToString(locator)).indent(di+1);

        fetcher(locator, cbt.add(function(pkg)
        {
            // This should only happen if locator points to a provider
//            if(!pkg)
//                return;

            DEBUG.indent(di+1).print("Path: \0cyan(" + pkg.path + "\0)");

            // Update the mapping locator to be absolute path location-based
            self.normalizedDescriptor.json.mappings[alias] = {
                "location": pkg.path + "/"
            };

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
    if (typeof locator.descriptor != "undefined" && typeof locator.descriptor.main != "undefined")
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


/**
 * Get the source code of a module calling all preloaders if applicable.
 */
Package.prototype.getModuleSource = function(sandbox, resourceURI, callback)
{
    var modulePath = resourceURI,
        parts = resourceURI.split("@/");
    if (parts.length == 2)
    {
        if (parts[0].replace(/\/$/, "") != this.path)
            throw new Error("Cannot require module '" + id + "' from package '" + this.path + "'");
        modulePath = parts[1];
    }

    var context = {
        pkgPath: this.path,
        resourcePath: this.path + "/" + modulePath + ((/\.js$/.test(modulePath))?"":".js"),
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
        callback(API.FILE.read(context.resourcePath));
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

    sandbox.loader.module.load(self.path + "/@/" + moduleId, function(id)
    {
        callback(sandbox.loader.require(id));       
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

        fetcher(self.descriptor.locatorForId(id), cbt.add(function(pkg)
        {
            // This should only happen if locator points to a provider
//            if(!pkg)
//                return;

            DEBUG.indent(di+1).print("Path: \0cyan(" + pkg.path + "\0)");
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
Program.prototype.resolveLocator = function(assembler, locator, callback)
{
    var self = this;
    var descriptor = locator.descriptor;
    function finalize(locator)
    {
        if (typeof locator.provider == "undefined")
        {
            // If we do not have an absolute path location-based locator by now we cannot proceed
            if (typeof locator.location == "undefined" || locator.location.charAt(0) != "/")
                throw new Error("Resolved locator is not absolute path location-based: " + UTIL.locatorToString(locator));
            
            // If locator specifies a path we add it to the location.
            // This is typically needed to get the paths to packages in a multi-package archive
            if (typeof locator.path != "undefined")
                locator.location = API.FILE.realpath(locator.location + "/" + locator.path) + "/";
    
            // Pass through the descriptor unchanged
            if (typeof descriptor != "undefined")
                locator.descriptor = descriptor;
        }
        callback(locator);
    }
    
    if (typeof locator.archive != "undefined")
    {
        var m;
        if (!(m = locator.archive.match(/^https?:\/\/(.*)$/)))
            throw new Error("Invalid archive URL: "+ locator.archive);

        assembler.downloader.getForArchive(locator.archive, function(path)
        {
            locator.id = m[1];
            locator.location = path + "/";

            finalize(locator);
        });
        return;
    }
    else
    if (typeof locator.catalog != "undefined")
    {
        locator = this.descriptor.augmentLocator(locator);

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
        locator = this.descriptor.augmentLocator(locator);
    }
    else
    if (typeof locator.location != "undefined")
    {
        // do nothing for now
    }
    else
        throw new Error("NYI - " + UTIL.locatorToString(locator));

    // Make sure location path is always absolute and clean
    if (typeof locator.location != "undefined")
    {
        if (locator.location.charAt(0) == "/")
            locator.location = FILE.realpath(locator.location) + "/";
    }

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

    var request = function() {};
    request.prototype.open = function(method, url)
    {
        this.url = url;
    }
    request.prototype.send = function()
    {
        var m = this.url.match(/^memory:\/(.*)$/);
        try
        {
            this.responseText = API.FILE.read(m[1]);
            this.status = 200;
        }
        catch(e)
        {
            this.status = 404;
        }
    }

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

    var loading;

    loader.module.constructor.prototype.load = function pinf_loader_load(moduleIdentifier, callback)
    {
        var idBasedModuleIdentifier;
        if (typeof moduleIdentifier == "object")
        {
            if (API.DEBUG.enabled)
                if (API.ENV.booting)
                    API.DEBUG.termStream.write("\0)\0)\0magenta(\0:blue(<=====\0:)\0)\n");
                else
                    API.DEBUG.termStream.write("\0magenta(\n");

            var t = new Date().getTime();

            // Load an extra package into the program including all its dependencies
            // and start with the main module
            self.program.assembler.addPackageToProgram(self, self.program, moduleIdentifier, function(pkg)
            {
                loader.module.constructor.prototype.load(pkg.getMainId(moduleIdentifier), function(moduleIdentifier)
                {
                    if (API.DEBUG.enabled)
                        if (API.ENV.booting)
                            API.DEBUG.termStream.write("\0magenta(\0:blue(=====>\0:)\0)\0green(\0bold(", false, true);
                        else
                            API.DEBUG.termStream.write("\0)");

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
        else
        {
            // Load an extra module into the program
            moduleIdentifier = loader.require.id(moduleIdentifier);

            // Convert UID-based ID to path-based ID
            var parts = moduleIdentifier.split("@/");
            if (parts.length==2)
            {
                idBasedModuleIdentifier = moduleIdentifier;
                moduleIdentifier = self.packageForId(moduleIdentifier).path + "/@/" + parts[1];
            }
        }

        // See if package requests for its modules to be treated as native
        try
        {
            if (self.packageForId(moduleIdentifier).getIsNative() === true)
            {
                loader.requireMemo[moduleIdentifier] = require(moduleIdentifier.replace(/\/*@?\/+/g, "\/"));
                callback();
                return;
            }
        }
        catch(e)
        {
            // If this throws the moduleIdentifier was likely a non-packaged module ID
            // We only throw if we should have found a package
            if (moduleIdentifier.indexOf("@/") != -1)
                throw e;
        }

        function load(data)
        {
            if (typeof idBasedModuleIdentifier != "undefined")
                moduleIdentifier = idBasedModuleIdentifier;

            loading = {
                id: moduleIdentifier,
                callback: function()
                {
                    callback(moduleIdentifier);
                }
            };

            if ((typeof loader.module.constructor.prototype.load != "undefined" &&
                 typeof loader.module.constructor.prototype.load.modules11 != "undefined" &&
                 loader.module.constructor.prototype.load.modules11 === false) || data.match(/(^|[\r\n])\s*module.declare\s*\(/))
                eval("loader." + data.replace(/^\s\s*/g, ""));
            else
                eval("loader.module.declare([" + API.UTIL.scrapeDeps(data).join(',') + "], function(require, exports, module) {\n" + data + "\n})"); // Modules/1.1
        }

        var pkg = self.packageForId(moduleIdentifier, true);
        if (pkg)
        {
            // This is the new and proper way
            pkg.getModuleSource(self, moduleIdentifier, load);
        }
        else
        {
            var URL = loader.require.canonicalize(moduleIdentifier),
                m = URL.match(/^memory:\/(.*)$/),
                path = m[1];
    
            load(API.FILE.read(path));
        }
    }

    loader.module.constructor.prototype.declare = function pinf_loader_declare(dependencies, moduleFactory)
    {
        var id    = loading.id;
        var callback  = loading.callback;
        var deps  = [], i, label;

        loading = void 0;

        if (typeof dependencies === "function")
        {
          moduleFactory = dependencies;
          dependencies = [];
        }

        loader.require.memoize(id, dependencies, moduleFactory);

        /* Build a list of dependencies suitable for module.provide; this
         * means no labeled dependencies. 
         */
        function addDep(dependency)
        {
            // If it is a relative ID resolve it differently
            var dep;
            if (dependency.charAt(0)==".")
            {
                dep = API.FILE.realpath(API.FILE.dirname(id) + "/" + dependency);
            }
            else
            // TODO: Do this via a provider package
            if (dependency == "pinf/loader" || dependency == "pinf/protocol-handler")
                return;
            else
            {
                var depId = loader.makeModuleId(id, dependency);

                // Check if the dependency is platform native
                // Determining this is a bit of a hack for now
                // TODO: Use a default ProvidePackage?
                if (depId.indexOf("@/")==-1 && depId.substring(0, loader.mainModuleDir.length) == loader.mainModuleDir)
                {
//                    depId = depId.substring(loader.mainModuleDir.length);
                    // depId is a native module
                    // TODO: Check against list of native modules?
                    return;
                }

                // Determine if we are dealing with a provider package
                var pkg = self.packageForId(depId, true);
                if (pkg && typeof pkg.isProviderPackage != "undefined" && pkg.isProviderPackage === true)
                    return;

                dep = loader.require.id(dependency);
            }
            if (loader.require.isMemoized(dep) || deps.indexOf(dep) !== -1)
                return;
            deps.push(dep);
        }

        for (i=0; i < dependencies.length; i++)
        {
            if (typeof dependencies[i] === "string")
                addDep(dependencies[i]);
            else
            {
                for (label in dependencies[i])
                  addDep(dependencies[i][label])
            }
        }

        loader.module.provide(deps, callback);
    }

    // Register a bravojs core plugin to resolve package mappings to top-level package IDs

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

        // If id contains a package delimiter we are not interested
        if (id.indexOf("@/") !== -1)
            return;

        var path = id + ".js";

        // If file does not exist on disk where the loader expects it we look to find the
        // module in our ./modules directory and lastly let the platform's require handle it 
        if (!API.FILE.exists(path))
        {
            var id = id.substring(loader.mainModuleDir.length);
            if (id == "pinf/loader")
            {
                return API.PINF_LOADER;
            }
            else
            if (id == "pinf/protocol-handler")
            {
                return __require__('modules/pinf/protocol-handler');
            }
            path = API.ENV.loaderRoot + "/modules/" + id + ".js";
            if (!API.FILE.exists(path))
            {
                // Use platform require
                return API.ENV.platformRequire(id);
            }
            // Use module from ./modules
            bravojs.initializeModule(id);
            return true;
        }
    }
    Plugin.prototype.contextForId = function(id)
    {
        if (!id) return;
        try
        {
            return self.packageForId(id).path + "/";
        }
        catch(e)
        {
            // If this throws the ID was likely a non-packaged module ID
            // We only throw if we should have found a package
            if (id.indexOf("@/") !== -1)
                throw new Error("Unable to find package for ID: " + id);
        }
    }
    Plugin.prototype.resolvePackageMapping = function(packageMapping)
    {
/*            
        if (typeof packageMapping.catalog != "undefined")
        {
            var m = packageMapping.catalog.match(/^https?:\/\/(.*)$/),
                id = m[1] + "/" + packageMapping.name + "/";
            return id;
        }
        else
        if (typeof packageMapping.archive != "undefined")
        {
            throw new Error("Archive-based mappings should no longer be present. They should have been normalized already!");
        }
*/            
    }
    Plugin.prototype.loadPackageDescriptor = function(id)
    {
        return self.packageForId(id).normalizedDescriptor.toJSONObject();          
    }
    loader.registerPlugin(new Plugin());


    // ######################################################################
    // # Sandbox API
    // ######################################################################
    
    self.declare = loader.module.declare;
}

/**
 * Create or get existing package for path
 */
Sandbox.prototype.ensurePackageForLocator = function(locator)
{
    if (typeof locator.id != "undefined" && typeof this.packages[locator.id] != "undefined")
    {
        return this.packages[locator.id];
    }
    else
    if (typeof locator.uid != "undefined" && typeof this.packages[locator.uid] != "undefined")
    {
        return this.packages[locator.uid];
    }
    var path = locator.location;
    if (typeof this.packages[path] == "undefined")
    {
        this.packages[path] = new PACKAGE.Package(new DESCRIPTORS.Package(path));

        // If package has a UID set we also index our packages by it
        // TODO: Add version to key if applicable
        if (typeof this.packages[path].uid != "undefined")
        {
            locator.uid = this.packages[path].uid;
            this.packages[this.packages[path].uid] = this.packages[path];
        }

        // If locator has an ID set we also index our packages by it
        if (typeof locator.id != "undefined")
            this.packages[locator.id] = this.packages[path];

        // Merge descriptor information from the locator onto the package descriptor if applicable
        // We first ask the program descriptor to augment to locator with any additional info
        locator = this.program.descriptor.augmentLocator(locator);
        if (typeof locator.descriptor != "undefined")
        {
            API.UTIL.deepMerge(this.packages[path].normalizedDescriptor.json, locator.descriptor);
        }
    }
    return this.packages[path];
}

/**
 * Get an existing package for id
 */
Sandbox.prototype.packageForId = function(id, silent)
{
    if (!id)
        throw new Error("Empty ID!");
    var m = id.match(/^(\/?)(.*?)\/([^@\/]*)(@\/(.*))?$/),
        lookupIds;
    // m[1] - '/' prefix
    // m[2] - path
    // m[3] - version/revision
    // m[4] -
    // m[5] - after @/

    if (!m[1] && m[2] && !m[3])         // <packageUID>/ no version/revision
        lookupIds = [ m[2] + "/", m[2] ];
    else
    if (m[1] == "/" && m[2] && !m[3])   // /<packagePath>/ no version/revision
        lookupIds = [ "/" + m[2] + "/", m[2] + "/"];

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
__loader__.memoize('term', function(__require__, module, exports) {
// ######################################################################
// # /term.js
// ######################################################################
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// reference: http://ascii-table.com/ansi-escape-sequences-vt-100.php

var API = __require__('api'),
    SYSTEM = API.SYSTEM;

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
    var enabled = (Array.prototype.indexOf.call(terms, SYSTEM.env.TERM) >= 0);

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
__pinf_loader_scope__.boot = __loader__.__require__('loader').boot;
};
if(typeof exports != 'undefined') { __pinf_loader__(exports); } else { throw new Error('NYI'); }
})();