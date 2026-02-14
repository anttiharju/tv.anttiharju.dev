#!/bin/sh
set -eu

echo "Starting development server..."
echo ""

# Initial build
./.github/scripts/pre-build.sh

# Start the server in the background
cd src
python3 -m http.server 8000 &
SERVER_PID=$!
cd ..

echo ""
echo "🚀 Server running at http://localhost:8000"
echo "👀 Watching for changes..."
echo ""

# Cleanup function
cleanup() {
  echo ""
  echo "Stopping server..."
  kill $SERVER_PID 2>/dev/null || true
  exit
}

trap cleanup INT TERM

# Watch for changes and rebuild
watchexec -w playlists.yml -w .github/scripts/pre-build.sh -w src/index.html -- ./.github/scripts/pre-build.sh &
WATCH_PID=$!

# Wait for server
wait $SERVER_PID
kill $WATCH_PID 2>/dev/null || true
