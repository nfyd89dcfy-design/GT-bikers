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
export const img = (f: string) => `${import.meta.env.BASE_URL}images/${f}`;
export const photo = (id: string, i = 0) => (GT_BY[id] ? img(GT_BY[id].file) : CATALOG[id] ? img(CATALOG[id].files[i]) : img(`${id}.webp`));

/** Примерные цены, ₽. Макет: реальные цены считаются при заказе. */
export const PRICE: Record<string, number> = {
  "79bike-titaone-s": 289000,
  "79bike-falcon-pro": 589000,
  "79bike-falcon-gt": 749000,
  "79bike-lynx-trail": 649000,
  "beiguma-cq": 329000,
  "beiguma-dl": 349000,
  "beiguma-jl-1": 369000,
  "julong-g39-12": 119000,
  "julong-t1-8": 159000,
  "jq-jq-m200": 389000,
  "jq-jq-s500": 589000,
  "jq-jq-s1000": 899000,
  "jq-jq-u200": 699000,
  "jq-jq-u1000": 1190000,
  "juhool-ssv-raider-pro": 2490000,
  "beiguma-xdc": 249000,
  "jq-jq-sn300": 329000,
  "nicot-kr4-125re-p29": 219000,
  "nicot-kr9-250ncs-p40": 339000,
  "nicot-ht5-450nc-p35": 459000,
};
export const rub = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n / 1000) * 1000) + " ₽";


/* ---------------- GT 4x2: четыре размера, версии Base и Pro ---------------- */
export type Ver = "base" | "pro";
export type SizeKey = "t14" | "t17" | "t19" | "t21";
export interface GTModel {
  id: string; size: SizeKey; ver: Ver; name: string; wheels: string; kw: [number, number]; kwh: [number, number];
  file: string; price: number; cut: boolean;
}
export interface GTSize { key: SizeKey; code: string; wheels: string; title: string; note: [string, string]; bg: string; fg: "light" | "dark"; word: string }

export const SIZES: GTSize[] = [
  { key: "t14", code: "T14", wheels: "14/12", title: "Компактный первый байк", note: ["Твой первый байк: легкий, понятный, без лишнего.", "Компактная посадка для первого знакомства с электро-эндуро."], bg: "#d3d8de", fg: "dark", word: "T14" },
  { key: "t17", code: "T17", wheels: "17/14", title: "Средний питбайк", note: ["Питбайк для двора, трассы и первых send it.", "Средний питбайк: баланс веса, мощности и посадки."], bg: "#5e1224", fg: "light", word: "T17" },
  { key: "t19", code: "T19", wheels: "19/18", title: "Легкий взрослый трейл", note: ["Легкий трейл для леса, песка и длинных выездов.", "Легкий взрослый трейл: динамика и запас хода для регулярных поездок."], bg: "#ff4a2b", fg: "dark", word: "T19" },
  { key: "t21", code: "T21", wheels: "21/18", title: "Полноразмерный эндуро", note: ["Полноразмерный эндуро. Максимум тяги, drop и roost.", "Полноразмерный эндуро для опытных райдеров: максимальная тяга."], bg: "#14161a", fg: "light", word: "T21" },
];
export const GT: GTModel[] = [
  { id: "gt-t14-base", size: "t14", ver: "base", name: "GT T14 Base", wheels: "14/12", kw: [2, 3], kwh: [1, 1.5], file: "mimbob-tk1-2.webp", price: 129000, cut: true },
  { id: "gt-t14-pro", size: "t14", ver: "pro", name: "GT T14 Pro", wheels: "14/12", kw: [3, 5], kwh: [1.5, 2], file: "mimbob-tk2-2.webp", price: 169000, cut: true },
  { id: "gt-t17-base", size: "t17", ver: "base", name: "GT T17 Base", wheels: "17/14", kw: [4, 6], kwh: [1.5, 2.2], file: "mimbob-em22-3-1.webp", price: 219000, cut: true },
  { id: "gt-t17-pro", size: "t17", ver: "pro", name: "GT T17 Pro", wheels: "17/14", kw: [6, 9], kwh: [2, 2.6], file: "mimbob-em22-6-1.webp", price: 289000, cut: true },
  { id: "gt-t19-base", size: "t19", ver: "base", name: "GT T19 Base", wheels: "19/18", kw: [8, 12], kwh: [2.3, 3.3], file: "79bike-falcon-pro.webp", price: 359000, cut: true },
  { id: "gt-t19-pro", size: "t19", ver: "pro", name: "GT T19 Pro", wheels: "19/18", kw: [15, 20], kwh: [2.9, 4], file: "79bike-falcon-gt-1.webp", price: 569000, cut: true },
  { id: "gt-t21-base", size: "t21", ver: "base", name: "GT T21 Base", wheels: "21/18", kw: [20, 30], kwh: [4, 4.5], file: "electripet-grasshopper.webp", price: 789000, cut: true },
  { id: "gt-t21-pro", size: "t21", ver: "pro", name: "GT T21 Pro", wheels: "21/18", kw: [30, 40], kwh: [5, 6], file: "opai-m1.webp", price: 1090000, cut: true },
];
export const GT_BY: Record<string, GTModel> = Object.fromEntries(GT.map((g) => [g.id, g]));
export const sizeOf = (k: SizeKey) => SIZES.find((x) => x.key === k)!;
export const fmtRange = (r: [number, number]) => `${String(r[0]).replace(".", ",")}-${String(r[1]).replace(".", ",")}`;
export const VER_NOTE: Record<Ver, [string, string]> = {
  base: ["Чистая посадка и честная цена", "Базовая комплектация: посадка и честная цена"],
  pro: ["Больше мощности и оснащения в той же посадке", "Расширенная комплектация и больше мощности в той же посадке"],
};

