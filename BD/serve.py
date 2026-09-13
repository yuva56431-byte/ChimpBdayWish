from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from datetime import datetime, timezone
import json
import sys
import webbrowser

LOG_FILE = Path(__file__).resolve().parent / "proposal-log.jsonl"


class BirthdayHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        if self.path != "/api/proposal-choice":
            self.send_error(404)
            return

        origin = self.headers.get("Origin")
        expected_origin = f"http://{self.headers.get('Host')}"
        if origin != expected_origin:
            self.send_error(403, "Only this birthday page can save choices")
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 1024:
                raise ValueError("Invalid request size")
            data = json.loads(self.rfile.read(length))
            choice = data.get("choice")
            if choice not in ("YES", "NO"):
                raise ValueError("Invalid choice")
        except (ValueError, TypeError, json.JSONDecodeError):
            self.send_error(400, "Invalid proposal choice")
            return

        entry = {
            "time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "choice": choice,
        }
        with LOG_FILE.open("a", encoding="utf-8") as log:
            log.write(json.dumps(entry, ensure_ascii=False) + "\n")

        self.send_response(204)
        self.end_headers()


def main():
    directory = Path(__file__).resolve().parent
    handler = partial(BirthdayHandler, directory=str(directory))
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        url = f"http://127.0.0.1:{server.server_port}/index.html"
        print(f"Birthday website: {url}", flush=True)
        print(f"Proposal clicks will be saved to: {LOG_FILE}", flush=True)
        if "--no-browser" not in sys.argv:
            webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
