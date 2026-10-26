import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { abilities, settings, type Alignment, type Klass, type Race, type Skill } from "../data";
import { armorClass, hitPoints, modOf, signed, type Scores } from "../lib/rules";
import ClassIcon from "./ClassIcon";
import "./CharacterSheet.css";

// ค่าที่เปลี่ยนจะค่อยๆ เขียนขึ้นใหม่ (เปลี่ยน key = เล่นแอนิเมชันใหม่, ใช้แค่ opacity/transform)
export function Ink({ value, className = "", quiet = false }: { value: string; className?: string; quiet?: boolean }) {
  if (quiet) return <span className={className}>{value}</span>;
  return (
    <motion.span
      key={value}
      className={`ink ${className}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.23, 1, 0.32, 1] }}
    >
      {value}
    </motion.span>
  );
}

interface SheetProps {
  name: string;
  race?: Race;
  klass?: Klass;
  alignment?: Alignment;
  scores: Scores | null;
  skills: Skill[];
  typing?: boolean;
  sealed?: boolean;
  children?: ReactNode;
}

export default function CharacterSheet({ name, race, klass, alignment, scores, skills, typing, sealed, children }: SheetProps) {
  const monogram = klass ? klass.id[0] : race ? race.nameEn[0] : "?";
  const lineage = race || klass ? [race?.nameEn, klass?.id].filter(Boolean).join(" ") : "Choose a race and class";

  return (
    <article className="sheet" aria-label="Character sheet">
      <header className="sheet-head">
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
        <div className="sheet-title">
          <h3 className="sheet-name">
            <Ink value={name.trim() || "Unnamed hero"} quiet={typing} />
          </h3>
          <p className="sheet-lineage">
            <Ink value={lineage} />
          </p>
          <p className="sheet-meta">
            <Ink value={[klass?.role, alignment?.en].filter(Boolean).join(", ") || "New adventurer"} />
          </p>
        </div>
      </header>

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
            <Ink value={race ? `${race.speed} ft` : "—"} />
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

      <section className="sheet-skills" aria-label="Starting skills">
        <h4>
          Starting skills <span className="th" lang="th">สกิลเริ่มต้น</span>
        </h4>
        <ol>
          {Array.from({ length: Math.max(settings.startingSkillCount, skills.length) }, (_, i) => {
            const s = skills[i];
            return (
              <li key={i} className={s ? "" : "is-empty"}>
                <Ink className="sheet-skill-name" value={s ? s.nameEn : "Empty slot"} />
                {s && (
                  <span className="th" lang="th">
                    {s.nameTh}
                  </span>
                )}
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
            <svg viewBox="0 0 100 100" width="92" height="92">
              <path
                fill="rgba(60,10,5,.35)"
                transform="translate(2 4)"
                d="M50 5c7 0 10 6 17 7s13-2 17 4 1 12 5 18 9 9 7 16-8 9-10 16 1 13-5 17-12 1-18 5-9 8-16 7-10-7-17-8-12 2-16-4-1-12-5-18-8-9-7-16 8-9 10-16-1-13 5-17 12-1 18-5 9-8 15-7z"
              />
              <path
                fill="#8e2a1c"
                d="M50 5c7 0 10 6 17 7s13-2 17 4 1 12 5 18 9 9 7 16-8 9-10 16 1 13-5 17-12 1-18 5-9 8-16 7-10-7-17-8-12 2-16-4-1-12-5-18-8-9-7-16 8-9 10-16-1-13 5-17 12-1 18-5 9-8 15-7z"
              />
              <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(40,8,4,.45)" strokeWidth="3" />
              <path d="M36 51l10 10 19-22" fill="none" stroke="rgba(40,8,4,.55)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </article>
  );
}
