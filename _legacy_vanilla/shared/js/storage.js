// เก็บตัวละครไว้ใน localStorage ของเบราว์เซอร์ ใช้ร่วมกันทุกหน้า/ทุกเรื่อง
window.DND_STORE = (function () {
  const KEY = "dnd.characters";

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (err) {
      return [];
    }
  }

  function writeAll(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (err) {
      return false;
    }
  }

  return {
    list: readAll,
    get(id) {
      return readAll().find((c) => c.id === id) || null;
    },
    save(character) {
      const list = readAll().filter((c) => c.id !== character.id);
      list.push(character);
      return writeAll(list);
    },
    remove(id) {
      return writeAll(readAll().filter((c) => c.id !== id));
    },
  };
})();
