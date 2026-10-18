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
   Ver: ключ 3D-модели и цветовой сцены.
   base = Spark (питбайки и первый байк), sport = Send (trail 19), pro = Ridge (enduro 21), road = Pulse / Drift / Grand (дорога). */
export type Ver = "base" | "sport" | "pro" | "road";
export interface GTModel {
  id: string; ver: Ver; name: string; short: string; series: string; wheels: string; front: number; rear: number; kw: [number, number]; kwh: [number, number]; price: number;
  bg: string; fg: "light" | "dark"; word: string; tag: [string, string]; look: [string, string]; accent: string; count: number; models: string;
}
/** Четыре героя: по одному на серию. Диапазоны kw / kwh показывают всю серию. */
export const GT: GTModel[] = [
  { id: "gt-spark-14", ver: "base", name: "GT Spark 14", short: "Spark", series: "Spark", wheels: "14/12", front: 14, rear: 12, kw: [1, 8], kwh: [0.4, 2.2], price: DEPOSIT, bg: "#14161a", fg: "light", word: "SPARK", accent: "#ff4a2b", count: 5, models: "Spark 12, 14, 14 S, 17, 17 S",
    tag: ["Первый заряд: питбайки 12-17 дюймов, с которых начинают и не хотят слезать.", "Первый серьезный байк: питбайки 12-17 дюймов для подростков и тех, кто начинает."],
    look: ["Flare-пластик, черная рама, низкое седло от 700 мм.", "Пластик цвета flare, черная рама, низкое седло от 700 мм."] },
  { id: "gt-send-19r", ver: "sport", name: "GT Send 19 R", short: "Send", series: "Send", wheels: "19/18", front: 19, rear: 18, kw: [8, 35], kwh: [2.2, 4.3], price: DEPOSIT, bg: "#ff4a2b", fg: "dark", word: "SEND", accent: "#e4e8ec", count: 7, models: "Send 19 C, CR, 19, S, R, X, Factory",
    tag: ["Взрослый trail: лес, песок, длинные выезды. Send it.", "Взрослый trail для леса, песка и длинных выездов."],
    look: ["Батарея 4,32 кВт·ч, ход подвески 200/208 мм, гидравлика 220/203 мм.", "Батарея 4,32 кВт·ч, ход подвески 200/208 мм, гидравлические тормоза 220/203 мм."] },
  { id: "gt-ridge-21", ver: "pro", name: "GT Ridge 21", short: "Ridge", series: "Ridge", wheels: "21/18", front: 21, rear: 18, kw: [10, 12], kwh: [2.5, 3.6], price: DEPOSIT, bg: "#5e1224", fg: "light", word: "RIDGE", accent: "#9cc9ff", count: 2, models: "Ridge 21, 21 S",
    tag: ["Полноразмерный эндуро 21/18: камни, корни, подъемы.", "Полноразмерный эндуро 21/18 для сложного рельефа."],
    look: ["Колеса 21/18, масса от 71 кг, скорость до 100 км/ч.", "Колеса 21/18, масса от 71 кг, скорость до 100 км/ч."] },
  { id: "gt-pulse-17", ver: "road", name: "GT Pulse 17", short: "Pulse", series: "Road", wheels: "17/17", front: 17, rear: 17, kw: [5, 20], kwh: [2.9, 8.4], price: DEPOSIT, bg: "#1c2026", fg: "light", word: "PULSE", accent: "#9cc9ff", count: 6, models: "Pulse 17, 17 C, Duo, R, Drift 19, Grand",
    tag: ["Город и трасса: тихо, быстро, каждый день. Первая партия уже в пути.", "Город и трасса: тихо, быстро, каждый день. Первая партия уже заказана."],
    look: ["7,5 кВт, 105 км/ч, до 120 км. Дорожная серия с ABS в старших версиях.", "7,5 кВт, 105 км/ч, до 120 км. В старших версиях ABS."] },
];
export const GT_BY_HERO: Record<string, GTModel> = Object.fromEntries(GT.map((g) => [g.id, g]));

