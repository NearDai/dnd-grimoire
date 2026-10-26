// ภาพลูกเต๋า SVG: d6 (จุดครบสามหน้าที่มองเห็น), d10, d20 และเหรียญหัวก้อย
export type DieType = "d6" | "d10" | "d20" | "coin";

// ลำดับที่นี่ = ลำดับบนชั้นวางลูกเต๋า (เหรียญอยู่อันแรก)
export const DICE: Record<DieType, { sides: number; en: string; th: string }> = {
  coin: { sides: 2, en: "Coin", th: "เหรียญหัวก้อย" },
  d6: { sides: 6, en: "d6", th: "ลูกเต๋า 6 หน้า" },
  d10: { sides: 10, en: "d10", th: "ลูกเต๋า 10 หน้า" },
  d20: { sides: 20, en: "d20", th: "ลูกเต๋า 20 หน้า" },
};

// ตำแหน่งจุดบนหน้าลูกเต๋า (u,v ในสี่เหลี่ยมหน่วย 0–1)
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.25, 0.75], [0.5, 0.5], [0.75, 0.25], [0.75, 0.75]],
  6: [[0.25, 0.2], [0.25, 0.5], [0.25, 0.8], [0.75, 0.2], [0.75, 0.5], [0.75, 0.8]],
};

// แปลงสี่เหลี่ยมหน่วยไปเป็นหน้าลูกบาศก์แต่ละด้าน (จุดกลมจะเอียงตามหน้าเอง)
const D6_FACES = {
  top: "matrix(40 -22 40 22 10 30)",
  left: "matrix(40 22 0 42 10 30)",
  right: "matrix(40 -22 0 42 50 52)",
};

// หน้าข้างที่มองเห็นต้องเป็นค่าที่อยู่ติดกันได้จริง (หน้าตรงข้ามรวมกันได้ 7)
function sideFaces(top: number): [number, number] {
  const adjacent = [1, 2, 3, 4, 5, 6].filter((n) => n !== top && n !== 7 - top);
  const left = adjacent[0];
  const right = adjacent.find((n) => n !== left && n !== 7 - left)!;
  return [left, right];
}

function Pips({ n, transform }: { n: number; transform: string }) {
  return (
    <g transform={transform}>
      {PIPS[n].map(([u, v], i) => (
        <circle key={i} cx={u} cy={v} r={0.095} />
      ))}
    </g>
  );
}

export default function DieArt({ type, value }: { type: DieType; value?: number }) {
  if (type === "d6") {
    const top = value ?? 6;
    const [left, right] = sideFaces(top);
    return (
      <svg className="die-art" viewBox="0 0 100 100" aria-hidden="true">
        <polygon points="10,30 50,8 90,30 50,52" fill="#f4ead2" />
        <polygon points="10,30 50,52 50,94 10,72" fill="#d8c69e" />
        <polygon points="90,30 50,52 50,94 90,72" fill="#b9a271" />
        <polygon points="10,30 50,8 90,30 90,72 50,94 10,72" fill="none" stroke="#6a4f33" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 30 50 52 90 30M50 52v42" fill="none" stroke="#a48d5e" strokeWidth="1" />
        <g fill="#3a2816">
          <Pips n={top} transform={D6_FACES.top} />
          <Pips n={left} transform={D6_FACES.left} />
          <Pips n={right} transform={D6_FACES.right} />
        </g>
      </svg>
    );
  }
  if (type === "d10") {
    return (
      <svg className="die-art" viewBox="0 0 100 100" aria-hidden="true">
        <polygon points="50,4 30,52 6,40" fill="#2f6b4f" />
        <polygon points="50,4 94,40 70,52" fill="#24563f" />
        <polygon points="6,40 30,52 50,64 14,66" fill="#1f4a36" />
        <polygon points="94,40 86,66 50,64 70,52" fill="#173a2a" />
        <polygon points="14,66 50,64 86,66 50,96" fill="#122e21" />
        <polygon points="50,4 70,52 50,64 30,52" fill="#3a8462" />
        <polygon points="50,4 94,40 86,66 50,96 14,66 6,40" fill="none" stroke="#0b1f16" strokeWidth="2" strokeLinejoin="round" />
        <text className="die-num" x="50" y="50" textAnchor="middle">
          {value ?? 10}
        </text>
      </svg>
    );
  }
  if (type === "d20") {
    return (
      <svg className="die-art" viewBox="0 0 100 100" aria-hidden="true">
        <polygon points="50,4 90,27 50,22" fill="#c4442f" />
        <polygon points="50,4 10,27 50,22" fill="#b33a27" />
        <polygon points="10,27 50,22 24,66" fill="#9b2d20" />
        <polygon points="10,27 24,66 10,73" fill="#7a2218" />
        <polygon points="90,27 50,22 76,66" fill="#a8321f" />
        <polygon points="90,27 76,66 90,73" fill="#6e1d14" />
        <polygon points="10,73 24,66 50,96" fill="#6e1d14" />
        <polygon points="24,66 76,66 50,96" fill="#5c170f" />
        <polygon points="76,66 90,73 50,96" fill="#4f130c" />
        <polygon points="50,22 76,66 24,66" fill="#b8402b" />
        <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="none" stroke="#3d0e08" strokeWidth="2" strokeLinejoin="round" />
        <text className="die-num" x="50" y="57" textAnchor="middle">
          {value ?? 20}
        </text>
      </svg>
    );
  }
  // เหรียญ: หน้า = ตราโล่, ก้อย = ดาว
  return (
    <span className="coin" aria-hidden="true">
      <span className="coin-face coin-heads">
        <svg viewBox="0 0 40 40">
          <path d="M20 7c4 2 7 2.4 10 2.4v8c0 7-4.4 11.8-10 14.2-5.6-2.4-10-7.2-10-14.2v-8c3 0 6-.4 10-2.4z" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <path d="M20 13v14M14 19h12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="coin-face coin-tails">
        <svg viewBox="0 0 40 40">
          <path d="M20 6l3.6 9.4 10 .6-7.8 6.3 2.6 9.7L20 26.6l-8.4 5.4 2.6-9.7-7.8-6.3 10-.6z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        </svg>
      </span>
    </span>
  );
}
