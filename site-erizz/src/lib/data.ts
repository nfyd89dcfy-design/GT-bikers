import raw from "./catalog.json";

export type Fuel = "ev" | "gas";
export interface Model {
  id: string;
  brand: string;
  model: string;
  cat: string;
  fuel: Fuel;
  files: string[];
  cut: boolean;
  kw: number | null;
  wh: number | null;
  kmh: number | null;
  km: number | null;
  kg: number | null;
  cc: number | null;
  nm: number | null;
}

export const CATALOG = raw as Record<string, Model>;

export const PRICE: Record<string, number> = {};
export const rub = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n / 1000) * 1000) + " ₽";
/** Бронь модели: цена фиксируется после теста образца. */
export const DEPOSIT = 10000;

/* ---------------- Серии GT ----------------
   Ver: ключ 3D-модели и цветовой сцены конфигуратора.
   base = питбайк 14-17, sport = байк 19, pro = эндуро 21, road = дорога. Серия модели задается полем group. */
export type Ver = "base" | "sport" | "pro" | "road";
export interface GTModel {
  id: string; ver: Ver; name: string; short: string; series: string; wheels: string; front: number; rear: number; kw: [number, number]; kwh: [number, number]; price: number;
  bg: string; fg: "light" | "dark"; word: string; tag: [string, string]; look: [string, string]; accent: string; count: number; models: string;
}
/** Герои серий для конфигуратора: по одному на серию. ver задает 3D-модель и сцену. Диапазоны kw / kwh показывают всю серию. */
export const GT: GTModel[] = [
  { id: "gt-mini-12", ver: "base", name: "GT Mini 12", short: "Mini", series: "Mini", wheels: "12/10", front: 12, rear: 10, kw: [1, 1], kwh: [0.37, 0.37], price: DEPOSIT, bg: "#14161a", fg: "light", word: "MINI", accent: "#ff4a2b", count: 1, models: "Mini 12",
    tag: ["Первый заряд: 12 дюймов, низкое седло и понятная мощность.", "Первый байк ребенка: 12 дюймов, низкое седло, плавная мощность."],
    look: ["1 кВт, 33 км/ч, седло 700 мм.", "1 кВт, 33 км/ч, седло 700 мм."] },
  { id: "gt-trail-19", ver: "sport", name: "GT Trail 19", short: "Trail", series: "Trail", wheels: "19/16", front: 19, rear: 16, kw: [3, 10], kwh: [0.96, 2.52], price: DEPOSIT, bg: "#ff4a2b", fg: "dark", word: "TRAIL", accent: "#e4e8ec", count: 4, models: "Trail 14, 17, 19, 21",
    tag: ["Основа линейки: от питбайка 14 до trail 21. Trail 14 и 17 уже в продаже.", "Основа линейки: от питбайка 14 до trail 21. Trail 14 и 17 уже в продаже."],
    look: ["Четыре размера колес, батарея до 2,52 кВт·ч.", "Четыре размера колес, батарея до 2,52 кВт·ч."] },
  { id: "gt-trail-21-pro", ver: "pro", name: "GT Trail 21 Pro", short: "Trail Pro", series: "Trail Pro", wheels: "21/18", front: 21, rear: 18, kw: [4, 15], kwh: [1.8, 3.6], price: DEPOSIT, bg: "#5e1224", fg: "light", word: "PRO", accent: "#9cc9ff", count: 4, models: "Trail 14 Pro, 17 Pro, 19 Pro, 21 Pro",
    tag: ["Те же размеры, что у Trail, но больше батарея, мощность и подвеска.", "Усиленные версии Trail: больше батарея, мощность и подвеска."],
    look: ["Колеса 21/18, батарея 3,6 кВт·ч, скорость до 100 км/ч.", "Колеса 21/18, батарея 3,6 кВт·ч, скорость до 100 км/ч."] },
  { id: "gt-race-19", ver: "sport", name: "GT Race 19", short: "Race", series: "Race", wheels: "19/18", front: 19, rear: 18, kw: [10, 65], kwh: [2.52, 6.72], price: DEPOSIT, bg: "#ff4a2b", fg: "dark", word: "RACE", accent: "#e4e8ec", count: 5, models: "Race 17, 19, SM, Track, 21",
    tag: ["Спорт и флагман: кованая рама, супермото, гусеница на зиму. Send it.", "Спортивная серия: супермото, зимняя гусеница и флагман 65 кВт."],
    look: ["От 10 до 65 кВт пик, флагман Race 21 до 150 км/ч.", "От 10 до 65 кВт пик, флагман Race 21 до 150 км/ч."] },
  { id: "gt-city", ver: "road", name: "GT City", short: "Road", series: "Road", wheels: "17/17", front: 17, rear: 17, kw: [5, 20], kwh: [2.88, 8.35], price: DEPOSIT, bg: "#1c2026", fg: "light", word: "ROAD", accent: "#9cc9ff", count: 6, models: "City Compact, City, City Pro, Scrambler, Utility, Roadster",
    tag: ["Город и трасса: тихо, быстро, каждый день. Первая партия GT City уже заказана.", "Город и трасса: тихо, быстро, каждый день. Первая партия GT City уже заказана."],
    look: ["7,5 кВт, 105 км/ч, до 120 км. В старших версиях ABS и трекшн-контроль.", "7,5 кВт, 105 км/ч, до 120 км. В старших версиях ABS и трекшн-контроль."] },
];
export const GT_BY_HERO: Record<string, GTModel> = Object.fromEntries(GT.map((g) => [g.id, g]));

