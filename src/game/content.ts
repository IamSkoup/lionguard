import { POI } from "./constants";
import type { CharacterId, DialogueLine, Disposition, FactionId, MissionStatus, NpcKind, Objective } from "./types";

export type NamedNpc = {
  id: string;
  name: string;
  kind: NpcKind;
  x: number;
  z: number;
  faction: FactionId;
  disposition: Disposition;
  lines: Record<CharacterId, string[]>;
  homeWander: number;
};

export const NAMED: NamedNpc[] = [
  {
    id: "rani",
    name: "Рани",
    kind: "nightpride",
    x: 216,
    z: 72,
    faction: "night",
    disposition: "friendly",
    homeWander: 8,
    lines: {
      kion: ["Кайон, наш прайд ждёт короля. Древо живо — и мы вместе.", "Ночью Ночной Прайд выходит на дозор. Ты с нами?"],
      janja: ["Джанджа. Ты изменился. Здесь тебя примут, если придёшь с миром.", "Гиены и Ночной Прайд — уже не враги. Не испорти это."],
      kiara: ["Киара. Наши прайды связаны. Передай Симбе, что Древо стоит крепко."],
    },
  },
  {
    id: "simba",
    name: "Симба",
    kind: "lion",
    x: 70,
    z: 50,
    faction: "pride",
    disposition: "friendly",
    homeWander: 6,
    lines: {
      kion: ["Сын. Шрам остался, но ты — король. Земли Прайда в мире... пока."],
      janja: ["Джанджа. Ты доказал, что круг жизни шире ненависти. Не подведи Джасири."],
      kiara: ["Киара, однажды эта скала будет твоей. Береги её так, как я пытался."],
    },
  },
  {
    id: "nala",
    name: "Нала",
    kind: "lioness",
    x: 66,
    z: 46,
    faction: "pride",
    disposition: "friendly",
    homeWander: 7,
    lines: {
      kion: ["Кайон, ты вырос. Рани хорошая королева. Приходи чаще."],
      janja: ["Ты всё ещё слишком громкий. Но Землям Прайда нужен и твой смех."],
      kiara: ["Дочь. Ты сильнее, чем думаешь. Не спеши — и не бойся."],
    },
  },
  {
    id: "vitani",
    name: "Витани",
    kind: "lioness",
    x: 86,
    z: 28,
    faction: "pride",
    disposition: "guard",
    homeWander: 10,
    lines: {
      kion: ["Страж Земель Прайда на месте. Мы держим круг, как ты учил."],
      janja: ["Гиена на тренировочной поляне? Смотри, куда ставишь лапы."],
      kiara: ["Наследница. Хочешь спарринг — я не буду сдерживаться."],
    },
  },
  {
    id: "kovu",
    name: "Кову",
    kind: "lion",
    x: 62,
    z: 40,
    faction: "pride",
    disposition: "friendly",
    homeWander: 9,
    lines: {
      kion: ["Мы оба выбрали семью, а не войну. Это труднее рычания."],
      janja: ["Я тоже был изгнанником. Знаю, каково это — менять сторону."],
      kiara: ["Киара. Если пойдёшь в Земли Изгнанников — я с тобой."],
    },
  },
  {
    id: "jasiri",
    name: "Джасири",
    kind: "hyena",
    x: -152,
    z: 26,
    faction: "hyena",
    disposition: "friendly",
    homeWander: 12,
    lines: {
      kion: ["Король Древа. Наша стая больше не враг. Но пустоши всё ещё опасны."],
      janja: ["Джанджа, ты снова влез в неприятности? Рассказывай. Я помогу."],
      kiara: ["Наследница Прайда. Джанджа изменился. Не суди всех гиен по прошлому."],
    },
  },
  {
    id: "rafiki",
    name: "Рафики",
    kind: "mandrill",
    x: 100,
    z: -20,
    faction: "pride",
    disposition: "friendly",
    homeWander: 4,
    lines: {
      kion: ["Асante сана. Предки видят тебя. Рычание — не оружие, а ответственность."],
      janja: ["Ха! Гиена у баобаба. Даже ты можешь услышать совет, если закроешь пасть."],
      kiara: ["Будущая королева. Смотри глубже, чем видит глаз."],
    },
  },
  {
    id: "bunga",
    name: "Бунга",
    kind: "meerkat",
    x: 44,
    z: 132,
    faction: "wild",
    disposition: "friendly",
    homeWander: 14,
    lines: {
      kion: ["Зука-зука! Король пришёл! Есть дело — и оно воняет приключениями."],
      janja: ["Эй, смешливый! Если опять украдёшь жуков — я тебя найду."],
      kiara: ["Киара! Хочешь, покажу секретный прыжок? Это почти не опасно."],
    },
  },
  {
    id: "fuli",
    name: "Фули",
    kind: "cheetah",
    x: 8,
    z: 16,
    faction: "pride",
    disposition: "friendly",
    homeWander: 20,
    lines: {
      kion: ["Я быстрее ветра, ты — громче бури. Вместе мы всё ещё команда."],
      janja: ["Не отставай, гиена. Или хотя бы не мешай."],
      kiara: ["Наследница, скорость — это тоже власть. Покажи, на что способна."],
    },
  },
  {
    id: "beshte",
    name: "Беште",
    kind: "hippo",
    x: 22,
    z: -66,
    faction: "river",
    disposition: "friendly",
    homeWander: 10,
    lines: {
      kion: ["Поп-инти! Вода спокойна. Но крокодилы сегодня нервные."],
      janja: ["Друг, если тонешь — зови. Я тяжёлый, зато надёжный."],
      kiara: ["Источники нужно беречь. Кто-то мутит воду."],
    },
  },
  {
    id: "ono",
    name: "Оно",
    kind: "bird",
    x: 90,
    z: 10,
    faction: "pride",
    disposition: "friendly",
    homeWander: 30,
    lines: {
      kion: ["Хапана! Я вижу далеко. В ущелье снова движение."],
      janja: ["Джанджа, ты опять попал в поле зрения. Это комплимент... почти."],
      kiara: ["С вершины видно всё. Хочешь отчёт — только попроси."],
    },
  },
  {
    id: "anga",
    name: "Анга",
    kind: "bird",
    x: 110,
    z: 60,
    faction: "pride",
    disposition: "friendly",
    homeWander: 28,
    lines: {
      kion: ["Небеса чисты. Но шторм придёт с юга."],
      janja: ["С земли ты казался меньше. Не обижайся."],
      kiara: ["Я прикрою с воздуха, если пойдёшь в пустоши."],
    },
  },
  {
    id: "makuu",
    name: "Макуу",
    kind: "croc",
    x: -10,
    z: -90,
    faction: "river",
    disposition: "neutral",
    homeWander: 8,
    lines: {
      kion: ["Король. Мои крокодилы держат слово. Но молодые всё ещё хотят драки."],
      janja: ["Гиена у воды. Не кусай то, что кусается сильнее."],
      kiara: ["Наследница. Река не принадлежит только львам."],
    },
  },
  {
    id: "timon",
    name: "Тимон",
    kind: "meerkat",
    x: 38,
    z: 142,
    faction: "wild",
    disposition: "friendly",
    homeWander: 8,
    lines: {
      kion: ["Хакуна матата, король. Только без рычания рядом с жуками, ладно?"],
      janja: ["Это та гиена? Пумба, держи жуков!"],
      kiara: ["Принцесса! У нас лучшие жуки в саванне. Не морщись."],
    },
  },
  {
    id: "pumba",
    name: "Пумба",
    kind: "warthog",
    x: 42,
    z: 144,
    faction: "wild",
    disposition: "friendly",
    homeWander: 8,
    lines: {
      kion: ["Ты вырос! Но друзья — это навсегда. Даже короли."],
      janja: ["Я думал, гиены злые. Ты... странно добрый."],
      kiara: ["Как папа в молодости. Только аккуратнее с обрывами."],
    },
  },
  {
    id: "azaad",
    name: "Азаад",
    kind: "cheetah",
    x: 4,
    z: 18,
    faction: "wild",
    disposition: "friendly",
    homeWander: 22,
    lines: {
      kion: ["Друг. Гонка? Или снова спасаем кого-то по дороге."],
      janja: ["Ты быстрый. Я хитрый. Вместе — нечестно для остальных."],
      kiara: ["Покажи трассу. Я не люблю проигрывать."],
    },
  },
  {
    id: "nirmala",
    name: "Нирмала",
    kind: "lioness",
    x: 208,
    z: 88,
    faction: "night",
    disposition: "friendly",
    homeWander: 6,
    lines: {
      kion: ["Шрам зажил. Яд ушёл. Но тело помнит — не геройствуй впустую."],
      janja: ["Лежать. Я осмотрю. Даже храбрые гиены нуждаются в травах."],
      kiara: ["Целебные луга открыты для прайда. Возьми травы, если идёшь в бой."],
    },
  },
  {
    id: "makini",
    name: "Макини",
    kind: "mandrill",
    x: 226,
    z: 62,
    faction: "night",
    disposition: "friendly",
    homeWander: 7,
    lines: {
      kion: ["О, Кайон! Я записала новый стих про короля. Хочешь послушать? Всего... недолго."],
      janja: ["Гиена! У меня есть история, где ты почти герой. Почти."],
      kiara: ["Киара! Древо шепчет о будущем. Оно про тебя."],
    },
  },
  {
    id: "baliyo",
    name: "Балийо",
    kind: "nightpride",
    x: 248,
    z: 44,
    faction: "night",
    disposition: "guard",
    homeWander: 10,
    lines: {
      kion: ["Брат королевы на страже. Ночью здесь тихо — пока тихо."],
      janja: ["Смеёшься слишком громко для ночного дозора."],
      kiara: ["Гостья из Земель Прайда. Добро пожаловать, но не буди спящих."],
    },
  },
  {
    id: "surak",
    name: "Сурак",
    kind: "nightpride",
    x: 242,
    z: 38,
    faction: "night",
    disposition: "guard",
    homeWander: 9,
    lines: {
      kion: ["Король. Границы Древа спокойны. Чужие следы ведут к ущелью."],
      janja: ["Дисциплина. Даже для гиен."],
      kiara: ["Ты держишься достойно. Это заметно."],
    },
  },
];

