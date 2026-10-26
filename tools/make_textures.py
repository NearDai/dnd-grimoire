"""สร้างเท็กซ์เจอร์ PNG (กระดาษ/ลายไม้) แทน SVG feTurbulence ที่เรนเดอร์หนัก

    python tools/make_textures.py

ผลลัพธ์: src/styles/textures.css (ฝัง PNG แบบ base64 เป็นตัวแปร --noise / --grain)
"""
import base64
import math
import random
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
random.seed(7)


def png(width, height, pixels):
    """pixels = list ของแถว แต่ละแถวเป็น bytes RGBA"""
    raw = b"".join(b"\x00" + row for row in pixels)

    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9))
            + chunk(b"IEND", b""))


def noise(size=128):
    # จุดหมึกละเอียดบนกระดาษ สีน้ำตาลซีเปีย โปร่งแสงสุ่ม
    rows = []
    for _ in range(size):
        row = bytearray()
        for _ in range(size):
            a = int(random.random() ** 2.2 * 42)
            row += bytes((89, 61, 26, a))
        rows.append(bytes(row))
    return png(size, size, rows)


def grain(w=320, h=96):
    # ลายเสี้ยนไม้แนวนอน: แต่ละแถวมีความเข้มต่างกัน และแปรผันช้าๆ ตามแกน x (ต่อกันได้ไร้รอยต่อ)
    rows = []
    base = [random.random() for _ in range(h)]
    smooth = [(base[y - 1] + 2 * base[y] + base[(y + 1) % h]) / 4 for y in range(h)]
    for y in range(h):
        phases = [random.random() * math.tau for _ in range(3)]
        row = bytearray()
        for x in range(w):
            t = x / w * math.tau
            wave = (math.sin(t + phases[0]) + 0.5 * math.sin(2 * t + phases[1]) + 0.25 * math.sin(4 * t + phases[2])) / 1.75
            v = max(0.0, min(1.0, smooth[y] * 0.75 + wave * 0.25 + random.random() * 0.04))
            row += bytes((26, 13, 5, int(v * 128)))
        rows.append(bytes(row))
    return png(w, h, rows)


def data_url(b):
    return "data:image/png;base64," + base64.b64encode(b).decode()


css = (
    "/* สร้างอัตโนมัติด้วย tools/make_textures.py — อย่าแก้ด้วยมือ */\n"
    ":root {\n"
    f'  --noise: url("{data_url(noise())}");\n'
    f'  --grain: url("{data_url(grain())}");\n'
    "}\n"
)
out = ROOT / "src" / "styles" / "textures.css"
out.write_text(css, encoding="utf-8")
print(f"wrote {out.relative_to(ROOT)} ({len(css) // 1024} KB)")
