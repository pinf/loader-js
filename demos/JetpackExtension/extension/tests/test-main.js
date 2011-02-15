
exports.test_loader_inclusion = function(test)
{
    test.assert((typeof require("pinf-loader").boot) === "function");
};

exports.test_loader_booting_helloworld = function(test)
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
    
    var expected = "Hello World!\nOK";
    
    test.assert(stdout == expected);
};


exports.test_widgettest_url = function(test)
{
    var programResourceURI = packaging.getURLForData("/programs/WidgetTest/program.json");

    // This variable is passed to main(env) of each program
    var env = {};

    require("pinf-loader").boot({
        program: programResourceURI,
        env: env
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