/* ---------------- Полная линейка: 20 моделей (утверждена 18.10) ---------------- */
export type Status = "sale" | "order" | "cand" | "request";
export type Group = "mini" | "trail" | "trailpro" | "race" | "road";
export interface LModel {
  id: string; n: number; name: string; ser: Ver; group: Group;
  wheels: string; peak: number | null; peakNote: string; kwh: number | null; kwhNote?: string; kmh: number | null; range: string; seat: number | null; kg: string;
  chassis: string; role: string; status: Status; paint: string; trim: string; photo?: false;
}
const L = (x: LModel) => x;
const U = "уточняется";
export const LINEUP: LModel[] = [
  L({ id: "gt-mini-12", n: 1, name: "GT Mini 12", ser: "base", group: "mini", wheels: "12/10", peak: 1, peakNote: "мощность", kwh: 0.37, kmh: 33, range: "20 км", seat: 700, kg: "42,5 кг", chassis: "гидравлические дисковые тормоза", role: "Первый байк", status: "cand", paint: "#eef1f4", trim: "Mini" }),
  L({ id: "gt-trail-14", n: 2, name: "GT Trail 14", ser: "base", group: "trail", wheels: "14/12", peak: 3, peakNote: "2-3 кВт", kwh: 0.96, kwhNote: "48 В", kmh: null, range: U, seat: null, kg: U, chassis: "действующая модель GT", role: "Базовый питбайк", status: "sale", paint: "#ff4a2b", trim: "Base", photo: false }),
  L({ id: "gt-trail-17", n: 3, name: "GT Trail 17", ser: "base", group: "trail", wheels: "17/14", peak: 5, peakNote: "3-5 кВт", kwh: 1.8, kwhNote: "60 В", kmh: null, range: U, seat: null, kg: U, chassis: "действующая модель GT", role: "Средний питбайк", status: "sale", paint: "#ff4a2b", trim: "Base", photo: false }),
  L({ id: "gt-trail-19", n: 4, name: "GT Trail 19", ser: "sport", group: "trail", wheels: "19/16", peak: 8, peakNote: "3 ном. / 8+ макс.", kwh: 2.16, kmh: 88, range: U, seat: 845, kg: "77 кг", chassis: "компактная посадка", role: "Переход во взрослый класс", status: "cand", paint: "#ff4a2b", trim: "Base" }),
  L({ id: "gt-trail-21", n: 5, name: "GT Trail 21", ser: "pro", group: "trail", wheels: "21/18", peak: 10, peakNote: "пик", kwh: 2.52, kmh: 90, range: "80 км", seat: null, kg: "71 кг", chassis: "дисковые тормоза", role: "Легкий эндуро", status: "cand", paint: "#ff4a2b", trim: "Base" }),
  L({ id: "gt-trail-14-pro", n: 6, name: "GT Trail 14 Pro", ser: "base", group: "trailpro", wheels: "14/12", peak: 4, peakNote: "1,8 ном. / 4 макс.", kwh: 1.8, kwhNote: "60 В", kmh: 79, range: "74 км", seat: null, kg: U, chassis: "батарея вдвое больше Trail 14", role: "Старший питбайк", status: "cand", paint: "#14161a", trim: "Pro", photo: false }),
  L({ id: "gt-trail-17-pro", n: 7, name: "GT Trail 17 Pro", ser: "base", group: "trailpro", wheels: "17/14", peak: 8, peakNote: "3 ном. / 8+ макс.", kwh: 2.16, kmh: 80, range: U, seat: 800, kg: "75,5 кг", chassis: "база 1240 мм", role: "Старшая версия 17", status: "cand", paint: "#14161a", trim: "Pro" }),
  L({ id: "gt-trail-19-pro", n: 8, name: "GT Trail 19 Pro", ser: "sport", group: "trailpro", wheels: "19/19", peak: 15, peakNote: "пик", kwh: 2.52, kwhNote: "72 В", kmh: null, range: U, seat: 830, kg: "71 кг", chassis: "алюминиевая рама, дисковые тормоза", role: "Основной Pro", status: "cand", paint: "#14161a", trim: "Pro", photo: false }),
  L({ id: "gt-trail-21-pro", n: 9, name: "GT Trail 21 Pro", ser: "pro", group: "trailpro", wheels: "21/18", peak: 12, peakNote: "мощность", kwh: 3.6, kmh: 100, range: "100 км", seat: 950, kg: "98,5 кг", chassis: "гидравлика, мотор QS138", role: "Большая батарея", status: "cand", paint: "#14161a", trim: "Pro" }),
  L({ id: "gt-race-17", n: 10, name: "GT Race 17", ser: "sport", group: "race", wheels: "17/14", peak: 10, peakNote: "4 ном. / 10 пик", kwh: 2.52, kmh: 90, range: "80 км при 40 км/ч", seat: 770, kg: "74,5 кг", chassis: "кованые алюминиевые рама и маятник", role: "Вход в Race", status: "cand", paint: "#eef1f4", trim: "17", photo: false }),
  L({ id: "gt-race-19", n: 11, name: "GT Race 19", ser: "sport", group: "race", wheels: "19/18", peak: 35, peakNote: "пик", kwh: null, kwhNote: "109 В, емкость уточняется", kmh: 100, range: "около 120 км при 45 км/ч", seat: 880, kg: "95 кг", chassis: "кованая алюминиевая рама, вилка 220 мм", role: "Основа Race", status: "cand", paint: "#2a5bd7", trim: "19" }),
  L({ id: "gt-race-sm", n: 12, name: "GT Race SM", ser: "sport", group: "race", wheels: "17/17", peak: null, peakNote: "платформа Race 19", kwh: null, kmh: null, range: U, seat: null, kg: U, chassis: "супермото, шины 110/70-17 и 140/60-17", role: "Супермото", status: "cand", paint: "#eef1f4", trim: "SM", photo: false }),
  L({ id: "gt-race-track", n: 13, name: "GT Race Track", ser: "sport", group: "race", wheels: "колесо + гусеница", peak: null, peakNote: "платформа Race 19", kwh: null, kmh: null, range: U, seat: null, kg: U, chassis: "задняя гусеница, переднее колесо", role: "Зимний байк", status: "cand", paint: "#eef1f4", trim: "Track", photo: false }),
  L({ id: "gt-race-21", n: 14, name: "GT Race 21", ser: "pro", group: "race", wheels: "21/18", peak: 65, peakNote: "мощность", kwh: 6.72, kmh: 150, range: "до 150 км", seat: 960, kg: "116 кг", chassis: "ход вилки 310 мм, заднего колеса 280 мм", role: "Флагман", status: "cand", paint: "#14161a", trim: "21" }),
  L({ id: "gt-city-compact", n: 15, name: "GT City Compact", ser: "road", group: "road", wheels: "17", peak: 5, peakNote: "центральный мотор", kwh: 2.88, kmh: 100, range: "около 120 км при 45 км/ч", seat: null, kg: "91 кг", chassis: "гидравлика, газовый амортизатор", role: "Компактный город", status: "request", paint: "#9cc9ff", trim: "Compact" }),
  L({ id: "gt-city", n: 16, name: "GT City", ser: "road", group: "road", wheels: "17/17", peak: 7.5, peakNote: "номинал", kwh: 3.24, kmh: 105, range: "до 120 км", seat: 840, kg: U, chassis: "центральный мотор, дисковые тормоза", role: "Опора серии: первая партия", status: "order", paint: "#eef1f4", trim: "Base" }),
  L({ id: "gt-scrambler", n: 17, name: "GT Scrambler", ser: "road", group: "road", wheels: "19/17", peak: 10, peakNote: "мощность", kwh: 4.32, kmh: 95, range: "100 км", seat: 800, kg: "104 кг", chassis: "скрэмблер, NCM-батарея", role: "Прогулочный скрэмблер", status: "request", paint: "#ff4a2b", trim: "Scrambler" }),
  L({ id: "gt-utility", n: 18, name: "GT Utility", ser: "road", group: "road", wheels: "17/17", peak: 8.7, peakNote: "макс.", kwh: 5.04, kwhNote: "2 сменные батареи", kmh: 100, range: "150 км при 60 км/ч", seat: 780, kg: "146 кг", chassis: "ABS, низкое седло", role: "Практичный город", status: "request", paint: "#2a2e35", trim: "Utility" }),
  L({ id: "gt-city-pro", n: 19, name: "GT City Pro", ser: "road", group: "road", wheels: "17/17", peak: 6, peakNote: "номинал", kwh: 4.14, kwhNote: "2 батареи", kmh: 100, range: "100 км", seat: null, kg: "110 кг", chassis: "ABS и трекшн-контроль", role: "Старшая дорожная", status: "cand", paint: "#14161a", trim: "Pro" }),
  L({ id: "gt-roadster", n: 20, name: "GT Roadster", ser: "road", group: "road", wheels: U, peak: 20, peakNote: "10,5 ном. / 20 пик", kwh: 8.35, kmh: 130, range: "до 300 км", seat: null, kg: "193 кг", chassis: "двухканальная ABS", role: "Дорожный флагман", status: "request", paint: "#5e1224", trim: "Roadster" }),
];
export const L_BY: Record<string, LModel> = Object.fromEntries(LINEUP.map((m) => [m.id, m]));
/** 3D-модель для позиции линейки: старшие дорожные получают темную версию. */
export const glbKey = (m: LModel): string => (m.ser === "road" && (m.trim === "Pro" || m.trim === "Roadster" || m.trim === "Utility") ? "roadpro" : m.ser);
export const GROUPS: { key: Group | "all"; ru: string; note: string }[] = [
  { key: "all", ru: "Все 20", note: "вся линейка" },
  { key: "mini", ru: "Mini", note: "первый байк 12" },
  { key: "trail", ru: "Trail", note: "14-21, база" },
  { key: "trailpro", ru: "Trail Pro", note: "14-21, усиленные" },
  { key: "race", ru: "Race", note: "спорт и флагман" },
  { key: "road", ru: "Road", note: "город и дорога" },
];
export const GROUP_RU: Record<Group, string> = { mini: "Mini", trail: "Trail", trailpro: "Trail Pro", race: "Race", road: "Road" };
export const STATUS: Record<Status, [string, string]> = {
  sale: ["в продаже", "#ff4a2b"],
  order: ["первая партия", "#ff4a2b"],
  cand: ["в отборе", "#9cc9ff"],
  request: ["под заказ", "#8d97a2"],
};
export const num = (x: number) => String(x).replace(".", ",");
export const lSpec = (m: LModel) => [
  { k: "колеса", v: m.wheels },
  { k: "мощность", v: m.peak ? `${num(m.peak)} кВт` : "уточняется", s: m.peakNote },
  { k: "батарея", v: m.kwh ? `${num(m.kwh)} кВт·ч` : "уточняется", s: m.kwhNote },
  { k: "скорость", v: m.kmh ? `${m.kmh} км/ч` : "уточняется" },
  { k: "запас хода", v: m.range },
  { k: "седло", v: m.seat ? `${m.seat} мм` : "уточняется" },
  { k: "масса", v: m.kg },
];

