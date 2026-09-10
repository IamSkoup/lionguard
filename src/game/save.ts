import { CHAR_META, DEFAULT_REP, SAVE_BACKUP_KEY, SAVE_KEY, SAVE_VERSION } from "./constants";
import type { SaveData } from "./types";

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    money: 120,
    playTime: 0,
    active: "kion",
    characters: {
      kion: {
        x: CHAR_META.kion.spawn.x,
        y: 12,
        z: CHAR_META.kion.spawn.z,
        yaw: 0.4,
        hp: CHAR_META.kion.hp,
        stamina: CHAR_META.kion.stamina,
      },
      janja: {
        x: CHAR_META.janja.spawn.x,
        y: 8,
        z: CHAR_META.janja.spawn.z,
        yaw: -0.5,
        hp: CHAR_META.janja.hp,
        stamina: CHAR_META.janja.stamina,
      },
      kiara: {
        x: CHAR_META.kiara.spawn.x,
        y: 18,
        z: CHAR_META.kiara.spawn.z,
        yaw: 2.4,
        hp: CHAR_META.kiara.hp,
        stamina: CHAR_META.kiara.stamina,
      },
    },
    missions: { dawn: "active" },
    missionObj: 0,
    missionProg: 0,
    reputation: { ...DEFAULT_REP },
    collectibles: [],
    inventory: [
      { id: "herb", name: "Целебные травы", kind: "heal", qty: 2, desc: "Восстанавливают здоровье." },
      { id: "fruit", name: "Плоды баобаба", kind: "food", qty: 3, desc: "Восстанавливают запас сил." },
    ],
    discovered: ["treeOfLife"],
    achievements: [],
    timeOfDay: 8.6,
    weather: "clear",
    helped: 0,
    kills: 0,
    deaths: 0,
    secrets: [],
    settings: {
      mouseSens: 1,
      master: 0.8,
      music: 0.55,
      sfx: 0.8,
      shake: 0.7,
      invertY: false,
    },
  };
}

function migrate(raw: SaveData): SaveData {
  const base = defaultSave();
  const s = { ...base, ...raw, version: SAVE_VERSION };
  s.characters = {
    kion: { ...base.characters.kion, ...raw.characters?.kion },
    janja: { ...base.characters.janja, ...raw.characters?.janja },
    kiara: { ...base.characters.kiara, ...raw.characters?.kiara },
  };
  s.reputation = { ...base.reputation, ...raw.reputation };
  s.settings = { ...base.settings, ...raw.settings };
  s.missions = { ...base.missions, ...raw.missions };
  s.inventory = Array.isArray(raw.inventory) ? raw.inventory : base.inventory;
  return s;
}

export function hasSave(): boolean {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY));
  } catch {
    return false;
  }
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveData;
    return migrate(parsed);
  } catch {
    try {
      const bak = localStorage.getItem(SAVE_BACKUP_KEY);
      if (!bak) return null;
      return migrate(JSON.parse(bak) as SaveData);
    } catch {
      return null;
    }
  }
}

export function writeSave(data: SaveData): boolean {
  try {
    const prev = localStorage.getItem(SAVE_KEY);
    if (prev) localStorage.setItem(SAVE_BACKUP_KEY, prev);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SAVE_BACKUP_KEY);
  } catch {
    /* ignore */
  }
}
