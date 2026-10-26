import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { abilities, alignments, classes, howTo, races, settings, skills, type SkillTier } from "../data";
import ClassIcon from "../components/ClassIcon";
import HowToPlay from "./HowToPlay";
import { ChapterHeading } from "../components/Chapter";
import { reduceMotion } from "../lib/fx";
import { signed } from "../lib/rules";
import { onTabKeys } from "../lib/tabs";
import "./RulesPage.css";

const CHAPTERS = [
  { id: "howto", en: "How to play", th: "วิธีเล่น" },
  { id: "races", en: "Races", th: "เผ่าพันธุ์" },
  { id: "classes", en: "Classes", th: "อาชีพ" },
  { id: "abilities", en: "Abilities", th: "ค่าสถานะและกฎ" },
  { id: "skills", en: "Skills", th: "สกิล" },
] as const;

const TIERS: { id: SkillTier; en: string; th: string }[] = [
  { id: "normal", en: "Normal", th: "สกิลปกติ" },
  { id: "special", en: "Special", th: "สกิลพิเศษ" },
];

// "STR +2, DEX +1" หรือ "All +1" เมื่อทุกค่าได้เท่ากัน
function bonusText(bonus: Record<string, number>) {
  const values = abilities.map((a) => bonus[a.id] ?? 0);
  if (values.every((v) => v === values[0] && v !== 0)) return [`All ${signed(values[0])}`];
  return Object.entries(bonus).map(([k, v]) => `${k} ${signed(v)}`);
}

function Races() {
  return (
    <>
      <ChapterHeading en="Races" th="เผ่าพันธุ์">
        โบนัสค่าสถานะ ความเร็ว และพรสวรรค์ติดตัวของแต่ละเผ่า
      </ChapterHeading>
      <div className="entries">
        {races.map((r) => (
          <article key={r.id} className="entry entry-static">
            <span className="entry-head">
              <span className="entry-name">{r.nameEn}</span>
              <span className="th" lang="th">
                {r.nameTh}
              </span>
            </span>
            <span className="entry-text" lang="th">
              {r.summary}
            </span>
            <span className="entry-facts">
              {bonusText(r.bonus).map((b) => (
                <span key={b} className="fact">
                  {b}
                </span>
              ))}
              <span className="fact fact-quiet">{r.speed} ft</span>
            </span>
            <span className="entry-trait">
              <strong>{r.trait.en}</strong> <span lang="th">{r.trait.th}</span>
            </span>
          </article>
        ))}
      </div>
    </>
  );
}

function Classes() {
  return (
    <>
      <ChapterHeading en="Classes" th="อาชีพ">
        ลูกเต๋าพลังชีวิตและค่าสถานะหลักของแต่ละอาชีพ
      </ChapterHeading>
      <div className="entries">
        {classes.map((c) => (
          <article key={c.id} className="entry entry-static">
            <span className="entry-head">
              <ClassIcon id={c.id} className="rules-class-icon" />
              <span className="entry-name">{c.id}</span>
              <span className="th" lang="th">
                {c.nameTh}
              </span>
              <span className="entry-role">{c.role}</span>
            </span>
            <span className="entry-text" lang="th">
              {c.summary}
            </span>
            <span className="entry-facts">
              <span className="fact">Hit die d{c.hitDie}</span>
              {bonusText(c.bonus).map((b) => (
                <span key={b} className="fact fact-quiet">
                  {b}
                </span>
              ))}
            </span>
          </article>
        ))}
      </div>
    </>
  );
}

