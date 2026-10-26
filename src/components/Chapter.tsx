import type { ReactNode } from "react";
import "./Chapter.css";

// หัวข้อของแต่ละขั้น/หมวด: ชื่ออังกฤษใหญ่ ไทยรอง และคำอธิบายสั้น
export function ChapterHeading({ kicker, en, th, children }: { kicker?: string; en: string; th: string; children?: ReactNode }) {
  return (
    <header className="chapter-head">
      {kicker && <p className="chapter-kicker">{kicker}</p>}
      <h2 className="chapter-title" tabIndex={-1}>
        {en} <span className="th" lang="th">{th}</span>
      </h2>
      {children && (
        <p className="chapter-lede" lang="th">
          {children}
        </p>
      )}
    </header>
  );
}

// แถบขั้นตอน: เพชรทองเรียงตามลำดับ เชื่อมด้วยเส้น (แนวตั้งบนจอกว้าง แนวนอนบนจอแคบ)
interface Step {
  id: string;
  en: string;
  th: string;
  done?: boolean;
  disabled?: boolean;
}

export function StepRail({ steps, current, onSelect }: { steps: Step[]; current: number; onSelect: (i: number) => void }) {
  return (
    <nav className="rail" aria-label="Steps">
      <ol>
        {steps.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className={`rail-step ${i === current ? "is-current" : ""} ${s.done ? "is-done" : ""}`}
              aria-current={i === current ? "step" : undefined}
              disabled={s.disabled}
              onClick={() => onSelect(i)}
            >
              <span className="rail-gem" aria-hidden="true">
                <span>{s.done && i !== current ? "✓" : i + 1}</span>
              </span>
              <span className="rail-label">
                {s.en}
                <span className="th" lang="th">
                  {s.th}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
