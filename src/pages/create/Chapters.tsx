import { motion } from "framer-motion";
import { useEffect, useRef, useState, type Dispatch } from "react";
import { abilities, alignments, classes, races, settings, skills, startingSkillsFor, classById, raceById, skillById } from "../../data";
import ClassIcon from "../../components/ClassIcon";
import { ChapterHeading } from "../../components/Chapter";
import ClassCarousel, { CARD_THEME } from "./ClassCarousel";
import { burstFrom, reduceMotion } from "../../lib/fx";
import { finalScores, modOf, signed } from "../../lib/rules";
import { STEPS, type Action, type CreateState } from "./state";

interface ChapterProps {
  state: CreateState;
  dispatch: Dispatch<Action>;
}

const stepOf = (id: (typeof STEPS)[number]["id"]) => `Step ${STEPS.findIndex((s) => s.id === id) + 1} of ${STEPS.length}`;

// แสงทองเล็กๆ จากเครื่องหมายเลือก
function sparkle(el: HTMLElement | null) {
  burstFrom(el?.querySelector(".entry-mark"), { count: 10, spread: 46, size: 5 });
}

/* ---------- I. เผ่าพันธุ์ ---------- */
export function RaceChapter({ state, dispatch }: ChapterProps) {
  return (
    <>
      <ChapterHeading kicker={stepOf("race")} en="Race" th="เผ่าพันธุ์">
        เผ่าพันธุ์กำหนดรูปร่าง ความเร็ว และโบนัสค่าสถานะติดตัว
      </ChapterHeading>
      <div className="entries" role="radiogroup" aria-label="Race">
        {races.map((r) => (
          <label key={r.id} className="entry">
            <input
              type="radio"
              name="race"
              value={r.id}
              checked={state.raceId === r.id}
              onChange={(e) => {
                dispatch({ type: "race", id: r.id });
                sparkle(e.currentTarget.closest("label"));
              }}
            />
            <span className="entry-mark" aria-hidden="true" />
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
              {Object.entries(r.bonus).map(([k, v]) => (
                <span key={k} className="fact">
                  {k} {signed(v)}
                </span>
              ))}
              <span className="fact fact-quiet">{r.speed} ft</span>
            </span>
            <span className="entry-trait">
              <strong>{r.trait.en}</strong> <span lang="th">{r.trait.th}</span>
            </span>
          </label>
        ))}
      </div>
    </>
  );
}

/* ---------- II. อาชีพ ---------- */
// รูปแบบหน้าเลือกอาชีพ (เปลี่ยนค่านี้ค่าเดียว):
//   "carousel" = วงล้อการ์ดใหญ่โค้งรอบทรงกระบอก + แถบไอคอนเลือกเร็ว (ClassCarousel.tsx)
//   "cards"    = การ์ดแนวตั้งเรียงเป็นตาราง
//   "rows"     = แถวยาวสองช่อง (แบบแรกสุด)
const CLASS_LAYOUT = "carousel" as "carousel" | "cards" | "rows";

// ขั้นอาชีพใช้พื้นหลังมืดทั้งแผ่น (ให้เข้ากับการ์ดโทนมืด)
export const CLASS_STAGE_DARK = CLASS_LAYOUT === "carousel" && CARD_THEME === "dark";

export function ClassChapter(props: ChapterProps) {
  if (CLASS_LAYOUT === "carousel")
    return (
      <>
        <ClassHeading state={props.state} />
        <ClassCarousel {...props} />
      </>
    );
  return CLASS_LAYOUT === "cards" ? <ClassCards {...props} /> : <ClassRows {...props} />;
}

function ClassHeading({ state }: { state: CreateState }) {
  return (
    <>
      <ChapterHeading kicker={stepOf("class")} en="Class" th="อาชีพ">
        อาชีพกำหนดลูกเต๋าพลังชีวิต ค่าสถานะที่ควรเน้น และสายสกิลพิเศษที่จะเปิดได้ในอนาคต เลื่อนดูแล้วกดเพื่อเลือก
      </ChapterHeading>

      {state.droppedSkills.length > 0 && (
        <p className="chapter-notice" role="status" lang="th">
          อาชีพนี้เลือกสกิล {state.droppedSkills.map((id) => skillById(id)?.nameEn ?? id).join(", ")} ไม่ได้ จึงเอาออกจากสกิลเริ่มต้นแล้ว
        </p>
      )}
    </>
  );
}

const specialSkillsOf = (classId: string) => skills.filter((s) => s.tier === "special" && s.classes.includes(classId));

