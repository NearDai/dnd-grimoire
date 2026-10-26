import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { reduceMotion } from "../lib/fx";
import DiceTray from "./DiceTray";
import DieArt from "./DieArt";
import "./DiceDrawer.css";

// แท็บลูกเต๋าเล็กๆ ติดขอบซ้ายของจอ กดแล้วถาดเด้งออกมาจากขอบ กด Esc, × หรือแท็บอีกครั้งเพื่อเก็บ
export default function DiceDrawer() {
  const [open, setOpen] = useState(false);
  const tabRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true }); // เปิดถาดแล้วพาโฟกัสเข้าไปด้วย
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        tabRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="dice-drawer">
      <button
        type="button"
        ref={tabRef}
        className="dice-tab"
        aria-expanded={open}
        aria-controls="dice-panel"
        aria-label={open ? "Close dice tray" : "Open dice tray"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="dice-tab-art">
          <DieArt type="d20" />
        </span>
        <span className="dice-tab-label">Dice</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            id="dice-panel"
            className="dice-panel"
            aria-label="Dice tray"
            initial={reduceMotion ? { opacity: 0 } : { x: "-110%" }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: "-110%" }}
            transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 420, damping: 34 }}
          >
            <header className="dice-panel-head">
              <h2>
                Dice <span className="th" lang="th">ลูกเต๋า</span>
              </h2>
              <button
                type="button"
                ref={closeRef}
                className="dice-close"
                onClick={() => {
                  setOpen(false);
                  tabRef.current?.focus();
                }}
                aria-label="Close dice tray"
              >
                ×
              </button>
            </header>
            <DiceTray />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
