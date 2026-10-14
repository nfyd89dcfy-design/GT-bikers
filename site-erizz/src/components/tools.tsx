import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useApp, reduceMotion, scrollToId } from "@/lib/state";
import { CATALOG, COMPARE_IDS, DIRS, TIER_LABEL, modelName, photo, priceOf, rub, spec, type Tier } from "@/lib/data";
import { GridBg } from "./shaders";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { GlowCard } from "./ui/spotlight-card";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Configurator */
const CHASSIS = [
  { id: "79bike-titaone-s", tier: "lite", hue: 55 },
  { id: "79bike-falcon-pro", tier: "pro", hue: 255 },
  { id: "79bike-falcon-gt", tier: "ultra", hue: 45 },
];
const BATT = [{ n: "Stock", k: 1, p: 0 }, { n: "+20%", k: 1.2, p: 45000 }, { n: "+40%", k: 1.4, p: 95000 }, { n: "Dual", k: 2, p: 160000 }];
const CTRL = [{ n: "Stock", p: 0, d: "ровный отклик" }, { n: "Sport", p: 25000, d: "резкий старт" }, { n: "Pro tune", p: 60000, d: "тонкая настройка" }];
const SHIFT = [0, 60, 120, 180, 240];
const DECAL = [{ n: "Без наклеек", p: 0, txt: "" }, { n: "send it", p: 7000, txt: "SEND IT" }, { n: "roost", p: 7000, txt: "ROOST" }, { n: "custom plate", p: 14000, txt: "RIZZ 01" }];

const hueName = (h: number) => {
  h = ((h % 360) + 360) % 360;
  return h < 15 || h >= 345 ? "красный" : h < 40 ? "оранжевый" : h < 70 ? "желтый" : h < 165 ? "зеленый" : h < 200 ? "бирюзовый" : h < 255 ? "синий" : h < 295 ? "фиолетовый" : "розовый";
};

