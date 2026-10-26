# เรื่องราว (Stories)

แต่ละเรื่องอยู่ในโฟลเดอร์ของตัวเอง เช่น

```
src/stories/
  forest-of-whispers/
    StoryPage.tsx   หน้าเล่นเรื่องนี้
    events.ts       รายการเหตุการณ์สุ่มของเรื่องนี้
    StoryPage.css   สไตล์เฉพาะเรื่อง (ถ้ามี)
```

แล้วเพิ่มเส้นทางใน `src/App.tsx` เช่น `<Route path="/stories/forest-of-whispers" element={<ForestStory />} />`

ของกลางที่ใช้ร่วมกันได้:

- `components/Book` — ตำราเปิดสองหน้า พร้อมการพลิกหน้าเมื่อเปลี่ยน `turnKey`
- `components/Chapter` — `ChapterHeading` (หัวบทตัวอักษรนำสีแดง) และ `Ribbons` (ริบบิ้นคั่นหน้า)
- `components/CharacterSheet` — แผ่นตัวละคร
- `components/DiceTray` — ถาดลูกเต๋า d6/d10/d20/เหรียญ ใช้ `<DiceTray onRoll={(r) => ...} />` เหมาะกับเหตุการณ์สุ่มในเรื่อง
- `lib/fx` — `burst()` / `burstFrom(el)` / `shake(el)` และ `reduceMotion`
- `lib/rules` — `modOf`, `roll4d6DropLowest`, `hitPoints`, `armorClass`
- `lib/storage` — `store.list()` / `get(id)` / `save(character)` สำหรับโหลดตัวละครที่สร้างไว้
- `data` — เผ่า อาชีพ ค่าสถานะ สกิล (สร้างจากไฟล์ Excel ห้ามแก้ไฟล์ .json ตรงๆ)

กฎประสิทธิภาพ: แอนิเมชันใช้ transform/opacity เท่านั้น ห้ามใส่ filter (blur, drop-shadow) บนของที่ขยับหรือเลเยอร์ใหญ่

ยังไม่มีเรื่องใดในโฟลเดอร์นี้
