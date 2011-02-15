
// Boot a test program to print to the console
require("pinf-loader").boot({
    program: packaging.getURLForData("/programs/HelloWorld/program.json")
});

// Boot a test program to add a simple UI widget using the jetpack API
require("pinf-loader").boot({
    program: packaging.getURLForData("/programs/WidgetTest/program.json")
});
