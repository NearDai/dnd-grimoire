import "./ClassIcon.css";

// โลโก้อาชีพ: ไฟล์ src/assets/class-icons/<id อาชีพตัวเล็ก>.png|.webp|.svg (วางเป็น <img>)
// ถ้ามีหลายนามสกุลชื่อเดียวกัน ใช้ png/webp (ภาพวาด) ก่อน svg
// อาชีพใหม่ใน Excel ที่ยังไม่มีไฟล์ จะแสดงตัวอักษรแรกแทน
const files = import.meta.glob("../assets/class-icons/*.{png,webp,svg}", { query: "?url", import: "default", eager: true }) as Record<string, string>;

const ICONS: Record<string, string> = {};
const ART = new Set<string>(); // id ที่ใช้ภาพวาด png/webp
Object.entries(files)
  .sort(([a], [b]) => Number(a.endsWith(".svg")) - Number(b.endsWith(".svg")))
  .forEach(([path, url]) => {
    const id = path.split("/").pop()!.replace(/\.(png|webp|svg)$/, "").toLowerCase();
    if (ICONS[id]) return;
    ICONS[id] = url;
    if (!path.endsWith(".svg")) ART.add(id);
  });

export function classIconUrl(id: string): string | undefined {
  return ICONS[id.toLowerCase()];
}

// สีประจำอาชีพ = สีเด่นของภาพไอคอน คิดครั้งเดียวต่ออาชีพแล้วจำไว้
// อาชีพใหม่ได้สีของตัวเองอัตโนมัติจากรูปที่ใส่ ไม่ต้องตั้งค่าที่ไหน
// ไม่ใช้สีเฉลี่ยตรงๆ: ภาพโทนเทา/มืด (assassin, rogue, ranger, warlock) เฉลี่ยแล้วเกือบเท่าสีพื้นแผ่น มองไม่เห็นว่าเปลี่ยน
// จึงเฉลี่ยโดยให้น้ำหนักพิกเซลที่สีสด (chroma²) แล้วดันความสด/ความสว่างให้อยู่ในช่วงที่เห็นชัดบนพื้นมืด
const SAMPLE = 32;
const MIN_SAT = 0.5;
const LIGHT = [0.42, 0.58] as const;

function vividAccent(data: Uint8ClampedArray): string {
  let R = 0, G = 0, B = 0, W = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const c = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
    const w = c * c + 1e-4;
    R += r * w; G += g * w; B += b * w; W += w;
  }
  const r = R / W / 255, g = G / W / 255, b = B / W / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  const sat = Math.max(s, MIN_SAT) * 100;
  const light = Math.min(Math.max(l, LIGHT[0]), LIGHT[1]) * 100;
  return `hsl(${Math.round(h)} ${Math.round(sat)}% ${Math.round(light)}%)`;
}

const accents = new Map<string, Promise<string | null>>();
export function classAccent(id: string): Promise<string | null> {
  const key = id.toLowerCase();
  if (!accents.has(key)) {
    accents.set(
      key,
      new Promise((resolve) => {
        const url = ICONS[key];
        if (!url || !ART.has(key)) return resolve(null);
        const img = new Image();
        img.onload = () => {
          try {
            const c = document.createElement("canvas");
            c.width = c.height = SAMPLE;
            const ctx = c.getContext("2d")!;
            ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
            resolve(vividAccent(ctx.getImageData(0, 0, SAMPLE, SAMPLE).data));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      }),
    );
  }
  return accents.get(key)!;
}

export default function ClassIcon({ id, className = "" }: { id: string; className?: string }) {
  const url = classIconUrl(id);
  if (!url) {
    return <span className={`class-icon is-letter ${className}`}>{id[0]}</span>;
  }
  // ภาพวาด (png/webp) เป็นพื้นสี่เหลี่ยม -> ตัดเป็นวงกลม + ขอบทอง ให้เข้ากับช่องกลมเดิม
  const art = ART.has(id.toLowerCase()) ? "is-art" : "";
  return <img className={`class-icon ${art} ${className}`} src={url} alt="" draggable={false} />;
}