function Abilities() {
  return (
    <>
      <ChapterHeading en="Abilities" th="ค่าสถานะและกฎ">
        ค่าสถานะหกด้าน และวิธีคำนวณค่าต่างๆ บนแผ่นตัวละคร
      </ChapterHeading>
      <ul className="ability-list">
        {abilities.map((a) => (
          <li key={a.id}>
            <b>{a.id}</b>
            <span>
              {a.nameEn}{" "}
              <span className="th" lang="th">
                {a.nameTh}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <dl className="rule-list" lang="th">
        <div>
          <dt>Modifier</dt>
          <dd>(ค่าสถานะ − 10) ÷ 2 ปัดลง เช่น 14 ได้ +2, 9 ได้ −1</dd>
        </div>
        <div>
          <dt>HP</dt>
          <dd>Hit die ของอาชีพ + CON modifier (อย่างน้อย 1)</dd>
        </div>
        <div>
          <dt>AC</dt>
          <dd>{settings.baseAc} + DEX modifier</dd>
        </div>
        <div>
          <dt>Rolling</dt>
          <dd>
            ทอย 4d6 ตัดลูกต่ำสุดทิ้ง ทอยใหม่ได้ {settings.maxRerolls} ครั้ง หรือใช้ชุดมาตรฐาน {settings.standardArray.join(", ")}
          </dd>
        </div>
        <div>
          <dt>Starting skills</dt>
          <dd>
            เลือกสกิลปกติ LV{settings.startingSkillLevel} ได้ {settings.startingSkillCount} อย่างตอนสร้างตัวละคร สกิลพิเศษเลือกตอนเริ่มไม่ได้
          </dd>
        </div>
        <div>
          <dt>Alignment</dt>
          <dd>{alignments.map((a) => `${a.en} (${a.th})`).join(", ")}</dd>
        </div>
      </dl>
    </>
  );
}

function Skills() {
  const [tier, setTier] = useState<SkillTier>("normal");
  const [level, setLevel] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const inTier = skills.filter((s) => s.tier === tier);
  const levels = [...new Set(inTier.map((s) => s.level))].sort((a, b) => a - b);
  const lv = level !== null && levels.includes(level) ? level : levels[0];
  const q = query.trim().toLowerCase();
  const list = inTier.filter((s) => s.level === lv && (!q || `${s.nameEn} ${s.nameTh} ${s.effect}`.toLowerCase().includes(q)));

  return (
    <>
      <ChapterHeading en="Skills" th="สกิล">
        สกิลปกติใช้ได้ทุกคนและเลือกเป็นสกิลเริ่มต้นได้ ส่วนสกิลพิเศษปลดล็อกระหว่างการผจญภัย บางสกิลจำกัดอาชีพ
      </ChapterHeading>

      <div className="tabs" role="tablist" aria-label="Skill type" onKeyDown={onTabKeys}>
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={`tab tab-${t.id}`}
            aria-selected={tier === t.id}
            tabIndex={tier === t.id ? 0 : -1}
            onClick={() => setTier(t.id)}
          >
            {t.en} <span className="th" lang="th">{t.th}</span>
            <span className="tab-count">{skills.filter((s) => s.tier === t.id).length}</span>
          </button>
        ))}
      </div>

      <div className="skill-filter">
        <div className="tabs tabs-small" role="tablist" aria-label="Skill level" onKeyDown={onTabKeys}>
          {levels.map((l) => (
            <button key={l} type="button" role="tab" className="tab" aria-selected={lv === l} tabIndex={lv === l ? 0 : -1} onClick={() => setLevel(l)}>
              LV{l}
              <span className="tab-count">{inTier.filter((s) => s.level === l).length}</span>
            </button>
          ))}
        </div>
        <label className="search">
          <span className="sr-only">Search skills</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input type="search" placeholder="Search skills (ค้นหาสกิล)" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
        </label>
      </div>

      <div className="entries">
        {list.length ? (
          list.map((s) => (
            <article key={s.id} className={`entry entry-static ${s.tier === "special" ? "is-special" : ""}`}>
              <span className="entry-head">
                <span className="entry-name">{s.nameEn}</span>
                <span className="th" lang="th">
                  {s.nameTh}
                </span>
              </span>
              <span className="entry-text" lang="th">
                {s.effect}
              </span>
              {s.note && (
                <span className="entry-note" lang="th">
                  {s.note}
                </span>
              )}
              <span className="entry-facts">
                <span className="fact fact-quiet">{s.classes.join(", ")}</span>
                {s.requires.length > 0 && <span className="fact">Requires {s.requires.join(", ")}</span>}
              </span>
            </article>
          ))
        ) : (
          <p className="empty" lang="th">
            ไม่พบสกิลที่ตรงกับ “{query}”
          </p>
        )}
      </div>
    </>
  );
}

const PAGES = [HowToPlay, Races, Classes, Abilities, Skills];

const countOf = (id: (typeof CHAPTERS)[number]["id"]) =>
  id === "howto" ? howTo.length : id === "races" ? races.length : id === "classes" ? classes.length : id === "abilities" ? abilities.length : skills.length;

export default function RulesPage() {
  // หมวดที่เปิดอยู่เก็บใน URL (?section=skills) รีเฟรชหรือส่งลิงก์ต่อแล้วเปิดหมวดเดิม
  const [params, setParams] = useSearchParams();
  const chapter = Math.max(0, CHAPTERS.findIndex((c) => c.id === params.get("section")));
  const setChapter = (i: number) => setParams(i ? { section: CHAPTERS[i].id } : {}, { replace: true });
  const Page = PAGES[chapter];

  return (
    <motion.main
      className="rules-page"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <h1 className="sr-only">Rules</h1>
      <div className="tabs rules-tabs" role="tablist" aria-label="Rule sections" onKeyDown={onTabKeys}>
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            id={`rules-tab-${c.id}`}
            aria-controls="rules-panel"
            className="tab"
            aria-selected={i === chapter}
            tabIndex={i === chapter ? 0 : -1}
            onClick={() => setChapter(i)}
          >
            {c.en} <span className="th" lang="th">{c.th}</span>
            <span className="tab-count">{countOf(c.id)}</span>
          </button>
        ))}
      </div>

      <section className="rules-body parchment frame" id="rules-panel" role="tabpanel" aria-labelledby={`rules-tab-${CHAPTERS[chapter].id}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={chapter}
            className="stage-enter"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <Page />
          </motion.div>
        </AnimatePresence>
      </section>
    </motion.main>
  );
}
