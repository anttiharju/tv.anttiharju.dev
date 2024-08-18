#!/bin/sh

grep 'id:' "playlists.yml" | while IFS= read -r line; do
  # Extract the id using awk
  id=$(echo "$line" | awk -F'id: ' '{print $2}')
  # Remove leading and trailing whitespace from id
  id=$(echo "$id" | awk '{$1=$1};1')
  # Check if the length of the id is exactly 11 characters
  if [ ${#id} -ne 11 ]; then
    echo "ID '$id' seems invalid; it's not 11 characters long."
  fi
done