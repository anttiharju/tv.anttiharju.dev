#!/bin/sh
set -eu

# Read playlist names from playlists.yml
playlists=$(grep -E '^[a-zA-Z0-9_-]+:$' playlists.yml | sed 's/://')

# Copy index.html for each playlist
for playlist in $playlists; do
  if [ "$playlist" != "default" ]; then
    cp src/index.html "src/$playlist.html"
  fi
done

mv playlists.yml src/playlists.yml