export type MissionDef = {
  id: string;
  title: string;
  briefing: string;
  who?: CharacterId;
  night?: boolean;
  prereq?: string[];
  objectives: Objective[];
  reward: { money: number; rep?: Partial<Record<FactionId, number>> };
  doneTalk?: DialogueLine[];
};

export const MISSIONS: MissionDef[] = [
  {
    id: "dawn",
    title: "Новый рассвет",
    briefing: "После свадьбы прошло время. Рани ждёт Кайона у Древа жизни.",
    who: "kion",
    objectives: [{ type: "talk", npcId: "rani", label: "Поговорить с Рани" }],
    reward: { money: 80, rep: { night: 5 } },
    doneTalk: [{ speaker: "Рани", text: "Мир хрупок, Кайон. Но он наш. Начни с Древа — и иди, куда зовёт лапа." }],
  },
  {
    id: "guard",
    title: "Новый Страж",
    briefing: "Витани приняла Рычание Земель Прайда. Встреться с ней на тренировочной поляне.",
    prereq: ["dawn"],
    objectives: [
      { type: "goto", x: 86, z: 28, r: 10, label: "Добраться до тренировочной поляны" },
      { type: "talk", npcId: "vitani", label: "Поговорить с Витани" },
    ],
    reward: { money: 100, rep: { pride: 8 } },
  },
  {
    id: "scar-crown",
    title: "Шрам и корона",
    briefing: "Симба хочет видеть сына на Скале Предков.",
    prereq: ["guard"],
    who: "kion",
    objectives: [{ type: "talk", npcId: "simba", label: "Поговорить с Симбой" }],
    reward: { money: 90, rep: { pride: 10 } },
  },
  {
    id: "hyena-home",
    title: "Гиена среди своих",
    briefing: "Джасири зовёт Джанджу в лагерь. Стая ждет слова.",
    who: "janja",
    objectives: [
      { type: "goto", x: -152, z: 26, r: 12, label: "Вернуться в лагерь гиен" },
      { type: "talk", npcId: "jasiri", label: "Поговорить с Джасири" },
    ],
    reward: { money: 110, rep: { hyena: 12 } },
  },
  {
    id: "heir-spar",
    title: "Тренировка наследницы",
    briefing: "Киара должна провести спарринг на поляне Витани.",
    who: "kiara",
    objectives: [
      { type: "talk", npcId: "vitani", label: "Вызвать Витани" },
      { type: "hunt", count: 4, hostile: true, label: "Победить 4 противников на тренировке" },
    ],
    reward: { money: 120, rep: { pride: 8 } },
  },
  {
    id: "gazelle",
    title: "Спасти стадо",
    briefing: "Газели в панике у источников. Отгоните хищников.",
    prereq: ["guard"],
    objectives: [
      { type: "goto", x: 18, z: -70, r: 22, label: "Добраться до Больших Источников" },
      { type: "hunt", count: 5, hostile: true, label: "Прогнать хищников" },
    ],
    reward: { money: 140, rep: { wild: 10, river: 4 } },
  },
  {
    id: "thieves",
    title: "Погоня за ворами",
    briefing: "Кто-то таскает плоды у баобаба. Догоните и остановите.",
    prereq: ["hyena-home"],
    objectives: [
      { type: "goto", x: 100, z: -20, r: 14, label: "К баобабу Рафики" },
      { type: "hunt", count: 3, kind: "hyena", hostile: true, label: "Остановить воров" },
    ],
    reward: { money: 130, rep: { pride: 6, hyena: -4 } },
  },
  {
    id: "springs",
    title: "Защита источников",
    briefing: "Удержите Большие Источники, пока стадо пьёт.",
    prereq: ["gazelle"],
    objectives: [{ type: "defend", x: 18, z: -70, r: 20, seconds: 45, label: "Удержать источники 45 сек." }],
    reward: { money: 160, rep: { river: 10, wild: 6 } },
  },
  {
    id: "cub",
    title: "Пропавший детёныш",
    briefing: "Львёнок заблудился у редколесья. Верните его к прайду.",
    prereq: ["scar-crown"],
    objectives: [
      { type: "goto", x: 40, z: 140, r: 16, label: "Найти детёныша у оазиса" },
      { type: "escort", npcId: "cub", x: 70, z: 48, r: 12, label: "Сопроводить к Скале Предков" },
    ],
    reward: { money: 150, rep: { pride: 12 } },
  },
  {
    id: "roar-trial",
    title: "Испытание Рычания",
    briefing: "Рафики просит Кайона испытать Рычание у треснувшего камня.",
    who: "kion",
    prereq: ["scar-crown"],
    objectives: [
      { type: "goto", x: POI.crackedRock.x, z: POI.crackedRock.z, r: 10, label: "Найти треснувший камень" },
      { type: "roar", count: 1, label: "Использовать Рычание Предков" },
    ],
    reward: { money: 180, rep: { pride: 6, night: 4 } },
  },
  {
    id: "night-watch",
    title: "Ночной дозор",
    briefing: "Только ночью Ночной Прайд открывает тропу у пещер.",
    night: true,
    prereq: ["dawn"],
    objectives: [
      { type: "goto", x: 248, z: 42, r: 12, label: "Дойти до пещер Ночного Прайда ночью" },
      { type: "talk", npcId: "surak", label: "Доложить Сураку" },
    ],
    reward: { money: 140, rep: { night: 10 } },
  },
  {
    id: "race",
    title: "Гонка с Азаадом",
    briefing: "Азаад ждёт на саваннском прогоне. Три контрольные точки.",
    prereq: ["guard"],
    objectives: [
      { type: "talk", npcId: "azaad", label: "Принять вызов Азаада" },
      {
        type: "race",
        checkpoints: [
          { x: 4, z: 18 },
          { x: 40, z: -10 },
          { x: 86, z: 28 },
        ],
        label: "Пройти трассу",
      },
    ],
    reward: { money: 200, rep: { wild: 8 } },
  },
  {
    id: "gorge",
    title: "Тайна ущелья",
    briefing: "В Землях Изгнанников снова кто-то бродит. Разведайте ущелье.",
    prereq: ["hyena-home"],
    objectives: [
      { type: "goto", x: -200, z: -40, r: 14, label: "Исследовать ущелье" },
      { type: "hunt", count: 4, hostile: true, label: "Разогнать хищников ущелья" },
    ],
    reward: { money: 170, rep: { outlands: 8 } },
  },
  {
    id: "beshte-path",
    title: "Помощь Беште",
    briefing: "Беште ведёт стадо через воду. Прикройте переход.",
    prereq: ["springs"],
    objectives: [
      { type: "talk", npcId: "beshte", label: "Поговорить с Беште" },
      { type: "escort", npcId: "beshte", x: -10, z: -90, r: 10, label: "Сопроводить к затону Макуу" },
    ],
    reward: { money: 150, rep: { river: 12 } },
  },
  {
    id: "royal-visit",
    title: "Королевский визит",
    briefing: "Кайон должен лично пройти от Древа жизни до Скалы Предков.",
    who: "kion",
    prereq: ["scar-crown"],
    objectives: [
      { type: "goto", x: 220, z: 70, r: 12, label: "Начать путь у Древа" },
      { type: "goto", x: 72, z: 48, r: 12, label: "Дойти до Скалы Предков" },
      { type: "talk", npcId: "nala", label: "Поприветствовать Налу" },
    ],
    reward: { money: 160, rep: { pride: 8, night: 4 } },
  },
  {
    id: "janja-chaos",
    title: "Хаос Джанджи",
    briefing: "Джанджа «одолжил» плоды. Сначала удрать, потом всё вернуть.",
    who: "janja",
    prereq: ["hyena-home"],
    objectives: [
      { type: "goto", x: 40, z: 140, r: 12, label: "Добраться до оазиса" },
      { type: "collect", item: "fruit", count: 1, label: "Взять плоды (или найти)" },
      { type: "goto", x: -152, z: 26, r: 12, label: "Вернуться к Джасири" },
    ],
    reward: { money: 120, rep: { hyena: 8, wild: -2 } },
  },
  {
    id: "old-camp",
    title: "След Изгнанников",
    briefing: "Старый лагерь Зиры пуст, но не мёртв. Осмотрите его.",
    prereq: ["gorge"],
    objectives: [
      { type: "goto", x: -220, z: 80, r: 12, label: "Найти старый лагерь" },
      { type: "collect", item: "relic", count: 1, label: "Найти память Изгнанников" },
    ],
    reward: { money: 190, rep: { outlands: 10 } },
  },
  {
    id: "flowers",
    title: "Цветы Древа",
    briefing: "Макини просит собрать редкие цветы вокруг Древа жизни.",
    prereq: ["dawn"],
    objectives: [{ type: "collect", item: "mark", count: 3, label: "Собрать 3 символа Стража" }],
    reward: { money: 130, rep: { night: 6 } },
  },
  {
    id: "crocs",
    title: "Горячие головы",
    briefing: "Молодые крокодилы Макуу ищут драки. Остудите их.",
    prereq: ["beshte-path"],
    objectives: [
      { type: "talk", npcId: "makuu", label: "Поговорить с Макуу" },
      { type: "hunt", count: 6, kind: "croc", hostile: true, label: "Остановить задир" },
    ],
    reward: { money: 170, rep: { river: 8 } },
  },
  {
    id: "rafiki-secret",
    title: "Секрет Рафики",
    briefing: "Рафики говорит о пещере за Скалой. Только внимательный найдёт рисунки.",
    prereq: ["scar-crown"],
    objectives: [
      { type: "talk", npcId: "rafiki", label: "Спросить Рафики" },
      { type: "goto", x: 56, z: 64, r: 8, label: "Найти пещеру за Скалой" },
      { type: "collect", item: "carving", count: 1, label: "Изучить рисунок" },
    ],
    reward: { money: 220, rep: { pride: 6 } },
  },
  {
    id: "together",
    title: "Три судьбы",
    briefing: "Мир держится на троих. Переключитесь между Кайоном, Джанджей и Киарой.",
    prereq: ["dawn", "hyena-home", "heir-spar"],
    objectives: [
      { type: "switch", who: "kion", label: "Стать Кайоном" },
      { type: "switch", who: "janja", label: "Стать Джанджей" },
      { type: "switch", who: "kiara", label: "Стать Киарой" },
    ],
    reward: { money: 250, rep: { pride: 4, hyena: 4, night: 4 } },
  },
  {
    id: "silence",
    title: "Тишина саванны",
    briefing: "Пройдите четыре края мира и почувствуйте, что круг снова цел.",
    prereq: ["royal-visit"],
    objectives: [
      { type: "region", biome: "pride", label: "Побывать в Землях Прайда" },
      { type: "region", biome: "outlands", label: "Побывать в Землях Изгнанников" },
      { type: "region", biome: "tree", label: "Побывать у Древа жизни" },
      { type: "region", biome: "desert", label: "Побывать в южных пустошах" },
    ],
    reward: { money: 300, rep: { wild: 8 } },
  },
  {
    id: "healer",
    title: "Целительница",
    briefing: "Нирмала просит травы с целительных лугов.",
    prereq: ["dawn"],
    objectives: [
      { type: "talk", npcId: "nirmala", label: "Поговорить с Нирмалой" },
      { type: "collect", item: "herb", count: 2, label: "Принести целебные травы" },
    ],
    reward: { money: 110, rep: { night: 8 } },
  },
  {
    id: "sunset-rock",
    title: "Возвращение к скале",
    briefing: "Киара должна встретить закат на вершине Скалы Предков.",
    who: "kiara",
    prereq: ["heir-spar"],
    objectives: [{ type: "goto", x: 74, z: 50, r: 8, label: "Подняться на вершину Скалы Предков" }],
    reward: { money: 180, rep: { pride: 10 } },
  },
];

