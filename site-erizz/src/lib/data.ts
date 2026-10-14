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
export const photo = (id: string, i = 0) => (CATALOG[id] ? img(CATALOG[id].files[i]) : img(`${id}.webp`));

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
export const priceOf = (id: string) => PRICE[id] ?? 399000;
export const rub = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n / 1000) * 1000) + " ₽";

export type DirKey = "enduro" | "city" | "buggy" | "quad" | "snow" | "hybrid";
export type Tier = "lite" | "pro" | "ultra";
export interface Dir {
  key: DirKey;
  ru: string;
  en: string;
  hero: string; // id
  bg: string; // lifestyle photo id for atmospheres
  note: [string, string];
  tiers: { tier: Tier; id: string | null }[];
}

export const DIRS: Dir[] = [
  {
    key: "enduro", ru: "Эндуро", en: "enduro", hero: "79bike-falcon-gt", bg: "nicot-kr9-250ncs-p40",
    note: ["лес, песок, овраги, send it", "лес, грунт и бездорожье с запасом хода"],
    tiers: [{ tier: "lite", id: "79bike-titaone-s" }, { tier: "pro", id: "79bike-falcon-pro" }, { tier: "ultra", id: "79bike-falcon-gt" }],
  },
  {
    key: "city", ru: "Город", en: "city", hero: "beiguma-cq", bg: "nicot-bt-250fe-p45",
    note: ["двор, набережная, ночной asphalt", "ежедневные поездки: тихо, быстро, удобно"],
    tiers: [{ tier: "lite", id: "julong-g39-12" }, { tier: "pro", id: "beiguma-dl" }, { tier: "ultra", id: "beiguma-cq" }],
  },
  {
    key: "buggy", ru: "Багги", en: "buggy / UTV", hero: "jq-jq-u1000", bg: "zzssv-zz1400-2",
    note: ["вдвоем и вчетвером, roost по полю", "для семьи, фермы и дальних выездов"],
    tiers: [{ tier: "lite", id: "jq-jq-u200" }, { tier: "pro", id: "jq-jq-u1000" }, { tier: "ultra", id: "juhool-ssv-raider-pro" }],
  },
  {
    key: "quad", ru: "Квадрик", en: "ATV", hero: "jq-jq-s1000", bg: "juhool-utv-titan-pro",
    note: ["грязь, брод, drop с горки", "уверенный полный привод и грузоподъемность"],
    tiers: [{ tier: "lite", id: "jq-jq-m200" }, { tier: "pro", id: "jq-jq-s500" }, { tier: "ultra", id: "jq-jq-s1000" }],
  },
  {
    key: "snow", ru: "Снег", en: "snow", hero: "beiguma-xdc", bg: "nicot-ht5-450nc-p35",
    note: ["пухляк, склон, зимний roost", "зимние выезды: лыжи, гусеница, тишина"],
    tiers: [{ tier: "lite", id: "beiguma-xdc" }, { tier: "pro", id: "jq-jq-sn300" }, { tier: "ultra", id: null }],
  },
  {
    key: "hybrid", ru: "Бенз + электро", en: "gas / ev", hero: "79bike-falcon-pro", bg: "nicot-kr3-250cbf-p23",
    note: ["не определился: примерь оба мира", "не определились: сравните оба варианта рядом"],
    tiers: [{ tier: "lite", id: "nicot-kr4-125re-p29" }, { tier: "pro", id: "nicot-kr9-250ncs-p40" }, { tier: "ultra", id: "79bike-falcon-gt" }],
  },
];

export const TIER_LABEL: Record<Tier, [string, string]> = {
  lite: ["первый drop: легкий вход", "Легкий вход в мир E-Rizz"],
  pro: ["для тех, кто уже катает", "Золотая середина по запасу и мощности"],
  ultra: ["максимум, send it", "Максимум мощности и дальности"],
};

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

/** Список для сравнения и квиза. */
export const COMPARE_IDS = [
  "79bike-titaone-s", "79bike-falcon-pro", "79bike-falcon-gt", "79bike-lynx-trail",
  "nicot-kr9-250ncs-p40", "jq-jq-s1000", "juhool-ssv-raider-pro", "zzssv-zz1400-2",
];
export const modelName = (id: string) => `${CATALOG[id].brand} ${CATALOG[id].model}`;
