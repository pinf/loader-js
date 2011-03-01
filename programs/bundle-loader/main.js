
var SCANNER = require("./lib/scanner"),
    BUNDLER = require("./lib/bundler"),
    PATH = require("nodejs/path");

exports.main = function(env)
{
    var args = env.args;

    // TODO: Better argument parsing

    if (args.length != 3)
        throw new Error("Invalid arguments. Usage: [commonjs] bundle-loader --platform PLATFORM OUTPUT-FILE-PATH");

    if (args[0] != "--platform")
        throw new Error("No --platform argument provided");

    var platform = args[1],
        outputPath = args[2];

    if (outputPath.charAt(0) != "/")
        outputPath = process.cwd() + "/" + outputPath;

    var files = SCANNER.scan(PATH.dirname(PATH.dirname(PATH.dirname(module.id))) + "/lib", {
        platform: platform
    });

    var bundler = new BUNDLER.Bundler(files, {
        platform: platform
    });

    bundler.writeTo(outputPath);

    module.print("Bundle written to: " + outputPath + "\n");
}
