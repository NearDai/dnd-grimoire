import { AnimatePresence, motion } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { howTo, type HowToSection } from "../data";
import { reduceMotion } from "../lib/fx";
import { onTabKeys } from "../lib/tabs";
import "./HowToPlay.css";

// วิธีเล่น: สารบัญแบบสันหนังสือ (บทที่ 1–9 เรียงตามลำดับที่ควรอ่าน) + หน้าเนื้อหาของบทที่เลือก
// เนื้อหามาจากชีต How to Play ใน Excel แล้วแปลงข้อความเป็นรูปแบบที่อ่านง่าย:
// "1. ..." = ขั้นตอน, "a • b • c" = ป้ายรายการ, "คำ: ..." = หัวข้อตัวหนา, "x → y → z" ในตัวอย่าง = เส้นทางการคำนวณ

// ไอคอนประจำบท (เส้นเดียว ใช้ currentColor) — บทที่ไม่มีในรายการใช้ไอคอนหนังสือ
const ICONS: Record<string, ReactNode> = {
  basics: <path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5zM12 6v13.5" />,
  character: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6" />
    </>
  ),
  checks: (
    <>
      <path d="M12 3l8 4.6v8.8L12 21l-8-4.6V7.6z" />
      <path d="M12 3v6m0 0l8-1.4M12 9L4 7.6M12 9l-5 7.5m5-7.5l5 7.5M7 16.5h10" />
    </>
  ),
  combat: <path d="M5 4l9.5 9.5M4 5l1-1m9.5 9.5l-2 2m2-2l2 2M19 4L9.5 13.5M20 5l-1-1M9.5 13.5l2 2m-2-2l-2 2M5 17l2 2m10-2l-2 2" />,
  health: <path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0112 7.4 4.2 4.2 0 0119.5 10c0 5.4-7.5 10-7.5 10z" />,
  magic: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />,
  growth: <path d="M4 19h4v-4h4v-4h4V7h4M16 3h4v4" />,
  conditions: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.5a3.5 3.5 0 103.5 3.5M12 12h.01" />
    </>
  ),
  explore: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
};

function TopicIcon({ id }: { id: string }) {
  return (
    <svg className="howto-icon" viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[id] ?? ICONS.basics}
    </svg>
  );
}

const STEP = /^\d+\.\s+/;
const TERM = /^([^:：]{1,32})[:：]\s*(.+)$/;

// "คำ: ข้อความ" → คำตัวหนา + ข้อความ; ส่วนที่คั่นด้วย • สั้น ๆ ทั้งหมด → ป้าย
function Line({ text }: { text: string }) {
  const term = TERM.exec(text);
  const head = term ? term[1] : null;
  const rest = term ? term[2] : text;
  const parts = rest.split(" • ");
  const chips = parts.length > 2 && parts.every((p) => p.length <= 44);
  return (
    <>
      {head && <b className="howto-term">{head}</b>}
      {chips ? (
        <span className="howto-chips">
          {parts.map((p) => (
            <span key={p} className="howto-chip">
              {p}
            </span>
          ))}
        </span>
      ) : (
        <span>{parts.join(" • ")}</span>
      )}
    </>
  );
}

function Body({ lines }: { lines: string[] }) {
  if (lines.length === 1) {
    return (
      <p className="howto-text">
        <Line text={lines[0]} />
      </p>
    );
  }
  const steps = lines.every((l) => STEP.test(l));
  const List = steps ? "ol" : "ul";
  return (
    <List className={steps ? "howto-steps" : "howto-list"}>
      {lines.map((l) => (
        <li key={l}>
          <Line text={steps ? l.replace(STEP, "") : l} />
        </li>
      ))}
    </List>
  );
}

// ตัวอย่าง: บทสนทนา (DM: / ผู้เล่น:) แสดงเป็นบทพูด, "a → b → c" แสดงเป็นเส้นทางที่ขั้นสุดท้ายคือผลลัพธ์
function Example({ lines }: { lines: string[] }) {
  return (
    <figure className="howto-example">
      <figcaption>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l8 4.6v8.8L12 21l-8-4.6V7.6z" />
        </svg>
        ตัวอย่าง
      </figcaption>
      {lines.map((line) => {
        const speaker = /^(DM|ผู้เล่น)[:：]\s*(.+)$/.exec(line);
        if (speaker) {
          return (
            <p key={line} className={`howto-say ${speaker[1] === "DM" ? "is-dm" : "is-player"}`}>
              <b>{speaker[1]}</b>
              <span>{speaker[2]}</span>
            </p>
          );
        }
        return line.split(" • ").map((part) => {
          const steps = part.split(/\s*→\s*/).filter(Boolean);
          if (steps.length < 2) {
            return (
              <p key={part} className="howto-note">
                {part}
              </p>
            );
          }
          return (
            <ol key={part} className="howto-trail">
              {steps.map((s, i) => (
                <li key={`${i}-${s}`} className={i === steps.length - 1 ? "is-result" : ""}>
                  {s}
                </li>
              ))}
            </ol>
          );
        });
      })}
    </figure>
  );
}

