// สร้างอัตโนมัติจาก DND_GameData.xlsx ด้วย tools/export_data.py — อย่าแก้ด้วยมือ
window.DND_DATA = window.DND_DATA || {};
window.DND_DATA.abilities = [
  {
    "id": "STR",
    "nameEn": "Strength",
    "nameTh": "พละกำลัง"
  },
  {
    "id": "DEX",
    "nameEn": "Dexterity",
    "nameTh": "ความว่องไว"
  },
  {
    "id": "CON",
    "nameEn": "Constitution",
    "nameTh": "ความทนทาน"
  },
  {
    "id": "INT",
    "nameEn": "Intelligence",
    "nameTh": "สติปัญญา"
  },
  {
    "id": "WIS",
    "nameEn": "Wisdom",
    "nameTh": "ปรีชาญาณ"
  },
  {
    "id": "CHA",
    "nameEn": "Charisma",
    "nameTh": "เสน่ห์"
  }
];
window.DND_DATA.races = [
  {
    "id": "human",
    "nameEn": "Human",
    "nameTh": "มนุษย์",
    "summary": "เผ่าที่พบได้ทุกมุมโลก อายุสั้นแต่ทะเยอทะยาน ปรับตัวเข้ากับทุกอาชีพ",
    "bonus": {
      "STR": 1,
      "DEX": 1,
      "CON": 1,
      "INT": 1,
      "WIS": 1,
      "CHA": 1
    },
    "speed": 30,
    "trait": {
      "en": "Versatile",
      "th": "ค่าสถานะทุกด้าน +1"
    }
  },
  {
    "id": "elf",
    "nameEn": "Elf",
    "nameTh": "เอลฟ์",
    "summary": "ผู้พิทักษ์ป่าโบราณ ประสาทสัมผัสคมกริบ อายุยืนนับพันปี",
    "bonus": {
      "DEX": 2,
      "INT": 1
    },
    "speed": 35,
    "trait": {
      "en": "Trance",
      "th": "ไม่ต้องนอนหลับ ทำสมาธิ 4 ชั่วโมงแทน"
    }
  },
  {
    "id": "dwarf",
    "nameEn": "Dwarf",
    "nameTh": "คนแคระ",
    "summary": "ช่างตีเหล็กแห่งขุนเขา ร่างเตี้ยแต่ทนทานดั่งศิลา",
    "bonus": {
      "STR": 1,
      "CON": 2
    },
    "speed": 25,
    "trait": {
      "en": "Dwarven Resilience",
      "th": "ได้เปรียบเมื่อต้านทานพิษ"
    }
  },
  {
    "id": "halfling",
    "nameEn": "Halfling",
    "nameTh": "ฮาล์ฟลิ่ง",
    "summary": "ชาวทุ่งร่างเล็ก ร่าเริง และโชคดีเกินกว่าใครจะคาดคิด",
    "bonus": {
      "DEX": 2,
      "CHA": 1
    },
    "speed": 25,
    "trait": {
      "en": "Lucky",
      "th": "ทอยได้ 1 ให้ทอยใหม่ได้หนึ่งครั้ง"
    }
  },
  {
    "id": "half-orc",
    "nameEn": "Half-Orc",
    "nameTh": "ฮาล์ฟออร์ค",
    "summary": "เลือดผสมระหว่างมนุษย์และออร์ค แข็งแกร่ง ดุดัน ไม่ยอมล้มง่าย",
    "bonus": {
      "STR": 2,
      "CON": 1
    },
    "speed": 30,
    "trait": {
      "en": "Relentless Endurance",
      "th": "เมื่อ HP เหลือ 0 ฟื้นกลับมา 1 ได้วันละครั้ง"
    }
  },
  {
    "id": "tiefling",
    "nameEn": "Tiefling",
    "nameTh": "ทีฟลิ่ง",
    "summary": "ผู้สืบเชื้อสายปีศาจ มีเขาและหาง ถูกมองด้วยความหวาดระแวงเสมอ",
    "bonus": {
      "INT": 1,
      "CHA": 2
    },
    "speed": 30,
    "trait": {
      "en": "Hellish Resistance",
      "th": "ได้รับความเสียหายจากไฟลดลงครึ่งหนึ่ง"
    }
  },
  {
    "id": "dragonborn",
    "nameEn": "Dragonborn",
    "nameTh": "ดราก้อนบอร์น",
    "summary": "ลูกหลานมังกร เกล็ดแข็งดั่งเกราะ ภาคภูมิในเกียรติของตระกูล",
    "bonus": {
      "STR": 2,
      "CHA": 1
    },
    "speed": 30,
    "trait": {
      "en": "Breath Weapon",
      "th": "พ่นพลังธาตุใส่ศัตรูได้วันละครั้ง"
    }
  },
  {
    "id": "gnome",
    "nameEn": "Gnome",
    "nameTh": "โนม",
    "summary": "นักประดิษฐ์ตัวจิ๋วผู้อยากรู้อยากเห็น สมองไวยิ่งกว่ากลไก",
    "bonus": {
      "CON": 1,
      "INT": 2
    },
    "speed": 25,
    "trait": {
      "en": "Gnome Cunning",
      "th": "ได้เปรียบเมื่อต้านทานเวทที่โจมตีจิตใจ"
    }
  }
];
window.DND_DATA.classes = [
  {
    "id": "Fighter",
    "nameTh": "นักรบ",
    "role": "Frontline",
    "hitDie": 10,
    "primary": [
      "STR",
      "CON"
    ],
    "summary": "ผู้เชี่ยวชาญอาวุธทุกชนิด ยืนแนวหน้าและไม่เคยถอย"
  },
  {
    "id": "Barbarian",
    "nameTh": "คนเถื่อน",
    "role": "Frontline",
    "hitDie": 12,
    "primary": [
      "STR",
      "CON"
    ],
    "summary": "นักสู้จากดินแดนเถื่อน พลังโทสะทำให้แข็งแกร่งเกินมนุษย์"
  },
  {
    "id": "Paladin",
    "nameTh": "อัศวินศักดิ์สิทธิ์",
    "role": "Tank",
    "hitDie": 10,
    "primary": [
      "STR",
      "CHA"
    ],
    "summary": "อัศวินผู้ถือคำสาบาน ใช้ทั้งดาบและพรแห่งเทพ"
  },
  {
    "id": "Rogue",
    "nameTh": "โจร",
    "role": "Skirmisher",
    "hitDie": 8,
    "primary": [
      "DEX",
      "INT"
    ],
    "summary": "เจ้าแห่งเงามืด ปลดกับดัก สะเดาะกุญแจ และแทงจุดตาย"
  },
  {
    "id": "Ranger",
    "nameTh": "พรานป่า",
    "role": "Ranged",
    "hitDie": 10,
    "primary": [
      "DEX",
      "WIS"
    ],
    "summary": "นักแกะรอยแห่งพงไพร แม่นธนู และรู้จักทุกเส้นทางในป่า"
  },
  {
    "id": "Monk",
    "nameTh": "นักพรต",
    "role": "Skirmisher",
    "hitDie": 8,
    "primary": [
      "DEX",
      "WIS"
    ],
    "summary": "ผู้ฝึกกายและจิตจนหลอมเป็นหนึ่ง ต่อสู้ด้วยมือเปล่า"
  },
  {
    "id": "Wizard",
    "nameTh": "จอมเวท",
    "role": "Arcane Caster",
    "hitDie": 6,
    "primary": [
      "INT",
      "WIS"
    ],
    "summary": "นักวิชาการแห่งเวทมนตร์ ร่ายคาถาจากตำราที่ศึกษามาทั้งชีวิต"
  },
  {
    "id": "Sorcerer",
    "nameTh": "ผู้ใช้เวทโดยกำเนิด",
    "role": "Arcane Caster",
    "hitDie": 6,
    "primary": [
      "CHA",
      "CON"
    ],
    "summary": "พลังเวทไหลเวียนอยู่ในสายเลือด ไม่ต้องร่ำเรียนจากตำรา"
  },
  {
    "id": "Druid",
    "nameTh": "ดรูอิด",
    "role": "Nature Caster",
    "hitDie": 8,
    "primary": [
      "WIS",
      "CON"
    ],
    "summary": "นักบวชแห่งธรรมชาติ แปลงร่างเป็นสัตว์และเรียกพลังแห่งพงไพร"
  },
  {
    "id": "Cleric",
    "nameTh": "นักบวช",
    "role": "Healer",
    "hitDie": 8,
    "primary": [
      "WIS",
      "CHA"
    ],
    "summary": "ผู้รับใช้เทพเจ้า รักษาพันธมิตรและขับไล่ความชั่วร้าย"
  },
  {
    "id": "Assassin",
    "nameTh": "นักฆ่า",
    "role": "Striker",
    "hitDie": 8,
    "primary": [
      "DEX",
      "CHA"
    ],
    "summary": "มือสังหารผู้ไร้เงา จบงานในการโจมตีครั้งเดียว"
  },
  {
    "id": "Warlock",
    "nameTh": "ผู้ทำพันธสัญญา",
    "role": "Pact Caster",
    "hitDie": 8,
    "primary": [
      "CHA",
      "WIS"
    ],
    "summary": "แลกเปลี่ยนบางสิ่งกับสิ่งเหนือธรรมชาติ เพื่อพลังที่ไม่ควรมีใครครอบครอง"
  }
];
window.DND_DATA.alignments = [
  {
    "id": "LG",
    "en": "Lawful Good",
    "th": "ดีอย่างมีระเบียบ"
  },
  {
    "id": "NG",
    "en": "Neutral Good",
    "th": "ดีอย่างเป็นกลาง"
  },
  {
    "id": "CG",
    "en": "Chaotic Good",
    "th": "ดีอย่างอิสระ"
  },
  {
    "id": "LN",
    "en": "Lawful Neutral",
    "th": "เป็นกลางอย่างมีระเบียบ"
  },
  {
    "id": "TN",
    "en": "True Neutral",
    "th": "เป็นกลางแท้"
  },
  {
    "id": "CN",
    "en": "Chaotic Neutral",
    "th": "เป็นกลางอย่างอิสระ"
  },
  {
    "id": "LE",
    "en": "Lawful Evil",
    "th": "ชั่วอย่างมีระเบียบ"
  },
  {
    "id": "NE",
    "en": "Neutral Evil",
    "th": "ชั่วอย่างเป็นกลาง"
  },
  {
    "id": "CE",
    "en": "Chaotic Evil",
    "th": "ชั่วอย่างอิสระ"
  }
];
window.DND_DATA.settings = {
  "standardArray": [
    15,
    14,
    13,
    12,
    10,
    8
  ],
  "maxRerolls": 3,
  "startingSkillLevel": 0,
  "startingSkillCount": 3,
  "baseAc": 10
};
