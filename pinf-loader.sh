#!/bin/bash

BASE_PATH=$(dirname $(readlink $0))
# TODO: Only match until first non-option argument is found. i.e. argument not prefixed by '-'
PLATFORM_ALIAS=$(echo "$@" | perl -lpe '($_) = /\s*--platform\s*(\S*)\s*/')
PLATFORM_BIN_NAME=$PLATFORM_ALIAS

if [ "$PLATFORM_ALIAS" = "gpsee" ]; then
    PLATFORM_BIN_NAME="gsr"
fi

if [ -z $PLATFORM_BIN_NAME ]; then
    PLATFORM_ALIAS="node"
    PLATFORM_BIN_NAME="node"
fi

PLATFORM_BIN_PATH=$(which "$PLATFORM_BIN_NAME")

if [ -z $PLATFORM_BIN_PATH ]; then
    echo "Fatal Error: No binary '$PLATFORM_BIN_NAME' found for '--platform $PLATFORM_ALIAS' on PATH '$PATH'!"
    exit 1;
fi

exec "$PLATFORM_BIN_PATH" "$BASE_PATH/pinf-loader.js" "$@"
