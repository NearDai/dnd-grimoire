// เอฟเฟกต์ที่ใช้ร่วมกันทุกหน้า: ประกายไฟลอยเหนือโต๊ะ, อนุภาคระเบิด, จอสั่น
window.FX = (function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- วอลเปเปอร์: เบลอครั้งเดียวตอนโหลดหน้า ---------- */
  // วาดรูปลงแคนวาสพร้อมเบลอ แล้วใช้ภาพผลลัพธ์เป็นพื้นหลัง (body::before ใน base.css)
  // ภาพเลยขอบแคนวาสออกไปเท่าระยะเบลอ ขอบภาพจะได้ไม่จาง
  const WALLPAPER = new URL("../../Img/DND_wallpaper.jpg", document.currentScript.src).href;
  function wallpaper() {
    const root = document.documentElement;
    const blur = parseFloat(getComputedStyle(root).getPropertyValue("--wallpaper-blur")) || 0;
    const useCss = () => {
      root.style.setProperty("--wallpaper", `url("${WALLPAPER}")`);
      root.classList.add("wallpaper-css", "wallpaper-ready");
    };
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!("filter" in ctx)) return useCss();
        const pad = blur * 3;
        ctx.filter = `blur(${blur}px)`;
        ctx.drawImage(img, -pad, -pad, canvas.width + pad * 2, canvas.height + pad * 2);
        canvas.toBlob((blob) => {
          if (!blob) return useCss();
          root.style.setProperty("--wallpaper", `url("${URL.createObjectURL(blob)}")`);
          root.classList.add("wallpaper-ready");
        }, "image/jpeg", 0.9);
      } catch (e) {
        useCss(); // file:// อ่านพิกเซลรูปไม่ได้
      }
    };
    img.onerror = () => root.classList.add("wallpaper-ready");
    img.src = WALLPAPER;
  }
  wallpaper();

  /* ---------- ประกายไฟลอย (canvas เดียวทั้งหน้า) ---------- */
  // ประหยัดการ์ดจอ: วาดแสงเรืองไว้ล่วงหน้าครั้งเดียวแล้วแปะซ้ำ, แคนวาสครึ่งความละเอียด (แสงนุ่มอยู่แล้ว ดูไม่ต่าง)
  // อัปเดต 30 ครั้ง/วินาที, ผสมแสงเฉพาะในแคนวาส (ไม่ใช้ mix-blend-mode ที่บังคับผสมทั้งหน้าทุกเฟรม)
  function embers() {
    if (reduceMotion) return () => {};
    const canvas = document.createElement("canvas");
    canvas.className = "embers";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);
    const ctx = canvas.getContext("2d");
    const COUNT = 32;
    const SCALE = 0.5;
    const sparks = [];
    let w, h;

    const SPRITE = 32;
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = SPRITE;
    const sctx = sprite.getContext("2d");
    const g = sctx.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
    g.addColorStop(0, "rgba(255, 220, 150, 1)");
    g.addColorStop(0.35, "rgba(240, 140, 50, 0.5)");
    g.addColorStop(1, "rgba(240, 120, 40, 0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, SPRITE, SPRITE);

    function resize() {
      w = canvas.width = Math.ceil(window.innerWidth * SCALE);
      h = canvas.height = Math.ceil(window.innerHeight * SCALE);
    }

    function spawn(s, fresh) {
      s.x = Math.random() * w;
      s.y = fresh ? Math.random() * h : h + 10;
      s.size = (5 + Math.random() * 14) * SCALE;
      s.vy = (0.5 + Math.random() * 1.2) * SCALE; // ต่อเฟรม 30fps
      s.vx = (Math.random() - 0.5) * 0.6 * SCALE;
      s.life = 0.4 + Math.random() * 0.6;
      s.phase = Math.random() * Math.PI * 2;
      return s;
    }

    resize();
    for (let i = 0; i < COUNT; i++) sparks.push(spawn({}, true));
    window.addEventListener("resize", resize);

    let running = !document.hidden;
    let stopped = false;
    const onVisibility = () => {
      running = !document.hidden && !stopped;
      if (running) requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisibility);

    let lastDraw = 0;
    function tick(t) {
      if (!running) return;
      requestAnimationFrame(tick);
      if (t - lastDraw < 31) return; // วาด 30 ครั้ง/วินาที
      lastDraw = t;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const s of sparks) {
        s.y -= s.vy;
        s.x += s.vx + Math.sin(t / 900 + s.phase) * 0.5 * SCALE;
        if (s.y < -10) spawn(s, false);
        const flicker = 0.55 + Math.sin(t / 180 + s.phase * 3) * 0.45;
        ctx.globalAlpha = Math.max(0, s.life * flicker * Math.min(1, s.y / (h * 0.25)));
        ctx.drawImage(sprite, s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
      }
      ctx.globalAlpha = 1;
    }
    if (running) requestAnimationFrame(tick);

    return function stop() {
      stopped = true;
      running = false;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      canvas.remove();
    };
  }

  /* ---------- อนุภาคระเบิดจากจุดหนึ่ง ---------- */
  // x, y = พิกัดบนจอ (clientX/Y), count = จำนวน, colors = สีที่สุ่มใช้, spread = ระยะกระจาย (px)
  function burst(x, y, { count = 14, colors = ["#e6c47a", "#c99a43", "#fff1c4"], spread = 90, size = 7 } = {}) {
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
        { duration: 700 + Math.random() * 400, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
      ).onfinish = () => {
        if (++done === count) layer.remove();
      };
    }
  }

  // ระเบิดจากกลางของ element
  function burstFrom(el, opts) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, opts);
  }

  /* ---------- สั่น ---------- */
  function shake(el, strength = 6) {
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
      { duration: 380, easing: "ease-out" }
    );
  }

  // คลาส .fx-stagger ให้ลูกๆ เข้ามาทีละชิ้น (ใช้ --i เป็นลำดับ)
  function stagger(container, selector) {
    if (reduceMotion || !container) return;
    container.querySelectorAll(selector).forEach((el, i) => {
      el.style.setProperty("--i", Math.min(i, 14));
      el.classList.add("fx-enter");
    });
  }

  /* ---------- โหมดเบา + เครื่องมือวินิจฉัย ---------- */
  // ?fx=lite  บังคับโหมดเบา (ปิดประกายไฟ เท็กซ์เจอร์ และเงาใหญ่)
  // ?fx=full  บังคับโหมดเต็ม และล้างค่าที่ระบบจำไว้
  // ?fps      แสดงเฟรมเรตมุมขวาล่าง
  // ถ้าไม่ได้บังคับ ระบบจะวัดเฟรมเรตช่วงแรกของหน้า ถ้าต่ำกว่า 40 fps จะสลับเป็นโหมดเบาเองและจำไว้
  const KEY = "dnd.fx";
  const params = new URLSearchParams(location.search);
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) { /* ไม่มีที่เก็บก็ไม่เป็นไร */ } },
  };
  if (params.get("fx") === "full") store.set(null);
  const forced = params.get("fx");
  let lite = forced === "lite" || (forced !== "full" && store.get() === "lite");
  if (lite) document.documentElement.classList.add("fx-lite");

  if (params.has("fps")) {
    const box = document.createElement("div");
    box.className = "fx-fps";
    document.body.append(box);
    let frames = [];
    let last = performance.now();
    let slowTotal = 0;
    const tick = (t) => {
      const d = t - last;
      last = t;
      frames.push(d);
      if (d > 25) slowTotal++;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setInterval(() => {
      if (!frames.length) return;
      const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
      box.textContent = `FPS ${Math.round(1000 / avg)}  worst ${Math.round(Math.max(...frames))}ms
slow frames ${slowTotal}${lite ? "  (lite)" : ""}`;
      frames = [];
    }, 500);
  }

  const stopEmbers = lite ? () => {} : embers();

  function enableLite() {
    lite = true;
    document.documentElement.classList.add("fx-lite");
    stopEmbers();
    store.set("lite");
  }

  // วัดช่วง 0.8–3.8 วินาทีหลังเปิดหน้า (ช่วงที่มีแอนิเมชันเปิดหน้ามากที่สุด)
  if (!lite && !forced && !reduceMotion) {
    const frames = [];
    let last = 0;
    const start = performance.now();
    const probe = (t) => {
      if (last && t - start > 800) frames.push(t - last);
      last = t;
      if (document.hidden) return; // แท็บถูกซ่อน ผลจะเพี้ยน ไม่ตัดสิน
      if (t - start < 3800) return requestAnimationFrame(probe);
      const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
      if (frames.length > 20 && 1000 / avg < 40) enableLite();
    };
    requestAnimationFrame(probe);
  }

  return { reduceMotion, burst, burstFrom, shake, stagger, enableLite };
})();