// แบบการ์ด: ไอคอนใหญ่ด้านบน ชื่อ บทบาท คำอธิบาย ป้ายโบนัสค่าสถานะ และจำนวนสกิลพิเศษ
function ClassCards({ state, dispatch }: ChapterProps) {
  return (
    <>
      <ClassHeading state={state} />
      <div className="class-cards" role="radiogroup" aria-label="Class">
        {classes.map((c) => {
          const special = specialSkillsOf(c.id);
          // แสดงเฉพาะค่าที่ได้โบนัสหรือเป็นค่าหลัก ค่าหลักมีดาวนำหน้า
          const stats = abilities.filter((a) => c.bonus[a.id] || c.primary.includes(a.id));
          return (
            <label key={c.id} className="class-card">
              <input
                type="radio"
                name="class"
                value={c.id}
                checked={state.classId === c.id}
                onChange={(e) => {
                  dispatch({ type: "class", id: c.id });
                  sparkle(e.currentTarget.closest("label"));
                }}
              />
              <span className="entry-mark" aria-hidden="true" />
              <span className="card-hd" title="Hit die">
                <small>HD</small>d{c.hitDie}
              </span>
              <span className="card-art" aria-hidden="true">
                <ClassIcon id={c.id} />
              </span>
              <span className="card-title">
                <span className="card-name">{c.id}</span>
                <span className="th" lang="th">
                  {c.nameTh}
                </span>
              </span>
              <span className="card-role">{c.role}</span>
              <span className="card-text" lang="th">
                {c.summary}
              </span>
              <span className="card-stats" aria-label="Ability bonuses">
                {stats.map((a) => {
                  const plus = c.bonus[a.id] ?? 0;
                  return (
                    <span key={a.id} className={`card-stat ${plus ? "is-bonus" : ""}`}>
                      {c.primary.includes(a.id) && <span aria-label="primary">★</span>}
                      {a.id}
                      {plus ? <b>{signed(plus)}</b> : null}
                    </span>
                  );
                })}
              </span>
              <span className="card-unlocks" lang="th" title={special.map((sk) => sk.nameEn).join(", ")}>
                {special.length ? `✦ สกิลพิเศษ ${special.length} สกิล` : "ใช้สกิลพิเศษกลางเท่านั้น"}
              </span>
            </label>
          );
        })}
      </div>
    </>
  );
}

