
var MIME = require("mime");

exports.test = function()
{
    return (MIME.extension("text/html") == "html");
}
