
module.declare([], function(require, exports, module)
{
    exports.main = function()
    {
        module.print("Hello World from WebWorker!\n");

        var workerScript = "/Worker.js";

        module.print("Starting worker: " + workerScript + "\n");
        
        var worker = new Worker(workerScript);

        worker.onerror = function(e)
        {
            console.log(e);
            throw e;
        };

        worker.onmessage = function(e)
        {
            switch(e.data.type)
            {
                case "log":
                    module.print(e.data.data);
                    break;
            }
        };
    }
});
