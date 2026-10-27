import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { abilities, classSkillsOf, classes, levelsOf, settings, skills, type ClassLevel, type Klass } from "../data";
import ClassIcon from "../components/ClassIcon";
import { ChapterHeading } from "../components/Chapter";
import { reduceMotion } from "../lib/fx";
import { signed } from "../lib/rules";
import { onTabKeys } from "../lib/tabs";
import "./GuidePage.css";

// คู่มืออาชีพ: เลือกอาชีพแล้วดูภาพรวม ตารางเลเวล สกิลเฉพาะอาชีพ และสกิลพิเศษที่อาชีพนี้เปิดได้
// ข้อมูลทั้งหมดมาจาก Excel (ชีต Classes, Class Levels, Class Skills และไฟล์สกิล)
// อาชีพที่เลือกเก็บใน URL (?class=Wizard) รีเฟรชหรือส่งลิงก์ต่อแล้วเปิดอาชีพเดิม

const TYPE_TH: Record<string, string> = {
  Active: "ใช้งาน",
  Passive: "ติดตัว",
  Reaction: "ตอบโต้",
  Resource: "แหล่งพลัง",
  Ultimate: "ท่าไม้ตาย",
};

// แถวไอคอนลอยขึ้นลง ±2px ด้วย transform ล้วน (ไม่วาดใหม่ทุกเฟรม)
const DOCK_FLOAT: TargetAndTransition = { y: [-2, 2, -2], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } };

interface Row extends ClassLevel {
  hpTotal: number;
  totals: Record<string, number>;
  normalNow: number | null;
  specialNow: number | null;
}

// รวมยอดสะสมทีละเลเวล: HP, ค่าสถานะ (เริ่มจากโบนัสอาชีพ), ระดับสกิลที่ใช้ได้
function buildRows(klass: Klass): Row[] {
  const totals: Record<string, number> = { ...klass.bonus };
  let hp = 0;
  let normal: number | null = null;
  let special: number | null = null;
  return levelsOf(klass.id).map((l) => {
    hp += l.hp;
    for (const [k, v] of Object.entries(l.gains)) totals[k] = (totals[k] ?? 0) + v;
    normal = l.normalLv ?? normal;
    special = l.specialLv ?? special;
    return { ...l, hpTotal: hp, totals: { ...totals }, normalNow: normal, specialNow: special };
  });
}

