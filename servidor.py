#!/usr/bin/env python3
"""Servidor local do MV Note (site 1).

Uso:
    python3 servidor.py                  # http://localhost:8000
    MV_NOTE_PORT=8100 python3 servidor.py
    MV_HOST=0.0.0.0 python3 servidor.py  # acessar de outro aparelho na rede
"""

from __future__ import annotations

import functools
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PORTA = int(os.environ.get("MV_NOTE_PORT", "8000"))
HOST = os.environ.get("MV_HOST", "127.0.0.1")


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        # Evita ficar com versões antigas em cache durante o desenvolvimento.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:
        print(f"[mv-note] {fmt % args}")


def main() -> None:
    handler = functools.partial(Handler, directory=BASE_DIR)
    servidor = ThreadingHTTPServer((HOST, PORTA), handler)
    print(f"MV Note:     http://localhost:{PORTA}")
    print("Pressione Ctrl+C para parar.")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        servidor.server_close()


if __name__ == "__main__":
    main()
