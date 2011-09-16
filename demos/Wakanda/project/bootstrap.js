
// TODO: Run loader in worker

require("pinf-loader").boot({
    program: application.getFolder().path + "/programs/HelloWorld"
});

// TODO: Send requests to worker

wait();