/* ---------------- Полная линейка: 20 моделей ---------------- */
export type Status = "order" | "cand" | "reserve";
export interface LModel {
  id: string; n: number; name: string; ser: Ver; group: "spark" | "send" | "ridge" | "road";
  wheels: string; peak: number | null; peakNote: string; kwh: number | null; kwhNote?: string; kmh: number; range: string; seat: number | null; kg: string;
  chassis: string; role: string; status: Status; paint: string; trim: string;
}
const L = (x: LModel) => x;
export const LINEUP: LModel[] = [
  L({ id: "gt-spark-12", n: 1, name: "GT Spark 12", ser: "base", group: "spark", wheels: "12/10", peak: 1, peakNote: "мощность", kwh: 0.37, kmh: 33, range: "20 км", seat: 700, kg: "42,5 кг", chassis: "гидравлические дисковые тормоза", role: "Вход в серию", status: "cand", paint: "#9cc9ff", trim: "Base" }),
  L({ id: "gt-spark-14", n: 2, name: "GT Spark 14", ser: "base", group: "spark", wheels: "14/12", peak: 3, peakNote: "1,5 ном. / 3 пик", kwh: 1.4, kmh: 60, range: "50 км при 45 км/ч", seat: null, kg: "52 кг", chassis: "дисковые тормоза, гидроподвеска", role: "Базовый питбайк", status: "cand", paint: "#ff4a2b", trim: "Base" }),
  L({ id: "gt-spark-14s", n: 3, name: "GT Spark 14 S", ser: "base", group: "spark", wheels: "14/12", peak: 5.5, peakNote: "макс.", kwh: 2.16, kmh: 65, range: "85 км при 60 км/ч", seat: 700, kg: "65 кг", chassis: "центральный мотор, ход вилки 120 мм", role: "Старший питбайк", status: "cand", paint: "#eef1f4", trim: "S" }),
  L({ id: "gt-spark-17", n: 4, name: "GT Spark 17", ser: "base", group: "spark", wheels: "17/14", peak: 5, peakNote: "мощность", kwh: 1.8, kmh: 75, range: "75 км", seat: 810, kg: "уточняется", chassis: "72 В, мотор с редуктором", role: "Средний питбайк", status: "cand", paint: "#ff4a2b", trim: "Base" }),
  L({ id: "gt-spark-17s", n: 5, name: "GT Spark 17 S", ser: "base", group: "spark", wheels: "17/14", peak: 8, peakNote: "3 ном. / 8+ макс.", kwh: 2.16, kmh: 80, range: "уточняется", seat: 800, kg: "75,5 кг", chassis: "база 1240 мм", role: "Старшая версия 17", status: "cand", paint: "#2a2e35", trim: "S" }),
  L({ id: "gt-send-19c", n: 6, name: "GT Send 19 C", ser: "sport", group: "send", wheels: "19/16", peak: 8, peakNote: "3 ном. / 8+ макс.", kwh: 2.16, kmh: 88, range: "уточняется", seat: 845, kg: "77 кг", chassis: "компактная посадка", role: "Переход во взрослый класс", status: "cand", paint: "#eef1f4", trim: "C" }),
  L({ id: "gt-send-19cr", n: 7, name: "GT Send 19 CR", ser: "sport", group: "send", wheels: "19/16", peak: 30, peakNote: "макс.", kwh: 3.96, kmh: 100, range: "100 км при 40 км/ч", seat: 860, kg: "99 кг", chassis: "хромомолибденовая рама, алюминиевый маятник", role: "Компактный спорт", status: "cand", paint: "#ff4a2b", trim: "CR" }),
  L({ id: "gt-send-19", n: 8, name: "GT Send 19", ser: "sport", group: "send", wheels: "19/18", peak: 8, peakNote: "макс.", kwh: 2.35, kmh: 90, range: "от 80 км при 60 км/ч", seat: 810, kg: "71 кг", chassis: "алюминиевая рама, вилка 226 мм", role: "Взрослая база", status: "cand", paint: "#14161a", trim: "Base" }),
  L({ id: "gt-send-19s", n: 9, name: "GT Send 19 S", ser: "sport", group: "send", wheels: "19/19", peak: 17, peakNote: "5 ном. / 17 пик", kwh: 3.24, kmh: 105, range: "140 км при 30-35 км/ч", seat: 850, kg: "73 кг", chassis: "гидравлика 220 мм", role: "Спортивный trail", status: "cand", paint: "#9cc9ff", trim: "S" }),
  L({ id: "gt-send-19r", n: 10, name: "GT Send 19 R", ser: "sport", group: "send", wheels: "19/18", peak: 17, peakNote: "6 ном. / 17 пик", kwh: 4.32, kmh: 110, range: "120 км при 40 км/ч", seat: 890, kg: "86 кг с АКБ", chassis: "ход 200/208 мм, гидравлика 220/203 мм", role: "Основной Pro", status: "cand", paint: "#14161a", trim: "R" }),
  L({ id: "gt-send-19x", n: 11, name: "GT Send 19 X", ser: "sport", group: "send", wheels: "19/18", peak: 25, peakNote: "мощность", kwh: 4.32, kmh: 100, range: "100 км", seat: null, kg: "85 кг", chassis: "4-поршневые суппорты", role: "Альтернатива Pro", status: "cand", paint: "#5e1224", trim: "X" }),
  L({ id: "gt-send-19f", n: 12, name: "GT Send 19 Factory", ser: "sport", group: "send", wheels: "19/18", peak: 35, peakNote: "пик", kwh: null, kwhNote: "109 В, емкость уточняется", kmh: 100, range: "около 120 км при 45 км/ч", seat: 880, kg: "95 кг", chassis: "кованая алюминиевая рама, вилка 220 мм", role: "Флагман", status: "cand", paint: "#2a5bd7", trim: "Factory" }),
  L({ id: "gt-ridge-21", n: 13, name: "GT Ridge 21", ser: "pro", group: "ridge", wheels: "21/18", peak: 10, peakNote: "пик", kwh: 2.52, kmh: 90, range: "80 км", seat: null, kg: "71 кг", chassis: "дисковые тормоза", role: "Легкий эндуро", status: "cand", paint: "#eef1f4", trim: "Base" }),
  L({ id: "gt-ridge-21s", n: 14, name: "GT Ridge 21 S", ser: "pro", group: "ridge", wheels: "21/18", peak: 12, peakNote: "мощность", kwh: 3.6, kmh: 100, range: "100 км", seat: 950, kg: "98,5 кг", chassis: "гидравлика, мотор QS138", role: "Большая батарея", status: "cand", paint: "#ff4a2b", trim: "S" }),
  L({ id: "gt-pulse-17c", n: 15, name: "GT Pulse 17 C", ser: "road", group: "road", wheels: "17", peak: 5, peakNote: "центральный мотор", kwh: 2.88, kmh: 100, range: "около 120 км при 45 км/ч", seat: null, kg: "91 кг", chassis: "гидравлика, газовый амортизатор", role: "Компактный город", status: "cand", paint: "#9cc9ff", trim: "C" }),
  L({ id: "gt-pulse-17", n: 16, name: "GT Pulse 17", ser: "road", group: "road", wheels: "17/17", peak: 7.5, peakNote: "номинал", kwh: 3.24, kmh: 105, range: "до 120 км", seat: 840, kg: "уточняется", chassis: "центральный мотор, дисковые тормоза", role: "Опора серии: первая партия", status: "order", paint: "#eef1f4", trim: "Base" }),
  L({ id: "gt-pulse-duo", n: 17, name: "GT Pulse 17 Duo", ser: "road", group: "road", wheels: "17/17", peak: 8.7, peakNote: "макс.", kwh: 5.04, kwhNote: "2 сменные батареи", kmh: 100, range: "150 км при 60 км/ч", seat: 780, kg: "146 кг", chassis: "ABS, низкое седло", role: "Практичный город", status: "cand", paint: "#2a2e35", trim: "Duo" }),
  L({ id: "gt-drift-19", n: 18, name: "GT Drift 19", ser: "road", group: "road", wheels: "19/17", peak: 10, peakNote: "мощность", kwh: 4.32, kmh: 95, range: "100 км", seat: 800, kg: "104 кг", chassis: "скрэмблер, NCM-батарея", role: "Прогулочный скрэмблер", status: "reserve", paint: "#ff4a2b", trim: "Base" }),
  L({ id: "gt-pulse-17r", n: 19, name: "GT Pulse 17 R", ser: "road", group: "road", wheels: "17/17", peak: 6, peakNote: "номинал", kwh: 4.14, kwhNote: "2 батареи", kmh: 100, range: "100 км", seat: null, kg: "110 кг", chassis: "ABS + трекшн-контроль", role: "Старшая дорожная", status: "reserve", paint: "#14161a", trim: "R" }),
  L({ id: "gt-grand", n: 20, name: "GT Grand", ser: "road", group: "road", wheels: "уточняются", peak: 20, peakNote: "10,5 ном. / 20 пик", kwh: 8.35, kmh: 130, range: "до 300 км", seat: null, kg: "193 кг", chassis: "двухканальная ABS", role: "Дорожный флагман", status: "reserve", paint: "#5e1224", trim: "Grand" }),
];
export const L_BY: Record<string, LModel> = Object.fromEntries(LINEUP.map((m) => [m.id, m]));
/** 3D-модель для позиции линейки: дорожные R и Grand получают темную версию. */
export const glbKey = (m: LModel): string => (m.ser === "road" && (m.trim === "R" || m.trim === "Grand" || m.trim === "Duo") ? "roadpro" : m.ser);
export const GROUPS: { key: LModel["group"] | "all"; ru: string; note: string }[] = [
  { key: "all", ru: "Все 20", note: "вся линейка" },
  { key: "spark", ru: "Spark", note: "питбайки 12-17" },
  { key: "send", ru: "Send", note: "trail 19" },
  { key: "ridge", ru: "Ridge", note: "эндуро 21" },
  { key: "road", ru: "Pulse / Drift / Grand", note: "дорога" },
];
export const STATUS: Record<Status, [string, string]> = {
  order: ["первая партия", "#ff4a2b"],
  cand: ["в отборе", "#9cc9ff"],
  reserve: ["резерв", "#8d97a2"],
};
export const num = (x: number) => String(x).replace(".", ",");
export const lSpec = (m: LModel) => [
  { k: "колеса", v: m.wheels },
  { k: "мощность", v: m.peak ? `${num(m.peak)} кВт` : "уточняется", s: m.peakNote },
  { k: "батарея", v: m.kwh ? `${num(m.kwh)} кВт·ч` : "уточняется", s: m.kwhNote },
  { k: "скорость", v: `${m.kmh} км/ч` },
  { k: "запас хода", v: m.range },
  { k: "седло", v: m.seat ? `${m.seat} мм` : "уточняется" },
  { k: "масса", v: m.kg },
];

