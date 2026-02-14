{
  description = "tv.anttiharju.dev development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};

          stopDevServer = pkgs.writeShellScriptBin "stop-dev" ''
            if [ -f .dev-server.pid ]; then
              echo "Stopping development server..."

              # Kill server
              if [ -f .dev-server.pid ]; then
                SERVER_PID=$(cat .dev-server.pid)
                kill $SERVER_PID 2>/dev/null || true
                rm .dev-server.pid
              fi

              # Kill watcher
              if [ -f .dev-watcher.pid ]; then
                WATCH_PID=$(cat .dev-watcher.pid)
                kill $WATCH_PID 2>/dev/null || true
                rm .dev-watcher.pid
              fi

              # Restore playlists.yml
              if [ -f src/playlists.yml ]; then
                mv src/playlists.yml playlists.yml
              fi

              echo "Stopped."
            else
              echo "No server running."
            fi
          '';

          startDevServer = pkgs.writeShellScriptBin "start-dev" ''
            set -eu

            # Check if already running
            if [ -f .dev-server.pid ]; then
              if kill -0 $(cat .dev-server.pid) 2>/dev/null; then
                echo "Development server already running at http://localhost:8000"
                exit 0
              fi
            fi

            # Ensure we're in the project root
            if [ ! -f flake.nix ]; then
              echo "Error: Must run from project root"
              exit 1
            fi

            echo "Starting development server..."

            # Clean up any previous build artifacts
            if [ -f src/playlists.yml ]; then
              mv src/playlists.yml playlists.yml
            fi

            # Initial build
            ${pkgs.bash}/bin/bash ./.github/scripts/pre-build.sh 2>/dev/null

            # Start the server in the background
            (
              cd src
              ${pkgs.python3}/bin/python3 ../server.py > /dev/null 2>&1 &
              echo $! > ../.dev-server.pid
              cd ..
            )

            # Watch for changes and rebuild
            ${pkgs.watchexec}/bin/watchexec \
              -w playlists.yml \
              -w .github/scripts/pre-build.sh \
              -w src/index.html \
              -- ${pkgs.bash}/bin/bash -c 'if [ -f src/playlists.yml ]; then mv src/playlists.yml playlists.yml; fi && ./.github/scripts/pre-build.sh 2>/dev/null' \
              > /dev/null 2>&1 &
            echo $! > .dev-watcher.pid

            echo ""
            echo "http://localhost:8000"
            echo ""
          '';
        in
        {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              python3
              shellcheck
              watchexec
              startDevServer
              stopDevServer
            ];

            shellHook = ''
              start-dev
            '';
          };
        }
      );
    };
}
