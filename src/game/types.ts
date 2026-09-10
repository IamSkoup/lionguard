export type CharacterId = "kion" | "janja" | "kiara";

export type WeatherId =
  | "clear"
  | "clouds"
  | "rain"
  | "storm"
  | "fog"
  | "wind";

export type BiomeId =
  | "pride"
  | "outlands"
  | "tree"
  | "water"
  | "mountains"
  | "desert"
  | "forest";

export type AiState =
  | "idle"
  | "wander"
  | "follow"
  | "flee"
  | "chase"
  | "attack"
  | "eat"
  | "drink"
  | "sleep"
  | "talk"
  | "investigate"
  | "return_home";

export type ScreenId =
  | "boot"
  | "menu"
  | "playing"
  | "paused"
  | "dead"
  | "map"
  | "inventory"
  | "achievements"
  | "settings"
  | "controls"
  | "dialogue"
  | "switching";

export type MissionStatus = "locked" | "available" | "active" | "done";

export type ItemKind = "food" | "heal" | "quest" | "collect" | "rare";

export type NpcKind =
  | "lion"
  | "lioness"
  | "hyena"
  | "cheetah"
  | "leopard"
  | "zebra"
  | "gazelle"
  | "elephant"
  | "giraffe"
  | "hippo"
  | "croc"
  | "bird"
  | "mandrill"
  | "meerkat"
  | "warthog"
  | "hippoGuard"
  | "nightpride";

export type Disposition = "friendly" | "neutral" | "skittish" | "hostile" | "guard";

export type FactionId = "pride" | "hyena" | "night" | "outlands" | "river" | "wild";

export type Objective =
  | { type: "goto"; x: number; z: number; r: number; label: string }
  | { type: "talk"; npcId: string; label: string }
  | { type: "hunt"; count: number; kind?: NpcKind; hostile?: boolean; label: string }
  | { type: "collect"; item: string; count: number; label: string }
  | { type: "escort"; npcId: string; x: number; z: number; r: number; label: string }
  | { type: "survive"; seconds: number; label: string }
  | { type: "roar"; count: number; label: string }
  | { type: "race"; checkpoints: { x: number; z: number }[]; label: string }
  | { type: "defend"; x: number; z: number; r: number; seconds: number; label: string }
  | { type: "switch"; who: CharacterId; label: string }
  | { type: "region"; biome: BiomeId; label: string }
  | { type: "help"; count: number; label: string };

export type Item = {
  id: string;
  name: string;
  kind: ItemKind;
  qty: number;
  desc: string;
};

export type DialogueLine = {
  speaker: string;
  text: string;
};

export type HudSnapshot = {
  character: CharacterId;
  characterName: string;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  ability: number;
  abilityName: string;
  money: number;
  wanted: number;
  missionTitle: string;
  missionHint: string;
  timeOfDay: number;
  weather: WeatherId;
  region: string;
  interactLabel: string | null;
  compass: number;
  grounded: boolean;
  mounted: boolean;
  sprinting: boolean;
  fps: number;
};

export type MinimapBlip = {
  x: number;
  z: number;
  color: string;
  kind: "npc" | "mission" | "player" | "poi" | "danger" | "collect";
};

export type MapPoi = {
  id: string;
  name: string;
  x: number;
  z: number;
  discovered: boolean;
  fastTravel: boolean;
};

export type AchievementDef = {
  id: string;
  title: string;
  desc: string;
};

export type SaveData = {
  version: number;
  money: number;
  playTime: number;
  active: CharacterId;
  characters: Record<
    CharacterId,
    { x: number; y: number; z: number; yaw: number; hp: number; stamina: number }
  >;
  missions: Record<string, MissionStatus>;
  missionObj: number;
  missionProg: number;
  reputation: Record<FactionId, number>;
  collectibles: string[];
  inventory: Item[];
  discovered: string[];
  achievements: string[];
  timeOfDay: number;
  weather: WeatherId;
  helped: number;
  kills: number;
  deaths: number;
  secrets: string[];
  settings: {
    mouseSens: number;
    master: number;
    music: number;
    sfx: number;
    shake: number;
    invertY: boolean;
  };
};

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setSteer?: (v: number) => void;
      setKeys?: (codes: string[]) => void;
    };
    __game?: {
      engine: unknown;
    };
  }
}
