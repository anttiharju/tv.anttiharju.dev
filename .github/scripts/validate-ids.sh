#!/bin/sh
set -eu

grep 'id:' "playlists.yml" | awk -F'id: ' '{print $2}' | awk '{$1=$1};1' | while IFS= read -r id; do
  if [ ${#id} -ne 11 ]; then
    echo "Error: ID '$id' is ${#id} characters (expected 11)."
    # Signal failure via a marker file since the pipe creates a subshell
    touch .validate-ids-failed
  fi
done

if [ -f .validate-ids-failed ]; then
  rm -f .validate-ids-failed
  exit 1
fi