export const GT_BY: Record<string, GTModel> = GT_BY_HERO;
export const fmtRange = (r: [number, number]) => `${num(r[0])}-${num(r[1])}`;
export const verLabel = (v: Ver) => (v === "base" ? "Trail" : v === "sport" ? "Race" : v === "pro" ? "Trail Pro" : "Road");
export const verOf = (id: string): Ver => L_BY[id]?.ser ?? GT_BY_HERO[id]?.ver ?? "sport";

export const modelName = (id: string) => (L_BY[id] ? L_BY[id].name : GT_BY[id] ? GT_BY[id].name : CATALOG[id] ? CATALOG[id].model : id);
export const priceOf = (_id: string) => DEPOSIT;

/* ---------------- Направления ---------------- */
export type DirKey = "first" | "enduro" | "city" | "buggy" | "quad" | "snow";
export interface Dir { key: DirKey; ru: string; en: string; note: [string, string]; ids: string[]; cats: string[]; photo: string }
export const DIRS: Dir[] = [
  { key: "first", ru: "Первый байк", en: "pit / first ride", note: ["питбайк для старта: низкое седло, понятная мощность", "первый байк для подростка: низкое седло и плавная мощность"], ids: ["gt-mini-12", "gt-trail-14", "gt-trail-17"], cats: [], photo: "kid_rider" },
  { key: "enduro", ru: "Эндуро", en: "enduro / trail", note: ["лес, песок, овраги, send it", "лес, грунт и бездорожье с запасом хода"], ids: ["gt-trail-19", "gt-trail-21-pro", "gt-race-19"], cats: ["ebike-enduro", "moto"], photo: "forest_orange" },
  { key: "city", ru: "Город", en: "city / road", note: ["двор, набережная, ночной asphalt", "ежедневные поездки: тихо, быстро, удобно"], ids: ["gt-city", "gt-utility", "gt-scrambler"], cats: ["ebike-city", "ebike-sport"], photo: "night_blur" },
  { key: "buggy", ru: "Багги", en: "buggy / UTV", note: ["вдвоем и вчетвером, roost по полю", "для семьи, фермы и дальних выездов"], ids: [], cats: ["utv"], photo: "utv_dunes" },
  { key: "quad", ru: "Квадрик", en: "ATV", note: ["грязь, брод, drop с горки", "полный привод и высокая грузоподъемность"], ids: [], cats: ["quad"], photo: "atv_mud" },
  { key: "snow", ru: "Снег", en: "snow", note: ["пухляк, склон, зимний roost", "зимние выезды: лыжи, гусеница, тишина"], ids: ["gt-race-track"], cats: ["snow"], photo: "snow_powder" },
];

