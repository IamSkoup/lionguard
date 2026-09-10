import { create } from "zustand";
import type { CharacterId, DialogueLine, HudSnapshot, ScreenId, WeatherId } from "./types";
import { CHAR_META } from "./constants";

export const defaultHud = (): HudSnapshot => ({
  character: "kion",
  characterName: CHAR_META.kion.name,
  hp: CHAR_META.kion.hp,
  maxHp: CHAR_META.kion.hp,
  stamina: CHAR_META.kion.stamina,
  maxStamina: CHAR_META.kion.stamina,
  ability: 1,
  abilityName: CHAR_META.kion.ability,
  money: 0,
  wanted: 0,
  missionTitle: "",
  missionHint: "Исследуйте Земли Прайда",
  timeOfDay: 9.5,
  weather: "clear" as WeatherId,
  region: "Древо жизни",
  interactLabel: null,
  compass: 0,
  grounded: true,
  mounted: false,
  sprinting: false,
  fps: 60,
});

export type Toast = { id: number; text: string };

type GameUI = {
  screen: ScreenId;
  hasSave: boolean;
  ready: boolean;
  hud: HudSnapshot;
  toasts: Toast[];
  deathPhase: 0 | 1 | 2;
  dialogue: DialogueLine[] | null;
  dialogueI: number;
  switchWheel: boolean;
  switchVignette: string | null;
  notice: string | null;
  mapWaypoint: { x: number; z: number } | null;
  engineReady: boolean;
  usedChars: Record<CharacterId, boolean>;
  setScreen: (s: ScreenId) => void;
  setHud: (h: Partial<HudSnapshot>) => void;
  pushToast: (text: string) => void;
  dropToast: (id: number) => void;
  setDeathPhase: (p: 0 | 1 | 2) => void;
  setDialogue: (d: DialogueLine[] | null) => void;
  setDialogueI: (i: number) => void;
  setSwitchWheel: (v: boolean) => void;
  setVignette: (v: string | null) => void;
  setNotice: (v: string | null) => void;
  setReady: (v: boolean) => void;
  setHasSave: (v: boolean) => void;
  setEngineReady: (v: boolean) => void;
  markChar: (id: CharacterId) => void;
};

let toastSeq = 1;

export const useGameUI = create<GameUI>((set) => ({
  screen: "menu",
  hasSave: false,
  ready: false,
  hud: defaultHud(),
  toasts: [],
  deathPhase: 0,
  dialogue: null,
  dialogueI: 0,
  switchWheel: false,
  switchVignette: null,
  notice: null,
  mapWaypoint: null,
  engineReady: false,
  usedChars: { kion: false, janja: false, kiara: false },
  setScreen: (screen) => set({ screen }),
  setHud: (h) => set((s) => ({ hud: { ...s.hud, ...h } })),
  pushToast: (text) =>
    set((s) => ({ toasts: [...s.toasts.slice(-4), { id: toastSeq++, text }] })),
  dropToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setDeathPhase: (deathPhase) => set({ deathPhase }),
  setDialogue: (dialogue) => set({ dialogue, dialogueI: 0 }),
  setDialogueI: (dialogueI) => set({ dialogueI }),
  setSwitchWheel: (switchWheel) => set({ switchWheel }),
  setVignette: (switchVignette) => set({ switchVignette }),
  setNotice: (notice) => set({ notice }),
  setReady: (ready) => set({ ready }),
  setHasSave: (hasSave) => set({ hasSave }),
  setEngineReady: (engineReady) => set({ engineReady }),
  markChar: (id) => set((s) => ({ usedChars: { ...s.usedChars, [id]: true } })),
}));

export type EngineHandle = {
  newGame: () => void;
  continueGame: () => void;
  pause: () => void;
  resume: () => void;
  requestPointer: () => void;
  switchTo: (id: CharacterId) => void;
  fastTravel: (x: number, z: number) => void;
  setWaypoint: (x: number, z: number) => void;
  advanceDialogue: () => void;
  applySettings: (p: Partial<{ mouseSens: number; master: number; music: number; sfx: number; shake: number; invertY: boolean }>) => void;
  getSettings: () => { mouseSens: number; master: number; music: number; sfx: number; shake: number; invertY: boolean };
  getMap: () => {
    player: { x: number; z: number; yaw: number };
    others: { id: CharacterId; x: number; z: number }[];
    pois: { id: string; name: string; x: number; z: number; discovered: boolean; ft: boolean }[];
    mission: { x: number; z: number } | null;
    blips: { x: number; z: number; c: string }[];
    world: number;
  };
  getInventory: () => { money: number; items: { id: string; name: string; qty: number; desc: string }[]; rep: Record<string, number> };
  getAchievements: () => { id: string; title: string; desc: string; got: boolean }[];
  getMinimap: (out: Uint8ClampedArray, size: number) => { yaw: number; blips: { x: number; z: number; c: string; k: string }[] };
  saveNow: () => void;
  resetSave: () => void;
  setJoy: (x: number, y: number) => void;
  addLook: (dx: number, dy: number) => void;
  tapKey: (code: string) => void;
  useItem: (id: string) => void;
  isPlaying: () => boolean;
};

export const engineRef: { current: EngineHandle | null } = { current: null };
