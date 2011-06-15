
// NOTE: This code is not very generic and intended for bundeling the loader only.

var FS = require("nodejs/fs");

var Bundler = exports.Bundler = function Bundler(files, options)
{
    this.files = files;
    this.options = options;
}

Bundler.prototype.writeTo = function(bundlePath)
{
    var code = [];

    code.push("(function() {");
    code.push("var __pinf_loader__ = function(__pinf_loader_scope__) {");

    code.push("var __loader__, __Loader__ = function() { this.modules = {}; this.memos = {}; };");
    code.push("__Loader__.prototype.memoize = function(id, factory) { this.memos[id] = factory; }");
    code.push("__Loader__.prototype.__require__ = function(id) {");
    // NOTE: Using 'this' instead of '__loader__' does not seem to work. Not quite sure why.
    code.push("    if (typeof __loader__.modules[id] == 'undefined') {");
    code.push("        var exports = {};");
    code.push("        __loader__.memos[id](__loader__.__require__, null, exports);");
    code.push("        __loader__.modules[id] = exports;");
    code.push("    }");
    code.push("    return __loader__.modules[id];");
    code.push("}");
    code.push("__loader__ = new __Loader__();");
    code.push("__loader__.__require__.platform = '" + this.options.platform + "';");

    for (var path in this.files)
    {
        var file = this.files[path];
        
        if (file.plugin == "text")
        {
            var id = file.plugin + "!" + file.subpath.substring(1);
            code.push("__loader__.memoize('"+id+"', function(__require__, module, exports) {");
    
            code.push("// ######################################################################");
            code.push("// # " + file.subpath);
            code.push("// ######################################################################");
            code.push();

            var moduleCode = FS.readFileSync(file.path, "utf-8");
    
            code.push('return ["' + moduleCode.replace(/"/g, '\\"').replace(/\n/g, '","') + '"].join("\\n");');
    
            code.push();
            code.push("});");
            code.push();
        }
        else
        {
            var id = file.subpath.substring(1, file.subpath.length-3);
            code.push("__loader__.memoize('"+id+"', function(__require__, module, exports) {");
    
            code.push("// ######################################################################");
            code.push("// # " + file.subpath);
            code.push("// ######################################################################");
            code.push();
    
            var moduleCode = FS.readFileSync(file.path, "utf-8");
            for (var reqId in file.requires)
                moduleCode = moduleCode.replace(new RegExp(RegExp.escape(file.requires[reqId]), "g"), "__require__('" + reqId + "')");
    
            if (id == "loader")
                moduleCode = moduleCode.replace(new RegExp(RegExp.escape('require("./adapter/"'), "g"), '__require__("adapter/"');
    
            code.push(moduleCode);
    
            code.push();
            code.push("});");
            code.push();
        }
    }

    code.push("__pinf_loader_scope__.boot = __loader__.__require__('loader').boot;");

    code.push("};");
    code.push("if(typeof exports != 'undefined') { __pinf_loader__(exports); } else { throw new Error('NYI'); }");
    code.push("})();");

    FS.writeFileSync(bundlePath, code.join("\n"));
}

RegExp.escape = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

