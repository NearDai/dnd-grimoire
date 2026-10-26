// หน้ากฎ — ทุกตารางสร้างจากข้อมูล Excel (data/gamedata.js, data/skills.js)
(function () {
  const { skills, races, classes, abilities, alignments, settings } = window.DND_DATA;
  const $ = (sel) => document.querySelector(sel);
  const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nameCell = (en, th) => `<span class="cell-en">${en}</span><span class="th" lang="th">${th}</span>`;

  // ถ้าได้โบนัสเท่ากันทุกค่าสถานะ (เช่น Human) แสดงเป็นบรรทัดเดียว
  function bonusText(bonus) {
    const values = abilities.map((a) => bonus[a.id] || 0);
    if (values[0] && values.every((v) => v === values[0])) return `All ${signed(values[0])}`;
    return abilities.filter((a) => bonus[a.id]).map((a) => `${a.id} ${signed(bonus[a.id])}`).join("<br>");
  }

  $("#raceTable").innerHTML = `
    <thead><tr><th>Race</th><th>Bonus</th><th>Speed</th><th>Trait</th><th lang="th">คำอธิบาย</th></tr></thead>
    <tbody>${races.map((r) => `
      <tr>
        <td>${nameCell(r.nameEn, r.nameTh)}</td>
        <td class="nowrap">${bonusText(r.bonus)}</td>
        <td class="nowrap">${r.speed} ft</td>
        <td><strong>${r.trait.en}</strong><br><span lang="th">${r.trait.th}</span></td>
        <td lang="th">${r.summary}</td>
      </tr>`).join("")}</tbody>`;

  $("#classTable").innerHTML = `
    <thead><tr><th>Class</th><th>Role</th><th>Hit Die</th><th>Primary</th><th lang="th">คำอธิบาย</th></tr></thead>
    <tbody>${classes.map((c) => `
      <tr>
        <td>${nameCell(c.id, c.nameTh)}</td>
        <td>${c.role}</td>
        <td class="nowrap">d${c.hitDie}</td>
        <td class="nowrap">${c.primary.join(", ")}</td>
        <td lang="th">${c.summary}</td>
      </tr>`).join("")}</tbody>`;

  $("#abilityInfo").innerHTML = `
    <ul class="ability-list">
      ${abilities.map((a) => `<li><b>${a.id}</b>${nameCell(a.nameEn, a.nameTh)}</li>`).join("")}
    </ul>
    <div class="flourish" aria-hidden="true"></div>
    <dl class="rule-list" lang="th">
      <div><dt>Modifier</dt><dd>(ค่าสถานะ − 10) ÷ 2 ปัดลง เช่น 14 ได้ +2, 9 ได้ −1</dd></div>
      <div><dt>HP</dt><dd>Hit Die ของอาชีพ + CON modifier (อย่างน้อย 1)</dd></div>
      <div><dt>AC</dt><dd>${settings.baseAc} + DEX modifier</dd></div>
      <div><dt>Rolling</dt><dd>ทอย 4d6 ตัดลูกต่ำสุดทิ้ง ทอยใหม่ได้ ${settings.maxRerolls} ครั้ง หรือใช้ชุดมาตรฐาน ${settings.standardArray.join(", ")}</dd></div>
      <div><dt>Starting Skill</dt><dd>เลือกสกิลปกติ LV${settings.startingSkillLevel} ได้ ${settings.startingSkillCount} อย่างตอนสร้างตัวละคร สกิลพิเศษเลือกตอนเริ่มไม่ได้</dd></div>
      <div><dt>Alignment</dt><dd>${alignments.map((a) => `${a.en} (${a.th})`).join(", ")}</dd></div>
    </dl>`;

  /* ---------- ตารางสกิล กรองตามประเภท เลเวล และคำค้น ---------- */
  const TIERS = [
    { id: "normal", en: "Normal", th: "สกิลปกติ" },
    { id: "special", en: "Special", th: "สกิลพิเศษ" },
  ];
  let tier = TIERS[0].id;
  let level = null;
  let query = "";

  const tierTabs = $("#tierTabs");
  tierTabs.innerHTML = TIERS.map((t) => `
    <button type="button" role="tab" class="level-tab" data-tier="${t.id}">${t.en} <span class="th" lang="th">${t.th}</span>
      <span class="count">${skills.filter((s) => s.tier === t.id).length}</span>
    </button>`).join("");

  const tabs = $("#levelTabs");
  function renderLevelTabs() {
    const inTier = skills.filter((s) => s.tier === tier);
    const levels = [...new Set(inTier.map((s) => s.level))].sort((a, b) => a - b);
    if (!levels.includes(level)) level = levels[0];
    tabs.innerHTML = levels.map((lv) => `
      <button type="button" role="tab" class="level-tab" data-level="${lv}">LV${lv}
        <span class="count">${inTier.filter((s) => s.level === lv).length}</span>
      </button>`).join("");
  }

  function renderSkills() {
    tierTabs.querySelectorAll(".level-tab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tier === tier)));
    tabs.querySelectorAll(".level-tab").forEach((b) => b.setAttribute("aria-selected", String(Number(b.dataset.level) === level)));
    const q = query.trim().toLowerCase();
    const list = skills.filter((s) => s.tier === tier && s.level === level &&
      (!q || `${s.nameEn} ${s.nameTh} ${s.effect}`.toLowerCase().includes(q)));
    $("#skillTable").innerHTML = `
      <thead><tr><th>Skill</th><th lang="th">ผล</th><th lang="th">ข้อจำกัด</th><th>Requires</th><th>Classes</th></tr></thead>
      <tbody>${list.length ? list.map((s) => `
        <tr>
          <td>${nameCell(s.nameEn, s.nameTh)}</td>
          <td lang="th">${s.effect}</td>
          <td lang="th" class="muted">${s.note || "—"}</td>
          <td class="muted">${s.requires.join(", ") || "—"}</td>
          <td class="muted">${s.classes.join(", ")}</td>
        </tr>`).join("") : `<tr><td colspan="5" class="muted" lang="th">ไม่พบสกิลที่ตรงกับ “${esc(query)}”</td></tr>`}</tbody>`;
  }

  tierTabs.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tier]");
    if (!b) return;
    tier = b.dataset.tier;
    renderLevelTabs();
    renderSkills();
    window.FX.stagger($("#skillTable tbody"), "tr");
  });

  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("[data-level]");
    if (!b) return;
    level = Number(b.dataset.level);
    renderSkills();
    window.FX.stagger($("#skillTable tbody"), "tr");
  });

  $("#skillSearch").addEventListener("input", (e) => {
    query = e.target.value;
    renderSkills();
  });

  renderLevelTabs();
  renderSkills();

  // ปุ่มสารบัญและแถวตารางไหลเข้ามา
  const toc = document.querySelector(".toc");
  toc.style.setProperty("--fx-base", "450ms");
  window.FX.stagger(toc, "a");
  document.querySelectorAll("#raceTable tbody, #classTable tbody").forEach((tb) => {
    tb.style.setProperty("--fx-base", "800ms");
    window.FX.stagger(tb, "tr");
  });
})();
