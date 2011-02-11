
module.declare([], function(require, exports, module)
{
    exports.app = function(app, options)
    {
        return function(request)
        {
            var message = "Hello World! The time is: " + new Date();

            return {
                status: 200,
                headers: {},
                body: [
                    message
                ]
            };
        }
    }
});