#!/bin/sh
set -eu

# Read playlist names from videos.yml
playlists=$(grep -E '^[a-zA-Z0-9_-]+:$' videos.yml | sed 's/://')

# Copy index.html for each playlist
for playlist in $playlists; do
  if [ "$playlist" != "default" ]; then
    cp index.html "$playlist.html"
  fi
done