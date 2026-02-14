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
            if [ ! -f .dev-server.pid ]; then
              echo "No server running."
              exit 0
            fi

            echo "Stopping development server..."

            kill "$(cat .dev-server.pid)" 2>/dev/null || true
            rm -f .dev-server.pid

            if [ -f .dev-watcher.pid ]; then
              kill "$(cat .dev-watcher.pid)" 2>/dev/null || true
              rm -f .dev-watcher.pid
            fi

            if [ -f src/playlists.yml ]; then
              mv src/playlists.yml playlists.yml
            fi

            echo "Stopped."
          '';

          startDevServer = pkgs.writeShellScriptBin "start-dev" ''
            set -eu

            # Already running?
            if [ -f .dev-server.pid ] && kill -0 "$(cat .dev-server.pid)" 2>/dev/null; then
              echo "Dev server: http://localhost:8000"
              exit 0
            fi
            rm -f .dev-server.pid .dev-watcher.pid

            if [ ! -f flake.nix ]; then
              echo "Error: Must run from project root"
              exit 1
            fi

            # Clean up previous build artifacts
            if [ -f src/playlists.yml ]; then
              mv src/playlists.yml playlists.yml
            fi

            # Initial build
            ${pkgs.bash}/bin/bash ./.github/scripts/pre-build.sh 2>/dev/null

            # Start server in background (exec replaces subshell so $! is the python PID)
            (cd src && exec ${pkgs.python3}/bin/python3 ../server.py) > /dev/null 2>&1 &
            echo $! > .dev-server.pid
            disown

            # Watch for changes and rebuild
            ${pkgs.watchexec}/bin/watchexec \
              -w playlists.yml \
              -w .github/scripts/pre-build.sh \
              -w src/index.html \
              -- ${pkgs.bash}/bin/bash -c 'if [ -f src/playlists.yml ]; then mv src/playlists.yml playlists.yml; fi && ./.github/scripts/pre-build.sh 2>/dev/null' \
              > /dev/null 2>&1 &
            echo $! > .dev-watcher.pid
            disown

            echo "Dev server: http://localhost:8000"
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
              if [ -f .dev-server.pid ] && kill -0 "$(cat .dev-server.pid)" 2>/dev/null; then
                echo "Dev server: http://localhost:8000"
              else
                echo "Run 'start-dev' to start the development server."
              fi
            '';
          };
        }
      );
    };
}
