import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { alignmentById, classById, raceById, skillById, type Skill } from "../data";
import CharacterSheet from "../components/CharacterSheet";
import ClassIcon from "../components/ClassIcon";
import { ChapterHeading } from "../components/Chapter";
import { reduceMotion } from "../lib/fx";
import { store, type Character } from "../lib/storage";
import "./RosterPage.css";

// เอียงประกาศแต่ละใบเล็กน้อยแบบถาวร (ตามลำดับ ไม่สุ่ม จึงไม่เปลี่ยนทุกครั้งที่วาด)
const TILTS = [-1.6, 1.1, -0.6, 1.8, -1.2, 0.7];

export default function RosterPage() {
  const [heroes, setHeroes] = useState<Character[]>(() => store.list());
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  // แก้ไขได้เฉพาะชื่อกับประวัติ (เผ่า อาชีพ ค่าสถานะ ล็อกตั้งแต่ตอนสร้าง)
  const [editing, setEditing] = useState<{ name: string; backstory: string } | null>(null);
  const [editError, setEditError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastCard = useRef<HTMLButtonElement | null>(null);

  const hero = heroes.find((h) => h.id === openId);
  const heroSkills = useMemo(() => (hero?.skills ?? []).map(skillById).filter(Boolean) as Skill[], [hero]);

  // เปิดแผ่นแล้วโฟกัสปุ่มปิด, Esc ปิด แล้วคืนโฟกัสให้ประกาศใบเดิม
  // Tab วนอยู่ในแผ่นเท่านั้น ไม่หลุดไปที่ประกาศด้านหลัง
  useEffect(() => {
    if (!hero) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return editingRef.current ? cancelEdit() : close();
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input, textarea, [tabindex]:not([tabindex='-1'])");
      const first = items[0];
      const last = items[items.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) {
        e.preventDefault();
        first?.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hero]);

  // Esc ใช้ค่าล่าสุดของโหมดแก้ไข (ตัวฟังคีย์ผูกไว้ครั้งเดียวต่อการเปิดแผ่น)
  const editingRef = useRef(editing);
  editingRef.current = editing;

  function open(id: string, el: HTMLButtonElement) {
    lastCard.current = el;
    setConfirming(false);
    setEditing(null);
    setOpenId(id);
  }

  function close() {
    setOpenId(null);
    setConfirming(false);
    setEditing(null);
    lastCard.current?.focus();
  }

  function startEdit() {
    if (!hero) return;
    setConfirming(false);
    setEditError("");
    setEditing({ name: hero.name, backstory: hero.backstory });
  }

  function cancelEdit() {
    setEditing(null);
    setEditError("");
    closeRef.current?.focus();
  }

  function saveEdit() {
    if (!hero || !editing) return;
    const name = editing.name.trim();
    if (!name) return setEditError("ต้องมีชื่อตัวละคร");
    const updated = { ...hero, name, backstory: editing.backstory.trim() };
    if (!store.save(updated)) return setEditError("บันทึกไม่สำเร็จ เบราว์เซอร์ปิดการเก็บข้อมูลไว้");
    setHeroes((list) => list.map((h) => (h.id === hero.id ? updated : h)));
    cancelEdit();
  }

  function remove() {
    if (!hero) return;
    if (!confirming) return setConfirming(true);
    store.remove(hero.id);
    setHeroes((list) => list.filter((h) => h.id !== hero.id));
    setOpenId(null);
    setConfirming(false);
  }

  return (
    <motion.main
      className="roster-page"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <h1 className="sr-only">Characters</h1>

      <section className="notice-board frame" aria-labelledby="board-title">
        <header className="board-head">
          <h2 id="board-title" className="board-title">
            Adventurers <span className="th" lang="th">กระดานนักผจญภัย</span>
          </h2>
          <p className="board-count" lang="th">
            {heroes.length ? `${heroes.length} คนในกิลด์` : "ยังไม่มีใครลงชื่อ"}
          </p>
        </header>

        <ol className="notices stage-enter">
          {heroes.map((h, i) => {
            const r = raceById(h.race);
            return (
              <li key={h.id} style={{ rotate: `${TILTS[i % TILTS.length]}deg` }}>
                <button type="button" className="notice parchment" onClick={(e) => open(h.id, e.currentTarget)} aria-haspopup="dialog">
                  <span className="notice-pin" aria-hidden="true" />
                  <span className="notice-crest" aria-hidden="true">
                    <ClassIcon id={h.class} />
                  </span>
                  <span className="notice-name">{h.name}</span>
                  <span className="notice-line">
                    {r?.nameEn} {h.class}
                  </span>
                  <span className="notice-vitals">
                    <span>
                      HP <b>{h.hp}</b>
                    </span>
                    <span>
                      AC <b>{h.ac}</b>
                    </span>
                    <span>
                      Speed <b>{h.speed}</b>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          <li style={{ rotate: `${TILTS[heroes.length % TILTS.length]}deg` }}>
            <Link to="/create" className="notice notice-new">
              <span className="notice-pin" aria-hidden="true" />
              <span className="notice-plus" aria-hidden="true">
                +
              </span>
              <span className="notice-name">Create a character</span>
              <span className="notice-line" lang="th">
                ลงชื่อนักผจญภัยคนใหม่
              </span>
            </Link>
          </li>
        </ol>
      </section>

      <AnimatePresence>
        {hero && (
          <motion.div
            className="sheet-overlay"
            onClick={(e) => e.target === e.currentTarget && close()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              ref={dialogRef}
              className="sheet-dialog parchment frame"
              role="dialog"
              aria-modal="true"
              aria-label={hero.name}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
            >
              <button type="button" ref={closeRef} className="dialog-close" onClick={close} aria-label="Close">
                ×
              </button>
              <CharacterSheet
                name={editing ? editing.name.trim() || hero.name : hero.name}
                race={raceById(hero.race)}
                klass={classById(hero.class)}
                alignment={alignmentById(hero.alignment)}
                scores={hero.abilities}
                skills={heroSkills}
              />
              {editing ? (
                <form
                  className="hero-edit"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit();
                  }}
                >
                  <p className="hero-edit-note" lang="th">
                    แก้ได้เฉพาะชื่อและประวัติ เผ่า อาชีพ และค่าสถานะเปลี่ยนไม่ได้หลังสร้างตัวละคร
                  </p>
                  <label className="field">
                    <span className="field-label">
                      Name <span className="th" lang="th">ชื่อตัวละคร</span>
                    </span>
                    <input
                      type="text"
                      className="quill-line"
                      maxLength={40}
                      value={editing.name}
                      autoComplete="off"
                      autoFocus
                      aria-invalid={!!editError && !editing.name.trim()}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    />
                  </label>
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
                      value={editing.backstory}
                      onChange={(e) => setEditing({ ...editing, backstory: e.target.value })}
                    />
                  </label>
                  {editError && (
                    <p className="hero-edit-error" role="alert" lang="th">
                      {editError}
                    </p>
                  )}
                  <div className="hero-edit-actions">
                    <button type="button" className="btn btn-ink" onClick={cancelEdit}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-gold">
                      Save changes
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {hero.backstory && (
                    <section className="backstory">
                      <ChapterHeading en="Backstory" th="ประวัติ" />
                      <p lang="th">{hero.backstory}</p>
                    </section>
                  )}
                  <footer className="hero-actions">
                    <span className="hero-date">
                      Created {new Date(hero.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <span className="hero-buttons">
                      <button type="button" className="btn btn-ink" onClick={startEdit}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`btn btn-ink hero-delete ${confirming ? "is-confirm" : ""}`}
                        onClick={remove}
                        onBlur={() => setConfirming(false)}
                      >
                        {confirming ? `Delete ${hero.name}?` : "Delete"}
                      </button>
                    </span>
                  </footer>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
