PINF Loader on Narwhal
======================

Use the loader with [Narwhal](http://narwhaljs.org/).

**NOTE: Only the `rhino` engine has been tested on OSX thus far.**

Usage
-----

    cd ./
    
    # download narwhal and activate (see: http://narwhaljs.org/quick-start.html)
    git clone git://github.com/280north/narwhal.git
    source narwhal/bin/activate
    
    # make sure narwhal works
    narwhal narwhal/examples/hello
    
    # make sure the loader works
    narwhal ../../pinf-loader -h

You can now run the _Portable_ & _Narwhal specific_ demos under _Usage_ from [../../README.md](https://github.com/pinf/loader-js) by prefixing `narwhal`.

For example:

    cd ../../
    narwhal ./pinf-loader -v ./demos/HelloWorld
    narwhal ./pinf-loader -v ./demos/Narwhal