export default function GuidePage() {
  const [params, setParams] = useSearchParams();
  const klass = classes.find((c) => c.id === params.get("class")) ?? classes[0];
  const pick = (id: string) => setParams(id === classes[0].id ? {} : { class: id }, { replace: true });

  return (
    <motion.main
      className="guide-page"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <h1 className="sr-only">Class guide</h1>

      {/* Dock ไอคอนอาชีพ (แนวเดียวกับหน้า Create): ไม่มีกรอบ ลอยขึ้นลงช้าๆ ชี้แล้วเด้ง+ป้ายชื่อ จุดทองสไลด์ใต้อาชีพที่เลือก */}
      <motion.div className="guide-picker" role="tablist" aria-label="Class" onKeyDown={onTabKeys} animate={reduceMotion ? undefined : DOCK_FLOAT}>
        {classes.map((c) => (
          <motion.button
            key={c.id}
            type="button"
            role="tab"
            id={`guide-tab-${c.id}`}
            aria-controls="guide-panel"
            aria-selected={c.id === klass.id}
            aria-label={`${c.id} ${c.nameTh}`}
            tabIndex={c.id === klass.id ? 0 : -1}
            className="guide-pick"
            whileHover={reduceMotion ? undefined : { scale: 1.1, y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            onClick={() => pick(c.id)}
          >
            {c.id === klass.id && (
              <motion.span
                layoutId="guide-pick-glow"
                className="guide-pick-glow"
                transition={reduceMotion ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.35 }}
              />
            )}
            <span className="guide-pick-icon" aria-hidden="true">
              <ClassIcon id={c.id} />
            </span>
            <span className="guide-pick-label" aria-hidden="true">
              {c.id} <span lang="th">{c.nameTh}</span>
            </span>
          </motion.button>
        ))}
      </motion.div>

      <section className="guide-body parchment frame" id="guide-panel" role="tabpanel" aria-labelledby={`guide-tab-${klass.id}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={klass.id}
            className="stage-enter"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <Overview klass={klass} />
            <LevelTable klass={klass} />
            <ClassSkillList klass={klass} />
            <SpecialSkillList klass={klass} />
          </motion.div>
        </AnimatePresence>
      </section>
    </motion.main>
  );
}

/* ---------- ภาพรวมอาชีพ ---------- */
function Overview({ klass: c }: { klass: Klass }) {
  return (
    <header className="guide-hero">
      <span className="guide-hero-icon" aria-hidden="true">
        <ClassIcon id={c.id} />
      </span>
      <div className="guide-hero-text">
        <p className="chapter-kicker">Class guide · คู่มืออาชีพ</p>
        <h2 className="guide-hero-name">
          {c.id} <span className="th" lang="th">{c.nameTh}</span>
        </h2>
        <p className="guide-hero-summary" lang="th">
          {c.summary}
        </p>
        <dl className="guide-facts">
          <div>
            <dt>Role</dt>
            <dd>{c.role}</dd>
          </div>
          <div>
            <dt>Hit die</dt>
            <dd>d{c.hitDie}</dd>
          </div>
          <div>
            <dt>Primary</dt>
            <dd>{c.primary.join(", ")}</dd>
          </div>
          <div>
            <dt>Class bonus</dt>
            <dd>
              {Object.entries(c.bonus)
                .map(([k, v]) => `${k} ${signed(v)}`)
                .join(", ") || "—"}
            </dd>
          </div>
        </dl>
      </div>
    </header>
  );
}

/* ---------- ตารางเลเวล ---------- */
function LevelTable({ klass }: { klass: Klass }) {
  const rows = buildRows(klass);
  const unlocks = classSkillsOf(klass.id);
  if (!rows.length) {
    return (
      <p className="empty" lang="th">
        ยังไม่มีตารางเลเวลของ {klass.id} (เพิ่มได้ในชีต Class Levels)
      </p>
    );
  }
  return (
    <section className="guide-section">
      <ChapterHeading en="Level table" th="ตารางเลเวล">
        ตามกติกา D&D 5e • HP สะสมยังไม่รวม CON mod (บวกเพิ่ม CON mod ทุกเลเวล) • ค่าสถานะคือโบนัสอาชีพ + ASI แบบสะสม (ตารางใส่ +1 ค่าหลัก 1, +1 ค่าหลัก 2 ทุกครั้งที่ได้ ASI แต่จะเลือกเองหรือรับ Feat แทนก็ได้; ยังไม่รวมค่าที่ทอยและโบนัสเผ่า) • ช่องที่มีขีดทองคือค่าที่เพิ่มในเลเวลนั้น
      </ChapterHeading>
      <div className="guide-table-wrap" tabIndex={0} role="region" aria-label={`${klass.id} level table`}>
        <table className="guide-table">
          <thead>
            <tr>
              <th scope="col">Lv</th>
              <th scope="col">HP</th>
              {abilities.map((a) => (
                <th key={a.id} scope="col" className={klass.primary.includes(a.id) ? "is-primary" : ""}>
                  {a.id}
                </th>
              ))}
              <th scope="col">
                Prof <span className="th" lang="th">ความชำนาญ</span>
              </th>
              <th scope="col">
                Normal <span className="th" lang="th">สกิลปกติ</span>
              </th>
              <th scope="col">
                Special <span className="th" lang="th">สกิลพิเศษ</span>
              </th>
              <th scope="col">
                New <span className="th" lang="th">เลือกเพิ่ม</span>
              </th>
              <th scope="col" className="col-wide">
                Features <span className="th" lang="th">ความสามารถที่ได้</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const got = unlocks.filter((s) => s.level === r.level);
              return (
                <tr key={r.level} className={got.some((s) => s.type === "Ultimate") ? "is-capstone" : ""}>
                  <th scope="row">{r.level}</th>
                  <td>
                    <b>{r.hpTotal}</b> <small>+{r.hp}</small>
                  </td>
                  {abilities.map((a) => {
                    const total = r.totals[a.id] ?? 0;
                    const up = r.gains[a.id];
                    return (
                      <td key={a.id} className={up ? "is-up" : ""} title={up ? `+${up} at level ${r.level}` : undefined}>
                        {total ? signed(total) : "—"}
                      </td>
                    );
                  })}
                  <td className={i > 0 && r.prof !== rows[i - 1].prof ? "is-up" : ""}>+{r.prof}</td>
                  <td className={r.normalLv !== null ? "is-up" : ""}>{r.normalNow === null ? "—" : `LV${r.normalNow}`}</td>
                  <td className={r.specialLv !== null ? "is-up" : ""}>{r.specialNow === null ? "—" : `LV${r.specialNow}`}</td>
                  <td>{r.newSkills ? `+${r.newSkills}` : "—"}</td>
                  <td className="col-wide">
                    {got.map((s) => (
                      <span key={s.id} className="guide-unlock">
                        {s.nameEn} <span lang="th">{s.nameTh}</span>
                      </span>
                    ))}
                    {r.note && (
                      <span className="guide-note" lang="th">
                        {r.note}
                      </span>
                    )}
                    {!got.length && !r.note && "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- สกิลเฉพาะอาชีพ (ละเอียด) ---------- */
function ClassSkillList({ klass }: { klass: Klass }) {
  const list = classSkillsOf(klass.id);
  const subclass = list.find((s) => s.source !== "Class")?.source;
  return (
    <section className="guide-section">
      <ChapterHeading en="Class skills" th="สกิลเฉพาะอาชีพ">
        ความสามารถของ {klass.id} ตามกติกา D&D 5e ครบทุกเลเวล 1–20 ป้ายสีน้ำเงินคือความสามารถของสายย่อย{subclass ? ` (คู่มือนี้ใช้ ${subclass})` : ""}
      </ChapterHeading>
      {list.length ? (
        <ol className="guide-skills">
          {list.map((s) => (
            <li key={s.id} className={`guide-skill type-${s.type.toLowerCase()}`}>
              <header className="guide-skill-head">
                <span className="guide-skill-lv" aria-label={`Unlocks at level ${s.level}`}>
                  <small>Lv</small>
                  {s.level}
                </span>
                <span className="guide-skill-title">
                  <span className="entry-name">{s.nameEn}</span>
                  <span className="th" lang="th">
                    {s.nameTh}
                  </span>
                  {s.source !== "Class" && <span className="guide-skill-source">{s.source}</span>}
                </span>
                <span className="guide-skill-type">
                  {s.type}
                  <span lang="th"> · {TYPE_TH[s.type] ?? s.type}</span>
                </span>
              </header>
              <dl className="guide-skill-meta" lang="th">
                {s.cost && s.cost !== "-" && (
                  <div>
                    <dt>ใช้</dt>
                    <dd>{s.cost}</dd>
                  </div>
                )}
                {s.uses && s.uses !== "-" && (
                  <div>
                    <dt>จำนวน/คูลดาวน์</dt>
                    <dd>{s.uses}</dd>
                  </div>
                )}
                {s.range && s.range !== "-" && (
                  <div>
                    <dt>ระยะ</dt>
                    <dd>{s.range}</dd>
                  </div>
                )}
                {s.requires.length > 0 && (
                  <div>
                    <dt>ต้องมีก่อน</dt>
                    <dd>{s.requires.join(", ")}</dd>
                  </div>
                )}
              </dl>
              <p className="guide-skill-effect" lang="th">
                {s.effect}
              </p>
              {s.detail && (
                <ul className="guide-skill-detail" lang="th">
                  {s.detail.split("•").map((d) => d.trim()).filter(Boolean).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty" lang="th">
          ยังไม่มีสกิลของ {klass.id} (เพิ่มได้ในชีต Class Skills)
        </p>
      )}
    </section>
  );
}

/* ---------- สกิลพิเศษที่อาชีพนี้เปิดได้ (จากไฟล์สกิล) ---------- */
function SpecialSkillList({ klass }: { klass: Klass }) {
  const special = skills.filter((s) => s.tier === "special");
  const own = special.filter((s) => s.classes.includes(klass.id));
  const shared = special.filter((s) => s.classes.includes("All")).length;
  const normal = skills.filter((s) => s.tier === "normal" && (s.classes.includes("All") || s.classes.includes(klass.id))).length;
  const levels = [...new Set(own.map((s) => s.level))].sort((a, b) => a - b);
  const [picked, setPicked] = useState<number | null>(null);
  const lv = picked !== null && levels.includes(picked) ? picked : levels[0];
  return (
    <section className="guide-section">
      <ChapterHeading en="Special skills" th="สกิลพิเศษสายอาชีพ">
        สกิลพิเศษที่จำกัดเฉพาะบางอาชีพและ {klass.id} เปิดได้ (ใช้ได้ตามระดับสกิลพิเศษในตารางเลเวล) นอกจากนี้ยังเลือกสกิลพิเศษกลางได้อีก {shared} สกิล และสกิลปกติ {normal} สกิล
        (เริ่มต้นเลือกสกิลปกติ LV{settings.startingSkillLevel} ได้ {settings.startingSkillCount} อย่าง)
      </ChapterHeading>
      {own.length ? (
        <>
          <div className="tabs guide-special-tabs" role="tablist" aria-label="Special skill level" onKeyDown={onTabKeys}>
            {levels.map((l) => (
              <button
                key={l}
                type="button"
                role="tab"
                id={`guide-special-tab-${l}`}
                aria-controls="guide-special-panel"
                className="tab"
                aria-selected={lv === l}
                tabIndex={lv === l ? 0 : -1}
                onClick={() => setPicked(l)}
              >
                LV{l}
                <span className="tab-count">{own.filter((s) => s.level === l).length}</span>
              </button>
            ))}
          </div>
          <div className="guide-special-level" id="guide-special-panel" role="tabpanel" aria-labelledby={`guide-special-tab-${lv}`}>
            <div className="entries">
              {own
                .filter((s) => s.level === lv)
                .map((s) => (
                  <article key={s.id} className="entry entry-static is-special">
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
                ))}
            </div>
          </div>
        </>
      ) : (
        <p className="empty" lang="th">
          {klass.id} ยังไม่มีสกิลพิเศษเฉพาะสาย ใช้สกิลพิเศษกลางได้ทั้งหมด
        </p>
      )}
    </section>
  );
}