/** Ориентиры по классу техники под заказ (без названий и фото, только диапазоны по каталогу). */
export function dirStats(cats: string[]) {
  const ms = Object.values(CATALOG).filter((m) => cats.includes(m.cat));
  const rng = (f: (m: Model) => number | null) => { const v = ms.map(f).filter((x): x is number => !!x); return v.length ? [Math.min(...v), Math.max(...v)] : null; };
  const out: { k: string; v: string }[] = [];
  const cc = rng((m) => m.cc), kmh = rng((m) => m.kmh), kg = rng((m) => m.kg), kw = rng((m) => m.kw);
  const f = (r: number[] | null, u: string) => (r ? (r[0] === r[1] ? `${r[0]} ${u}` : `${r[0]}-${r[1]} ${u}`) : null);
  const items: [string, string | null][] = [["двигатель", f(cc, "см3")], ["мощность", f(kw, "кВт")], ["скорость", f(kmh, "км/ч")], ["вес", f(kg, "кг")]];
  items.forEach(([k, v]) => { if (v) out.push({ k, v }); });
  return { count: ms.length, rows: out };
}
export const gtSpec = (g: GTModel) => [
  { k: "мощность серии", v: `${fmtRange(g.kw)} кВт` },
  { k: "батарея серии", v: `${fmtRange(g.kwh)} кВт·ч` },
  { k: "колеса героя", v: g.wheels },
];
export const heroOf = (id: string) => L_BY[id] ?? L_BY[GT_BY_HERO[id]?.id ?? ""];

