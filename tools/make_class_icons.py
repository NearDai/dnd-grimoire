# ย่อภาพโลโก้อาชีพ src/assets/class-icons/*.jpg (ต้นฉบับ 2048px) เป็น .webp 256px ให้เว็บใช้
# + ปรับขนาดโลโก้ (ลายขาว) ให้เท่ากันทุกอาชีพ และจัดให้อยู่กลางภาพ
# ต้นฉบับ .jpg ไม่ถูกแก้และไม่ถูก bundle (ClassIcon โหลดแค่ png/webp/svg)
# เพิ่ม/แก้รูปแล้วรัน: python tools/make_class_icons.py   (ทำเฉพาะรูปที่ยังไม่มี .webp หรือ .jpg ใหม่กว่า)
#   --all = ทำใหม่ทุกรูป (หลังแก้ TARGET/ADJUST)   --preview = ทำแผ่นเทียบก่อน/หลังไว้ดู
import math
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps

SIZE = 256
DIR = Path(__file__).resolve().parent.parent / "src" / "assets" / "class-icons"
BACKUP = DIR / "_backup-v1"  # webp ชุดก่อนปรับสมดุล (โฟลเดอร์ย่อยไม่ถูก bundle)

TARGET = 0.60  # ขนาดโลโก้ (รากที่สองของพื้นที่กรอบ) เทียบความกว้างภาพ
MAX_RADIUS = 0.47  # โลโก้ต้องไม่เกินรัศมีนี้ (เทียบความกว้าง) จะได้ไม่ถูกขอบวงกลมตัด
# ปรับด้วยตาเพิ่มจากค่าที่วัดอัตโนมัติ (>1 = ใหญ่ขึ้น): ทรงทึบ/ทรงกลมดูใหญ่กว่าขนาดกรอบจริง ทรงโปร่งดูเล็กกว่า
ADJUST = {"fighter": 1.12, "cleric": 1.1, "paladin": 1.1, "druid": 1.05, "warlock": 1.05, "monk": 0.95, "wizard": 0.95}
MEASURE = 256  # วัดบนภาพย่อขนาดนี้
WORK = 512  # ทำงานบนภาพย่อขนาดนี้ (ผลลัพธ์แค่ 256)


def white_mask(img: Image.Image) -> Image.Image:
    """พิกเซลที่เป็นลายขาว (สว่าง + สีจาง) = 255"""
    r, g, b = img.split()
    sat = img.convert("HSV").split()[1]
    mask = r.point(lambda v: 255 * (v > 185))
    for ch in (g.point(lambda v: 255 * (v > 185)), b.point(lambda v: 255 * (v > 185)), sat.point(lambda v: 255 * (v < 70))):
        mask = ImageChops.multiply(mask, ch)
    return mask


def emblem_box(img: Image.Image):
    """หาโลโก้สีขาว: คืน (cx, cy, size, radius) เป็นสัดส่วน 0..1 ของภาพ"""
    px = white_mask(img.resize((MEASURE, MEASURE), Image.LANCZOS)).load()
    pts = [(x, y) for y in range(MEASURE) for x in range(MEASURE) if px[x, y]]
    xs = sorted(p[0] for p in pts)
    ys = sorted(p[1] for p in pts)
    cut = lambda arr, q: arr[min(len(arr) - 1, int(len(arr) * q))]  # ตัดจุดเปื้อนหลุดๆ ออก
    x0, x1, y0, y1 = cut(xs, 0.004), cut(xs, 0.996), cut(ys, 0.004), cut(ys, 0.996)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    dist = sorted(math.hypot(x - cx, y - cy) for x, y in pts if x0 <= x <= x1 and y0 <= y <= y1)
    radius = cut(dist, 0.995)
    return cx / MEASURE, cy / MEASURE, math.sqrt((x1 - x0) * (y1 - y0)) / MEASURE, radius / MEASURE


def mirror_pad(img: Image.Image, pad: int) -> Image.Image:
    """ขยายพื้นหลังด้วยการสะท้อนลาย (ใช้ตอนต้องย่อโลโก้ลง)"""
    w, h = img.size
    out = Image.new("RGB", (w + 2 * pad, h + 2 * pad))
    flips = {-1: ImageOps.mirror, 0: lambda i: i, 1: ImageOps.mirror}
    for j in (-1, 0, 1):
        for i in (-1, 0, 1):
            tile = flips[i](img)
            if j:
                tile = ImageOps.flip(tile)
            out.paste(tile, (pad + i * w, pad + j * h))
    # ลายโลโก้ที่ติดมากับส่วนสะท้อน -> ลบออก (เฉพาะขอบที่เติม ไม่แตะภาพจริง)
    mask = white_mask(out).filter(ImageFilter.MaxFilter(7))
    mask.paste(0, (pad, pad, pad + w, pad + h))
    fill = out.filter(ImageFilter.MinFilter(15)).filter(ImageFilter.GaussianBlur(4))
    out.paste(fill, mask=mask.filter(ImageFilter.GaussianBlur(2)))
    return out


def balance(img: Image.Image, name: str) -> Image.Image:
    img = img.resize((WORK, WORK), Image.LANCZOS)
    w = img.width
    cx, cy, size, radius = emblem_box(img)
    k = min(TARGET * ADJUST.get(name, 1) / size, MAX_RADIUS / radius)  # >1 = ขยายโลโก้, <1 = ย่อ
    crop = w / k
    pad = math.ceil(max(0, crop - w) / 2 + w * 0.1)
    big = mirror_pad(img, pad)
    left, top = pad + cx * w - crop / 2, pad + cy * w - crop / 2
    print(f"  size {size:.2f} r {radius:.2f} -> x{k:.2f}")
    return big.resize((SIZE, SIZE), Image.LANCZOS, box=(left, top, left + crop, top + crop))


def main():
    preview = "--preview" in sys.argv
    srcs = sorted(DIR.glob("*.jpg"))
    if "--all" not in sys.argv:
        srcs = [s for s in srcs if not s.with_suffix(".webp").exists() or s.stat().st_mtime > s.with_suffix(".webp").stat().st_mtime]
    if not BACKUP.exists():
        BACKUP.mkdir()
        for old in DIR.glob("*.webp"):
            shutil.copy2(old, BACKUP / old.name)
    sheet = Image.new("RGB", (len(srcs) * SIZE // 2, SIZE), "white") if preview else None
    for n, src in enumerate(srcs):
        print(src.stem)
        img = Image.open(src).convert("RGB")
        out = balance(img, src.stem)
        out.save(src.with_suffix(".webp"), "WEBP", quality=82, method=6)
        if sheet:
            half = SIZE // 2
            sheet.paste(img.resize((half, half), Image.LANCZOS), (n * half, 0))
            sheet.paste(out.resize((half, half), Image.LANCZOS), (n * half, half))
    if sheet:
        sheet.save(DIR.parent.parent.parent / "tools" / "class_icons_preview.png")


if __name__ == "__main__":
    main()
