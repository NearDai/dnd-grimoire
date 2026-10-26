import { useEffect, useRef, useState } from "react";
import { burstFrom, reduceMotion, shake } from "../lib/fx";
import DieArt, { DICE, type DieType } from "./DieArt";
import "./DiceTray.css";

export type RollResult = { type: DieType; value: number | "heads" | "tails"; max?: boolean; min?: boolean };

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
const ROLL_MS = 1150;
const COIN_MS = 1300;

interface Shown {
  value: string;
  label: string;
  max?: boolean;
  min?: boolean;
}

// ถาดลูกเต๋า: หยิบลูกจากชั้นวาง (ตอนแรกยังไม่หยิบ) แล้วทอยในถาด
export default function DiceTray({ onRoll }: { onRoll?: (r: RollResult) => void }) {
  const [current, setCurrent] = useState<DieType | null>(null);
  const [face, setFace] = useState<number | undefined>();
  const [rolling, setRolling] = useState(false);
  const [shown, setShown] = useState<Shown | null>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLButtonElement>(null);
  const shadowRef = useRef<HTMLSpanElement>(null);
  const resultRef = useRef<HTMLSpanElement>(null);
  const timers = useRef<number[]>([]);
  const dropped = useRef(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ลูกที่เพิ่งหยิบตกลงถาด
  useEffect(() => {
    if (!current || !dropped.current || reduceMotion) return;
    dropped.current = false;
    slotRef.current?.animate(
      [
        { transform: "translateY(-190px) rotate(-120deg) scale(0.6)", opacity: 0 },
        { transform: "translateY(12px) rotate(10deg) scale(1.06)", opacity: 1, offset: 0.7 },
        { transform: "translateY(-4px) rotate(-3deg) scale(0.99)", offset: 0.85 },
        { transform: "none" },
      ],
      { duration: 620, easing: EASE },
    );
    shadowRef.current?.animate([{ transform: "scale(0.3)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 620, easing: EASE });
  }, [current]);

  // ตัวเลขผลทอยเด้งขึ้น (scale/opacity เท่านั้น)
  useEffect(() => {
    if (!shown || reduceMotion) return;
    resultRef.current?.animate(
      [
        { transform: "scale(2.2)", opacity: 0 },
        { transform: "scale(0.92)", opacity: 1, offset: 0.6 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 520, easing: EASE },
    );
  }, [shown]);

  function pick(type: DieType) {
    if (rolling) return;
    setShown(null);
    if (current === type) {
      setCurrent(null); // วางคืนชั้นวาง
      return;
    }
    dropped.current = true;
    setFace(undefined);
    setCurrent(type);
  }

  function finish(res: RollResult) {
    setRolling(false);
    if (res.type === "coin") {
      setShown({ value: res.value === "heads" ? "Heads" : "Tails", label: res.value === "heads" ? "หัว" : "ก้อย" });
    } else {
      const label = res.type === "d20" && res.max ? "Natural 20!" : res.min ? "Critical fail" : res.max ? `Max ${res.type}!` : res.type;
      setShown({ value: String(res.value), label, max: res.max, min: res.min });
    }
    if (res.max) burstFrom(slotRef.current, { count: 28, spread: 150, size: 9 });
    else if (res.min) shake(trayRef.current, 7);
    else if (res.type === "coin") burstFrom(slotRef.current, { count: 10, spread: 70, size: 6 });
    onRoll?.(res);
  }

  function roll() {
    if (!current || rolling) return;
    const type = current;
    setRolling(true);
    setShown(null);

    if (type === "coin") {
      const heads = Math.random() < 0.5;
      const turns = 1800 + (heads ? 0 : 180);
      const coin = slotRef.current?.querySelector<HTMLElement>(".coin");
      const res: RollResult = { type, value: heads ? "heads" : "tails" };
      if (coin) coin.style.transform = `rotateY(${turns % 360}deg)`;
      if (reduceMotion || !coin) return finish(res);
      const ease = "cubic-bezier(0.33, 0.7, 0.4, 1)";
      coin.animate(
        [
          { transform: "translateY(0) rotateY(0deg) scale(1)" },
          { transform: `translateY(-150px) rotateY(${turns / 2}deg) scale(1.35)`, offset: 0.45 },
          { transform: `translateY(6px) rotateY(${turns - 20}deg) scale(0.98)`, offset: 0.85 },
          { transform: `translateY(0) rotateY(${turns}deg) scale(1)` },
        ],
        { duration: COIN_MS, easing: ease },
      ).onfinish = () => finish(res);
      shadowRef.current?.animate(
        [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0.4)", opacity: 0.3, offset: 0.45 }, { transform: "scale(1)", opacity: 1 }],
        { duration: COIN_MS, easing: ease },
      );
      return;
    }

    const sides = DICE[type].sides;
    const value = 1 + Math.floor(Math.random() * sides);
    const res: RollResult = { type, value, max: value === sides, min: value === 1 };
    if (reduceMotion) {
      setFace(value);
      return finish(res);
    }

    // หน้าลูกเต๋าเปลี่ยนเร็วตอนกลิ้งแรงแล้วช้าลง และล็อกผลจริงที่ ~38% ของเวลา
    // (เส้นความเร็ว ease-out ทำให้ลูกเต๋าเกือบหยุดตั้งแต่ครึ่งแรก ตัวเลขจึงไม่วิ่งตอนลูกนิ่งแล้ว)
    const lockAt = ROLL_MS * 0.38;
    let shownFace = value;
    let elapsed = 0;
    let gap = 50;
    const tumble = () => {
      if (elapsed + gap >= lockAt) {
        timers.current.push(window.setTimeout(() => setFace(value), lockAt - elapsed));
        return;
      }
      timers.current.push(
        window.setTimeout(() => {
          let next;
          do next = 1 + Math.floor(Math.random() * sides);
          while (next === shownFace);
          shownFace = next;
          setFace(next);
          elapsed += gap;
          gap *= 1.25;
          tumble();
        }, gap),
      );
    };
    tumble();

    const dir = Math.random() < 0.5 ? 1 : -1;
    const path = [
      [-140 * dir, -80, -620 * dir, 0.65],
      [80 * dir, 34, -260 * dir, 1.08],
      [-46 * dir, -22, -80 * dir, 0.97],
      [16 * dir, 8, 16 * dir, 1.02],
      [0, 0, 0, 1],
    ];
    const offsets = [0, 0.32, 0.58, 0.8, 1];
    const ease = "cubic-bezier(0.2, 0.7, 0.3, 1)";
    const anim = slotRef.current?.animate(
      path.map(([x, y, r, s], i) => ({ transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`, offset: offsets[i] })),
      { duration: ROLL_MS, easing: ease },
    );
    shadowRef.current?.animate(
      path.map(([x, y, , s], i) => ({ transform: `translate(${x}px, ${y * 0.3}px) scale(${s})`, offset: offsets[i] })),
      { duration: ROLL_MS, easing: ease },
    );
    const done = () => {
      setFace(value);
      finish(res);
    };
    if (anim) anim.onfinish = done;
    else done();
  }

  const t = current ? DICE[current] : null;

  return (
    <div className="dt">
      <div className="dt-tray" ref={trayRef}>
        <div className={`dt-felt ${shown?.max ? "is-max" : ""} ${shown?.min ? "is-min" : ""}`}>
          {!current && (
            <p className="dt-empty" lang="th">
              หยิบลูกเต๋าจากชั้นวาง
              <br />
              มาวางในถาด
            </p>
          )}
          {current && (
            <>
              <button
                type="button"
                ref={slotRef}
                className={`dt-slot dt-slot-${current}`}
                onClick={roll}
                aria-label={current === "coin" ? "Flip the coin" : `Roll the ${current}`}
              >
                <DieArt type={current} value={face} />
              </button>
              <span className="dt-shadow" ref={shadowRef} />
            </>
          )}
          <p className="dt-result" aria-live="polite">
            {shown && (
              <>
                <span className="dt-result-value" ref={resultRef}>
                  {shown.value}
                </span>
                <span className="dt-result-label">{shown.label}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="dt-rack" role="group" aria-label="Choose a die">
        {(Object.keys(DICE) as DieType[]).map((id) => (
          <button key={id} type="button" className="dt-pick" aria-pressed={current === id} onClick={() => pick(id)} title={DICE[id].th}>
            <span className="dt-pick-art">
              <DieArt type={id} />
            </span>
            <span className="dt-pick-name">{DICE[id].en}</span>
          </button>
        ))}
      </div>

      <button type="button" className="btn btn-gold dt-roll" disabled={!current || rolling} onClick={roll}>
        {!t ? "Pick a die" : current === "coin" ? "Flip coin" : `Roll ${t.en}`}
      </button>
    </div>
  );
}
