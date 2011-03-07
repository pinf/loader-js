#! /usr/bin/gsr

/**
 * @author	Wes Garland, wes@page.ca
 * @date	September, 2010
 * @file	gpsee_fastload.js
 *
 * 	**[ Warning ]************************************************
 *	*                                                          **
 * 	*  Do not place untrusted .js files your web hierarchy if  **
 *      *  this script can be executed by your web server.         **
 *      *                                                          **
 * 	*  Any module which can be sent to the client could be     **
 * 	*  executed with the same permissions as your web server.  **
 *      *                                                          **
 *      *************************************************************
 *
 *		This file implements a fastload back-end for the fastload.js which
 *		ships with BravoJS.  This back-end, and fastload.js, are both
 *		expected to work with ANY conformant CommonJS Modules/2.0 environment.
 *
 *		This implementation is written for GPSEE as a CommonJS Modules/1.1
 *		program. It can be used as a CGI script from any CGI-compatible
 *		webserver (tested with Apache).
 *
 *		- Multiple modules may be requested at once
 *		- The entire dependency tree may be resolved and transmitted in a single request
 *		- JS code may be dynamically minified
 * 		- Data may be sent to the browser compressed with gzip
 *		- Payload may be cached via HTTP 304
 *
 * 		The location of modules is calculated as follows:
 *              - Requests for other web servers are not satisfied (that happens on the client)
 *              - Requests for this web server are satisfied against ${DOCUMENT_ROOT}
 *
 */
const fs 	= require("fs-base");
const cgi 	= require("cgi").query;
const mmap 	= require("./mmap").mmap;
const env	= require("system").env;

var lastModified = new Date();
var tmp;

/* Any of these parameters can be overridden by the CGI query */
var config =
{
  cacheable: 	false,
  minify:	true,
  compress:	false,
  deptree:	true,
  topLevelDir:	null	/* use referer */
}

/** Turn a module id into a filesystem path. Edit this funciton
 *  to validate paths if you need to restrict module-space (to
 *  improve system security, encapsulation, etc).
 */
function modulePath(id)
{
  var i;

  if (!/^[a-zA-Z0-9._/~?-]*$/.test(id) || id.indexOf("..") !== -1)
    throw new Error("Invalid module id: " + id);

  if (id[0] != "/")
    throw new Error("Incomplete module id: " + id);

  if (id.indexOf("/" + env["SERVER_NAME"] + "/") !== 0)
    throw new Error("Illegal module id: " + id + "(not in " + env["SERVER_NAME"] + ")");

  if ((i=id.indexOf("?")) !== -1)
    id = id.slice(0, i);

  return (id + '.js').replace("/" + env["SERVER_NAME"], env["DOCUMENT_ROOT"]);
}

/** Turn a relative or top-level module identifier into a module id */
function resolveModuleId(parentId, moduleIdentifier)
{
  /* relative */
  if ((moduleIdentifier.indexOf("./") === 0) || (moduleIdentifier.indexOf("../") === 0))
  {
    return realpath(dirname(parentId) + "/" + moduleIdentifier);	
  }

  if (config.topLevelDir === null)
    return realpath(dirname(env["HTTP_REFERER"]) + "/" + moduleIdentifier);
  else
    return realpath("/" + env["SERVER_NAME"] + "/" + config.topLevelDir + "/" + moduleIdentifier);
}

/** Emit a module to the web client, while minifying and collecting
 *  dependencies. The dependency array is returned to the caller.
 *  Undefined may be returned if there are no dependencies.
 */
function emitModule(id)
{
  var moduleSource = mmap(modulePath(id)).asString();
  var module;
  var decl;

  if (config.minify || config.deptree)
  {
    module = {};
    module.declare = function module_declare(dependencies, moduleFactory)
    { 
      if (typeof dependencies === "function")
      {
	moduleFactory = dependencies;
	dependencies = undefined;
      }
      return { dependencies: dependencies, moduleFactory: moduleFactory }
    };

    try
    {
      decl = eval(moduleSource);
    
      if (config.minify)
        moduleSource = "module.declare(" + 
	    (decl.dependencies ? decl.dependencies.toSource() : "[]") + ", " +  
	    decl.moduleFactory.toSource() + ")";
    } catch(e) 
    { 
      /* revert to raw module if we throw during eval */
      rlog("Exception while evaluating module: " + e + "\nin " + e.fileName + ",\nat line " + e.lineNumber);
    };
  }

  print("fastload_modules['" + id + "'] = function(){" + moduleSource + "}");

  return decl ? decl.dependencies : undefined;
}

/** Update the list of modules we are emitting to the client based
 *  on newly-discovered dependencies.
 *
 *  @param	list		Current module list; array of id
 *  @param	dependencies	A dependencies array supplied by module.declare
 *  @param	parentId	The current module id, used for calculating relative
 *				module ids
 */
function updateModuleList(list, dependencies, parentId)
{
  var i;
  var label;

  function update(dependency)
  {
    var id;

    if (dependency[0] === '/')
    {
      if (dependency.indexOf("/" + env["SERVER_NAME"] + "/") !== 0)
      {
	rlog("Dependency " + dependency + " is not on this web server; deferring resolution to client");
	return;
      }
      else
	id = dependency;
    }
    else
    {
      id = resolveModuleId(parentId, dependency);
    }

    if (list.indexOf(id) === -1)
      list.push(id);
  }

  for (i=0; i < dependencies.length; i++)
  {
    if (typeof dependencies[i] === "string")
      update(dependencies[i]);
    else
    {
      for (label in dependencies[i])
      {
	if (!dependencies[i].hasOwnProperty(label))
	  continue;

	update(dependencies[i][label]);
      }
    }
  }
}

/** Canonicalize path, compacting slashes and dots per basic UNIX rules.
 *  Treats paths with trailing slashes as though they end with INDEX instead.
 *  Not rigorous.
 */
function realpath(path)
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

/** Extract the directory portion of a path */
function dirname(path)
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

/** Write a log entry to the client as a comment, provided we are not minified */
function rlog(message)
{
  if (!config.minify)
    print('/* LOG: ' + message.split("\n").join("\n *      ") + (message.indexOf("\n") === -1 ? "" : "\n") + " */");
}

/** Main program */
function main()
{
  cgi.readQuery();
  for (tmp in config)
  {
    if (!config.hasOwnProperty(tmp))
      continue;

    if (cgi[tmp])
      config[tmp] = cgi[tmp] === "true";
  }

  if (typeof cgi.module === "string")
    cgi.module = [ cgi.module ];
  else if(!cgi.module)
    cgi.module = [];

  for (let i=0; i < cgi.module.length; i++)
  {
    if (+(tmp = fs.lastModified(modulePath(cgi.module[i]))) < +lastModified)
      lastModified = tmp;
  }

  if (config.cacheable)
  {
    if ((tmp = env["HTTP_IF_MODIFIED_SINCE"]))
    {
      if (+lastModified <= +Date(tmp))
      {
	print("Status: 304 Not Modified");
	print("");
	throw 0;
      }
    }
  }

  print("Status: 200");
  print("Content-Type: application/x-javascript");
  if (config.cacheable)
    print("Last-Modified: " + lastModified.toUTCString());
  print("");

  for (let i=0, dependencies; i < cgi.module.length; i++)
  {
    dependencies = emitModule(cgi.module[i]);
    if (dependencies)
      updateModuleList(cgi.module, dependencies, cgi.module[i]);
  }
}

main(arguments);
