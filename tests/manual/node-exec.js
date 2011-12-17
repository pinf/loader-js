
var EXEC = require('child_process').exec;

EXEC("npm --verbose install -f nodemailer@0.2.3", {
	cwd: "/pinf/tmp/1/node_modules"
}, function (error, stdout, stderr) {
	
	console.log("error", error);
	console.log("stdout", stdout);
	console.log("stderr", stderr);


	EXEC("npm --verbose install -f nodemailer@0.2.3", {
		cwd: "/pinf/tmp/node_modules"
	}, function (error, stdout, stderr) {
		
		console.log("error", error);
		console.log("stdout", stdout);
		console.log("stderr", stderr);

	});
});
