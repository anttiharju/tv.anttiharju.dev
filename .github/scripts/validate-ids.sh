#!/bin/sh
set -eu

fail=0
grep 'id:' "playlists.yml" | while IFS= read -r line; do
  id=$(echo "$line" | awk -F'id: ' '{print $2}' | awk '{$1=$1};1')
  if [ ${#id} -ne 11 ]; then
    echo "Error: ID '$id' is ${#id} characters (expected 11)."
    fail=1
  fi
done
exit $fail
