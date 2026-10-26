import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { memo, useEffect, useRef, useState, type Dispatch } from "react";
import { createPortal } from "react-dom";
import { abilities, classes, skills, type Klass } from "../../data";
import ClassIcon, { classAccent } from "../../components/ClassIcon";
import { reduceMotion } from "../../lib/fx";
import { signed } from "../../lib/rules";
import type { Action, CreateState } from "./state";
import "./ClassCarousel.css";

/* ── วงล้อเลือกอาชีพ ─────────────────────────────────────────────
 * ดัดแปลงจากแนว "tilted grid hero" แต่มองจากนอกทรงกระบอก: การ์ดเรียงบนผิวด้านนอก
 * ใบกลางอยู่หน้าสุด แบนหันหาจอ ใบข้างๆ โค้งหนีลึกเข้าไปด้านหลังแล้วจางหายที่ขอบ
 * ลาก/ปัด/ลูกศร/กดการ์ดข้างๆ เพื่อหมุน ปล่อยแล้วใบที่ใกล้ที่สุดล็อกกลางจอและถูกเลือก
 * แถบไอคอนด้านล่างกดเพื่อหมุนไปหาอาชีพนั้นทันที (ไฮไลต์สไลด์ตามแบบ animated tabs)
 * ตำแหน่งวงล้อ (pos) เป็นเลขทศนิยมของลำดับการ์ด เดินได้ไม่สิ้นสุด (วนรอบ)
 * ทุกการ์ดขยับด้วย transform/opacity เท่านั้น
 * ไม่ใช้ transform-style: preserve-3d (พื้นที่ 3D ร่วม): ทำให้ Chrome ต้องเรียงลึก/ตัดระนาบการ์ด 13 ใบ
 * ทุกเฟรมที่หมุน = เฟรมตก (วัดแล้ว: เฟรมช้า ~215 -> ~40 ต่อการลาก 2 ครั้ง) จึงฉายภาพมุมมองเองใน JS:
 * คำนวณตำแหน่งบนจอ + ย่อตามความลึก + บีบตามมุมเอียง + ลำดับซ้อน (z-index) เอง เป็น transform 2D ล้วน
 * ─────────────────────────────────────────────────────────────── */

const STEP = 16; // องศาระหว่างการ์ดติดกันบนทรงกระบอก (ยิ่งมาก ยิ่งโค้งหนีเร็ว)
const GAP = 1.3; // ระยะห่างการ์ด เทียบความกว้างการ์ด (1 = ชิดกันพอดี)
const PERSPECTIVE = 1300; // px ระยะกล้อง (ยิ่งน้อย ใบข้างยิ่งเล็กลงเร็ว)
const VISIBLE = 3; // เห็นการ์ดห่างจากกลางได้กี่ใบ เกินนี้ซ่อน
const SPRING = { type: "spring", stiffness: 260, damping: 32 } as const;
// โทนการ์ด: "dark" = พื้นไม้มืด ลายทอง (ลองใหม่), "light" = กระดาษสว่าง (แบบก่อนหน้า)
// ตอนเป็น "dark" แผ่นพื้นหลังของขั้นอาชีพทั้งแผ่นจะเปลี่ยนเป็นโทนมืดตามด้วย (ดู CreatePage)
export const CARD_THEME = "dark" as "dark" | "light";

const n = classes.length;
const mod = (a: number, m: number) => ((a % m) + m) % m;
// ระยะของการ์ด i จากตำแหน่งปัจจุบัน แบบวนรอบ (−n/2 .. n/2)
const offsetOf = (i: number, pos: number) => mod(i - pos + n / 2, n) - n / 2;

interface Props {
  state: CreateState;
  dispatch: Dispatch<Action>;
}