function Price({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const cur = useRef(value);
  useEffect(() => {
    const el = ref.current!;
    if (reduceMotion()) { el.textContent = rub(value); cur.current = value; return; }
    const o = { v: cur.current };
    const tw = gsap.to(o, { v: value, duration: 0.5, ease: "power2.out", onUpdate: () => { el.textContent = rub(o.v); cur.current = o.v; } });
    return () => { tw.kill(); };
  }, [value]);
  return <span ref={ref}>{rub(value)}</span>;
}

export function Configurator() {
  const { t, addCart, setDriveFor } = useApp();
  const [ch, setCh] = useState(1);
  const [bt, setBt] = useState(0);
  const [ct, setCt] = useState(0);
  const [cl, setCl] = useState(0);
  const [dc, setDc] = useState(0);
  const c = CHASSIS[ch];
  const m = CATALOG[c.id];
  const total = priceOf(c.id) + BATT[bt].p + CTRL[ct].p + (cl ? 12000 : 0) + DECAL[dc].p;
  const wh = Math.round((m.wh || 0) * BATT[bt].k);
  const summary = `${c.tier}, батарея ${wh} Вт·ч (${BATT[bt].n}), контроллер ${CTRL[ct].n}, ${hueName(c.hue + SHIFT[cl])}${DECAL[dc].txt ? ", наклейки " + DECAL[dc].n : ""}`;
  const filter = `hue-rotate(${SHIFT[cl]}deg) saturate(${cl ? 1.35 : 1})`;
  const id = `build-${ch}${bt}${ct}${cl}${dc}`;

  const Opt = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <fieldset className="border-0 p-0"><legend className="mono mb-2 text-aqua">{label}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>
  );
  return (
    <section id="config" className="dark-zone relative isolate overflow-hidden py-20 sm:py-28" aria-labelledby="config-h">
      <GridBg a="#0b2a2e" b="#6fe0d0" className="absolute inset-0 -z-10 h-full w-full opacity-90" />
      <div className="container-x">
        <Reveal>
          <Eyebrow n="05" dark>конструктор</Eyebrow>
          <H2><span id="config-h">{t("Собери", "Соберите")}</span> <span className="text-aqua">{t("свой build", "свою конфигурацию")}</span></H2>
          <p className="muted mt-4 max-w-2xl text-lg">{t("Рама, батарея, контроллер, цвет, наклейки. Цена пересчитывается сразу, она примерная.", "Платформа, батарея, контроллер, цвет и наклейки. Стоимость пересчитывается сразу, цена примерная.")}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-frost/20 bg-deep/45 sm:min-h-[480px]" data-cursor="build">
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_55%,rgba(111,224,208,.28),transparent_70%)]" />
            <div className="absolute inset-x-[4%] top-1/2 -translate-y-1/2">
              <div className="relative">
                <img key={c.id} src={photo(c.id)} alt={`${modelName(c.id)}, цвет: ${hueName(c.hue + SHIFT[cl])}`} className="w-full transition-[filter] duration-500" style={{ filter }} />
                {DECAL[dc].txt && (
                  <div className="font-display pointer-events-none absolute left-[36%] top-[40%] -rotate-[8deg] rounded bg-flare px-2 py-0.5 text-[clamp(9px,1.5vw,18px)] font-extrabold text-ink shadow-lg">{DECAL[dc].txt}</div>
                )}
                <Spot x={44} y={52} label={`АКБ ${wh} Вт·ч`} />
                <Spot x={60} y={24} label={`контроллер ${CTRL[ct].n}`} />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <div>
                <div className="mono text-aqua">{m.brand} {m.model}</div>
                <div className="mono muted max-w-[16rem] truncate sm:max-w-none">{summary}</div>
              </div>
            </div>
          </div>
          <div className="space-y-5 rounded-3xl border border-frost/20 bg-deep/55 p-5 backdrop-blur sm:p-6">
            <Opt label="01 рама">
              {CHASSIS.map((x, i) => <button key={x.id} className="chip !text-frost aria-pressed:!text-ink" aria-pressed={ch === i} onClick={() => setCh(i)}>{x.tier}</button>)}
            </Opt>
            <Opt label="02 батарея">
              {BATT.map((x, i) => <button key={x.n} className="chip !text-frost aria-pressed:!text-ink" aria-pressed={bt === i} onClick={() => setBt(i)}>{x.n}</button>)}
            </Opt>
            <Opt label="03 контроллер">
              {CTRL.map((x, i) => <button key={x.n} className="chip !text-frost aria-pressed:!text-ink" aria-pressed={ct === i} onClick={() => setCt(i)} title={x.d}>{x.n}</button>)}
            </Opt>
            <Opt label="04 цвет">
              {SHIFT.map((s, i) => (
                <button key={s} aria-pressed={cl === i} aria-label={i === 0 ? "Цвет: стандартный" : `Цвет: ${hueName(c.hue + s)}`} onClick={() => setCl(i)}
                  className={cn("h-11 w-11 cursor-pointer rounded-full border-2", cl === i ? "border-flare ring-2 ring-flare/40" : "border-frost/40")}
                  style={{ background: i === 0 ? "linear-gradient(135deg,#222,#666)" : `hsl(${(c.hue + s) % 360} 75% 55%)` }} />
              ))}
            </Opt>
            <Opt label="05 кастом-наклейки">
              {DECAL.map((x, i) => <button key={x.n} className="chip !text-frost aria-pressed:!text-ink" aria-pressed={dc === i} onClick={() => setDc(i)}>{x.n}</button>)}
            </Opt>
            <p className="muted text-xs">{t("Оттенок в макете подбирается фильтром по фото, в проде будут рендеры каждой расцветки.", "Оттенок в макете подбирается фильтром по фото, в рабочей версии будут рендеры каждой расцветки.")}</p>
            <div className="border-t border-frost/25 pt-4">
              <div className="mono muted">примерная цена</div>
              <div className="font-display text-4xl font-extrabold" aria-live="polite"><Price value={total} /></div>
              <div className="mt-4 flex flex-wrap gap-3">
                <InteractiveHoverButton text={t("В корзину", "В корзину")} className="h-14 w-52 border-frost/40 bg-transparent text-frost" onClick={() => addCart({ id, name: `E-Rizz build · ${m.model}`, sub: summary, price: total, img: photo(c.id) })} data-testid="cfg-add" />
                <button className="btn-ghost" onClick={() => { setDriveFor(c.id); scrollToId("drive"); }}>{t("Сначала тест-драйв", "Сначала тест-драйв")}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function Spot({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <div className="absolute flex items-center gap-2" style={{ left: `${x}%`, top: `${y}%` }}>
      <span className="relative grid h-3 w-3 place-items-center"><span className="ping absolute h-3 w-3 rounded-full bg-flare/70" /><span className="h-2 w-2 rounded-full bg-flare" /></span>
      <span className="mono hidden rounded-full bg-deep/85 px-2 py-1 text-frost sm:block">{label}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- Quiz */
interface Q { q: [string, string]; a: { l: [string, string]; s: Partial<Record<string, number>> }[] }
const QUIZ: Q[] = [
  { q: ["Где будешь кататься чаще всего?", "Где вы планируете ездить чаще всего?"], a: [
    { l: ["Двор, город, набережная", "Город, двор, набережная"], s: { city: 3 } },
    { l: ["Лес, поле, овраги", "Лес, поле, грунтовые дороги"], s: { enduro: 3 } },
    { l: ["Грязь, брод, груз", "Бездорожье и перевозка груза"], s: { quad: 2, buggy: 2 } },
    { l: ["Снег и склоны", "Снег и зимние выезды"], s: { snow: 4 } },
  ] },
  { q: ["Какой у тебя опыт?", "Какой у вас опыт?"], a: [
    { l: ["Только начинаю", "Начинаю знакомство"], s: { lite: 3 } },
    { l: ["Катаю регулярно", "Езжу регулярно"], s: { pro: 3 } },
    { l: ["Хочу максимум, send it", "Нужен максимум мощности"], s: { ultra: 3 } },
  ] },
  { q: ["Что важнее всего?", "Что для вас важнее всего?"], a: [
    { l: ["Запас хода", "Запас хода"], s: { pro: 1, enduro: 1, city: 1 } },
    { l: ["Мощность и драйв", "Мощность и динамика"], s: { ultra: 2, enduro: 1 } },
    { l: ["Простота и цена", "Простота и стоимость"], s: { lite: 2 } },
    { l: ["Чтобы влезли все", "Место для пассажиров и груза"], s: { buggy: 3, quad: 1 } },
  ] },
  { q: ["Электро или бензин?", "Электро или бензин?"], a: [
    { l: ["Электро, тишина и тяга", "Электро: тишина и тяга"], s: { enduro: 1, city: 1 } },
    { l: ["Бензин, привычнее", "Бензин: привычнее"], s: { hybrid: 4 } },
    { l: ["Не знаю, хочу сравнить", "Пока не решил, хочу сравнить"], s: { hybrid: 3 } },
  ] },
];

export function Quiz() {
  const { t, addCart, toggleCompare, setDriveFor, setDir } = useApp();
  const [step, setStep] = useState(0);
  const [score, setScore] = useState<Record<string, number>>({});
  const done = step >= QUIZ.length;
  const pick = (s: Partial<Record<string, number>>) => {
    const n = { ...score };
    for (const k in s) n[k] = (n[k] || 0) + (s[k] || 0);
    setScore(n); setStep(step + 1);
  };
  const res = useMemo(() => {
    if (!done) return null;
    const dirs = DIRS.map((d) => [d.key, score[d.key] || 0] as const).sort((a, b) => b[1] - a[1]);
    const d = DIRS.find((x) => x.key === dirs[0][0])!;
    const tiers = (["lite", "pro", "ultra"] as Tier[]).map((x) => [x, score[x] || 0] as const).sort((a, b) => b[1] - a[1]);
    const want = tiers[0][1] ? tiers[0][0] : "pro";
    const avail = d.tiers.filter((x) => x.id);
    const found = avail.find((x) => x.tier === want) || avail[avail.length - 1];
    return { d, tier: found.tier as Tier, id: found.id! };
  }, [done, score]);

  return (
    <section id="quiz" className="relative py-20 sm:py-28" aria-labelledby="quiz-h">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <Eyebrow n="06">подбор</Eyebrow>
          <H2><span id="quiz-h">{t("Не знаешь, что", "Не знаете, что")}</span><br /><span className="text-flare">{t("выбрать?", "выбрать?")}</span></H2>
          <p className="mt-4 max-w-md text-lg text-mute">{t("Четыре вопроса, и мы подскажем направление и уровень: lite, pro или ultra.", "Четыре вопроса, и мы подскажем направление и уровень: lite, pro или ultra.")}</p>
        </Reveal>
        <div className="rounded-3xl bg-ink p-6 text-frost sm:p-8" aria-live="polite">
          {!done ? (
            <>
              <div className="mono mb-4 flex items-center justify-between text-aqua"><span>вопрос {step + 1} / {QUIZ.length}</span><span className="h-1 w-24 overflow-hidden rounded bg-frost/20"><span className="block h-full bg-flare" style={{ width: `${(step / QUIZ.length) * 100}%` }} /></span></div>
              <h3 className="font-display text-2xl font-extrabold uppercase leading-tight sm:text-3xl">{t(QUIZ[step].q[0], QUIZ[step].q[1])}</h3>
              <div className="mt-6 grid gap-3">
                {QUIZ[step].a.map((a) => (
                  <button key={a.l[0]} onClick={() => pick(a.s)} className="min-h-14 cursor-pointer rounded-2xl border border-frost/30 px-5 py-3 text-left text-lg font-semibold transition hover:border-flare hover:bg-flare hover:text-ink">
                    {t(a.l[0], a.l[1])}
                  </button>
                ))}
              </div>
            </>
          ) : res && (
            <div>
              <div className="mono text-aqua">{t("твой результат", "ваш результат")}: {res.d.ru} / {res.tier}</div>
              <div className="mt-4 grid items-center gap-4 sm:grid-cols-2">
                <img src={photo(res.id)} alt={modelName(res.id)} className="w-full rounded-2xl bg-kelp object-contain" style={{ aspectRatio: "4/3", objectFit: CATALOG[res.id].cut ? "contain" : "cover" }} />
                <div>
                  <h3 className="font-display text-3xl font-extrabold uppercase leading-none">{CATALOG[res.id].model}</h3>
                  <p className="muted mt-1">{CATALOG[res.id].brand}. {t(TIER_LABEL[res.tier][0], TIER_LABEL[res.tier][1])}.</p>
                  <ul className="mt-3 text-sm">{spec(CATALOG[res.id]).slice(0, 4).map((s) => <li key={s.k}><span className="muted">{s.k}:</span> {s.v}</li>)}</ul>
                  <div className="mt-3 font-display text-xl font-extrabold">{rub(priceOf(res.id))} <span className="mono muted">примерная цена</span></div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="btn-solid" onClick={() => addCart({ id: res.id, name: modelName(res.id), sub: `${res.tier} · примерная цена`, price: priceOf(res.id), img: photo(res.id) })}>В корзину</button>
                <button className="btn-ghost" onClick={() => { toggleCompare(res.id); scrollToId("compare"); }}>{t("Сравнить", "Сравнить")}</button>
                <button className="btn-ghost" onClick={() => { setDriveFor(res.id); scrollToId("drive"); }}>Тест-драйв</button>
                <button className="btn-ghost" onClick={() => { setDir(res.d.key); scrollToId("lineup"); }}>{t("Вся линейка", "Вся линейка")}</button>
                <button className="mono inline-flex min-h-11 cursor-pointer items-center gap-2 px-2 text-frost/80 hover:text-aqua" onClick={() => { setStep(0); setScore({}); }}><RotateCcw size={16} />еще раз</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Compare */
type Row = { k: string; get: (id: string) => number | string | null; unit?: string; best?: "max" | "min" };
const ROWS: Row[] = [
  { k: "Мощность", get: (i) => CATALOG[i].kw, unit: "кВт", best: "max" },
  { k: "Батарея", get: (i) => CATALOG[i].wh, unit: "Вт·ч", best: "max" },
  { k: "Двигатель", get: (i) => CATALOG[i].cc, unit: "см3" },
  { k: "Макс. скорость", get: (i) => CATALOG[i].kmh, unit: "км/ч", best: "max" },
  { k: "Запас хода", get: (i) => CATALOG[i].km, unit: "км", best: "max" },
  { k: "Вес", get: (i) => CATALOG[i].kg, unit: "кг", best: "min" },
  { k: "Тип", get: (i) => (CATALOG[i].fuel === "ev" ? "электро" : "бензин") },
];
export function Compare() {
  const { t, compare, toggleCompare, addCart } = useApp();
  const rows = ROWS.filter((r) => compare.some((id) => r.get(id) != null));
  return (
    <section id="compare" className="relative bg-frost py-20 sm:py-28" aria-labelledby="cmp-h">
      <div className="container-x">
        <Reveal>
          <Eyebrow n="07">сравнение</Eyebrow>
          <H2><span id="cmp-h">{t("Сравни", "Сравните")}</span> <span className="text-flare">2-3 модели</span></H2>
        </Reveal>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Выбор моделей для сравнения">
          {COMPARE_IDS.map((id) => (
            <button key={id} className="chip !min-h-11 text-sm" aria-pressed={compare.includes(id)} onClick={() => toggleCompare(id)}>{CATALOG[id].model}</button>
          ))}
        </div>
        <p className="mono mt-2 text-mute">{t("выбери от 2 до 3 моделей", "выберите от 2 до 3 моделей")}</p>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-ink/20 bg-sleet">
          <table className="w-full min-w-[470px] border-collapse text-left">
            <caption className="sr-only-x">Сравнение выбранных моделей</caption>
            <thead>
              <tr>
                <th className="w-[20%] p-2 sm:p-4" scope="col"><span className="sr-only-x">Параметр</span></th>
                {compare.map((id) => (
                  <th key={id} scope="col" className="p-2 align-bottom sm:p-4">
                    <GlowCardless id={id} />
                    <div className="mono mt-2 text-mute">{CATALOG[id].brand}</div>
                    <div className="font-display text-base font-extrabold uppercase sm:text-xl">{CATALOG[id].model}</div>
                    <div className="mt-1 text-sm font-normal"><span className="text-mute">примерная цена</span> {rub(priceOf(id))}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const vals = compare.map((id) => r.get(id));
                const nums = vals.filter((v): v is number => typeof v === "number");
                const best = r.best && nums.length > 1 ? (r.best === "max" ? Math.max(...nums) : Math.min(...nums)) : null;
                return (
                  <tr key={r.k} className="border-t border-ink/15">
                    <th scope="row" className="mono p-4 font-normal text-mute">{r.k}</th>
                    {vals.map((v, i) => (
                      <td key={compare[i]} className={cn("p-4 text-lg font-semibold", best !== null && v === best && "text-ink")}>
                        {v == null ? <span className="text-mute/70 text-sm font-normal">уточняем</span> : <span className={cn(best !== null && v === best && "rounded-full bg-flare px-3 py-1")}>{v}{r.unit ? ` ${r.unit}` : ""}</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr className="border-t border-ink/15">
                <th scope="row" className="p-4" />
                {compare.map((id) => (
                  <td key={id} className="p-4"><button className="btn-ghost" onClick={() => addCart({ id, name: modelName(id), sub: "примерная цена", price: priceOf(id), img: photo(id) })}>В корзину</button></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-mute">{t("Оранжевым отмечено лучшее значение в строке.", "Лучшее значение в строке отмечено цветом.")}</p>
      </div>
    </section>
  );
}
function GlowCardless({ id }: { id: string }) {
  const m = CATALOG[id];
  return <div className="grid h-24 place-items-center overflow-hidden rounded-xl bg-ink/10"><img src={photo(id)} alt={modelName(id)} loading="lazy" className={cn("h-full w-full", m.cut ? "object-contain" : "object-cover")} /></div>;
}
void GlowCard;
