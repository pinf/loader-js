
exports.main = function(options)
{
        
    // Boot a program to print to the console
    require("pinf-loader").boot({
        program: require("self").data.url("programs/HelloWorld/program.json")
    });
    
    // Boot a zipped program to print to the console
    require("pinf-loader").boot({
        program: require("self").data.url("programs/HelloWorldZipped.zip")
    });
    
    // Boot a program to add a simple UI widget using the jetpack API
    require("pinf-loader").boot({
        program: require("self").data.url("programs/WidgetTest/program.json")
    });
    
    // Boot a program to add a chrome protocol handler and service it via JSGI app
    require("pinf-loader").boot({
        program: require("self").data.url("programs/ChromeURL-JSGI/program.json"),
        platformOptions: options,
        args: options
    });

}