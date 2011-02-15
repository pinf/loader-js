
const WIDGETS = require("jetpack/widget");
const TABS = require("jetpack/tabs");

exports.main = function(env)
{

    var widget = WIDGETS.Widget({
      label: "Mozilla website",
      contentURL: "http://www.mozilla.org/favicon.ico",
      onClick: function() {
        TABS.open("http://www.mozilla.org/");
      }
    });


    // Just as an example. Used in ../../../../tests/test-main.js
    env.jetpackRequire = function(id)
    {
        return require("jetpack/" + id);
    }
}
