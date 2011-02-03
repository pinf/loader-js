#! /bin/bash
#
# @author	Wes Garland, wes@page.ca
# @date		December, 2010
# @file		fastload.sh
#
#		This file implements a fastload back-end for the fastload.js which
#		ships with BravoJS.  This back-end, and fastload.js, are both
#		expected to work with ANY conformant CommonJS Modules/2.0 environment.
#
#		This implement is written as a shell script which requires GNU bash
#		and UNIX-like environment. It can be used as a CGI script from any 
#		CGI-compatible webserver (tested with Apache).
#
#		- Multiple modules may be requested at once
# 		- Data may be sent to the browser compressed with gzip
#

compress="`echo \"${QUERY_STRING}\" | grep '[&?]compress=true'`"
modules="`echo \"${QUERY_STRING}\" | sed -e 's/[&?]module=/ /g' -e 's/[&?][a-zA-Z0-9]*=[^&?]//g'`"

quit()
{
  echo "$*" >/dev/stderr
  exit 1
}

# Turn a module id into a filesystem path. Edit this funciton
# to validate paths if you need to restrict module-space (to
# improve system security, encapsulation, etc).
#
modulePath()
{
  id="$1"

  if echo "${id}" | grep -v '^/[a-zA-Z0-9._/~?-]*$' >/dev/null; then
    quit "Invalid module id: ${id}";
  fi

  if echo "${id}" | grep -v "^/${SERVER_NAME}/" >/dev/null; then
    quit "Illegal module id: ${id} (not in ${SERVER_NAME})"
  fi

  echo "${id}" | sed "s/${SERVER_NAME}/${DOCUMENT_ROOT}/"
}

# Emit a module to the web client
emitModule()
{
  id="$1"

  echo "fastload_modules['${id}'] = function(){" 
  cat `modulePath ${id}`
  echo "}"
}

# Write a log entry to the client as a comment
rlog()
{
  echo "// LOG: $*"
}

# Main program 
main()
{
  echo "Content-Type: application/x-javascript"
  echo

  for module in ${modules}
  do
    emitModule "${module}"    
  done
}

main
