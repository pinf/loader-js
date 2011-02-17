
exports.test_loader_inclusion = function(test)
{
    test.assert((typeof require("pinf-loader").boot) === "function");
};

exports.test_loader_booting_HelloWorld = function(test)
{
    var programResourceURI = packaging.getURLForData("/programs/HelloWorld/program.json");
    
    var stdout = "";

    require("pinf-loader").boot({
        program: programResourceURI,
        print: function(str)
        {
            stdout += str;
        }
    });

    var expected = "Hello World!\n";
    
    test.assert(stdout == expected);
};

exports.test_loader_booting_HelloWorldZipped = function(test)
{
    var programResourceURI = packaging.getURLForData("/programs/HelloWorldZipped.zip");

    var stdout = "";

    require("pinf-loader").boot({
        program: programResourceURI,
        print: function(str)
        {
            stdout += str;
        }
    });

    var expected = "Hello World from Zipped!\n";

    test.assert(stdout == expected);
};

exports.test_WidgetTest = function(test)
{
    var programResourceURI = packaging.getURLForData("/programs/WidgetTest/program.json");

    // This variable is passed to main(env) of each program
    var env = {};

    require("pinf-loader").boot({
        program: programResourceURI,
        env: env,
        print: function() {}
    });

    // This function is added by ../data/programs/WidgetTest/lib/main.js as an example
    env.jetpackRequire("request").Request({
        url: "http://www.mozilla.org/",
        onComplete: function(response) {
            test.assertEqual(response.statusText, "OK");
            test.done();
        }
    }).get();
    test.waitUntilDone(20000);    
};

exports.test_ChromeURL_JSGI = function(test)
{
    var programResourceURI = packaging.getURLForData("/programs/ChromeURL-JSGI/program.json");

    var stdout = "";

    require("pinf-loader").boot({
        program: programResourceURI,
        print: function(str)
        {
            stdout += str;
        }
    });

    var expected = "Hello World from ChromeURL-JSGI!\nTry browsing to: jedi://hostname:80/path/to/file.ext?var1=val1&another=one\n";

    test.assert(stdout == expected);

    // TODO: Get rid of this error
    //       ......console: [JavaScript Error: "syntax error" {file: "jedi://hostname:80/path/to/file.ext?var1=val1&another=one" line: 1 column: 1 source: "method: GET"}]
    require("request").Request({
        url: "jedi://hostname:80/path/to/file.ext?var1=val1&another=one",
        onComplete: function(response) {

            var expect = [
                "method: GET",
                "scriptName: ",
                "pathInfo: /path/to/file.ext",
                "queryString: var1=val1&another=one",
                "host: hostname",
                "port: 80",
                "scheme: jedi",
                "input: null",
                "headers: [object Object]",
                "jsgi: [object Object]",
                "env: [object Object]",
                ""
            ].join("\n");

            test.assertEqual(response.text, expect);
            test.done();
        }
    }).get();
    
};
