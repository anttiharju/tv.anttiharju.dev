#!/usr/bin/env python3
import http.server
import socketserver
from pathlib import Path

PORT = 8000

class RewriteHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Remove query string and fragments
        path = self.path.split('?')[0].split('#')[0]

        # If path doesn't have an extension and isn't root, try .html
        if path != '/' and '.' not in Path(path).name:
            html_path = Path(self.directory) / (path.lstrip('/') + '.html')
            if html_path.exists():
                self.path = path + '.html'

        return super().do_GET()

with socketserver.TCPServer(("", PORT), RewriteHTTPRequestHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
