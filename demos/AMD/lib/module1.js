/**
 * Comment
 */
// Comment
({define:typeof define!="undefined"?define:function(deps, factory){module.exports = factory(exports, require("./module2"));}}).
define(["exports", "./module2"], function(exports, module2)
{
    exports.announce = function()
    {
        return module2.announce();
    }
    return exports;
});
