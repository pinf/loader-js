
var JSGI = require("server/vendor/connect/middleware/jsgi"),
    JSGI_RELOAD = require("server/jsgi/reload"),
    PROGRAM_SERVER = require("pinf/program-server"),
    FILE = require("modules/file");

exports.main = function(options)
{
    var CONNECT = options.stacks.connect.instance;

    console.log("ExtJS source root path: " + require.pkg("extjs4").id());
    
    options.stacks.connect.start(

        CONNECT()
	
	        .use('/extjs4', CONNECT.static(require.pkg("extjs4").id(), {
	            maxAge: 0
	        }))
	        .use('/ui', JSGI.jsgi(
	            new PROGRAM_SERVER.JSGI({
		            map: {
		                "/ui.js": {
		                    programPath: FILE.dirname(module.id) + "/ui/program.json"
		                }
		            },
		            trackRoutes: true
		        }).responder(null)
		    ))
	        .use('/', CONNECT.static(FILE.dirname(module.id) + "/www", {
	            maxAge: 0
	        }))
    );

    module.print("Program server started! You can now browse to: http://localhost:" + options.port + "/\n");
}
