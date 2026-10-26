import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useReducer, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { alignmentById, classById, raceById, settings, skillById, type Skill } from "../../data";
import HeroStrip from "../../components/HeroStrip";
import { ChapterHeading, StepRail } from "../../components/Chapter";
import { burstFrom, reduceMotion, shake } from "../../lib/fx";
import { armorClass, finalScores, hitPoints } from "../../lib/rules";
import { store, type Character } from "../../lib/storage";
import { AbilitiesChapter, CLASS_STAGE_DARK, ClassChapter, IdentityChapter, RaceChapter, SkillsChapter } from "./Chapters";
import { STEPS, blockedReason, canReach, isStepDone, loadDraft, reducer, saveDraft } from "./state";
import "./CreatePage.css";

const CHAPTERS = [RaceChapter, ClassChapter, AbilitiesChapter, SkillsChapter, IdentityChapter];

export default function CreatePage() {
  const [state, dispatch] = useReducer(reducer, undefined, loadDraft);
  const sheetRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const [saveError, setSaveError] = useState("");

  const race = raceById(state.raceId);
  const klass = classById(state.classId);
  const scores = finalScores(state.base, race, klass);
  const chosen = state.skillIds.map(skillById).filter(Boolean) as Skill[];
  const last = state.step === STEPS.length - 1;
  const Chapter = CHAPTERS[state.step];
  const blocked = blockedReason(state, state.step);

  useEffect(() => saveDraft(state), [state]);

  // เปลี่ยนขั้นแล้วโฟกัสหัวข้อใหม่ ถ้าเลื่อนลงไปไกลแล้วให้เลื่อนกลับขึ้นมาที่ป้ายขั้นตอน
  const prevPage = useRef(`${state.step}-${state.saved}`);
  useEffect(() => {
    const page = `${state.step}-${state.saved}`;
    if (prevPage.current === page) return;
    prevPage.current = page;
    const t = window.setTimeout(() => {
      stageRef.current?.querySelector<HTMLElement>(".chapter-title")?.focus({ preventScroll: true });
      const plaques = stageRef.current?.previousElementSibling;
      if (plaques && plaques.getBoundingClientRect().top < 0) plaques.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }, 260);
    return () => clearTimeout(t);
  }, [state.step, state.saved]);

  function seal() {
    if (!race || !klass || !scores) return;
    const character: Character = {
      id: `c-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      name: state.name.trim(),
      race: race.id,
      class: klass.id,
      alignment: state.alignment,
      backstory: state.backstory.trim(),
      level: settings.startingSkillLevel,
      abilities: scores,
      hp: hitPoints(klass, scores),
      ac: armorClass(scores),
      speed: race.speed,
      skills: [...state.skillIds],
    };
    if (!store.save(character)) {
      setSaveError("บันทึกไม่สำเร็จ เบราว์เซอร์ปิดการเก็บข้อมูลไว้ ลองเปิดหน้านี้นอกโหมดส่วนตัว");
      return;
    }
    setSaveError("");
    dispatch({ type: "saved" });
    // จังหวะที่ตราครั่งกระแทกกระดาษ
    window.setTimeout(() => {
      shake(sheetRef.current, 5);
      burstFrom(sheetRef.current?.querySelector(".wax-seal"), { count: 26, spread: 140, size: 8, colors: ["#ecd18a", "#c9a24a", "#8e2a1c", "#fff3cf"] });
    }, 260);
  }

  const left = state.saved ? (
    <div className="sealed-page">
      <ChapterHeading en="Sealed" th="บันทึกเรียบร้อย">
        {state.name.trim()} ถูกบันทึกลงตำราแล้ว พร้อมออกเดินทางเมื่อเรื่องราวแรกเปิดให้เล่น
      </ChapterHeading>
      <div className="sealed-actions">
        <Link className="btn btn-gold" to="/">
          View characters
        </Link>
        <button type="button" className="btn btn-ink" onClick={() => dispatch({ type: "reset" })}>
          Create another
        </button>
      </div>
    </div>
  ) : (
    <div className="chapter">
      <Chapter state={state} dispatch={dispatch} />
      <footer className="chapter-nav">
        <button type="button" className="btn btn-ink" disabled={state.step === 0} onClick={() => dispatch({ type: "goto", step: state.step - 1 })}>
          Back
        </button>
        {saveError && (
          <p className="chapter-error" role="alert" lang="th">
            {saveError}
          </p>
        )}
        <p className="chapter-hint" aria-live="polite" lang="th">
          {blocked}
        </p>
        <button
          type="button"
          className="btn btn-gold"
          disabled={!!blocked}
          onClick={() => (last ? seal() : dispatch({ type: "goto", step: state.step + 1 }))}
        >
          {last ? "Seal character" : `Next: ${STEPS[state.step + 1].en}`}
        </button>
      </footer>
    </div>
  );

  const pageKey = state.saved ? "sealed" : state.step;

  return (
    <motion.main
      className="create"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <h1 className="sr-only">Create a character</h1>

      <HeroStrip
        ref={sheetRef}
        name={state.name}
        race={race}
        klass={klass}
        alignment={alignmentById(state.alignment)}
        scores={scores}
        skills={chosen}
        sealed={state.saved}
      />

      <div className="create-plaques">
        <StepRail
          current={state.saved ? -1 : state.step}
          onSelect={(i) => dispatch({ type: "goto", step: i })}
          steps={STEPS.map((s, i) => ({
            id: s.id,
            en: s.en,
            th: s.th,
            done: state.saved || (isStepDone(state, i) && i !== state.step),
            disabled: state.saved || !canReach(state, i),
          }))}
        />
      </div>

      <section
        className={`create-stage parchment frame ${CLASS_STAGE_DARK && !state.saved && STEPS[state.step].id === "class" ? "is-dark" : ""}`}
        ref={stageRef}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pageKey}
            className="stage-body stage-enter"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 * state.direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 * state.direction }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            {left}
          </motion.div>
        </AnimatePresence>
      </section>
    </motion.main>
  );
}
