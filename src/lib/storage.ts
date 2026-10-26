// เก็บตัวละครไว้ใน localStorage ของเบราว์เซอร์ ใช้ร่วมกันทุกหน้าและทุกเรื่อง
import type { Scores } from "./rules";

export interface Character {
  id: string;
  createdAt: string;
  name: string;
  race: string;
  class: string;
  alignment: string;
  backstory: string;
  level: number;
  abilities: Scores;
  hp: number;
  ac: number;
  speed: number;
  skills: string[];
}

const KEY = "dnd.characters";

function readAll(): Character[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Character[];
  } catch {
    return [];
  }
}

function writeAll(list: Character[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export const store = {
  list: () => readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  get: (id: string) => readAll().find((c) => c.id === id) ?? null,
  save(character: Character) {
    return writeAll([...readAll().filter((c) => c.id !== character.id), character]);
  },
  remove(id: string) {
    return writeAll(readAll().filter((c) => c.id !== id));
  },
};
