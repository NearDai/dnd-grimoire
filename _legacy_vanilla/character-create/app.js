(function () {
  // ข้อมูลทั้งหมดมาจาก Excel ผ่าน tools/export_data.py
  const { skills, races, classes, abilities, alignments, settings } = window.DND_DATA;
  const FX = window.FX;
  const STANDARD_ARRAY = settings.standardArray;
  const MAX_REROLLS = settings.maxRerolls;
  const SKILL_LEVEL = settings.startingSkillLevel;
  const SKILL_COUNT = settings.startingSkillCount;
  const BASE_AC = settings.baseAc;
  const reduceMotion = FX.reduceMotion;
  const EASE_OUT = getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim() || "ease-out";

  const STEPS = [
    { id: "race", en: "Race", th: "เผ่าพันธุ์", hint: "เลือกเผ่าของตัวละคร" },
    { id: "class", en: "Class", th: "อาชีพ", hint: "เลือกอาชีพที่จะเดินตาม" },
    { id: "abilities", en: "Abilities", th: "ค่าสถานะ", hint: "ทอยลูกเต๋าหรือใช้ชุดมาตรฐาน" },
    { id: "skill", en: "Skill", th: "สกิลเริ่มต้น", hint: `เลือกสกิลปกติ LV${SKILL_LEVEL} ได้ ${SKILL_COUNT} อย่าง` },
    { id: "identity", en: "Identity", th: "ตัวตน", hint: "ตั้งชื่อแล้วบันทึกตัวละคร" },
  ];
  const NUMERALS = ["I", "II", "III", "IV", "V"];

  const state = {
    step: 0,
    raceId: null,
    classId: null,
    base: null, // ค่าสถานะก่อนบวกโบนัสเผ่า
    rollDetail: null, // ลูกเต๋า 4 ลูกของแต่ละค่าสถานะจากการทอยครั้งล่าสุด
    freshRoll: false,
    rerollsLeft: MAX_REROLLS,
    swapPick: null,
    skillIds: [], // เรียงตามลำดับที่เลือก
    skillQuery: "",
    name: "",
    alignment: "",
    backstory: "",
    saved: false,
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const view = $("#stepView");
  const stepper = $("#stepper");
  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");
  const stepHint = $("#stepHint");
  const sheet = $("#sheet");

  // สกิลเริ่มต้นเลือกได้เฉพาะสกิลปกติ (ชีต Normal Skills) ส่วนสกิลพิเศษปลดล็อกระหว่างเล่น
  const startingSkills = skills.filter((s) => s.tier === "normal" && s.level === SKILL_LEVEL);
  const race = () => races.find((r) => r.id === state.raceId);
  const klass = () => classes.find((c) => c.id === state.classId);
  const chosenSkills = () => state.skillIds.map((id) => skills.find((s) => s.id === id)).filter(Boolean);
  const alignment = () => alignments.find((a) => a.id === state.alignment);
  const modOf = (score) => Math.floor((score - 10) / 2);
  const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  }

  function finalScores() {
    if (!state.base) return null;
    const bonus = race() ? race().bonus : {};
    const out = {};
    abilities.forEach((a) => {
      out[a.id] = state.base[a.id] + (bonus[a.id] || 0);
    });
    return out;
  }

  function isStepDone(index) {
    switch (STEPS[index].id) {
      case "race": return !!state.raceId;
      case "class": return !!state.classId;
      case "abilities": return !!state.base;
      case "skill": return state.skillIds.length === SKILL_COUNT;
      case "identity": return state.name.trim().length > 0;
      default: return false;
    }
  }

  const canReach = (index) => STEPS.slice(0, index).every((_, i) => isStepDone(i));

  /* ---------- ลูกเต๋าค่าสถานะ ---------- */
  const d6 = () => 1 + Math.floor(Math.random() * 6);

  function roll4d6DropLowest() {
    const dice = [d6(), d6(), d6(), d6()].sort((a, b) => b - a);
    return { dice, total: dice[0] + dice[1] + dice[2] };
  }

  // เรียงชุดค่ามาตรฐานให้ค่าสูงสุดไปอยู่ที่ค่าสถานะหลักของอาชีพ
  function standardForClass() {
    const primary = klass() ? klass().primary : [];
    const order = [...primary, ...abilities.map((a) => a.id).filter((id) => !primary.includes(id))];
    const out = {};
    order.forEach((id, i) => { out[id] = STANDARD_ARRAY[i]; });
    return out;
  }

  /* ---------- ส่วนแสดงผลแต่ละขั้น ---------- */
  function stepHeading(en, th, lede) {
    return `
      <header class="step-head">
        <h3 class="step-title" tabindex="-1">${en} <span class="th" lang="th">${th}</span></h3>
        <p class="step-lede" lang="th">${lede}</p>
      </header>`;
  }

  function renderRace() {
    return `
      ${stepHeading("Choose a Race", "เลือกเผ่าพันธุ์", "เผ่าพันธุ์กำหนดรูปร่าง ความเร็ว และโบนัสค่าสถานะติดตัว")}
      <div class="choice-grid" role="radiogroup" aria-label="Race">
        ${races.map((r) => `
          <label class="choice">
            <input type="radio" name="race" value="${r.id}" ${state.raceId === r.id ? "checked" : ""}>
            <span class="choice-top">
              <span class="choice-name">${r.nameEn}</span>
              <span class="th" lang="th">${r.nameTh}</span>
            </span>
            <span class="choice-text" lang="th">${r.summary}</span>
            <span class="chips">
              ${Object.entries(r.bonus).map(([k, v]) => `<span class="chip">${k} ${signed(v)}</span>`).join("")}
              <span class="chip chip-quiet">${r.speed} ft</span>
            </span>
            <span class="choice-trait"><strong>${r.trait.en}</strong> <span lang="th">${r.trait.th}</span></span>
          </label>`).join("")}
      </div>`;
  }

  function renderClass() {
    return `
      ${stepHeading("Choose a Class", "เลือกอาชีพ", "อาชีพกำหนดลูกเต๋าพลังชีวิต ค่าสถานะที่ควรเน้น และสายสกิลขั้นสูงที่จะเปิดได้ในอนาคต")}
      <div class="choice-grid" role="radiogroup" aria-label="Class">
        ${classes.map((c) => {
          const unlocks = skills.filter((s) => s.classes.includes(c.id)).length;
          return `
          <label class="choice">
            <input type="radio" name="class" value="${c.id}" ${state.classId === c.id ? "checked" : ""}>
            <span class="choice-top">
              <span class="choice-name">${c.id}</span>
              <span class="th" lang="th">${c.nameTh}</span>
            </span>
            <span class="choice-role">${c.role}</span>
            <span class="choice-text" lang="th">${c.summary}</span>
            <span class="chips">
              <span class="chip">Hit Die d${c.hitDie}</span>
              ${c.primary.map((p) => `<span class="chip chip-quiet">${p}</span>`).join("")}
            </span>
            <span class="choice-trait" lang="th">${unlocks ? `ปลดล็อกสกิลเฉพาะอาชีพได้ ${unlocks} สกิล (LV2 ขึ้นไป)` : "ใช้สกิลทั่วไปได้ทุกสาย"}</span>
          </label>`;
        }).join("")}
      </div>`;
  }

  function renderAbilities() {
    const scores = finalScores();
    const bonus = race() ? race().bonus : {};
    const rows = abilities.map((a, ci) => {
      const base = state.base ? state.base[a.id] : null;
      const total = scores ? scores[a.id] : null;
      const plus = bonus[a.id] || 0;
      const picked = state.swapPick === a.id;
      const dice = state.rollDetail && state.rollDetail[a.id];
      return `
        <li>
          <button type="button" class="ability ${picked ? "is-picked" : ""}" data-ability="${a.id}" ${state.base ? "" : "disabled"}
            aria-pressed="${picked}" aria-label="${a.nameEn} ${total ?? ""}" style="--c:${ci}">
            <span class="ability-code">${a.id}</span>
            <span class="ability-score" data-score="${a.id}">${total ?? "—"}</span>
            <span class="ability-mod">${total === null ? "" : signed(modOf(total))}</span>
            <span class="ability-name">${a.nameEn}<span class="th" lang="th">${a.nameTh}</span></span>
            ${dice ? `<span class="mini-dice" aria-label="Rolled ${dice.join(", ")}, dropped ${dice[3]}">
              ${dice.map((d, i) => `<span class="mini-die ${i === 3 ? "is-dropped" : ""}" style="--d:${i}">${d}</span>`).join("")}
            </span>` : ""}
            <span class="ability-breakdown" lang="th">${base === null ? "ยังไม่ทอย" : `${base}${plus ? ` ${signed(plus)} จากเผ่า` : ""}`}</span>
          </button>
        </li>`;
    }).join("");

    return `
      ${stepHeading("Ability Scores", "ค่าสถานะ", `ทอย 4d6 ตัดลูกต่ำสุดทิ้ง ${abilities.length} ครั้ง หรือใช้ชุดมาตรฐาน ${STANDARD_ARRAY.join(", ")} ที่จัดตามอาชีพให้`)}
      <div class="dice-bar">
        <button type="button" class="btn btn-gold" id="rollBtn" ${state.rerollsLeft <= 0 ? "disabled" : ""}>
          ${state.base && state.rollDetail ? "Reroll Abilities" : "Roll Abilities"}
        </button>
        <span class="dice-count" lang="th">ทอยใหม่ได้อีก ${state.rerollsLeft} ครั้ง</span>
        <button type="button" class="btn btn-ink" id="standardBtn">Standard Array</button>
      </div>
      <ul class="ability-grid ${state.freshRoll ? "is-fresh" : ""}">${rows}</ul>
      <p class="step-note" lang="th">${state.base
        ? "แตะค่าสถานะสองช่องเพื่อสลับค่ากัน"
        : "ค่าสถานะจะแสดงหลังทอยลูกเต๋า"}</p>`;
  }

  function renderSkill() {
    const q = state.skillQuery.trim().toLowerCase();
    const allowed = startingSkills.filter((s) => s.classes.includes("All") || s.classes.includes(state.classId));
    const list = q
      ? allowed.filter((s) => `${s.nameTh} ${s.nameEn} ${s.effect}`.toLowerCase().includes(q))
      : allowed;

    const full = state.skillIds.length >= SKILL_COUNT;

    return `
      ${stepHeading("Starting Skills", "สกิลเริ่มต้น", `ทุกนักผจญภัยมีพรสวรรค์ติดตัว ${SKILL_COUNT} อย่าง เลือกจากสกิลปกติ LV${SKILL_LEVEL} ทั้งหมด ${allowed.length} สกิล (สกิลพิเศษปลดล็อกระหว่างการผจญภัย)`)}
      <p class="skill-count" id="skillCount" aria-live="polite">Chosen <b>${state.skillIds.length}</b> / ${SKILL_COUNT} <span class="th" lang="th">เลือกแล้ว</span></p>
      <label class="search">
        <span class="sr-only">Search skills</span>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
        <input type="search" id="skillSearch" placeholder="Search skills (ค้นหาสกิล)" value="${escapeHtml(state.skillQuery)}" autocomplete="off">
      </label>
      <div class="skill-list${full ? " is-full" : ""}" role="group" aria-label="Starting skills">
        ${list.length ? list.map((s) => `
          <label class="skill">
            <input type="checkbox" name="skill" value="${s.id}" ${state.skillIds.includes(s.id) ? "checked" : full ? "disabled" : ""}>
            <span class="skill-head">
              <span class="skill-name">${s.nameEn}</span>
              <span class="skill-lv">LV${s.level}</span>
            </span>
            <span class="th skill-th" lang="th">${s.nameTh}</span>
            <span class="skill-effect" lang="th">${s.effect}</span>
            ${s.note ? `<span class="skill-note" lang="th">${s.note}</span>` : ""}
          </label>`).join("") : `<p class="empty" lang="th">ไม่พบสกิลที่ตรงกับ “${escapeHtml(state.skillQuery)}” ลองค้นด้วยคำอื่น</p>`}
      </div>`;
  }

  function renderIdentity() {
    if (state.saved) {
      return `
        <div class="done">
          ${stepHeading("Character Sealed", "บันทึกเรียบร้อย", `${escapeHtml(state.name)} ถูกบันทึกลงตำราแล้ว พร้อมออกเดินทางเมื่อเรื่องราวแรกเปิดให้เล่น`)}
          <div class="done-actions">
            <a class="btn btn-gold" href="../index.html">View Characters</a>
            <button type="button" class="btn btn-ink" id="newBtn">Create Another</button>
          </div>
        </div>`;
    }
    return `
      ${stepHeading("Identity", "ตัวตน", "ต้องมีชื่อ ส่วนแนวทางและประวัติจะเว้นไว้ก่อนก็ได้")}
      <div class="form">
        <label class="field">
          <span class="field-label">Name <span class="th" lang="th">ชื่อตัวละคร</span></span>
          <input type="text" id="nameInput" maxlength="40" value="${escapeHtml(state.name)}" placeholder="e.g. Aren the Wanderer" autocomplete="off">
        </label>
        <fieldset class="field">
          <legend class="field-label">Alignment <span class="th" lang="th">แนวทาง</span></legend>
          <div class="align-grid">
            ${alignments.map((a) => `
              <label class="align">
                <input type="radio" name="alignment" value="${a.id}" ${state.alignment === a.id ? "checked" : ""}>
                <span class="align-en">${a.en}</span>
                <span class="align-th" lang="th">${a.th}</span>
              </label>`).join("")}
          </div>
        </fieldset>
        <label class="field">
          <span class="field-label">Backstory <span class="th" lang="th">ประวัติโดยย่อ</span></span>
          <textarea id="backstoryInput" rows="4" maxlength="600" lang="th" placeholder="มาจากไหน ทำไมจึงออกผจญภัย">${escapeHtml(state.backstory)}</textarea>
        </label>
      </div>`;
  }

  const RENDERERS = { race: renderRace, class: renderClass, abilities: renderAbilities, skill: renderSkill, identity: renderIdentity };

  /* ---------- การวาดหน้า ---------- */
  function renderStepper() {
    stepper.innerHTML = STEPS.map((s, i) => {
      const current = i === state.step && !state.saved;
      const done = (isStepDone(i) && !current) || state.saved;
      return `
        <li>
          <button type="button" class="step ${current ? "is-current" : ""} ${done ? "is-done" : ""}" data-step="${i}"
            ${current ? 'aria-current="step"' : ""} ${canReach(i) && !state.saved ? "" : "disabled"}>
            <span class="step-num" aria-hidden="true">${NUMERALS[i]}</span>
            <span class="step-name">${s.en}</span>
            <span class="step-th" lang="th">${s.th}</span>
          </button>
        </li>`;
    }).join("");
  }

  function renderNav() {
    const last = state.step === STEPS.length - 1;
    prevBtn.hidden = state.saved;
    nextBtn.hidden = state.saved;
    prevBtn.disabled = state.step === 0;
    nextBtn.disabled = !isStepDone(state.step);
    nextBtn.textContent = last ? "Seal Character" : "Continue";
    stepHint.textContent = state.saved ? "" : STEPS[state.step].hint;
  }

  // enter = เพิ่งเข้าขั้นนี้ (ให้การ์ดไหลเข้ามาทีละใบ)
  function renderStep(direction = 0, enter = false) {
    view.innerHTML = RENDERERS[STEPS[state.step].id]();
    renderStepper();
    renderNav();
    if (!enter && !direction) return;
    FX.stagger(view, ".choice, .skill, .ability, .align, .field, .dice-bar, .search, .done-actions");
    if (direction && !reduceMotion) {
      // หน้ากระดาษถูกเขียนใหม่: ปาดจากด้านที่กำลังไป
      const from = direction > 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
      view.animate(
        [
          { clipPath: from, opacity: 0.4, filter: "blur(3px)" },
          { clipPath: "inset(0 0 0 0)", opacity: 1, filter: "blur(0)" },
        ],
        { duration: 460, easing: EASE_OUT }
      );
      stepper.querySelector(".is-current .step-num")?.animate(
        [{ transform: "scale(1.8) rotate(-12deg)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }],
        { duration: 480, easing: EASE_OUT }
      );
    }
  }

  // เขียนค่าลงแผ่นตัวละคร — ค่าที่เปลี่ยนจะเรืองทองขึ้นมา (quiet = เปลี่ยนเงียบๆ ระหว่างพิมพ์)
  function ink(field, text, quiet = false) {
    const el = sheet.querySelector(`[data-field="${field}"]`);
    if (!el || el.textContent === text) return false;
    el.textContent = text;
    if (quiet) return true;
    el.classList.remove("is-updated");
    void el.offsetWidth; // รีสตาร์ทแอนิเมชัน
    el.classList.add("is-updated");
    return true;
  }

  function renderSheet(typing = false) {
    const r = race();
    const c = klass();
    const picked = chosenSkills();
    const al = alignment();
    const scores = finalScores();

    if (ink("monogram", c ? c.id[0] : r ? r.nameEn[0] : "?") && !reduceMotion) {
      // กรอบภาพหมุนเผยตราใหม่
      $(".portrait").animate(
        [{ transform: "rotateY(90deg) scale(0.9)" }, { transform: "rotateY(-10deg) scale(1.05)", offset: 0.7 }, { transform: "none" }],
        { duration: 560, easing: EASE_OUT }
      );
    }
    $(".portrait").classList.toggle("is-lit", !!c);
    ink("classTag", c ? c.role : "—");
    ink("name", state.name.trim() || "Unnamed Hero", typing);
    ink("lineage", r || c ? [r && r.nameEn, c && c.id].filter(Boolean).join(" ") : "Choose a race and class");
    ink("alignment", al ? al.en : "");
    ink("speed", r ? `${r.speed} ft` : "—");
    ink("hp", c && scores ? String(Math.max(1, c.hitDie + modOf(scores.CON))) : "—");
    ink("ac", scores ? String(BASE_AC + modOf(scores.DEX)) : "—");
    const slots = $("#sheetSkills");
    if (!slots.children.length) {
      slots.innerHTML = Array.from({ length: SKILL_COUNT }, (_, i) => `
        <li class="sheet-skill-slot">
          <span class="sheet-skill-name" data-field="skill-${i}">Empty slot</span>
          <span class="sheet-skill-th th" lang="th" data-field="skillTh-${i}"></span>
        </li>`).join("");
    }
    for (let i = 0; i < SKILL_COUNT; i++) {
      const s = picked[i];
      ink(`skill-${i}`, s ? s.nameEn : "Empty slot");
      ink(`skillTh-${i}`, s ? s.nameTh : "");
      slots.children[i].classList.toggle("is-empty", !s);
    }

    const list = $("#sheetAbilities");
    if (!list.children.length) {
      list.innerHTML = abilities.map((a) => `
        <li class="plate plate-stat">
          <span class="plate-label">${a.id}</span>
          <span class="plate-value" data-field="score-${a.id}">—</span>
          <span class="plate-mod" data-field="mod-${a.id}"></span>
        </li>`).join("");
    }
    abilities.forEach((a) => {
      ink(`score-${a.id}`, scores ? String(scores[a.id]) : "—");
      ink(`mod-${a.id}`, scores ? signed(modOf(scores[a.id])) : "");
    });
  }

  function update(direction = 0, enter = false) {
    renderStep(direction, enter);
    renderSheet();
  }

  function goTo(index) {
    if (index < 0 || index >= STEPS.length || index === state.step || !canReach(index)) return;
    const direction = index > state.step ? 1 : -1;
    state.step = index;
    state.swapPick = null;
    update(direction);
    view.querySelector(".step-title")?.focus({ preventScroll: true });
    if (window.innerWidth < 1200) $(".stage").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---------- ค่าสถานะ ---------- */
  function rollAbilities() {
    if (state.rerollsLeft <= 0) return;
    const hadRolled = !!state.rollDetail;
    const results = {};
    abilities.forEach((a) => { results[a.id] = roll4d6DropLowest(); });
    if (hadRolled) state.rerollsLeft -= 1;
    state.swapPick = null;

    const finish = () => {
      state.base = {};
      state.rollDetail = {};
      abilities.forEach((a) => {
        state.base[a.id] = results[a.id].total;
        state.rollDetail[a.id] = results[a.id].dice;
      });
      state.freshRoll = true;
      update();
      state.freshRoll = false;
      if (reduceMotion) return;
      // ผลรวมเด้งขึ้นหลังลูกเต๋าของการ์ดนั้นวางครบ
      view.querySelectorAll(".ability-score").forEach((cell, i) => {
        cell.animate(
          [{ transform: "scale(1.5)", color: "#8e2c20", opacity: 0 }, { transform: "scale(1)", opacity: 1 }],
          { duration: 420, delay: 420 + i * 90, easing: EASE_OUT, fill: "backwards" }
        );
      });
      // ค่าที่สูงที่สุดได้ประกายทอง
      const best = Math.max(...abilities.map((a) => results[a.id].total));
      if (best >= 16) {
        const top = abilities.find((a) => results[a.id].total === best);
        const i = abilities.indexOf(top);
        setTimeout(() => FX.burstFrom(view.querySelector(`[data-ability="${top.id}"]`), { count: 18, spread: 90 }), 760 + i * 90);
      }
    };
    if (reduceMotion) return finish();

    $("#rollBtn").disabled = true;
    view.querySelectorAll(".ability").forEach((el) => el.classList.add("is-rolling"));
    const cells = abilities.map((a) => view.querySelector(`[data-score="${a.id}"]`));
    const timer = setInterval(() => {
      cells.forEach((cell) => { cell.textContent = 3 + Math.floor(Math.random() * 16); });
    }, 55);
    setTimeout(() => {
      clearInterval(timer);
      finish();
    }, 650);
  }

  function swapAbility(id) {
    if (!state.base) return;
    if (!state.swapPick) {
      state.swapPick = id;
    } else if (state.swapPick === id) {
      state.swapPick = null;
    } else {
      const a = state.swapPick;
      [state.base[a], state.base[id]] = [state.base[id], state.base[a]];
      if (state.rollDetail) [state.rollDetail[a], state.rollDetail[id]] = [state.rollDetail[id], state.rollDetail[a]];
      state.swapPick = null;
    }
    update();
    view.querySelector(`[data-ability="${id}"]`)?.focus();
  }

  /* ---------- บันทึก ---------- */
  function buildCharacter() {
    const r = race();
    const c = klass();
    const scores = finalScores();
    return {
      id: `c-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      name: state.name.trim(),
      race: r.id,
      class: c.id,
      alignment: state.alignment,
      backstory: state.backstory.trim(),
      level: SKILL_LEVEL,
      abilities: scores,
      hp: Math.max(1, c.hitDie + modOf(scores.CON)),
      ac: BASE_AC + modOf(scores.DEX),
      speed: r.speed,
      skills: [...state.skillIds],
    };
  }

  function stampSeal() {
    const seal = $("#seal");
    seal.classList.remove("is-stamped");
    void seal.offsetWidth;
    seal.classList.add("is-stamped");
    // จังหวะที่ตรากระแทกกระดาษ
    setTimeout(() => {
      FX.shake($(".sheet"), 5);
      FX.burstFrom(seal, { count: 26, spread: 140, size: 8, colors: ["#e6c47a", "#c99a43", "#8e2c20", "#fff1c4"] });
    }, 300);
  }

  function commit() {
    const character = buildCharacter();
    if (!window.DND_STORE.save(character)) {
      stepHint.textContent = "บันทึกไม่สำเร็จ เบราว์เซอร์ปิดการเก็บข้อมูลไว้ ลองเปิดหน้านี้นอกโหมดส่วนตัว";
      return;
    }
    state.saved = true;
    stampSeal();
    update(1);
  }

  function reset() {
    Object.assign(state, {
      step: 0, raceId: null, classId: null, base: null, rollDetail: null, freshRoll: false, rerollsLeft: MAX_REROLLS,
      swapPick: null, skillIds: [], skillQuery: "", name: "", alignment: "", backstory: "", saved: false,
    });
    $("#seal").classList.remove("is-stamped");
    update(-1);
  }

  // การ์ดที่ถูกเลือก: แสงทองวิ่งผ่าน + ประกายจากตราถูก
  function celebrate(label) {
    if (!label || reduceMotion) return;
    label.classList.remove("is-shine");
    void label.offsetWidth;
    label.classList.add("is-shine");
    const r = label.getBoundingClientRect();
    FX.burst(r.right - 21, r.top + 21, { count: 10, spread: 46, size: 5 });
  }

  /* ---------- เหตุการณ์ ---------- */
  view.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "race") state.raceId = t.value;
    else if (t.name === "class") state.classId = t.value;
    else if (t.name === "skill") return toggleSkill(t);
    else if (t.name === "alignment") state.alignment = t.value;
    else return;
    if (t.name !== "alignment") celebrate(t.closest("label"));
    renderStepper();
    renderNav();
    renderSheet();
  });

  // เลือกครบแล้วช่องที่เหลือถูกปิดไว้ ต้องเอาออกก่อนถึงเลือกใหม่ได้
  function toggleSkill(input) {
    const ids = state.skillIds;
    if (input.checked && ids.length < SKILL_COUNT) ids.push(input.value);
    else if (!input.checked) ids.splice(ids.indexOf(input.value), 1);
    const full = ids.length >= SKILL_COUNT;
    const list = view.querySelector(".skill-list");
    list.classList.toggle("is-full", full);
    list.querySelectorAll("input[name=skill]").forEach((el) => { el.disabled = full && !el.checked; });
    $("#skillCount b").textContent = ids.length;
    if (input.checked) celebrate(input.closest("label"));
    renderStepper();
    renderNav();
    renderSheet();
  }

  view.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "nameInput") state.name = t.value;
    else if (t.id === "backstoryInput") state.backstory = t.value;
    else if (t.id === "skillSearch") {
      state.skillQuery = t.value;
      const caret = t.selectionStart;
      renderStep();
      const input = $("#skillSearch");
      input.focus();
      input.setSelectionRange(caret, caret);
      return;
    } else return;
    renderStepper();
    renderNav();
    renderSheet(true);
  });

  view.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.id === "rollBtn") rollAbilities();
    else if (t.id === "standardBtn") {
      state.base = standardForClass();
      state.rollDetail = null;
      state.swapPick = null;
      update();
      FX.stagger(view, ".ability");
    } else if (t.id === "newBtn") reset();
    else if (t.dataset.ability) swapAbility(t.dataset.ability);
  });

  stepper.addEventListener("click", (e) => {
    const t = e.target.closest("[data-step]");
    if (t) goTo(Number(t.dataset.step));
  });

  prevBtn.addEventListener("click", () => goTo(state.step - 1));
  nextBtn.addEventListener("click", () => {
    if (!isStepDone(state.step)) return;
    if (state.step === STEPS.length - 1) commit();
    else goTo(state.step + 1);
  });

  view.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.id === "nameInput" && isStepDone(state.step)) commit();
  });

  window.DiceTray.mount($("#diceTray"));
  // รอบแรกรอให้แผงกระดาษคลี่เสร็จก่อนการ์ดจะไหลเข้ามา
  view.style.setProperty("--fx-base", "750ms");
  update(0, true);
  setTimeout(() => view.style.removeProperty("--fx-base"), 1500);
})();
