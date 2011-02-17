
// Boot a program to print to the console
require("pinf-loader").boot({
    program: packaging.getURLForData("/programs/HelloWorld/program.json")
});

// Boot a zipped program to print to the console
require("pinf-loader").boot({
    program: packaging.getURLForData("/programs/HelloWorldZipped.zip")
});

// Boot a program to add a simple UI widget using the jetpack API
require("pinf-loader").boot({
    program: packaging.getURLForData("/programs/WidgetTest/program.json")
});

// Boot a program to add a chrome protocol handler and service it via JSGI app
require("pinf-loader").boot({
    program: packaging.getURLForData("/programs/ChromeURL-JSGI/program.json")
});
