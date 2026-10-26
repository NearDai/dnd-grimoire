"""เซิร์ฟเวอร์สำหรับเล่น/ทดสอบในเครื่อง

    python tools/serve.py [port]

ทุกครั้งที่เบราว์เซอร์ขอไฟล์ใน data/ ถ้าไฟล์ Excel ถูกแก้หลังการ export ครั้งล่าสุด
จะ export ใหม่ให้อัตโนมัติ — แก้ Excel แล้วกดรีเฟรชหน้าเว็บได้เลย
"""
import functools
import http.server
import sys
import threading

import export_data

lock = threading.Lock()


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/data/"):
            with lock:
                if export_data.is_stale():
                    try:
                        warns = export_data.export(verbose=False)
                        print("[data] อัปเดตข้อมูลจาก Excel แล้ว", flush=True)
                        for w in warns:
                            print(f"[data] ! {w}", flush=True)
                    except Exception as err:  # ใช้ข้อมูลชุดเดิมต่อไปถ้า Excel มีปัญหา
                        print(f"[data] ERROR {err} (ใช้ข้อมูลชุดเดิมแทน)", flush=True)
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # ไม่ต้องพิมพ์ทุก request


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    try:
        export_data.export()
    except Exception as err:
        print(f"ERROR {err}")
    handler = functools.partial(Handler, directory=str(export_data.ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"Serving at http://localhost:{port}/", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
