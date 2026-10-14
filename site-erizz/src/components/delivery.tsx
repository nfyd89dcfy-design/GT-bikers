import { useMemo, useState } from "react";
import { Box, PackageCheck, Truck } from "lucide-react";
import { useApp } from "@/lib/state";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { GlowCard } from "./ui/spotlight-card";
import { cn } from "@/lib/utils";

/* Упрощенный контур России (lon, lat), проекция равнопромежуточная со сжатием по долготе */
const OUTLINE: [number, number][] = [
  [30, 69.8], [36, 69.2], [41, 67.4], [44, 66.2], [46, 68], [53, 68.6], [60, 69.4], [66, 69.8], [68, 71.2], [72, 73], [80, 73.5], [87, 75.5], [100, 77], [105, 77.8], [113, 73.8], [128, 73.5], [140, 72.8], [150, 71.3], [160, 69.6], [170, 69.7], [180, 68.9], [190, 66.2], [187, 64.6], [180, 64.8], [178, 62.5], [172, 60.5], [166, 60], [163, 60], [163, 58], [162, 55], [160, 52.5], [156.5, 51], [156, 53.5], [155.8, 57], [156, 59.7], [150, 59.3], [143, 59], [138, 56], [135, 54.7], [140, 53.5], [141, 50], [140, 47], [138, 46], [135, 43.5], [132, 43], [131, 43], [131, 45], [134.5, 48.3], [130.5, 48.8], [127, 50], [125, 53], [120, 53.2], [118, 49.8], [116, 49.8], [114, 50], [110, 49.5], [107, 50.3], [102, 51.3], [98, 51], [96, 50.5], [91, 50.5], [88, 49], [87, 49], [84, 50.5], [80, 51], [77, 53.5], [73, 54], [70, 55.2], [65, 54], [61.5, 53], [61, 50.8], [55, 50.8], [52, 51.7], [50, 51.5], [47.5, 50], [47, 48.5], [47, 47], [49, 46.5], [47.5, 45], [48, 43], [48.5, 41.8], [46, 41.8], [43.5, 42.7], [42, 43], [40.5, 43.3], [39.8, 43.5], [37.7, 44.5], [36.7, 45.2], [37.5, 45.5], [38, 47], [40, 48], [40, 49.5], [38, 49.5], [35.5, 50], [34, 51.5], [32, 52.5], [31.5, 54], [31, 56], [27.5, 55.8], [28, 57], [27.5, 58], [28, 59.5], [30, 61], [29.5, 65], [30, 67], [28.5, 69],
];
const S = 10.2;
const pr = (lon: number, lat: number): [number, number] => [(lon - 25) * 0.5 * S + 16, (79 - lat) * S + 14];

interface City { n: string; lon: number; lat: number }
const ORIGINS: City[] = [{ n: "Москва", lon: 37.6, lat: 55.75 }, { n: "Ростов-на-Дону", lon: 39.7, lat: 47.2 }];
const CITIES: City[] = [
  { n: "Санкт-Петербург", lon: 30.3, lat: 59.9 }, { n: "Краснодар", lon: 38.97, lat: 45.04 }, { n: "Сочи", lon: 39.7, lat: 43.6 }, { n: "Воронеж", lon: 39.2, lat: 51.7 },
  { n: "Казань", lon: 49.1, lat: 55.8 }, { n: "Самара", lon: 50.1, lat: 53.2 }, { n: "Екатеринбург", lon: 60.6, lat: 56.8 }, { n: "Омск", lon: 73.4, lat: 55 },
  { n: "Новосибирск", lon: 82.9, lat: 55 }, { n: "Красноярск", lon: 92.9, lat: 56 }, { n: "Иркутск", lon: 104.3, lat: 52.3 }, { n: "Хабаровск", lon: 135.1, lat: 48.5 },
  { n: "Владивосток", lon: 131.9, lat: 43.1 }, { n: "Мурманск", lon: 33.1, lat: 68.97 }, { n: "Якутск", lon: 129.7, lat: 62 },
];

const km = (a: City, b: City) => {
  const R = 6371, rad = Math.PI / 180;
  const dl = (b.lat - a.lat) * rad, dn = (b.lon - a.lon) * rad;
  const h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const plural = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "день" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "дня" : "дней");
const eta = (a: City, b: City) => { const d = km(a, b); const lo = Math.round(d / 950) + 2; const hi = lo + 2; return { d: Math.round(d / 10) * 10, txt: `${lo}-${hi} ${plural(hi)}` }; };

const STEPS = [
  { icon: Box, h: "Заказ", ty: "Выбираешь байк и оставляешь заявку. Мы подтверждаем комплектацию и цену.", vy: "Вы выбираете технику и оставляете заявку. Мы подтверждаем комплектацию и стоимость." },
  { icon: PackageCheck, h: "Упаковка", ty: "Проверяем, снимаем лишнее, пакуем в обрешетку, фиксируем фото-отчетом.", vy: "Проверяем технику, пакуем в обрешетку и присылаем фото-отчет." },
  { icon: Truck, h: "Доставка", ty: "Транспортная компания довезет до двери или терминала в твоем городе.", vy: "Транспортная компания доставит технику до двери или до терминала в вашем городе." },
];

