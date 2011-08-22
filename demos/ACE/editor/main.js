
module.declare([
    "pilot/fixoldbrowsers",
    "pilot/plugin_manager",
    "pilot/settings",
    "pilot/environment",
    "demo/demo"
], function(require, exports, module)
{
    exports.main = function()
    {
        var plugins = [
            "pilot/index",
            "cockpit/index",
            "ace/defaults"
        ];

        var catalog = require("pilot/plugin_manager").catalog;
        catalog.registerPlugins(plugins).then(function()
        {
            var env = require("pilot/environment").create();
            catalog.startupPlugins({ env: env }).then(function()
            {
                require("demo/demo").launch(env);
            });
        });
    }
});
