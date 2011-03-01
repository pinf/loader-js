#!/bin/bash

BASE_PATH=$(dirname $(readlink $0))
NODE_PATH=$(which "node")

if [ "$NODE_PATH" ]; then
    # TODO: Check --platform to invoke correct platform binary.
    #       For now we let the loader check and have node spawn a process if needed.
    exec "$NODE_PATH" "$BASE_PATH/pinf-loader.js" "$@"
else
    echo "ERROR: Need NodeJS installed. 'node' must be on the PATH."
    exit 1
fi
