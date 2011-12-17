
// @see https://github.com/joyent/node/issues/2254

var FORK = require('child_process').fork,
	PATH = require("path");

FORK(PATH.dirname(module.id) + "/node-exec.js", [], {
	env: process.env,
	cwd: process.cwd()
});
process.exit(0);
