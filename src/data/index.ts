// ข้อมูลเกมทั้งหมดมาจาก Excel ผ่าน tools/export_data.py (อย่าแก้ไฟล์ .json ด้วยมือ)
import game from "./gamedata.json";
import skillList from "./skills.json";

export type AbilityId = string;

export interface Ability {
  id: AbilityId;
  nameEn: string;
  nameTh: string;
}

export interface Race {
  id: string;
  nameEn: string;
  nameTh: string;
  summary: string;
  bonus: Record<AbilityId, number>;
  speed: number;
  trait: { en: string; th: string };
}

export interface Klass {
  id: string;
  nameTh: string;
  role: string;
  hitDie: number;
  primary: AbilityId[];
  bonus: Record<AbilityId, number>; // ค่าสถานะที่อาชีพบวกให้ (คอลัมน์ STR..CHA ในชีต Classes)
  summary: string;
}

export interface Alignment {
  id: string;
  en: string;
  th: string;
}

export interface Settings {
  standardArray: number[];
  maxRerolls: number;
  startingSkillLevel: number;
  startingSkillCount: number;
  baseAc: number;
}

export type SkillTier = "normal" | "special";

export interface Skill {
  id: string;
  level: number;
  tier: SkillTier;
  nameEn: string;
  nameTh: string;
  effect: string;
  note: string;
  requires: string[];
  classes: string[];
}

export const abilities = game.abilities as Ability[];
export const races = game.races as unknown as Race[];
export const classes = game.classes as unknown as Klass[];
export const alignments = game.alignments as Alignment[];
export const settings = game.settings as Settings;
export const skills = skillList as Skill[];

export const raceById = (id: string | null) => races.find((r) => r.id === id);
export const classById = (id: string | null) => classes.find((c) => c.id === id);
export const skillById = (id: string) => skills.find((s) => s.id === id);
export const alignmentById = (id: string | null) => alignments.find((a) => a.id === id);

// สกิลเริ่มต้นเลือกได้เฉพาะสกิลปกติ (ชีต Normal Skills) ส่วนสกิลพิเศษปลดล็อกระหว่างเล่น
export function startingSkillsFor(classId: string | null) {
  return skills.filter(
    (s) =>
      s.tier === "normal" &&
      s.level === settings.startingSkillLevel &&
      (s.classes.includes("All") || (classId !== null && s.classes.includes(classId))),
  );
}
