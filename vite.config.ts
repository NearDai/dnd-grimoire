import { spawnSync } from "node:child_process";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const ROOT = __dirname;
const SOURCES = ["DND_GameData.xlsx", "DND_Skill_Extra_Final.xlsx"].map((f) => path.resolve(ROOT, f));

// แปลง Excel -> src/data/*.json ตอนเริ่ม และทุกครั้งที่บันทึกไฟล์ Excel (ระหว่าง npm run dev)
// ถ้าแปลงไม่ผ่าน หน้าเว็บยังใช้ข้อมูลชุดล่าสุดที่แปลงสำเร็จ
function excelData(): Plugin {
  const run = () => {
    for (const py of ["python", "py"]) {
      const r = spawnSync(py, ["-X", "utf8", "tools/export_data.py"], { cwd: ROOT, encoding: "utf8" });
      if (r.error) continue;
      if (r.status === 0) process.stdout.write(`[excel] ${r.stdout}`);
      else console.error(`[excel] แปลงข้อมูลไม่สำเร็จ ใช้ข้อมูลชุดเดิม\n${r.stdout}${r.stderr}`);
      return;
    }
    console.warn("[excel] ไม่พบ Python ใช้ข้อมูลที่แปลงไว้ล่าสุด");
  };
  return {
    name: "excel-data",
    buildStart: run,
    configureServer(server) {
      server.watcher.add(SOURCES);
      const onFile = (file: string) => {
        if (SOURCES.includes(path.resolve(file))) run();
      };
      server.watcher.on("change", onFile);
      server.watcher.on("add", onFile);
    },
  };
}

export default defineConfig(() => ({
  // เว็บอยู่ที่รากของโดเมน (Vercel, dev) — ถ้าวันหนึ่งย้ายไปอยู่ใต้ path ย่อย เช่น GitHub Pages
  // ให้ตั้ง base เป็น "/<ชื่อ repo>/" (router ใช้ค่านี้ผ่าน import.meta.env.BASE_URL อยู่แล้ว)
  base: "/",
  plugins: [react(), excelData()],
  // host: true = เปิดให้เครื่องอื่นในวง LAN เดียวกันเข้าได้ทาง http://<IP เครื่องนี้>:5500
  // strictPort: ถ้า 5500 ไม่ว่างให้ขึ้น error เลย ไม่แอบย้ายไป 5501 (ลิงก์ที่แชร์และกฎ Firewall ผูกกับ 5500)
  server: { port: 5500, strictPort: true, open: true, host: true },
  preview: { port: 5500, strictPort: true, open: true, host: true },
}));