export default function ClassCarousel({ state, dispatch }: Props) {
  const startIndex = Math.max(0, classes.findIndex((c) => c.id === state.classId));
  const pos = useMotionValue(startIndex);
  const [centre, setCentre] = useState(startIndex);
  const stageRef = useRef<HTMLDivElement>(null);
  const [cardW, setCardW] = useState(320);
  const drag = useRef<{ x: number; pos: number; t: number; v: number; moved: boolean } | null>(null);
  const [accents, setAccents] = useState<Record<string, string>>({});

  // สีประจำอาชีพจากไอคอน (ใช้ทำแสงหลังไอคอนบนการ์ด)
  useEffect(() => {
    let alive = true;
    Promise.all(classes.map(async (c) => [c.id, await classAccent(c.id)] as const)).then((list) => {
      if (alive) setAccents(Object.fromEntries(list.filter(([, v]) => v)) as Record<string, string>);
    });
    return () => {
      alive = false;
    };
  }, []);

  // ความกว้างการ์ดตามพื้นที่ (มือถือยังเห็นการ์ดข้างๆ โผล่มา)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCardW(Math.round(Math.min(400, e.contentRect.width * 0.66))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const spacing = cardW * GAP;
  const radius = spacing / ((STEP * Math.PI) / 180);

  useMotionValueEvent(pos, "change", (p) => {
    const c = mod(Math.round(p), n);
    setCentre((prev) => (prev === c ? prev : c));
  });

  function choose(i: number) {
    const k = classes[i];
    if (state.classId !== k.id) dispatch({ type: "class", id: k.id });
  }

  // หมุนไปที่ตำแหน่ง target (ทศนิยมได้) แล้วล็อกที่ใบใกล้สุดและเลือกใบนั้น
  function settle(target: number) {
    const snap = Math.round(target);
    let chosen = false;
    const done = () => {
      if (chosen) return;
      chosen = true;
      choose(mod(snap, n));
    };
    if (reduceMotion) {
      pos.set(snap);
      return done();
    }
    // เลือกทันทีที่ตาเห็นว่าหยุด (ห่างจุดล็อกไม่ถึง 3% ของการ์ด) ไม่รอหางสปริงที่ค่อยๆ เข้าที่อีกเกือบวินาที
    animate(pos, snap, {
      ...SPRING,
      onUpdate: (p) => Math.abs(p - snap) < 0.03 && done(),
      onComplete: done,
    });
  }

  // ไปหาอาชีพ i ทางที่สั้นที่สุด
  const goTo = (i: number) => settle(Math.round(pos.get()) + offsetOf(i, Math.round(pos.get())));

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    pos.stop();
    drag.current = { x: e.clientX, pos: pos.get(), t: performance.now(), v: 0, moved: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    const now = performance.now();
    const next = d.pos - dx / spacing;
    d.v = ((next - pos.get()) / Math.max(1, now - d.t)) * 1000; // การ์ด/วินาที
    d.t = now;
    pos.set(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) {
      // ปัดแรงไปต่อได้อีกหน่อย แต่ไม่เกิน 3 ใบ
      settle(pos.get() + Math.max(-3, Math.min(3, d.v * 0.18)));
      return;
    }
    // แตะ (ไม่ได้ลาก): การ์ดข้างๆ = หมุนไปหา, ใบกลาง = เลือก
    const card = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
    if (!card) return;
    const i = Number(card.dataset.index);
    if (i === centre) choose(i);
    else goTo(i);
  }

  // ปัดสองนิ้วแนวนอนบนทัชแพด (ล้อเมาส์แนวตั้งปล่อยให้เลื่อนหน้าตามปกติ)
  const wheelTimer = useRef(0);
  function onWheel(e: React.WheelEvent) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    pos.stop();
    pos.set(pos.get() + e.deltaX / spacing);
    clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(() => settle(pos.get()), 120);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      settle(Math.round(pos.get()) + step);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(centre);
    }
  }

  const shown = classes[centre];

  // แผ่นพื้นหลังของขั้นนี้ (section.create-stage) ไว้วาดวงสีประจำอาชีพ
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(stageRef.current?.closest<HTMLElement>(".create-stage") ?? null), []);

  return (
    <div className={`cc ${CARD_THEME === "dark" ? "is-dark" : ""}`}>
      <div
        ref={stageRef}
        className="cc-stage"
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="Classes: use left and right arrow keys, Enter to choose"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      >
        <div className="cc-ring">
          {classes.map((c, i) => (
            <Card
              key={c.id}
              klass={c}
              index={i}
              pos={pos}
              radius={radius}
              width={cardW}
              isCentre={i === centre}
              selected={state.classId === c.id}
              accent={accents[c.id]}
            />
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {shown.id} {shown.nameTh} {state.classId === shown.id ? "selected" : ""}
      </p>


      <QuickPick current={centre} selectedId={state.classId} onPick={goTo} />

      {host &&
        createPortal(
          // สีตามอาชีพที่ "เลือกแล้ว" (ตั้งตอนการ์ดหมุนล็อกกลางเสร็จ) ไม่ใช่ใบที่ผ่านกลางระหว่างลาก
          // ลากผ่านหลายใบไม่หยุด พื้นหลังจะยังไม่เปลี่ยน จนกว่าจะหยุดที่ใบไหน
          <ClassTint host={host} from={stageRef.current} id={state.classId} color={state.classId ? accents[state.classId] : undefined} />,
          host,
        )}
    </div>
  );
}

/* ---------- วงสีประจำอาชีพขยายทับพื้นหลังทั้งแผ่น ----------
 * เลือกอาชีพใหม่ทีไร (หลังวงล้อหยุดล็อกกลาง) วงกลมสีของอาชีพนั้นขยายออกจากกลางวงล้อจนคลุมทั้งแผ่น ทับวงเก่า
 * - วงเป็นสีทึบ (สีอาชีพผสมสีพื้นไว้แล้วใน CSS) วงใหม่ทับวงเก่าจึงไม่ผสมสีกัน
 *   สีระหว่างขยายกับตอนนิ่งเป็นสีเดียวกัน ลายพื้น/ขอบมืดวาดทับอีกชั้น (.cc-tint-texture)
 * - ขยายด้วย Web Animations (transform: scale) ให้การ์ดจอทำ ไม่กินเธรดหลักระหว่างวงล้อหมุน
 * - กล่องวงเล็ก (TINT_SIZE) แล้วขยาย ขอบจึงนุ่มเองและไม่กินหน่วยความจำกราฟิก
 * - ขยายเสร็จแล้วลบวงเก่าที่อยู่ข้างใต้ทิ้ง */
const TINT_SIZE = 400;
const TINT_SOLID = 0.6; // ส่วนสีทึบของวง = 60% ของรัศมี (ต้องตรงกับ .cc-tint)

interface Tint {
  key: number;
  id: string;
  instant: boolean; // วงแรกสุด: แสดงเต็มทันที ไม่ต้องขยาย
  color: string;
  x: number;
  y: number;
  scale: number;
}

function ClassTint({ host, from, id, color }: { host: HTMLElement; from: HTMLElement | null; id: string | null; color?: string }) {
  const [tints, setTints] = useState<Tint[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    if (!id || !color) return;
    // วัดตำแหน่งตอนเปลี่ยนใบเท่านั้น (ไม่วัดระหว่าง render)
    const h = host.getBoundingClientRect();
    const f = from?.getBoundingClientRect();
    const x = f ? f.left + f.width / 2 - h.left - host.clientLeft : h.width / 2;
    const y = f ? f.top + f.height / 2 - h.top - host.clientTop : h.height / 2;
    const far = Math.max(Math.hypot(x, y), Math.hypot(h.width - x, y), Math.hypot(x, h.height - y), Math.hypot(h.width - x, h.height - y));
    const scale = (far / ((TINT_SIZE / 2) * TINT_SOLID)) * 1.05;
    setTints((list) => {
      if (list.at(-1)?.id === id) return list; // อาชีพเดิม (เช่น effect รันซ้ำ) ไม่ต้องเพิ่มวง
      seq.current += 1;
      return [...list, { key: seq.current, id, instant: list.length === 0, color, x, y, scale }];
    });
  }, [id, color, host, from]);

  function grow(el: HTMLSpanElement | null, t: Tint) {
    if (!el || el.dataset.grown) return;
    el.dataset.grown = "1";
    const done = () => setTints((list) => list.filter((o) => o.key >= t.key));
    if (t.instant || reduceMotion) {
      el.style.transform = `scale(${t.scale})`;
      return done();
    }
    el.animate([{ transform: "scale(0)" }, { transform: `scale(${t.scale})` }], {
      duration: 600,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
      fill: "forwards",
    }).onfinish = done;
  }

  return (
    <div className="cc-tints" aria-hidden="true">
      {tints.map((t) => (
        <span
          key={t.key}
          ref={(el) => grow(el, t)}
          className="cc-tint"
          style={{ left: t.x - TINT_SIZE / 2, top: t.y - TINT_SIZE / 2, width: TINT_SIZE, height: TINT_SIZE, "--tint": t.color } as React.CSSProperties}
        />
      ))}
      <span className="cc-tint-texture" />
    </div>
  );
}

/* ---------- การ์ดหนึ่งใบบนทรงกระบอก ---------- */
// memo: ตอนลากผ่านการ์ด ใบกลางเปลี่ยนทีไรมีแค่ 2 ใบที่ต้องวาดใหม่ (ใบที่เข้า/ออกจากกลาง) ไม่ใช่ทั้ง 13 ใบ
const Card = memo(function Card({
  klass: c,
  index,
  pos,
  radius,
  width,
  isCentre,
  selected,
  accent,
}: {
  klass: Klass;
  index: number;
  pos: MotionValue<number>;
  radius: number;
  width: number;
  isCentre: boolean;
  selected: boolean;
  accent?: string;
}) {
  const transform = useTransform(pos, (p) => {
    const d = offsetOf(index, p);
    if (Math.abs(d) > VISIBLE + 0.5) return "scale(0)";
    const a = (d * STEP * Math.PI) / 180;
    // ด้านนอกทรงกระบอก: ออกข้างตาม sin, ถอยลึกจากกล้องตาม (1 − cos)
    // ฉายภาพเอง: ไกลเท่าไหร่ ย่อเท่านั้น และระยะออกข้างหดตาม (จุดลับตาร่วมกันที่กลางเวที)
    const depth = radius * (1 - Math.cos(a));
    const k = PERSPECTIVE / (PERSPECTIVE + depth);
    // เอียงหันหน้าออกจากแกน = บีบแนวนอนตาม cos(มุม) (rotateY แบบไม่มีระยะกล้อง)
    // ใช้ transform 2D ล้วน: perspective()/rotateY ต่อใบทำให้การ์ดจอต้องวาดภาพเอียงเปอร์สเปกทีฟทุกเฟรม (วัดแล้วเฟรมหลุดเพิ่ม ~3 เท่า)
    return `translateX(${radius * Math.sin(a) * k}px) scale(${k * Math.cos(a)}, ${k})`;
  });
  // ใบใกล้กลางซ้อนอยู่บนสุด (แทนการเรียงลึกอัตโนมัติของ preserve-3d)
  // เปลี่ยนเป็นขั้นทีละใบเท่านั้น: z-index ที่เปลี่ยนทุกเฟรมทำให้เบราว์เซอร์จัดลำดับเลเยอร์ใหม่ทุกเฟรม = เฟรมตก
  const zIndex = useTransform(pos, (p) => 100 - Math.round(Math.abs(offsetOf(index, p))));
  const opacity = useTransform(pos, (p) => {
    const d = Math.abs(offsetOf(index, p));
    return d <= 1.6 ? 1 : Math.max(0, 1 - (d - 1.6) / (VISIBLE - 1.6));
  });
  // ใบที่หมุนไปด้านหลังซ่อนจริง (visibility) ไม่ใช่แค่โปร่งใส จะได้ไม่กินแรงเครื่องตอนลอยอยู่
  const visibility = useTransform(pos, (p) => (Math.abs(offsetOf(index, p)) > VISIBLE ? "hidden" : "visible"));
  // ใบข้างๆ หรี่ลงด้วยชั้นเงา (ไม่ใช้ filter ตามกฎประสิทธิภาพ)
  const dim = useTransform(pos, (p) => Math.min(0.55, Math.abs(offsetOf(index, p)) * 0.25));

  const special = skills.filter((s) => s.tier === "special" && s.classes.includes(c.id));
  const stats = abilities.filter((a) => c.bonus[a.id] || c.primary.includes(a.id));

  // สีประจำอาชีพตั้งครั้งเดียวที่ตัว element ห้ามส่งผ่าน style ของ motion:
  // framer เขียนตัวแปร CSS ซ้ำทุกเฟรมที่วงล้อหมุน แม้ค่าเดิม -> พื้นการ์ด (ใช้ --accent) ถูกวาดใหม่ทุกเฟรมทุกใบ = เฟรมตก
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (accent) ref.current?.style.setProperty("--accent", accent);
  }, [accent]);

  return (
    <motion.div
      ref={ref}
      className={`cc-card ${isCentre ? "is-centre" : ""} ${selected ? "is-selected" : ""}`}
      data-index={index}
      aria-hidden={!isCentre}
      style={{
        transform,
        opacity,
        visibility,
        zIndex,
        width,
        marginLeft: -width / 2,
        animationDelay: `${-index * 0.9}s`, // แต่ละใบลอยคนละจังหวะ
      }}
    >
      <span className="cc-corners" aria-hidden="true" />
      {selected && <span className="cc-sheen" aria-hidden="true" />}
      <span className="card-hd" title="Hit die">
        <small>HD</small>d{c.hitDie}
      </span>
      <span className="card-art">
        <ClassIcon id={c.id} />
      </span>
      <span className="card-title">
        <span className="card-name">{c.id}</span>
        <span className="th" lang="th">
          {c.nameTh}
        </span>
      </span>
      <span className="card-role">{c.role}</span>
      <span className="cc-rule" aria-hidden="true" />
      <span className="card-text" lang="th">
        {c.summary}
      </span>
      <span className="card-stats">
        {stats.map((a) => {
          const plus = c.bonus[a.id] ?? 0;
          return (
            <span key={a.id} className={`card-stat ${plus ? "is-bonus" : ""}`}>
              {c.primary.includes(a.id) && "★"}
              {a.id}
              {plus ? <b>{signed(plus)}</b> : null}
            </span>
          );
        })}
      </span>
      <span className="cc-skills">
        <span className="cc-skills-head" lang="th">
          ✦ สกิลพิเศษ {special.length} สกิล
        </span>
        {special.slice(0, 6).map((s) => (
          <span key={s.id} className="cc-skill">
            {s.nameEn}
          </span>
        ))}
        {special.length > 6 && <span className="cc-skill is-more">+{special.length - 6}</span>}
      </span>
      <motion.span className="cc-dim" style={{ opacity: dim }} aria-hidden="true" />
    </motion.div>
  );
});

/* ---------- แถวไอคอนเลือกเร็ว: ไอคอนอย่างเดียว ไม่มีกรอบ จุดทองสไลด์ตามใบที่อยู่กลาง ---------- */
function QuickPick({ current, selectedId, onPick }: { current: number; selectedId: string | null; onPick: (i: number) => void }) {
  return (
    <div className="cc-pick" role="radiogroup" aria-label="Class">
      {classes.map((c, i) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={selectedId === c.id}
          aria-label={`${c.id} ${c.nameTh}`}
          title={`${c.id} · ${c.nameTh}`}
          className={`cc-pick-item ${i === current ? "is-current" : ""}`}
          onClick={() => onPick(i)}
        >
          {i === current && (
            <motion.span
              layoutId="cc-pick-glow"
              className="cc-pick-glow"
              transition={reduceMotion ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.35 }}
            />
          )}
          <span className="cc-pick-icon">
            <ClassIcon id={c.id} />
          </span>
        </button>
      ))}
    </div>
  );
}