export const COMPARE_IDS = ["gt-trail-17", "gt-race-19", "gt-city"];

/** Фото-атмосфера: файлы в public/photos (Unsplash, лицензия Unsplash). */
export const photo = (n: string, sm = false) => `${import.meta.env.BASE_URL}photos/${sm ? "sm-" : ""}${n}.webp`;
/** Кадры «в деле» для коллажа модели: по группе. Сток до собственной съемки. */
export const SCENES: Record<Group, string[]> = {
  mini: ["kid_rider", "kids_pair", "backlit_dust", "forest_sun"],
  trail: ["dust_rider", "forest_orange", "trail_green", "backlit_dust"],
  trailpro: ["forest_orange", "trail_green", "hill_silhouette", "forest_sun"],
  race: ["dust_rider", "orange_dust", "dust_turn", "bw_dust"],
  road: ["night_city", "night_motion", "night_road", "rider_sea"],
};
/** Студийный кадр модели: профиль вправо, общий масштаб (540 px на метр), линия земли на 93% высоты кадра 16:9. */
export const studio = (n: number, sm = false) => `${import.meta.env.BASE_URL}products/studio/${sm ? "sm-" : ""}s${String(n).padStart(2, "0")}.webp`;
/** Реальные кадры моделей в деле из базы знаний (номер позиции → фото). */
export const LIFE: Record<number, string[]> = {};
