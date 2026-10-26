import type { KeyboardEvent } from "react";

// ปุ่มลูกศร/Home/End ย้ายไปแท็บข้างเคียงในแถบเดียวกัน แล้วเลือกแท็บนั้นเลย (รูปแบบแท็บมาตรฐาน WAI-ARIA)
// ใช้: <div role="tablist" onKeyDown={onTabKeys}> ... <button role="tab"> ...
export function onTabKeys(e: KeyboardEvent<HTMLElement>) {
  const tabs = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')];
  const i = tabs.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
  if (next === undefined) return;
  e.preventDefault();
  const tab = tabs[(next + tabs.length) % tabs.length];
  tab.focus();
  tab.click();
}
