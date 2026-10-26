import { abilities, settings, startingSkillsFor, type Klass } from "../../data";
import { roll4d6DropLowest, standardFor, type Scores } from "../../lib/rules";

export const STEPS = [
  { id: "race", en: "Race", th: "เผ่าพันธุ์" },
  { id: "class", en: "Class", th: "อาชีพ" },
  { id: "abilities", en: "Abilities", th: "ค่าสถานะ" },
  { id: "skills", en: "Skills", th: "สกิลเริ่มต้น" },
  { id: "identity", en: "Identity", th: "ตัวตน" },
] as const;

export interface CreateState {
  step: number;
  direction: 1 | -1;
  raceId: string | null;
  classId: string | null;
  base: Scores | null; // ค่าสถานะก่อนบวกโบนัสเผ่า
  rollDetail: Record<string, number[]> | null; // ลูกเต๋า 4 ลูกของแต่ละค่าจากการทอยครั้งล่าสุด
  rollId: number; // เปลี่ยนทุกครั้งที่ทอย ใช้เล่นแอนิเมชันลูกเต๋าเล็ก (0 = ยังไม่เคยทอย)
  rerollsLeft: number;
  swapPick: string | null;
  skillIds: string[]; // เรียงตามลำดับที่เลือก
  droppedSkills: string[]; // สกิลที่ถูกเอาออกเพราะเปลี่ยนอาชีพครั้งล่าสุด (ไว้แจ้งผู้เล่น)
  name: string;
  alignment: string;
  backstory: string;
  saved: boolean;
}

export const initialState: CreateState = {
  step: 0,
  direction: 1,
  raceId: null,
  classId: null,
  base: null,
  rollDetail: null,
  rollId: 0,
  rerollsLeft: settings.maxRerolls,
  swapPick: null,
  skillIds: [],
  droppedSkills: [],
  name: "",
  alignment: "",
  backstory: "",
  saved: false,
};

export type Action =
  | { type: "goto"; step: number }
  | { type: "race"; id: string }
  | { type: "class"; id: string }
  | { type: "roll" }
  | { type: "standard"; klass: Klass | undefined }
  | { type: "swap"; id: string }
  | { type: "skill"; id: string }
  | { type: "field"; field: "name" | "alignment" | "backstory"; value: string }
  | { type: "saved" }
  | { type: "reset" };

// ขั้นนี้ยังไปต่อไม่ได้เพราะอะไร (ข้อความไทยใต้ปุ่ม Next) — "" = ไปต่อได้
export function blockedReason(s: CreateState, i: number) {
  switch (STEPS[i].id) {
    case "race":
      return s.raceId ? "" : "เลือกเผ่าพันธุ์ก่อน";
    case "class":
      return s.classId ? "" : "เลือกอาชีพก่อน";
    case "abilities":
      return s.base ? "" : "ทอยลูกเต๋าหรือใช้ชุดมาตรฐานก่อน";
    case "skills": {
      const left = settings.startingSkillCount - s.skillIds.length;
      return left > 0 ? `เลือกอีก ${left} สกิล` : "";
    }
    case "identity":
      return s.name.trim() ? "" : "ตั้งชื่อตัวละครก่อน";
  }
}

/* ---------- ร่างที่ยังสร้างไม่เสร็จ: เก็บใน sessionStorage กันหายเมื่อสลับหน้า/รีเฟรช ---------- */
const DRAFT_KEY = "dnd.createDraft";

export function loadDraft(): CreateState {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) return { ...initialState, ...JSON.parse(raw), saved: false, swapPick: null, droppedSkills: [] };
  } catch {
    /* ไม่มีที่เก็บหรือข้อมูลเสีย เริ่มใหม่ */
  }
  return initialState;
}

export function saveDraft(s: CreateState) {
  try {
    if (s.saved) sessionStorage.removeItem(DRAFT_KEY);
    else sessionStorage.setItem(DRAFT_KEY, JSON.stringify(s));
  } catch {
    /* เก็บไม่ได้ก็แค่ไม่มีร่าง */
  }
}

export const isStepDone = (s: CreateState, i: number) => blockedReason(s, i) === "";

export const canReach = (s: CreateState, i: number) => STEPS.slice(0, i).every((_, j) => isStepDone(s, j));

export function reducer(s: CreateState, a: Action): CreateState {
  switch (a.type) {
    case "goto":
      if (a.step === s.step || a.step < 0 || a.step >= STEPS.length || !canReach(s, a.step)) return s;
      return { ...s, step: a.step, direction: a.step > s.step ? 1 : -1, swapPick: null, droppedSkills: [] };
    case "race":
      return { ...s, raceId: a.id };
    case "class": {
      // เปลี่ยนอาชีพแล้ว เก็บไว้เฉพาะสกิลที่อาชีพใหม่ยังเลือกได้
      const allowed = new Set(startingSkillsFor(a.id).map((sk) => sk.id));
      return {
        ...s,
        classId: a.id,
        skillIds: s.skillIds.filter((id) => allowed.has(id)),
        droppedSkills: s.skillIds.filter((id) => !allowed.has(id)),
      };
    }
    case "roll": {
      if (s.rerollsLeft <= 0) return s;
      const base: Scores = {};
      const rollDetail: Record<string, number[]> = {};
      abilities.forEach((ab) => {
        const r = roll4d6DropLowest();
        base[ab.id] = r.total;
        rollDetail[ab.id] = r.dice;
      });
      return {
        ...s,
        base,
        rollDetail,
        rollId: s.rollId + 1,
        // ทอยครั้งแรกฟรี ครั้งต่อๆ ไปหักโควตาเสมอ แม้กดชุดมาตรฐานคั่นกลาง (rollDetail ถูกล้าง แต่ rollId ไม่)
        rerollsLeft: s.rollId > 0 ? s.rerollsLeft - 1 : s.rerollsLeft,
        swapPick: null,
      };
    }
    case "standard":
      return { ...s, base: standardFor(a.klass), rollDetail: null, swapPick: null };
    case "swap": {
      if (!s.base) return s;
      if (!s.swapPick) return { ...s, swapPick: a.id };
      if (s.swapPick === a.id) return { ...s, swapPick: null };
      const x = s.swapPick;
      const base = { ...s.base, [x]: s.base[a.id], [a.id]: s.base[x] };
      const rollDetail = s.rollDetail ? { ...s.rollDetail, [x]: s.rollDetail[a.id], [a.id]: s.rollDetail[x] } : null;
      return { ...s, base, rollDetail, swapPick: null };
    }
    case "skill": {
      const has = s.skillIds.includes(a.id);
      if (!has && s.skillIds.length >= settings.startingSkillCount) return s;
      return { ...s, skillIds: has ? s.skillIds.filter((id) => id !== a.id) : [...s.skillIds, a.id] };
    }
    case "field":
      return { ...s, [a.field]: a.value };
    case "saved":
      return { ...s, saved: true, direction: 1 };
    case "reset":
      return { ...initialState, direction: -1 };
  }
}
