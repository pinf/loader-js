
module.declare(["coffee-script/lexer", "coffee-script/parser", "coffee-script/nodes"], function(require, exports, module)
{
    var LEXER = require("coffee-script/lexer"),
        PARSER = require("coffee-script/parser").parser;

    PARSER.lexer = {
        lex: function()
        {
            var tag, _ref;
            _ref = this.tokens[this.pos++] || [''], tag = _ref[0], this.yytext = _ref[1], this.yylineno = _ref[2];
            return tag;
        },
        setInput: function(tokens)
        {
            this.tokens = tokens;
            return this.pos = 0;
        },
        upcomingInput: function()
        {
            return "";
        }
    };
    PARSER.yy = require("coffee-script/nodes");

    exports.main = function(context)
    {
        var compiled = {},
            lexer = new LEXER.Lexer();

        return {
            getModuleSource: function(context, modulePath)
            {
                var resourcePath = context.resourcePath;

                if (!/\./.test(modulePath) || !/\.js$/.test(modulePath))
                {
                    resourcePath = resourcePath.replace(/\.js$/, ".coffee");
                    if (!context.api.file.exists(resourcePath))
                        return;
                }
                else
                if (!/\.coffee$/.test(modulePath))
                    return;

                if (typeof compiled[modulePath] == "undefined")
                {
                    var code = context.api.file.read(resourcePath);

                    try {
                        compiled[modulePath] = PARSER.parse(lexer.tokenize(code)).compile({});
                    }
                    catch(e)
                    {
                        e.message += " while compiling: " + context.resourcePath;
                        throw e;
                    }
                }
                return compiled[modulePath];
            }
        };
    }
});
