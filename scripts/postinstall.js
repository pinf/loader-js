
// NOTE: Called via `npm run-script postinstall ...`

var SYS = require("sys"),
	PATH = require("path"),
	FS = require("fs");

/**
 * Update the `../pinf-loader.sh` script to set an absolute `BASE_PATH`.
 * This is necessary as the dynamic base path detection does not work because
 * npm links the `commonjs` binary using a relative path.
 */
function main()
{
	try {

		var basePath = process.cwd(),
			scriptPath = basePath + "/pinf-loader.sh",
			// TODO: Adjust this based on ENV var
			baseSourcePath = "/pinf/workspaces/github.com/pinf/loader-js";

		// If loader source found on local system we use that instead
		// of the code shipped with the NPM package!
		if (PATH.existsSync(baseSourcePath))
		{
			basePath = baseSourcePath;
			SYS.print([
			  "-------",
			  " NOTE: Linked `commonjs` command to source at '" + basePath + "'!",
			  "-------"
			].join("\n") + "\n\n");
		}

		var scriptContent = "" + FS.readFileSync(scriptPath);

		scriptContent = scriptContent.replace(/(\nBASE_PATH=).*(\n)/, "$1\"" + basePath + "\"$2");

		FS.writeFileSync(scriptPath, scriptContent);

	} catch(e) {
		console.error("Fatal Error '" + e + "' updating `pinf-loader.sh` script!");
		process.exit(1);
	}
}

main();
