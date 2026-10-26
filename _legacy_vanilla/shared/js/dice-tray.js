// ถาดลูกเต๋า: เลือกหยิบลูกจากชั้นวาง (d6 / d10 / d20 / เหรียญ) แล้วทอยในถาด
// ใช้: DiceTray.mount(document.getElementById("x"), { onRoll(result) {} })
// result = { type: "d20", value: 17, max: false, min: false } หรือ { type: "coin", value: "heads" }
window.DiceTray = (function () {
  const FX = window.FX || { reduceMotion: false, burstFrom() {}, shake() {} };
  const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

  const TYPES = {
    d6: { sides: 6, en: "d6", th: "ลูกเต๋า 6 หน้า" },
    d10: { sides: 10, en: "d10", th: "ลูกเต๋า 10 หน้า" },
    d20: { sides: 20, en: "d20", th: "ลูกเต๋า 20 หน้า" },
    coin: { sides: 2, en: "Coin", th: "เหรียญหัวก้อย" },
  };

  /* ---------- ภาพลูกเต๋า ---------- */
  // ตำแหน่งจุดบนหน้าลูกเต๋า (u,v ในสี่เหลี่ยมหน่วย 0–1)
  const PIPS = {
    1: [[0.5, 0.5]],
    2: [[0.25, 0.25], [0.75, 0.75]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]],
    5: [[0.25, 0.25], [0.25, 0.75], [0.5, 0.5], [0.75, 0.25], [0.75, 0.75]],
    6: [[0.25, 0.2], [0.25, 0.5], [0.25, 0.8], [0.75, 0.2], [0.75, 0.5], [0.75, 0.8]],
  };

  // แปลงสี่เหลี่ยมหน่วยไปเป็นหน้าลูกบาศก์แต่ละด้าน (จุดกลมจะเอียงตามหน้าเอง)
  const D6_FACES = {
    top: "matrix(40 -22 40 22 10 30)", // A(10,30) B(50,8) D(50,52)
    left: "matrix(40 22 0 42 10 30)", // A(10,30) B(50,52) D(10,72)
    right: "matrix(40 -22 0 42 50 52)", // A(50,52) B(90,30) D(50,94)
  };

  function pips(n) {
    return PIPS[n].map(([u, v]) => `<circle cx="${u}" cy="${v}" r="0.095"/>`).join("");
  }

  // หน้าข้างที่มองเห็นต้องเป็นค่าที่อยู่ติดกันได้จริง (หน้าตรงข้ามรวมกันได้ 7)
  function sideFaces(top) {
    const adjacent = [1, 2, 3, 4, 5, 6].filter((n) => n !== top && n !== 7 - top);
    const left = adjacent[0];
    const right = adjacent.find((n) => n !== left && n !== 7 - left);
    return [left, right];
  }

  function d6Faces(top) {
    const [left, right] = sideFaces(top);
    return `
      <g class="die-face" data-face="top" transform="${D6_FACES.top}">${pips(top)}</g>
      <g data-face="left" transform="${D6_FACES.left}">${pips(left)}</g>
      <g data-face="right" transform="${D6_FACES.right}">${pips(right)}</g>`;
  }

  function art(type, value) {
    if (type === "d6") {
      return `
        <svg class="die-art" viewBox="0 0 100 100" aria-hidden="true">
          <polygon points="10,30 50,8 90,30 50,52" fill="#f4ead2"/>
          <polygon points="10,30 50,52 50,94 10,72" fill="#d8c69e"/>
          <polygon points="90,30 50,52 50,94 90,72" fill="#b9a271"/>
          <polygon points="10,30 50,8 90,30 90,72 50,94 10,72" fill="none" stroke="#6a4f33" stroke-width="2" stroke-linejoin="round"/>
          <path d="M10 30 50 52 90 30M50 52v42" fill="none" stroke="#a48d5e" stroke-width="1"/>
          <g class="d6-pips" fill="#3a2816">${d6Faces(value || 6)}</g>
        </svg>`;
    }
    if (type === "d10") {
      return `
        <svg class="die-art" viewBox="0 0 100 100" aria-hidden="true">
          <polygon points="50,4 30,52 6,40" fill="#2f6b4f"/>
          <polygon points="50,4 94,40 70,52" fill="#24563f"/>
          <polygon points="6,40 30,52 50,64 14,66" fill="#1f4a36"/>
          <polygon points="94,40 86,66 50,64 70,52" fill="#173a2a"/>
          <polygon points="14,66 50,64 86,66 50,96" fill="#122e21"/>
          <polygon points="50,4 70,52 50,64 30,52" fill="#3a8462"/>
          <polygon points="50,4 94,40 86,66 50,96 14,66 6,40" fill="none" stroke="#0b1f16" stroke-width="2" stroke-linejoin="round"/>
          <text class="die-face die-num" x="50" y="50" text-anchor="middle">${value || 10}</text>
        </svg>`;
    }
    if (type === "d20") {
      return `
        <svg class="die-art" viewBox="0 0 100 100" aria-hidden="true">
          <polygon points="50,4 90,27 50,22" fill="#c4442f"/>
          <polygon points="50,4 10,27 50,22" fill="#b33a27"/>
          <polygon points="10,27 50,22 24,66" fill="#9b2d20"/>
          <polygon points="10,27 24,66 10,73" fill="#7a2218"/>
          <polygon points="90,27 50,22 76,66" fill="#a8321f"/>
          <polygon points="90,27 76,66 90,73" fill="#6e1d14"/>
          <polygon points="10,73 24,66 50,96" fill="#6e1d14"/>
          <polygon points="24,66 76,66 50,96" fill="#5c170f"/>
          <polygon points="76,66 90,73 50,96" fill="#4f130c"/>
          <polygon points="50,22 76,66 24,66" fill="#b8402b"/>
          <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="none" stroke="#3d0e08" stroke-width="2" stroke-linejoin="round"/>
          <text class="die-face die-num" x="50" y="57" text-anchor="middle">${value || 20}</text>
        </svg>`;
    }
    // เหรียญ: หน้า = ตราโล่, ก้อย = ดาว
    return `
      <span class="coin" aria-hidden="true">
        <span class="coin-face coin-heads">
          <svg viewBox="0 0 40 40"><path d="M20 7c4 2 7 2.4 10 2.4v8c0 7-4.4 11.8-10 14.2-5.6-2.4-10-7.2-10-14.2v-8c3 0 6-.4 10-2.4z" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M20 13v14M14 19h12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
        </span>
        <span class="coin-face coin-tails">
          <svg viewBox="0 0 40 40"><path d="M20 6l3.6 9.4 10 .6-7.8 6.3 2.6 9.7L20 26.6l-8.4 5.4 2.6-9.7-7.8-6.3 10-.6z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>
        </span>
      </span>`;
  }

  function setFace(slot, type, value) {
    if (type === "d6") slot.querySelector(".d6-pips").innerHTML = d6Faces(value);
    else slot.querySelector(".die-face").textContent = value;
  }

  /* ---------- คอมโพเนนต์ ---------- */
  function mount(root, { onRoll } = {}) {
    root.classList.add("dt");
    root.innerHTML = `
      <div class="dt-tray">
        <div class="dt-felt">
          <p class="dt-empty" lang="th">หยิบลูกเต๋าจากชั้นวาง<br>มาวางในถาด</p>
          <button type="button" class="dt-slot" hidden aria-label="Roll"></button>
          <span class="dt-shadow" hidden></span>
          <p class="dt-result" aria-live="polite">
            <span class="dt-result-value"></span>
            <span class="dt-result-label"></span>
          </p>
        </div>
      </div>
      <div class="dt-rack" role="group" aria-label="Choose a die">
        ${Object.entries(TYPES).map(([id, t]) => `
          <button type="button" class="dt-pick" data-die="${id}" aria-pressed="false">
            <span class="dt-pick-art">${art(id)}</span>
            <span class="dt-pick-name">${t.en}</span>
          </button>`).join("")}
      </div>
      <button type="button" class="btn btn-gold dt-roll" disabled>Pick a die</button>`;

    const felt = root.querySelector(".dt-felt");
    const slot = root.querySelector(".dt-slot");
    const shadow = root.querySelector(".dt-shadow");
    const empty = root.querySelector(".dt-empty");
    const resultValue = root.querySelector(".dt-result-value");
    const resultLabel = root.querySelector(".dt-result-label");
    const rollBtn = root.querySelector(".dt-roll");
    let current = null;
    let rolling = false;

    function clearResult() {
      resultValue.textContent = "";
      resultLabel.textContent = "";
      felt.classList.remove("is-max", "is-min");
    }

    function pick(type) {
      if (rolling) return;
      clearResult();
      root.querySelectorAll(".dt-pick").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.die === type && current !== type)));
      if (current === type) {
        // วางคืนชั้นวาง
        current = null;
        slot.hidden = true;
        shadow.hidden = true;
        empty.hidden = false;
        rollBtn.disabled = true;
        rollBtn.textContent = "Pick a die";
        return;
      }
      current = type;
      slot.innerHTML = art(type);
      slot.dataset.die = type;
      slot.setAttribute("aria-label", type === "coin" ? "Flip the coin" : `Roll the ${type}`);
      slot.hidden = false;
      shadow.hidden = false;
      empty.hidden = true;
      rollBtn.disabled = false;
      rollBtn.textContent = type === "coin" ? "Flip Coin" : `Roll ${type}`;
      if (!FX.reduceMotion) {
        slot.animate(
          [
            { transform: "translateY(-190px) rotate(-120deg) scale(0.6)", opacity: 0 },
            { transform: "translateY(12px) rotate(10deg) scale(1.06)", opacity: 1, offset: 0.7 },
            { transform: "translateY(-4px) rotate(-3deg) scale(0.99)", offset: 0.85 },
            { transform: "none" },
          ],
          { duration: 620, easing: EASE }
        );
        shadow.animate([{ transform: "scale(0.3)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 620, easing: EASE });
      }
    }

    function showResult(res) {
      const t = TYPES[res.type];
      if (res.type === "coin") {
        resultValue.textContent = res.value === "heads" ? "Heads" : "Tails";
        resultLabel.textContent = res.value === "heads" ? "หัว" : "ก้อย";
      } else {
        resultValue.textContent = res.value;
        resultLabel.textContent = res.type === "d20" && res.max ? "Natural 20!"
          : res.min ? "Critical fail" : res.max ? `Max ${t.en}!` : t.en;
      }
      felt.classList.toggle("is-max", !!res.max);
      felt.classList.toggle("is-min", !!res.min);
      if (!FX.reduceMotion) {
        resultValue.animate(
          [
            { transform: "scale(2.2)", opacity: 0, filter: "blur(6px)" },
            { transform: "scale(0.92)", opacity: 1, filter: "blur(0)", offset: 0.6 },
            { transform: "scale(1)" },
          ],
          { duration: 520, easing: EASE }
        );
      }
      if (res.max) {
        FX.burstFrom(slot, { count: 28, spread: 150, size: 9 });
      } else if (res.min) {
        FX.shake(root.querySelector(".dt-tray"), 7);
      } else if (res.type === "coin") {
        FX.burstFrom(slot, { count: 10, spread: 70, size: 6 });
      }
    }

    function roll() {
      if (!current || rolling) return;
      rolling = true;
      rollBtn.disabled = true;
      clearResult();
      const type = current;

      if (type === "coin") {
        const heads = Math.random() < 0.5;
        const turns = 1800 + (heads ? 0 : 180);
        const coin = slot.querySelector(".coin");
        coin.style.transform = `rotateY(${turns % 360}deg)`;
        const done = () => {
          rolling = false;
          rollBtn.disabled = false;
          const res = { type, value: heads ? "heads" : "tails" };
          showResult(res);
          onRoll?.(res);
        };
        if (FX.reduceMotion) return done();
        coin.animate(
          [
            { transform: "translateY(0) rotateY(0deg) scale(1)" },
            { transform: `translateY(-150px) rotateY(${turns / 2}deg) scale(1.35)`, offset: 0.45 },
            { transform: `translateY(6px) rotateY(${turns - 20}deg) scale(0.98)`, offset: 0.85 },
            { transform: `translateY(0) rotateY(${turns}deg) scale(1)` },
          ],
          { duration: 1300, easing: "cubic-bezier(0.33, 0.7, 0.4, 1)" }
        ).onfinish = done;
        shadow.animate(
          [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0.4)", opacity: 0.3, offset: 0.45 }, { transform: "scale(1)", opacity: 1 }],
          { duration: 1300, easing: "cubic-bezier(0.33, 0.7, 0.4, 1)" }
        );
        return;
      }

      const sides = TYPES[type].sides;
      const value = 1 + Math.floor(Math.random() * sides);
      const res = { type, value, max: value === sides, min: value === 1 };
      const DURATION = 1150;
      let flicker = null;
      const done = () => {
        clearTimeout(flicker);
        setFace(slot, type, value);
        rolling = false;
        rollBtn.disabled = false;
        showResult(res);
        onRoll?.(res);
      };
      if (FX.reduceMotion) return done();

      // หน้าลูกเต๋าเปลี่ยนเร็วตอนกลิ้งแรง แล้วช้าลงตามแรงที่หมด
      // และล็อกผลจริงตั้งแต่ ~38% ของเวลา (ช่วงนั้นลูกเต๋ายังหมุนอยู่ แต่ใกล้หยุดแล้ว
      // เพราะเส้นความเร็วแบบ ease-out ทำให้ลูกเต๋าเคลื่อนที่เกือบหมดตั้งแต่ครึ่งแรก)
      const LOCK_AT = DURATION * 0.38;
      let shown = value;
      let elapsed = 0;
      let gap = 50;
      const tumbleFace = () => {
        if (elapsed + gap >= LOCK_AT) {
          flicker = setTimeout(() => setFace(slot, type, value), LOCK_AT - elapsed);
          return;
        }
        flicker = setTimeout(() => {
          let next;
          do { next = 1 + Math.floor(Math.random() * sides); } while (next === shown);
          shown = next;
          setFace(slot, type, next);
          elapsed += gap;
          gap *= 1.25;
          tumbleFace();
        }, gap);
      };
      tumbleFace();

      const dir = Math.random() < 0.5 ? 1 : -1;
      const path = [
        [-140 * dir, -80, -620 * dir, 0.65],
        [80 * dir, 34, -260 * dir, 1.08],
        [-46 * dir, -22, -80 * dir, 0.97],
        [16 * dir, 8, 16 * dir, 1.02],
        [0, 0, 0, 1],
      ];
      const offsets = [0, 0.32, 0.58, 0.8, 1];
      slot.animate(
        path.map(([x, y, r, s], i) => ({ transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`, offset: offsets[i] })),
        { duration: DURATION, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }
      ).onfinish = done;
      shadow.animate(
        path.map(([x, y, , s], i) => ({ transform: `translate(${x}px, ${y * 0.3}px) scale(${s})`, opacity: 0.5 + 0.5 * (s > 1 ? 0.6 : 1), offset: offsets[i] })),
        { duration: DURATION, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }
      );
    }

    root.querySelector(".dt-rack").addEventListener("click", (e) => {
      const b = e.target.closest("[data-die]");
      if (b) pick(b.dataset.die);
    });
    slot.addEventListener("click", roll);
    rollBtn.addEventListener("click", roll);

    return { pick, roll };
  }

  return { mount, art };
})();
