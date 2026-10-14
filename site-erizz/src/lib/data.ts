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


/* ---------------- GT: три модели Base / Sport / Pro ---------------- */
export type Ver = "base" | "sport" | "pro";
export interface GTModel {
  id: string; ver: Ver; name: string; short: string; wheels: string; front: number; rear: number; kw: [number, number]; kwh: [number, number]; price: number;
  bg: string; fg: "light" | "dark"; word: string; tag: [string, string]; look: [string, string]; accent: string;
}
export const GT: GTModel[] = [
  { id: "gt-base", ver: "base", name: "GT Base", short: "Base", wheels: "17/14", front: 17, rear: 14, kw: [5, 8], kwh: [1.8, 2.4], price: 249000, bg: "#14161a", fg: "light", word: "BASE", accent: "#ff4a2b",
    tag: ["Твой первый серьезный байк: легкий, понятный, без лишнего.", "Первый серьезный байк: легкий, понятный и без лишнего."], look: ["Черная матовая рама, графитовые обода и одна вспышка flare.", "Матовая черная рама, графитовые обода, единственный акцент flare."] },
  { id: "gt-sport", ver: "sport", name: "GT Sport", short: "Sport", wheels: "19/18", front: 19, rear: 18, kw: [10, 16], kwh: [2.6, 3.6], price: 459000, bg: "#ff4a2b", fg: "dark", word: "SPORT", accent: "#e4e8ec",
    tag: ["Для леса, песка и длинных выездов: динамика и запас хода.", "Для леса, песка и длинных выездов: динамика и запас хода."], look: ["Хромированные детали, серебристо-стальная подвеска, оранжевые обода.", "Хромированные детали, серебристо-стальная подвеска и оранжевые обода."] },
  { id: "gt-pro", ver: "pro", name: "GT Pro", short: "Pro", wheels: "21/18", front: 21, rear: 18, kw: [25, 35], kwh: [4.5, 5.5], price: 939000, bg: "#5e1224", fg: "light", word: "PRO", accent: "#c9a24b",
    tag: ["Полноразмерный эндуро: максимум тяги, drop и roost.", "Полноразмерный эндуро для опытных райдеров: максимум тяги."], look: ["Бордовая рама, золотые обода и подвеска, хромированный корпус батареи.", "Бордовая рама, золотые обода и подвеска, хромированный корпус батареи."] },
];
export const GT_BY: Record<string, GTModel> = Object.fromEntries(GT.map((g) => [g.id, g]));
export const fmtRange = (r: [number, number]) => `${String(r[0]).replace(".", ",")}-${String(r[1]).replace(".", ",")}`;
export const verLabel = (v: Ver) => (v === "base" ? "Base" : v === "sport" ? "Sport" : "Pro");

export const modelName = (id: string) => (GT_BY[id] ? GT_BY[id].name : CATALOG[id] ? CATALOG[id].model : id);
export const priceOf = (id: string) => GT_BY[id]?.price ?? PRICE[id] ?? 399000;

/* ---------------- Направления (фильтр по категориям каталога) ---------------- */
export type DirKey = "enduro" | "city" | "buggy" | "quad" | "snow";
export interface Dir { key: DirKey; ru: string; en: string; note: [string, string]; ids: string[]; cats: string[] }
export const DIRS: Dir[] = [
  { key: "enduro", ru: "Эндуро", en: "enduro", note: ["лес, песок, овраги, send it", "лес, грунт и бездорожье с запасом хода"], ids: ["gt-sport", "gt-pro"], cats: ["ebike-enduro", "moto"] },
  { key: "city", ru: "Город", en: "city", note: ["двор, набережная, ночной asphalt", "ежедневные поездки: тихо, быстро, удобно"], ids: ["gt-base"], cats: ["ebike-city", "ebike-sport"] },
  { key: "buggy", ru: "Багги", en: "buggy / UTV", note: ["вдвоем и вчетвером, roost по полю", "для семьи, фермы и дальних выездов"], ids: [], cats: ["utv"] },
  { key: "quad", ru: "Квадрик", en: "ATV", note: ["грязь, брод, drop с горки", "полный привод и высокая грузоподъемность"], ids: [], cats: ["quad"] },
  { key: "snow", ru: "Снег", en: "snow", note: ["пухляк, склон, зимний roost", "зимние выезды: лыжи, гусеница, тишина"], ids: [], cats: ["snow"] },
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
  { k: "пик, целевой", v: `${fmtRange(g.kw)} кВт` },
  { k: "энергия, целевая", v: `${fmtRange(g.kwh)} кВт·ч` },
  { k: "колеса, дюймы", v: g.wheels },
];

export const COMPARE_IDS = GT.map((g) => g.id);