export function missionAvailable(id: string, status: Record<string, MissionStatus>): boolean {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) return false;
  if (status[id] === "done" || status[id] === "active") return false;
  if (!m.prereq || m.prereq.length === 0) return true;
  return m.prereq.every((p) => status[p] === "done");
}

export const VIGNETTES: Record<CharacterId, string[]> = {
  kion: [
    "Кайон стоит у Древа жизни и говорит с Рани о границах прайда.",
    "Кайон обходит целительные луга. Нирмала проверяет шрам.",
    "Кайон слушает ветер с вершины у Древа — Рычание отвечает тихо.",
  ],
  janja: [
    "Джанджа убегает от возмущённых птиц: он снова «одолжил» плоды.",
    "Джанджа спорит с Джасири, кто лучше сторожит ущелье.",
    "Джанджа репетирует геройскую позу. Получается смешно.",
  ],
  kiara: [
    "Киара тренируется на Скале Предков, отрабатывая удар плечом.",
    "Киара слушает совет Налы о том, каким должен быть король.",
    "Киара смотрит на саванну с уступа — и считает стада.",
  ],
};

export const WORLD_LINES = [
  "Это был Кайон?.. Он напал на своих?",
  "Король снова помог нам.",
  "Гиена Джанджа теперь с нами. Странные времена.",
  "Наследница Киара патрулирует границы.",
  "Ночной Прайд видел огни в ущелье.",
  "Круг жизни держится. Пока держится.",
];
