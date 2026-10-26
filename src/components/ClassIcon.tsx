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

// สีประจำอาชีพ = สีเฉลี่ยของภาพไอคอน (ย่อเหลือ 1 พิกเซล) คิดครั้งเดียวต่ออาชีพแล้วจำไว้
// อาชีพใหม่ได้สีของตัวเองอัตโนมัติจากรูปที่ใส่ ไม่ต้องตั้งค่าที่ไหน
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
            c.width = c.height = 1;
            const ctx = c.getContext("2d")!;
            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            resolve(`rgb(${r} ${g} ${b})`);
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