// แบบแถว (แบบเดิม): หนึ่งอาชีพต่อหนึ่งแถว ช่องซ้าย = ชื่อ บทบาท Hit die | ช่องขวา = คำอธิบาย ค่าสถานะหลัก สกิลพิเศษ
function ClassRows({ state, dispatch }: ChapterProps) {
  const SHOWN = 4;
  return (
    <>
      <ClassHeading state={state} />

      <div className="class-rows" role="radiogroup" aria-label="Class">
        {classes.map((c) => {
          const special = specialSkillsOf(c.id);
          const more = special.length > SHOWN ? ` +${special.length - SHOWN}` : "";
          return (
            <label key={c.id} className="class-row">
              <input
                type="radio"
                name="class"
                value={c.id}
                checked={state.classId === c.id}
                onChange={(e) => {
                  dispatch({ type: "class", id: c.id });
                  sparkle(e.currentTarget.closest("label"));
                }}
              />
              <span className="entry-mark" aria-hidden="true" />

              <span className="class-main">
                <span className="class-coin" aria-hidden="true">
                  <ClassIcon id={c.id} />
                </span>
                <span className="class-title">
                  <span className="class-name">{c.id}</span>
                  <span className="th" lang="th">
                    {c.nameTh}
                  </span>
                  <span className="class-role">{c.role}</span>
                </span>
                <span className="class-hd">
                  <small>Hit die</small>d{c.hitDie}
                </span>
              </span>

              <span className="class-detail">
                <span className="class-text" lang="th">
                  {c.summary}
                </span>
                <span className="class-stats" aria-label="Ability bonuses">
                  {abilities.map((a) => {
                    const plus = c.bonus[a.id] ?? 0;
                    return (
                      <span key={a.id} className={`class-stat ${plus ? "is-bonus" : ""} ${c.primary.includes(a.id) ? "is-primary" : ""}`}>
                        <span className="class-stat-code">
                          {c.primary.includes(a.id) && "★ "}
                          {a.id}
                        </span>
                        <span className="class-stat-value">{plus ? signed(plus) : "—"}</span>
                      </span>
                    );
                  })}
                </span>
                {special.length > 0 && (
                  <span className="class-unlocks">
                    <span lang="th">สกิลพิเศษ {special.length} สกิล:</span>{" "}
                    {special.slice(0, SHOWN).map((sk) => sk.nameEn).join(", ")}
                    {more}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </>
  );
}

/* ---------- III. ค่าสถานะ ---------- */
export function AbilitiesChapter({ state, dispatch }: ChapterProps) {
  const race = raceById(state.raceId);
  const klass = classById(state.classId);
  const scores = finalScores(state.base, race, klass);
  const [rolling, setRolling] = useState(false);
  const [flicker, setFlicker] = useState<Record<string, number> | null>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const lastRoll = useRef(state.rollId);

  // ทอยเสร็จ: ค่าที่สูงที่สุด (16 ขึ้นไป) ได้ประกายทอง
  useEffect(() => {
    if (state.rollId === lastRoll.current || !state.base) return;
    lastRoll.current = state.rollId;
    const best = Math.max(...abilities.map((a) => state.base![a.id]));
    if (best < 16) return;
    const top = abilities.find((a) => state.base![a.id] === best)!;
    const t = window.setTimeout(() => burstFrom(gridRef.current?.querySelector(`[data-ability="${top.id}"]`), { count: 18, spread: 90 }), 700);
    return () => clearTimeout(t);
  }, [state.rollId, state.base]);

  function roll() {
    if (reduceMotion) return dispatch({ type: "roll" });
    // ตัวเลขสุ่มวิ่งสั้นๆ ระหว่างการ์ดสั่น แล้วค่อยใส่ผลจริง
    setRolling(true);
    const timer = window.setInterval(() => {
      const f: Record<string, number> = {};
      abilities.forEach((a) => (f[a.id] = 3 + Math.floor(Math.random() * 16)));
      setFlicker(f);
    }, 60);
    window.setTimeout(() => {
      clearInterval(timer);
      setFlicker(null);
      setRolling(false);
      dispatch({ type: "roll" });
    }, 650);
  }

  return (
    <>
      <ChapterHeading kicker={stepOf("abilities")} en="Abilities" th="ค่าสถานะ">
        ทอย 4d6 ตัดลูกต่ำสุดทิ้ง {abilities.length} ครั้ง หรือใช้ชุดมาตรฐาน {settings.standardArray.join(", ")} ที่จัดตามอาชีพให้
      </ChapterHeading>

      <div className="roll-bar">
        <button type="button" className="btn btn-gold" onClick={roll} disabled={rolling || state.rerollsLeft <= 0}>
          {state.rollId > 0 ? "Reroll abilities" : "Roll abilities"}
        </button>
        <button type="button" className="btn btn-ink" onClick={() => dispatch({ type: "standard", klass })} disabled={rolling}>
          Use standard array
        </button>
        <span className="roll-count" lang="th">
          ทอยใหม่ได้อีก {state.rerollsLeft} ครั้ง
        </span>
      </div>

      <ul className="seals" ref={gridRef}>
        {abilities.map((a, i) => {
          const total = flicker ? flicker[a.id] : scores?.[a.id];
          const base = state.base?.[a.id];
          const plus = race?.bonus[a.id] ?? 0;
          const classPlus = klass?.bonus[a.id] ?? 0;
          const dice = !flicker && state.rollDetail?.[a.id];
          const picked = state.swapPick === a.id;
          return (
            <li key={a.id}>
              <button
                type="button"
                data-ability={a.id}
                className={`seal ${picked ? "is-picked" : ""} ${rolling ? "is-rolling" : ""}`}
                disabled={!state.base || rolling}
                aria-pressed={picked}
                aria-label={`${a.nameEn} ${total ?? ""}`}
                onClick={() => dispatch({ type: "swap", id: a.id })}
                style={{ animationDelay: `${i * -40}ms` }}
              >
                <span className="seal-code">{a.id}</span>
                <motion.span
                  key={`${state.rollId}-${total}`}
                  className="seal-score"
                  initial={flicker || reduceMotion ? false : { scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: dice ? 0.36 + i * 0.07 : 0, ease: [0.23, 1, 0.32, 1] }}
                >
                  {total ?? "—"}
                </motion.span>
                <span className="seal-mod">{total === undefined ? "" : signed(modOf(total))}</span>
                <span className="seal-name">
                  {a.nameEn}
                  <span className="th" lang="th">
                    {a.nameTh}
                  </span>
                </span>
                {dice && (
                  <span className="mini-dice" key={state.rollId} aria-label={`Rolled ${dice.join(", ")}, dropped ${dice[3]}`}>
                    {dice.map((d, k) => (
                      <motion.span
                        key={k}
                        className={`mini-die ${k === 3 ? "is-dropped" : ""}`}
                        initial={reduceMotion ? false : { y: -14, rotate: -90, opacity: 0 }}
                        animate={{ y: 0, rotate: 0, opacity: k === 3 ? 0.4 : 1 }}
                        transition={{ duration: 0.34, delay: i * 0.07 + k * 0.05, ease: [0.23, 1, 0.32, 1] }}
                      >
                        {d}
                      </motion.span>
                    ))}
                  </span>
                )}
                <span className="seal-breakdown" lang="th">
                  {base === undefined
                    ? "ยังไม่ทอย"
                    : `${base}${plus ? ` ${signed(plus)} เผ่า` : ""}${classPlus ? ` ${signed(classPlus)} อาชีพ` : ""}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="chapter-note" lang="th">
        {state.base ? "แตะค่าสถานะสองช่องเพื่อสลับค่ากัน" : "ค่าสถานะจะแสดงหลังทอยลูกเต๋า"}
      </p>
    </>
  );
}

/* ---------- IV. สกิลเริ่มต้น ---------- */
export function SkillsChapter({ state, dispatch }: ChapterProps) {
  const [query, setQuery] = useState("");
  const allowed = startingSkillsFor(state.classId);
  const q = query.trim().toLowerCase();
  const list = q ? allowed.filter((s) => `${s.nameTh} ${s.nameEn} ${s.effect}`.toLowerCase().includes(q)) : allowed;
  const count = settings.startingSkillCount;
  const full = state.skillIds.length >= count;

  return (
    <>
      <ChapterHeading kicker={stepOf("skills")} en="Skills" th="สกิลเริ่มต้น">
        ทุกนักผจญภัยมีพรสวรรค์ติดตัว {count} อย่าง เลือกจากสกิลปกติ LV{settings.startingSkillLevel} ทั้งหมด {allowed.length} สกิล
        ส่วนสกิลพิเศษจะปลดล็อกระหว่างการผจญภัย
      </ChapterHeading>

      <div className="skill-tools">
        <p className="skill-count" aria-live="polite">
          <strong>{state.skillIds.length}</strong> of {count} chosen
          <span className="th" lang="th">
            {" "}
            เลือกแล้ว
          </span>
        </p>
        <label className="search">
          <span className="sr-only">Search skills</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input type="search" placeholder="Search skills (ค้นหาสกิล)" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
        </label>
      </div>

      <div className={`entries ${full ? "is-full" : ""}`} role="group" aria-label="Starting skills">
        {list.length ? (
          list.map((s) => {
            const checked = state.skillIds.includes(s.id);
            return (
              <label key={s.id} className="entry entry-skill">
                <input
                  type="checkbox"
                  value={s.id}
                  checked={checked}
                  disabled={full && !checked}
                  onChange={(e) => {
                    dispatch({ type: "skill", id: s.id });
                    if (!checked) sparkle(e.currentTarget.closest("label"));
                  }}
                />
                <span className="entry-mark entry-mark-check" aria-hidden="true" />
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
              </label>
            );
          })
        ) : (
          <p className="empty" lang="th">
            ไม่พบสกิลที่ตรงกับ “{query}” ลองค้นด้วยคำอื่น
          </p>
        )}
      </div>
    </>
  );
}

/* ---------- V. ตัวตน ---------- */
export function IdentityChapter({ state, dispatch }: ChapterProps) {
  return (
    <>
      <ChapterHeading kicker={stepOf("identity")} en="Identity" th="ตัวตน">
        ต้องมีชื่อ ส่วนแนวทางและประวัติจะเว้นไว้ก่อนก็ได้
      </ChapterHeading>
      <div className="form">
        <label className="field">
          <span className="field-label">
            Name <span className="th" lang="th">ชื่อตัวละคร</span>
          </span>
          <input
            type="text"
            className="quill-line"
            maxLength={40}
            value={state.name}
            placeholder="e.g. Aren the Wanderer"
            autoComplete="off"
            onChange={(e) => dispatch({ type: "field", field: "name", value: e.target.value })}
          />
        </label>

        <fieldset className="field">
          <legend className="field-label">
            Alignment <span className="th" lang="th">แนวทาง</span>
          </legend>
          <div className="align-grid">
            {alignments.map((a) => (
              <label key={a.id} className="align">
                <input
                  type="radio"
                  name="alignment"
                  value={a.id}
                  checked={state.alignment === a.id}
                  onChange={() => dispatch({ type: "field", field: "alignment", value: a.id })}
                />
                <span className="align-en">{a.en}</span>
                <span className="th" lang="th">
                  {a.th}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span className="field-label">
            Backstory <span className="th" lang="th">ประวัติโดยย่อ</span>
          </span>
          <textarea
            className="ruled"
            rows={5}
            maxLength={600}
            lang="th"
            placeholder="มาจากไหน ทำไมจึงออกผจญภัย"
            value={state.backstory}
            onChange={(e) => dispatch({ type: "field", field: "backstory", value: e.target.value })}
          />
        </label>
      </div>
    </>
  );
}
