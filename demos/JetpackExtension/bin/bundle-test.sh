#!/bin/bash

# get the absolute path of the executable
SELF_PATH=$(cd -P -- "$(dirname -- "$0")" && pwd -P) && SELF_PATH="$SELF_PATH/$(basename -- "$0")"
BASE_PATH=$(dirname $(dirname $SELF_PATH))

$BASE_PATH/../../bin/bundle-loader --platform jetpack $BASE_PATH/extension/lib/pinf-loader.js

cfx --pkgdir=$BASE_PATH/extension -b /Applications/Firefox-4/Firefox.app/Contents/MacOS/firefox-bin test