export const modelName = (id: string) => (GT_BY[id] ? GT_BY[id].name : CATALOG[id] ? CATALOG[id].model : id);
export const priceOf = (id: string) => GT_BY[id]?.price ?? PRICE[id] ?? 399000;

/* ---------------- Направления (фильтр по категориям каталога) ---------------- */
export type DirKey = "enduro" | "city" | "buggy" | "quad" | "snow";
export interface Dir { key: DirKey; ru: string; en: string; note: [string, string]; ids: string[] }
export const DIRS: Dir[] = [
  { key: "enduro", ru: "Эндуро", en: "enduro", note: ["лес, песок, овраги, send it", "лес, грунт и бездорожье с запасом хода"], ids: ["gt-t14-pro", "gt-t19-base", "gt-t21-pro"] },
  { key: "city", ru: "Город", en: "city", note: ["двор, набережная, ночной asphalt", "ежедневные поездки: тихо, быстро, удобно"], ids: ["julong-g39-12", "beiguma-dl", "beiguma-cq"] },
  { key: "buggy", ru: "Багги", en: "buggy / UTV", note: ["вдвоем и вчетвером, roost по полю", "для семьи, фермы и дальних выездов"], ids: ["jq-jq-u200", "jq-jq-u1000", "juhool-ssv-raider-pro"] },
  { key: "quad", ru: "Квадрик", en: "ATV", note: ["грязь, брод, drop с горки", "полный привод и высокая грузоподъемность"], ids: ["jq-jq-m200", "jq-jq-s500", "jq-jq-s1000"] },
  { key: "snow", ru: "Снег", en: "snow", note: ["пухляк, склон, зимний roost", "зимние выезды: лыжи, гусеница, тишина"], ids: ["beiguma-xdc", "jq-jq-sn300"] },
];

/** Характеристики для карточек направлений: у GT целевые, у остальных из каталога. */
export const spec = (m: Model) => {
  const a: { k: string; v: string }[] = [];
  if (m.kw) a.push({ k: "мощность", v: `${m.kw} кВт` });
  else if (m.cc) a.push({ k: "двигатель", v: `${m.cc} см3` });
  if (m.wh) a.push({ k: "батарея", v: `${m.wh} Вт·ч` });
  if (m.kmh) a.push({ k: "скорость", v: `${m.kmh} км/ч` });
  if (m.km) a.push({ k: "запас хода", v: `${m.km} км` });
  if (m.kg) a.push({ k: "вес", v: `${m.kg} кг` });
  return a;
};
export const gtSpec = (g: GTModel) => [
  { k: "пик, целевой", v: `${fmtRange(g.kw)} кВт` },
  { k: "энергия, целевая", v: `${fmtRange(g.kwh)} кВт·ч` },
  { k: "колеса", v: g.wheels },
];

export const COMPARE_IDS = GT.map((g) => g.id);
