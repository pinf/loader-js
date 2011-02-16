
var PREF_SERVICE = require("jetpack/preferences-service");

exports.get = function(name)
{
    return PREF_SERVICE.get(name);
}

