
var SYS = require("sys"),
    PATH = require("path"),
    PINF_LOADER = require("pinf-loader-js/lib/pinf-loader-js/loader");

SYS.print("Hello World from NPMPackage!\n");

PINF_LOADER.boot({
    program: PATH.dirname(__filename) + "/programs/HelloWorld/program.json",
    debug: true
});
