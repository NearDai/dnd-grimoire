import { AnimatePresence, motion } from "framer-motion";
import { forwardRef } from "react";
import { abilities, settings, type Alignment, type Klass, type Race, type Skill } from "../data";
import { armorClass, hitPoints, modOf, signed, type Scores } from "../lib/rules";
import { Ink } from "./CharacterSheet";
import ClassIcon from "./ClassIcon";
import "./HeroStrip.css";

interface StripProps {
  name: string;
  race?: Race;
  klass?: Klass;
  alignment?: Alignment;
  scores: Scores | null;
  skills: Skill[];
  sealed?: boolean;
}

// แถบสรุปตัวละครแนวนอนเหนือขั้นตอนการสร้าง: ทุกค่าที่เลือกเขียนลงที่นี่ทันที
const HeroStrip = forwardRef<HTMLElement, StripProps>(function HeroStrip({ name, race, klass, alignment, scores, skills, sealed }, ref) {
  const monogram = klass ? klass.id[0] : race ? race.nameEn[0] : "?";
  const lineage = race || klass ? [race?.nameEn, klass?.id].filter(Boolean).join(" ") : "Choose a race and class";

  return (
    <section className="hero-strip parchment frame" aria-label="Character summary" ref={ref}>
      <div className="strip-id">
        <div className={`medallion ${klass ? "is-lit" : ""}`} aria-hidden="true">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={monogram}
              className="medallion-letter"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.36, ease: [0.23, 1, 0.32, 1] }}
            >
              {klass ? <ClassIcon id={klass.id} /> : monogram}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="strip-name">
          <h2 className="sheet-name">
            <Ink value={name.trim() || "Unnamed hero"} quiet />
          </h2>
          <p className="sheet-lineage">
            <Ink value={lineage} />
          </p>
          <p className="sheet-meta">
            <Ink value={[klass?.role, alignment?.en].filter(Boolean).join(", ") || "New adventurer"} />
          </p>
        </div>
      </div>

      <dl className="vitals">
        <div>
          <dt>HP</dt>
          <dd>
            <Ink value={klass && scores ? String(hitPoints(klass, scores)) : "—"} />
          </dd>
        </div>
        <div>
          <dt>AC</dt>
          <dd>
            <Ink value={scores ? String(armorClass(scores)) : "—"} />
          </dd>
        </div>
        <div>
          <dt>Speed</dt>
          <dd>
            <Ink value={race ? String(race.speed) : "—"} />
          </dd>
        </div>
      </dl>

      <ul className="stat-row" aria-label="Ability scores">
        {abilities.map((a) => (
          <li key={a.id}>
            <span className="stat-code">{a.id}</span>
            <Ink className="stat-score" value={scores ? String(scores[a.id]) : "—"} />
            <Ink className="stat-mod" value={scores ? signed(modOf(scores[a.id])) : ""} />
          </li>
        ))}
      </ul>

      <section className="sheet-skills strip-skills" aria-label="Starting skills">
        <h4>
          Skills <span className="th" lang="th">สกิลเริ่มต้น</span>
        </h4>
        <ol>
          {Array.from({ length: settings.startingSkillCount }, (_, i) => {
            const s = skills[i];
            return (
              <li key={i} className={s ? "" : "is-empty"}>
                <Ink className="sheet-skill-name" value={s ? s.nameEn : "Empty slot"} />
              </li>
            );
          })}
        </ol>
      </section>

      <AnimatePresence>
        {sealed && (
          <motion.div
            className="wax-seal"
            aria-hidden="true"
            initial={{ scale: 1.6, rotate: -24, opacity: 0 }}
            animate={{ scale: 1, rotate: -10, opacity: 1 }}
            transition={{ duration: 0.42, ease: [0.34, 1.4, 0.64, 1] }}
          >
            <svg viewBox="0 0 100 100" width="84" height="84">
              <path
                fill="rgba(60,10,5,.35)"
                transform="translate(2 4)"
                d="M50 5c7 0 10 6 17 7s13-2 17 4 1 12 5 18 9 9 7 16-8 9-10 16 1 13-5 17-12 1-18 5-9 8-16 7-10-7-17-8-12 2-16-4-1-12-5-18-8-9-7-16 8-9 10-16-1-13 5-17 12-1 18-5 9-8 15-7z"
              />
              <path
                fill="#8e2c20"
                d="M50 5c7 0 10 6 17 7s13-2 17 4 1 12 5 18 9 9 7 16-8 9-10 16 1 13-5 17-12 1-18 5-9 8-16 7-10-7-17-8-12 2-16-4-1-12-5-18-8-9-7-16 8-9 10-16-1-13 5-17 12-1 18-5 9-8 15-7z"
              />
              <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(40,8,4,.45)" strokeWidth="3" />
              <path d="M36 51l10 10 19-22" fill="none" stroke="rgba(40,8,4,.55)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});

export default HeroStrip;
