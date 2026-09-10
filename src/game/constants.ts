import type { AchievementDef, CharacterId, FactionId } from "./types";

export const SAVE_VERSION = 1;
export const SAVE_KEY = "lion-guard-ow-save-v1";
export const SAVE_BACKUP_KEY = "lion-guard-ow-save-v1-bak";

export const WORLD_HALF = 240;
export const FIXED_DT = 1 / 60;
export const GRAVITY = 28;
export const WATER_Y = 0.15;

export const CHAR_META: Record<
  CharacterId,
  {
    name: string;
    title: string;
    walk: number;
    sprint: number;
    jump: number;
    hp: number;
    stamina: number;
    attack: number;
    ability: string;
    abilityCd: number;
    color: number;
    accent: number;
    spawn: { x: number; z: number };
    med: { x: number; z: number };
  }
> = {
  kion: {
    name: "Кайон",
    title: "Король Древа жизни",
    walk: 7.2,
    sprint: 16.4,
    jump: 8.4,
    hp: 130,
    stamina: 100,
    attack: 22,
    ability: "Рычание Предков",
    abilityCd: 11,
    color: 0xe0a84a,
    accent: 0xc24a24,
    spawn: { x: 218, z: 66 },
    med: { x: 208, z: 88 },
  },
  janja: {
    name: "Джанджа",
    title: "Гиена, что выбрала свет",
    walk: 8.1,
    sprint: 18.5,
    jump: 7.2,
    hp: 95,
    stamina: 110,
    attack: 16,
    ability: "Клич стаи",
    abilityCd: 9,
    color: 0x8a7358,
    accent: 0x3a3028,
    spawn: { x: -158, z: 20 },
    med: { x: -150, z: 30 },
  },
  kiara: {
    name: "Киара",
    title: "Наследница Земель Прайда",
    walk: 7.6,
    sprint: 17.2,
    jump: 9.1,
    hp: 110,
    stamina: 105,
    attack: 20,
    ability: "Рывок наследницы",
    abilityCd: 6,
    color: 0xecb85c,
    accent: 0xf2d9a8,
    spawn: { x: 70, z: 44 },
    med: { x: 58, z: 36 },
  },
};

export const POI: Record<string, { x: number; z: number; name: string; ft?: boolean }> = {
  prideRock: { x: 72, z: 48, name: "Скала Предков", ft: true },
  treeOfLife: { x: 220, z: 70, name: "Древо жизни", ft: true },
  wateringHole: { x: 18, z: -70, name: "Большие Источники", ft: true },
  hyenaCamp: { x: -160, z: 22, name: "Лагерь гиен", ft: true },
  outlandsGorge: { x: -200, z: -40, name: "Ущелье Изгнанников" },
  rafikiTree: { x: 100, z: -20, name: "Баобаб Рафики", ft: true },
  jungleOasis: { x: 40, z: 140, name: "Оазис Тимона и Пумбы" },
  nightPrideCaves: { x: 248, z: 42, name: "Пещеры Ночного Прайда" },
  medicalTree: { x: 208, z: 88, name: "Целебные луга" },
  medicalPride: { x: 58, z: 36, name: "Покои прайда" },
  medicalHyena: { x: -150, z: 30, name: "Логово Джасири" },
  trainingGrounds: { x: 86, z: 28, name: "Тренировочная поляна" },
  makuuPond: { x: -10, z: -90, name: "Затон Макуу" },
  azaadRun: { x: 4, z: 18, name: "Саваннский прогон" },
  hiddenFalls: { x: 190, z: 120, name: "Скрытый водопад" },
  oldOutlandsCamp: { x: -220, z: 80, name: "Старый лагерь Зиры" },
  highLookout: { x: 74, z: 50, name: "Вершина Скалы Предков" },
  secretCave: { x: 56, z: 64, name: "Пещера за Скалой" },
  desertSouth: { x: 16, z: -205, name: "Южные пустоши" },
  northMountains: { x: 36, z: 208, name: "Северные кряжи" },
  crackedRock: { x: 132, z: 8, name: "Треснувший камень" },
  hyenaTunnel: { x: -188, z: 8, name: "Узкий лаз гиен" },
  royalPath: { x: 80, z: 56, name: "Королевская тропа" },
};

export const FACTION_NAMES: Record<FactionId, string> = {
  pride: "Прайд Земель Прайда",
  hyena: "Гиены",
  night: "Ночной Прайд",
  outlands: "Земли Изгнанников",
  river: "Речной клан",
  wild: "Вольные стада",
};

export const DEFAULT_REP: Record<FactionId, number> = {
  pride: 70,
  hyena: 45,
  night: 88,
  outlands: 55,
  river: 50,
  wild: 40,
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "hevi", title: "Хеви Кабиса!", desc: "Впервые использовать Рычание Предков." },
  { id: "hyena-back", title: "Гиена вернулась", desc: "Выполнить первую миссию Джанджи." },
  { id: "queen", title: "Будущая королева", desc: "Завершить серию заданий Киары." },
  { id: "king-tree", title: "Король Древа", desc: "Вернуться к Древу жизни за Кайона." },
  { id: "quiet", title: "Тихий исследователь", desc: "Найти 10 секретных мест." },
  { id: "climb", title: "Куда ты полез?", desc: "Добраться до очень труднодоступного места." },
  { id: "dead", title: "МЁРТВ", desc: "Погибнуть впервые." },
  { id: "switch3", title: "Три судьбы", desc: "Переключиться между всеми героями." },
  { id: "wanted5", title: "Враг круга жизни", desc: "Набрать 5 звёзд преследования." },
  { id: "rich", title: "Запасы саванны", desc: "Накопить 1500 солнц." },
  { id: "night", title: "Ночной странник", desc: "Дождаться полной ночи в открытом мире." },
  { id: "storm", title: "Под грозой", desc: "Побывать в грозе." },
  { id: "missions10", title: "Хранитель покоя", desc: "Завершить 10 заданий." },
  { id: "chaos", title: "Хаос с умыслом", desc: "Напасть на охраняемую территорию и скрыться." },
];

export const COLLECT_TYPES = [
  { id: "mark", name: "Символ Стража" },
  { id: "relic", name: "Древний артефакт" },
  { id: "feather", name: "Перо" },
  { id: "stone", name: "Редкий камень" },
  { id: "carving", name: "Наскальный рисунок" },
  { id: "scar", name: "Память Кайона" },
] as const;
