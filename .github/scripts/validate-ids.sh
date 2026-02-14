#!/bin/sh
set -eu

rc=0
for id in $(grep 'id:' "playlists.yml" | awk -F'id: ' '{print $2}' | awk '{$1=$1};1'); do
  if [ ${#id} -ne 11 ]; then
    echo "Error: ID '$id' is ${#id} characters (expected 11)."
    rc=1
  fi
done
exit $rc
