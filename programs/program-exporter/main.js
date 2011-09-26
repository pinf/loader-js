
var ARGS = require("modules/args"),
	FILE = require("modules/file"),
	SYSTEM = require("modules/system"),
	PROGRAM_SERVER = require("pinf/program-server");


exports.main = function(env)
{
	var optParser = new ARGS.Parser(),
		cliOptions;
	
	optParser.arg("ProgramPath");
	optParser.arg("ExportPath");
	optParser.help("Export a program to a given path");
	optParser.option("-v", "--verbose").bool().help("Display debug messages");
	optParser.option("-h", "--help").bool().help("Display usage information");
	
	cliOptions = optParser.parse(["script"].concat(env.args));
	
	if (cliOptions.help === true)
	{
	    optParser.printHelp(cliOptions);
	    return;
	}
	
	if (!cliOptions.args[0])
	{
	    optParser.print('\0red(\0bold(' + "Error: No ProgramPath specified!" + '\0)\0)\n');
	    optParser.printHelp(cliOptions);
	    return;
	}
	
	if (!cliOptions.args[1])
	{
	    optParser.print('\0red(\0bold(' + "Error: No ExportPath specified!" + '\0)\0)\n');
	    optParser.printHelp(cliOptions);
	    return;
	}
	
	var programPath = cliOptions.args[0],
		exportPath = cliOptions.args[1];

	// Path relative to boot package
	if (!/^\./.test(programPath) && !/^\//.test(programPath))
		programPath = FILE.realpath(env.bootPackagePath + "/" + programPath);
	if (!/^\./.test(exportPath) && !/^\//.test(exportPath))
		exportPath = FILE.realpath(env.bootPackagePath + "/" + exportPath);

	// Path relative to current working directory
	if (/^\./.test(programPath))
		programPath = FILE.realpath(SYSTEM.pwd + "/" + programPath);
	if (/^\./.test(exportPath))
		exportPath = FILE.realpath(SYSTEM.pwd + "/" + exportPath);

	if (!/\/program.json$/.test(programPath))
		programPath = FILE.realpath(programPath + "/program.json");
	
	module.print("Exporting program '" + programPath + "' to '" + exportPath + "':\n");

	var server = new PROGRAM_SERVER.JSGI({
        map: {
            "/main.js": {
                programPath: programPath
            }
        }
    });
	
	if (FILE.exists(exportPath))
	{
		module.print("  Removing existing directory: " + exportPath + "\n");

		SYSTEM.exec("rm -Rf " + exportPath, function()
		{
			doExport();
		});
	}
	else
		doExport();
	
	
	function doExport()
	{
		FILE.mkdirs(exportPath, parseInt("0775"));

		server.spider("/main.js", exportPath, function()
	    {
			// Write index.sample.html file.
			var sampleIndexContent = FILE.read(FILE.dirname(module.id) + "/resources/index.sample.html");
			FILE.write(exportPath + "/index.sample.html", sampleIndexContent);
			
	    	done();
	    }, {
	    	debug: cliOptions.verbose
	    });
	}
	
	function done()
	{
		module.print("DONE\n");
	}	
}
