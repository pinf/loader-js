// @see https://github.com/280north/narwhal/blob/master/packages/narwhal-lib/lib/narwhal/term.js
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// reference: http://ascii-table.com/ansi-escape-sequences-vt-100.php

var API = require("./api"),
    SYSTEM = API.SYSTEM,
    UTIL = require("./util");

var terms = [
    'ansi',
    'vt100',
    'xterm',
    'xtermc',
    'xterm-color',
    'gnome-terminal'
];

exports.Stream = function (system) {
    var self = Object.create(system.stdout);
    var output = system.stdout;
    var errput = system.stderr;
    var fore = "";
    var back = "";
    var bold = "0";
    var stack = [];
    var enabled = UTIL.has(terms, SYSTEM.env.TERM);

    self.enable = function () {
        enabled = true;
    };

    self.disable = function () {
        enabled = false;
    };

    self.writeCode = function (code) {
        if (enabled) {
            output.flush();
            errput.write(code).flush();
        }
        return self;
    };

    self.print = function () {
        // todo recordSeparator, fieldSeparator
        self.write(Array.prototype.join.call(arguments, " ") + "\n");
        self.flush();
        return self;
    };

    self.printError = function () {
        // todo recordSeparator, fieldSeparator
        self.write(Array.prototype.join.call(arguments, " ") + "\n", true);
        self.flush();
        return self;
    };

    self.write = function (string, error, noclear) {
        var toput = error ? errput : output;
        var at = 0;
        self.update(bold, fore, back);
        while (at < string.length) {
            var pos = string.indexOf("\0", at);
            if (pos == -1) {
                // no additional marks, advanced to end
                toput.write(string.substring(at, string.length));
                at = string.length;
            } else {
                toput.write(string.substring(at, pos));
                at = pos + 1;
                if (string.charAt(at) == ")" || string.substring(at, at+2) == ":)" ) {
                    if (!stack.length)
                        throw new Error("No colors on the stack at " + at);
                    var pair = stack.pop();
                    bold = pair[0];
                    if(string.charAt(at) == ")") {
                        fore = pair[1];
                    } else {
                        back = pair[2];
                        at = at + 1;
                    }
                    at = at + 1;
                    self.update(bold, fore, back);
                } else {
                    var paren = string.indexOf("(", at);
                    stack.push([bold, fore, back]);
                    var command = string.substring(at, paren);
                    if (command == "bold") {
                        bold = "1";
                    } else if (Object.prototype.hasOwnProperty.call(exports.colors, command)) {
                        fore = exports.colors[command];
                    } else if (
                        /^:/.test(command) &&
                        Object.prototype.hasOwnProperty.call(exports.colors, command.substring(1))
                    ) {
                        back = exports.colors[command.substring(1)];
                    } else {
                        throw new Error("No such command: " + command);
                    }
                    self.update(bold, fore, back);
                    at = paren + 1;
                }
            }
        }
        if(!noclear)
            self.update("0", "", "");
        return self;
    };

    self.update = function (bold, fore, back) {
        return self.writeCode(
            "\033[" + [
                bold,
                (fore.length ? "3" + fore : ""),
                (back.length ? "4" + back : ""),
            ].filter(function (string) {
                return string.length;
            }).join(";") + "m"
        );
    };
    
    self.moveTo = function (y, x) {
        return self.writeCode("\033[" + y + ";" + x + "H");
    };

    self.moveBy = function (y, x) {
        if (y == 0) {
        } else if (y < 0) {
            self.writeCode("\033[" + (-y) + "A");
        } else {
            self.writeCode("\033[" + y + "B");
        }
        if (x == 0) {
        } else if (x > 0) {
            self.writeCode("\033[" + x + "C");
        } else {
            self.writeCode("\033[" + (-x) + "D");
        }
        errput.flush();
        return self;
    };

    self.home = function () {
        return self.writeCode("\033[H");
    };

    self.clear = function () {
        return self.writeCode("\033[2J");
    };
    self.clearUp = function () {
        return self.writeCode("\033[1J");
    };
    self.cearDown = function () {
        return self.writeCode("\033[J");
    };
    self.clearLine = function () {
        return self.writeCode("\033[2K");
    };
    self.clearLeft = function () {
        return self.writeCode("\033[1K");
    };
    self.clearRight = function () {
        return self.writeCode("\033[K");
    };

    self.update(bold, fore, back);

    self.error = {};

    self.error.print = function () {
        return self.printError.apply(self, arguments);
    };

    self.error.write = function (message) {
        return self.write(message, true);
    };

    return self;
};

exports.colors = {
    "black": "0",
    "red": "1",
    "green": "2",
    "orange": "3",
    "yellow": "3",
    "blue": "4",
    "violet": "5",
    "magenta": "5",
    "purple": "5",
    "cyan": "6",
    "white": "7"
}
