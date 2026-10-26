// แบนเนอร์หัวเว็บที่ใช้ร่วมกันทุกหน้า
// ใช้: <header class="banner" id="banner" data-root="../" data-active="create"></header>
(function () {
  const el = document.getElementById("banner");
  if (!el) return;
  const root = el.dataset.root || "";
  const active = el.dataset.active;

  const TABS = [
    { id: "characters", href: "index.html", en: "Characters", th: "ตัวละคร" },
    { id: "create", href: "character-create/index.html", en: "Create", th: "สร้างตัวละคร" },
    { id: "rules", href: "rules/index.html", en: "Rules", th: "กฎและข้อมูล" },
  ];

  // โล่เหล็กกับดาบไขว้
  const EMBLEM = `
    <svg class="emblem" viewBox="0 0 64 64" width="52" height="52" aria-hidden="true">
      <defs>
        <linearGradient id="emb-blade" x1="0" x2="1">
          <stop offset="0" stop-color="#f1ead8"/><stop offset="1" stop-color="#9c978c"/>
        </linearGradient>
        <linearGradient id="emb-iron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8b8a85"/><stop offset=".55" stop-color="#5b5a57"/><stop offset="1" stop-color="#34332f"/>
        </linearGradient>
      </defs>
      <g class="emb-sword-l" stroke-linecap="round">
        <path d="M11 55 47 11" stroke="url(#emb-blade)" stroke-width="3.4"/>
        <path d="M9 45l10 10" stroke="#c99a43" stroke-width="3.2"/>
        <circle cx="8" cy="58" r="2.6" fill="#c99a43"/>
      </g>
      <g class="emb-sword-r" stroke-linecap="round">
        <path d="M53 55 17 11" stroke="url(#emb-blade)" stroke-width="3.4"/>
        <path d="M45 55l10-10" stroke="#c99a43" stroke-width="3.2"/>
        <circle cx="56" cy="58" r="2.6" fill="#c99a43"/>
      </g>
      <g class="emb-shield">
      <path d="M32 13c7 3.5 12 4 17 4v14c0 12-7.5 20-17 24-9.5-4-17-12-17-24V17c5 0 10-.5 17-4z"
        fill="url(#emb-iron)" stroke="#c99a43" stroke-width="2"/>
      <path d="M32 19c4.6 2.2 8 2.8 11.5 3v9.3c0 8.4-5 14-11.5 17-6.5-3-11.5-8.6-11.5-17V22c3.5-.2 6.9-.8 11.5-3z"
        fill="none" stroke="#2f2e2b" stroke-width="1.2" opacity=".7"/>
      <path d="M32 22v24M24 31h16" stroke="#c99a43" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="32" cy="31" r="3" fill="#e6c47a" stroke="#8f6424"/>
      </g>
    </svg>`;

  el.innerHTML = `
    <div class="banner-inner">
      <a class="brand" href="${root}index.html">
        ${EMBLEM}
        <span class="brand-title">
          <strong>Adventurer's Codex</strong>
          <span class="th" lang="th">ตำรานักผจญภัย</span>
        </span>
      </a>
      <nav aria-label="Main">
        <ul class="tabs">
          ${TABS.map((t, i) => `
            <li style="display:contents">
              <a class="tab" style="--i:${i}" href="${root}${t.href}" ${t.id === active ? 'aria-current="page"' : ""}>
                <span class="tab-en">${t.en}</span>
                <span class="tab-th" lang="th">${t.th}</span>
              </a>
            </li>`).join("")}
        </ul>
      </nav>
    </div>`;
})();