export function Delivery() {
  const { t } = useApp();
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState("Новосибирск");
  const o = ORIGINS[from];
  const sel = CITIES.find((c) => c.n === to)!;
  const e = useMemo(() => eta(o, sel), [o, sel]);
  const path = OUTLINE.map((p, i) => `${i ? "L" : "M"}${pr(p[0], p[1]).map((v) => v.toFixed(1)).join(",")}`).join(" ") + " Z";
  const curve = (a: City, b: City) => {
    const [x1, y1] = pr(a.lon, a.lat), [x2, y2] = pr(b.lon, b.lat);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, d = Math.hypot(x2 - x1, y2 - y1);
    return `M${x1},${y1} Q${mx},${my - d * 0.22} ${x2},${y2}`;
  };
  return (
    <section id="delivery" className="relative py-28 sm:py-40" aria-labelledby="del-h">
      <div className="container-x">
        <Reveal>
          <Eyebrow n="09">доставка</Eyebrow>
          <H2><span id="del-h">{t("Доставка", "Доставка")}</span> <span className="chrome-text-dark">по России</span></H2>
          <div className="gold-line mt-6 max-w-md" />
          <p className="mt-5 max-w-2xl text-lg text-mute">{t("Отправляем из Москвы и Ростова-на-Дону в любой город. Выбери город на карте и посмотри примерный срок.", "Отправляем из Москвы и Ростова-на-Дону в любой город. Выберите город на карте и посмотрите примерный срок.")}</p>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="brushed-dark relative overflow-hidden rounded-3xl border border-ink/30 p-2 text-frost">
            <svg viewBox="0 0 900 450" role="img" aria-label={`Карта России: маршрут из ${o.n} в ${to}`} className="h-auto w-full">
              <path d={path} fill="#232830" stroke="#8d97a2" strokeWidth="1.2" strokeLinejoin="round" />
              {Array.from({ length: 14 }).map((_, i) => <line key={i} x1={20 + i * 64} y1="10" x2={20 + i * 64} y2="440" stroke="#fff" strokeOpacity=".04" />)}
              {CITIES.map((c) => <path key={c.n} d={curve(o, c)} fill="none" stroke="#8d97a2" strokeOpacity={c.n === to ? 0 : 0.28} strokeWidth="1" />)}
              <path d={curve(o, sel)} fill="none" stroke="#ff4a2b" strokeWidth="2.6" strokeDasharray="7 6" className="route-anim" />
              {CITIES.map((c) => {
                const [x, y] = pr(c.lon, c.lat); const on = c.n === to;
                return (
                  <g key={c.n} role="button" tabIndex={0} aria-label={`Город: ${c.n}`} onClick={() => setTo(c.n)} onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setTo(c.n); } }} className="cursor-pointer outline-none">
                    <circle cx={x} cy={y} r="14" fill="transparent" />
                    <circle cx={x} cy={y} r={on ? 6 : 3.6} fill={on ? "#ff4a2b" : "#e4e8ec"} stroke={on ? "#fff" : "none"} strokeWidth="1.5" />
                    <text x={x + 8} y={y - 7} fontSize={on ? 14 : 11} fontFamily="Onest" fontWeight={on ? 700 : 400} fill={on ? "#fff" : "#b9c2cc"}>{c.n}</text>
                  </g>
                );
              })}
              {ORIGINS.map((c, i) => {
                const [x, y] = pr(c.lon, c.lat);
                return (
                  <g key={c.n}>
                    <circle cx={x} cy={y} r="14" fill="none" stroke="#c9a24b" strokeWidth="1.5" opacity={i === from ? 1 : 0.4}><animate attributeName="r" values="9;16;9" dur="2.4s" repeatCount="indefinite" /></circle>
                    <circle cx={x} cy={y} r="7" fill="#c9a24b" stroke="#0e1013" strokeWidth="2" />
                    <text x={x + (i ? 12 : -12)} y={y + (i ? 20 : -14)} textAnchor={i ? "start" : "end"} fontSize="13" fontFamily="Onest" fontWeight="800" fill="#f1d994">{c.n}</text>
                  </g>
                );
              })}
            </svg>
            <p className="mono absolute bottom-3 left-4 text-frost/60">схема упрощена, не карта</p>
          </div>

          <div className="flex flex-col gap-4">
            <div role="group" aria-label="Откуда отправляем" className="flex flex-wrap gap-2">
              {ORIGINS.map((c, i) => <button key={c.n} className="chip" aria-pressed={from === i} onClick={() => setFrom(i)}>из: {c.n}</button>)}
            </div>
            <div className="rounded-3xl border border-ink/25 bg-frost p-6" aria-live="polite">
              <div className="mono text-mute">{o.n} → {to}</div>
              <div className="font-display mt-2 text-4xl font-extrabold uppercase leading-none">{e.txt}</div>
              <div className="gold-line my-3" />
              <p className="text-mute">Расстояние около {e.d} км. Срок <b className="text-ink">примерный</b>: зависит от транспортной компании, погоды и загрузки.</p>
            </div>
            <label className="mono text-mute" htmlFor="del-sel">другой город</label>
            <select id="del-sel" className="input -mt-2" value={to} onChange={(ev) => setTo(ev.target.value)}>{CITIES.map((c) => <option key={c.n}>{c.n}</option>)}</select>
          </div>
        </div>

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.h}>
              <GlowCard customSize glowColor="flare" className="touch-pan-y! h-full min-h-[220px] !bg-ink text-frost">
                <div>
                  <div className="flex items-center justify-between"><s.icon size={30} className="text-gold" aria-hidden="true" /><span className="font-display text-5xl font-extrabold text-frost/20">0{i + 1}</span></div>
                  <h3 className="font-display mt-4 text-2xl font-extrabold uppercase">{s.h}</h3>
                </div>
                <p className={cn("text-frost/80")}>{t(s.ty, s.vy)}</p>
              </GlowCard>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-mute">{t("Сроки и стоимость примерные, точные мы называем после оформления заказа. Забрать байк можно и в шоуруме в Ростове-на-Дону.", "Сроки и стоимость примерные, точные мы называем после оформления заказа. Забрать технику можно и в шоуруме в Ростове-на-Дону.")}</p>
      </div>
    </section>
  );
}
