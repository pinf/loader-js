
/**
 * OS: OSX Lion
 * This crashes (Segmentation fault: 11) 90% of the time at the end of the script.
 */

var SYSTEM = require("system");

for (var i = 0 ; i< 100 ; i++)
	SYSTEM.stdout.write("Hello World: " + i + "\n");