function Section({ sec, compact }: { sec: HowToSection; compact: boolean }) {
  return (
    <article className={compact ? "howto-tile" : "howto-row"}>
      <h3 className="howto-row-title">
        {sec.en}
        <span className="th" lang="th">
          {sec.th}
        </span>
      </h3>
      <div className="howto-row-body" lang="th">
        <Body lines={sec.body} />
        {sec.example.length > 0 && <Example lines={sec.example} />}
      </div>
    </article>
  );
}

export default function HowToPlay() {
  const [params, setParams] = useSearchParams();
  const index = Math.max(0, howTo.findIndex((t) => t.id === params.get("topic")));
  const topic = howTo[index];
  const pick = (i: number) => setParams(i === 0 ? {} : { topic: howTo[i].id }, { replace: true });
  const root = useRef<HTMLDivElement>(null);
  // ปุ่มบทก่อน/ถัดไปอยู่ท้ายหน้า: เปลี่ยนบทแล้วเลื่อนกลับไปหัวบท
  const turn = (i: number) => {
    pick(i);
    root.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  };

  if (!topic) {
    return (
      <p className="empty" lang="th">
        ยังไม่มีคู่มือวิธีเล่น (เพิ่มได้ในชีต How to Play)
      </p>
    );
  }

  const compact = topic.sections.every((s) => s.body.length <= 3 && s.example.length <= 1) && topic.sections.length > 8;
  const prev = howTo[index - 1];
  const next = howTo[index + 1];

  return (
    <div className="howto" ref={root}>
      <nav className="howto-spine" aria-label="How to play chapters">
        <p className="howto-spine-title">
          How to play <span className="th" lang="th">วิธีเล่น</span>
        </p>
        <div role="tablist" aria-orientation="vertical" onKeyDown={onTabKeys}>
          {howTo.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`howto-tab-${t.id}`}
              aria-controls="howto-page"
              aria-selected={i === index}
              tabIndex={i === index ? 0 : -1}
              className="howto-chapter"
              onClick={() => pick(i)}
            >
              <span className="howto-chapter-no">{i + 1}</span>
              <span className="howto-chapter-name">
                {t.en}
                <span className="th" lang="th">
                  {t.th}
                </span>
              </span>
            </button>
          ))}
        </div>
      </nav>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={topic.id}
          className="howto-page"
          id="howto-page"
          role="tabpanel"
          aria-labelledby={`howto-tab-${topic.id}`}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        >
          <header className={`howto-head topic-${topic.id}`}>
            <span className="howto-head-icon">
              <TopicIcon id={topic.id} />
            </span>
            <div>
              <p className="howto-head-no" lang="th">
                บทที่ {index + 1} จาก {howTo.length}
              </p>
              <h2 className="howto-head-title">
                {topic.en}
                <span className="th" lang="th">
                  {topic.th}
                </span>
              </h2>
              {topic.summary && (
                <p className="howto-head-summary" lang="th">
                  {topic.summary}
                </p>
              )}
            </div>
          </header>

          <div className={compact ? "howto-tiles" : "howto-rows"}>
            {topic.sections.map((sec) => (
              <Section key={sec.en} sec={sec} compact={compact} />
            ))}
          </div>

          <footer className="howto-pager">
            {prev ? (
              <button type="button" className="howto-pager-btn" onClick={() => turn(index - 1)}>
                <small lang="th">บทก่อนหน้า</small>
                {prev.th || prev.en}
              </button>
            ) : (
              <span />
            )}
            {next && (
              <button type="button" className="howto-pager-btn is-next" onClick={() => turn(index + 1)}>
                <small lang="th">บทถัดไป</small>
                {next.th || next.en}
              </button>
            )}
          </footer>
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
