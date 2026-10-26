// เอฟเฟกต์ที่ใช้ร่วมกันทุกหน้า: โหมดเบา, ตัววัดเฟรมเรต, อนุภาคระเบิด, จอสั่น, วอลเปเปอร์เบลอ
// กฎประสิทธิภาพของโปรเจกต์นี้: ขยับด้วย transform/opacity เท่านั้น ห้ามใส่ filter สดบนเลเยอร์ใหญ่หรือที่ขยับ
import wallpaperUrl from "../../Img/DND_wallpaper.jpg";

export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- โหมดเบา ---------- */
// ?fx=lite บังคับโหมดเบา (ปิดเท็กซ์เจอร์และเงาใหญ่), ?fx=full บังคับโหมดเต็มและล้างค่าที่จำไว้, ?fps แสดงเฟรมเรต
// ถ้าไม่ได้บังคับ จะวัดเฟรมเรตช่วงแรกของหน้า ถ้าต่ำกว่า 40 fps จะสลับเป็นโหมดเบาเองและจำไว้
const KEY = "dnd.fx";
const params = new URLSearchParams(location.search);
const memory = {
  get() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(v: string | null) {
    try {
      if (v) localStorage.setItem(KEY, v);
      else localStorage.removeItem(KEY);
    } catch {
      /* ไม่มีที่เก็บก็ไม่เป็นไร */
    }
  },
};
const forced = params.get("fx");
if (forced === "full") memory.set(null);

let lite = forced === "lite" || (forced !== "full" && memory.get() === "lite");

function enableLite() {
  lite = true;
  document.documentElement.classList.add("fx-lite");
  memory.set("lite");
}

function probeFrameRate() {
  if (lite || forced || reduceMotion) return;
  const frames: number[] = [];
  let last = 0;
  const start = performance.now();
  const probe = (t: number) => {
    if (last && t - start > 800) frames.push(t - last);
    last = t;
    if (document.hidden) return; // แท็บถูกซ่อน ผลจะเพี้ยน ไม่ตัดสิน
    if (t - start < 3800) {
      requestAnimationFrame(probe);
      return;
    }
    const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
    if (frames.length > 20 && 1000 / avg < 40) enableLite();
  };
  requestAnimationFrame(probe);
}

function fpsMeter() {
  if (!params.has("fps")) return;
  const box = document.createElement("div");
  box.className = "fx-fps";
  document.body.append(box);
  let frames: number[] = [];
  let last = performance.now();
  let slow = 0;
  const tick = (t: number) => {
    const d = t - last;
    last = t;
    frames.push(d);
    if (d > 25) slow++;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  setInterval(() => {
    if (!frames.length) return;
    const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
    box.textContent = `FPS ${Math.round(1000 / avg)}  worst ${Math.round(Math.max(...frames))}ms\nslow frames ${slow}${lite ? "  (lite)" : ""}`;
    frames = [];
  }, 500);
}

/* ---------- วอลเปเปอร์: เบลอครั้งเดียวตอนโหลดหน้า ---------- */
// วาดรูปลงแคนวาสพร้อมเบลอ แล้วใช้ภาพผลลัพธ์เป็นพื้นหลัง (body::before ใน global.css)
// ไม่ใช้ CSS filter: blur เพราะต้องคำนวณใหม่ทุกเฟรมที่มีของขยับอยู่ด้านบน
function wallpaper() {
  const root = document.documentElement;
  const blur = parseFloat(getComputedStyle(root).getPropertyValue("--wallpaper-blur")) || 0;
  const ready = (url: string) => {
    root.style.setProperty("--wallpaper", `url("${url}")`);
    root.classList.add("wallpaper-ready");
  };
  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx || !("filter" in ctx)) return ready(wallpaperUrl);
      const pad = blur * 3; // ภาพเลยขอบแคนวาสเท่าระยะเบลอ ขอบจะได้ไม่จาง
      ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(img, -pad, -pad, canvas.width + pad * 2, canvas.height + pad * 2);
      canvas.toBlob((blob) => ready(blob ? URL.createObjectURL(blob) : wallpaperUrl), "image/jpeg", 0.9);
    } catch {
      ready(wallpaperUrl);
    }
  };
  img.onerror = () => root.classList.add("wallpaper-ready");
  img.src = wallpaperUrl;
}

export function initFx() {
  if (lite) document.documentElement.classList.add("fx-lite");
  wallpaper();
  fpsMeter();
  probeFrameRate();
}

/* ---------- อนุภาคระเบิดจากจุดหนึ่ง ---------- */
interface BurstOptions {
  count?: number;
  colors?: string[];
  spread?: number;
  size?: number;
}

export function burst(
  x: number,
  y: number,
  { count = 14, colors = ["#ecd18a", "#c9a24a", "#fff3cf"], spread = 90, size = 7 }: BurstOptions = {},
) {
  if (reduceMotion) return;
  const layer = document.createElement("div");
  layer.className = "fx-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.append(layer);
  let done = 0;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "fx-spark";
    const s = size * (0.5 + Math.random());
    p.style.cssText = `left:${x}px;top:${y}px;width:${s}px;height:${s}px;background:${colors[i % colors.length]}`;
    layer.append(p);
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = spread * (0.5 + Math.random() * 0.7);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    p.animate(
      [
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * 0.8}px), calc(-50% + ${dy * 0.8}px)) scale(0.9)`, opacity: 1, offset: 0.6 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 30}px)) scale(0.2)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 400, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    ).onfinish = () => {
      if (++done === count) layer.remove();
    };
  }
}

export function burstFrom(el: Element | null | undefined, opts?: BurstOptions) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, opts);
}

export function shake(el: Element | null | undefined, strength = 6) {
  if (reduceMotion || !el) return;
  el.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: `translate(${-strength}px, ${strength / 2}px)` },
      { transform: `translate(${strength}px, ${-strength / 2}px)` },
      { transform: `translate(${-strength / 2}px, 0)` },
      { transform: `translate(${strength / 2}px, 0)` },
      { transform: "translate(0, 0)" },
    ],
    { duration: 380, easing: "ease-out" },
  );
}
