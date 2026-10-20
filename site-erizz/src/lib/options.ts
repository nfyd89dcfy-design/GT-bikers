/* Опции сборки байка: общие для конструктора и брони. Цены опций ориентировочные. */
import type { LModel, Ver } from "./data";

export const BATT = [{ n: "Стандарт", k: 1, p: 0 }, { n: "+20% емкости", k: 1.2, p: 60000 }, { n: "Вторая батарея", k: 2, p: 140000 }];
export const CTRL = [
  { n: "Штатный", p: 0, d: "ровный отклик" },
  { n: "Moxin Sport", p: 25000, d: "резкий старт" },
  { n: "Moxin Pro tune", p: 60000, d: "тонкая настройка под райдера" },
];
export const PAINT: { n: string; c?: string }[] = [{ n: "Заводской" }, { n: "Flare", c: "#ff4a2b" }, { n: "Иней", c: "#eef1f4" }, { n: "Графит", c: "#23272d" }, { n: "Небо", c: "#9cc9ff" }, { n: "Бордо", c: "#7a1b2e" }];
export const DECAL = [{ n: "Без наклеек", p: 0, txt: "" }, { n: "Знак GT", p: 7000, txt: "GT" }, { n: "Номер райдера", p: 14000, txt: "GT 01" }];
/** Пакеты можно брать вместе. p: null = цену назовем при подтверждении. */
export const KITS: { n: string; d: string; p: number | null; img?: string }[] = [
  { n: "Защита", d: "рама, радиатор, руки", p: 18000, img: "forkguard" },
  { n: "Свет и номер", d: "для дороги", p: 26000 },
  { n: "Зимний комплект", d: "гусеница и лыжа", p: null, img: "snowkit" },
];
/** Экипировка: цены не показываем, назовем при подтверждении брони. */
export const GEAR_ITEMS: { k: string; n: string; img: string }[] = [
  { k: "kit", n: "Джерси и штаны", img: "kit" },
  { k: "boots", n: "Мотоботы", img: "boots" },
  { k: "goggles", n: "Маска", img: "goggles" },
  { k: "gloves", n: "Перчатки", img: "gloves" },
  { k: "brace", n: "Ортезы на колени", img: "brace" },
  { k: "pack", n: "Рюкзак", img: "pack" },
  { k: "barpad", n: "Накладка на руль", img: "barpad" },
];
export const shopImg = (n: string) => `${import.meta.env.BASE_URL}shop/${n}.webp`;

/* Цвет пластика имитируем фильтром по фото (черное, белое и хром не меняются).
   Нужен исходный оттенок акцента на конкретном фото: небо, flare, бордо или кобальт. */
const BASE_HUE: Record<Ver, number> = { base: 213, sport: 9, pro: 350, road: 222 };
const PHOTO_HUE: Record<number, number> = { 1: 213, 4: 9, 5: 350, 7: 213, 9: 350, 11: 9, 15: 222, 16: 222, 17: 222, 18: 222, 19: 222, 20: 222 };
export const hueOf = (m: LModel) => PHOTO_HUE[m.n] ?? BASE_HUE[m.ser];
export const paintFilterHue = (i: number, b: number) =>
  ["none", `hue-rotate(${9 - b}deg) saturate(1.35)`, "grayscale(1) brightness(1.22)", "grayscale(1) brightness(.72)", `hue-rotate(${213 - b}deg) saturate(.75) brightness(1.08)`, `hue-rotate(${347 - b}deg) saturate(1.2) brightness(.72)`][i] ?? "none";

export interface BuildCfg { paint: number; batt: number; ctrl: number; decal: number; kits: number[]; gear: string[] }
export const emptyCfg = (): BuildCfg => ({ paint: 0, batt: 0, ctrl: 0, decal: 0, kits: [], gear: [] });
export const cfgPrice = (c: BuildCfg) => BATT[c.batt].p + CTRL[c.ctrl].p + DECAL[c.decal].p + c.kits.reduce((a, k) => a + (KITS[k].p ?? 0), 0);
/** Строки сборки для корзины и итога. */
export const cfgLines = (c: BuildCfg) => {
  const out: string[] = [];
  if (c.paint) out.push(`цвет ${PAINT[c.paint].n}`);
  if (c.batt) out.push(`батарея ${BATT[c.batt].n}`);
  if (c.ctrl) out.push(`контроллер ${CTRL[c.ctrl].n}`);
  if (c.decal) out.push(DECAL[c.decal].n);
  c.kits.forEach((k) => out.push(KITS[k].n.toLowerCase()));
  if (c.gear.length) out.push("экипировка: " + c.gear.map((g) => GEAR_ITEMS.find((x) => x.k === g)?.n.toLowerCase()).join(", "));
  return out;
};
export const cfgKey = (c: BuildCfg) => [c.paint, c.batt, c.ctrl, c.decal, c.kits.join("."), c.gear.join(".")].join("-");