export const GT_BY: Record<string, GTModel> = GT_BY_HERO;
export const fmtRange = (r: [number, number]) => `${num(r[0])}-${num(r[1])}`;
export const verLabel = (v: Ver) => (v === "base" ? "Spark" : v === "sport" ? "Send" : v === "pro" ? "Ridge" : "Road");
export const verOf = (id: string): Ver => L_BY[id]?.ser ?? GT_BY_HERO[id]?.ver ?? "sport";

export const modelName = (id: string) => (L_BY[id] ? L_BY[id].name : GT_BY[id] ? GT_BY[id].name : CATALOG[id] ? CATALOG[id].model : id);
export const priceOf = (_id: string) => DEPOSIT;

/* ---------------- Направления ---------------- */
export type DirKey = "first" | "enduro" | "city" | "buggy" | "quad" | "snow";
export interface Dir { key: DirKey; ru: string; en: string; note: [string, string]; ids: string[]; cats: string[]; photo: string }
export const DIRS: Dir[] = [
  { key: "first", ru: "Первый байк", en: "pit / first ride", note: ["питбайк для старта: низкое седло, понятная мощность", "первый байк для подростка: низкое седло и плавная мощность"], ids: ["gt-spark-12", "gt-spark-14", "gt-spark-17"], cats: [], photo: "kid_rider" },
  { key: "enduro", ru: "Эндуро", en: "enduro / trail", note: ["лес, песок, овраги, send it", "лес, грунт и бездорожье с запасом хода"], ids: ["gt-send-19", "gt-send-19r", "gt-ridge-21"], cats: ["ebike-enduro", "moto"], photo: "forest_orange" },
  { key: "city", ru: "Город", en: "city / road", note: ["двор, набережная, ночной asphalt", "ежедневные поездки: тихо, быстро, удобно"], ids: ["gt-pulse-17", "gt-pulse-duo", "gt-drift-19"], cats: ["ebike-city", "ebike-sport"], photo: "night_blur" },
  { key: "buggy", ru: "Багги", en: "buggy / UTV", note: ["вдвоем и вчетвером, roost по полю", "для семьи, фермы и дальних выездов"], ids: [], cats: ["utv"], photo: "utv_dunes" },
  { key: "quad", ru: "Квадрик", en: "ATV", note: ["грязь, брод, drop с горки", "полный привод и высокая грузоподъемность"], ids: [], cats: ["quad"], photo: "atv_mud" },
  { key: "snow", ru: "Снег", en: "snow", note: ["пухляк, склон, зимний roost", "зимние выезды: лыжи, гусеница, тишина"], ids: [], cats: ["snow"], photo: "snow_powder" },
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

export const COMPARE_IDS = ["gt-spark-14", "gt-send-19r", "gt-pulse-17"];

/** Фото-атмосфера: файлы в public/photos (Unsplash, лицензия Unsplash). */
export const photo = (n: string, sm = false) => `${import.meta.env.BASE_URL}photos/${sm ? "sm-" : ""}${n}.webp`;
/** Фото модели (вырезанное, прозрачный фон). n – номер позиции 1-20. */
export const prod = (n: number, sm = false) => `${import.meta.env.BASE_URL}products/${sm ? "sm-" : ""}m${String(n).padStart(2, "0")}.webp`;
/** Кадры «в деле» для коллажа модели: по группе. Сток до собственной съемки. */
export const SCENES: Record<LModel["group"], string[]> = {
  spark: ["kid_rider", "kids_pair", "backlit_dust", "forest_sun"],
  send: ["dust_rider", "orange_dust", "dust_turn", "bw_dust"],
  ridge: ["forest_orange", "trail_green", "hill_silhouette", "forest_sun"],
  road: ["night_city", "night_motion", "night_road", "rider_sea"],
};
