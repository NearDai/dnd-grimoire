import { abilities, settings, type AbilityId, type Klass, type Race } from "../data";

export type Scores = Record<AbilityId, number>;

export const modOf = (score: number) => Math.floor((score - 10) / 2);
export const signed = (n: number) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

const d6 = () => 1 + Math.floor(Math.random() * 6);

// ทอย 4d6 ตัดลูกต่ำสุดทิ้ง: dice เรียงมากไปน้อย ลูกสุดท้ายคือลูกที่ถูกตัด
export function roll4d6DropLowest() {
  const dice = [d6(), d6(), d6(), d6()].sort((a, b) => b - a);
  return { dice, total: dice[0] + dice[1] + dice[2] };
}

// เรียงชุดค่ามาตรฐานให้ค่าสูงสุดไปอยู่ที่ค่าสถานะหลักของอาชีพ
export function standardFor(klass: Klass | undefined): Scores {
  const primary = klass ? klass.primary : [];
  const order = [...primary, ...abilities.map((a) => a.id).filter((id) => !primary.includes(id))];
  const out: Scores = {};
  order.forEach((id, i) => {
    out[id] = settings.standardArray[i];
  });
  return out;
}

// ค่าสถานะสุดท้าย = ค่าที่ทอยได้ + โบนัสเผ่า + โบนัสอาชีพ
export function finalScores(base: Scores | null, race: Race | undefined, klass?: Klass): Scores | null {
  if (!base) return null;
  const out: Scores = {};
  abilities.forEach((a) => {
    out[a.id] = base[a.id] + (race?.bonus[a.id] ?? 0) + (klass?.bonus[a.id] ?? 0);
  });
  return out;
}

export const hitPoints = (klass: Klass, scores: Scores) => Math.max(1, klass.hitDie + modOf(scores.CON));
export const armorClass = (scores: Scores) => settings.baseAc + modOf(scores.DEX);
