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

// ตารางเลเวลของอาชีพ (ชีต Class Levels): ค่าที่ "เพิ่ม" เมื่อถึงเลเวลนั้น
export interface ClassLevel {
  level: number;
  prof: number; // โบนัสความชำนาญ ณ เลเวลนั้น
  hp: number; // HP ที่ได้เพิ่ม (ยังไม่รวม CON mod)
  gains: Record<AbilityId, number>;
  normalLv: number | null; // ระดับสกิลปกติสูงสุดที่ใช้ได้ (null = เท่าเลเวลก่อน)
  specialLv: number | null; // ระดับสกิลพิเศษสูงสุดที่ใช้ได้ (null = เท่าเลเวลก่อน)
  newSkills: number;
  note: string;
}

// สกิลเฉพาะอาชีพ (ชีต Class Skills)
export interface ClassSkill {
  id: string;
  classId: string;
  level: number; // เลเวลตัวละครที่ปลดล็อก
  nameEn: string;
  nameTh: string;
  source: string; // "Class" = ทุกคนในอาชีพได้, อื่น ๆ = ชื่อสายย่อย
  type: string; // Active / Passive / Reaction / Resource / Ultimate
  cost: string;
  uses: string;
  range: string;
  effect: string;
  detail: string;
  requires: string[];
}

// คู่มือวิธีเล่น (ชีต How to Play): 1 หัวข้อ = 1 แท็บ
export interface HowToSection {
  en: string;
  th: string;
  body: string[]; // 1 รายการ = 1 ข้อย่อย
  example: string[];
}

export interface HowToTopic {
  id: string;
  en: string;
  th: string;
  summary: string;
  sections: HowToSection[];
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
export const classLevels = game.classLevels as unknown as Record<string, ClassLevel[]>;
export const classSkills = game.classSkills as unknown as ClassSkill[];
export const howTo = game.howTo as HowToTopic[];

export const levelsOf = (classId: string) => classLevels[classId] ?? [];
export const classSkillsOf = (classId: string) => classSkills.filter((s) => s.classId === classId);

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
