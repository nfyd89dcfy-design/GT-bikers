import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useApp, reduceMotion, scrollToId } from "@/lib/state";
import { DEPOSIT, DIRS, GT, LINEUP, L_BY, STATUS, glbKey, lSpec, num, rub, studio, verLabel, type DirKey, type Ver } from "@/lib/data";
import { ObjectTracker } from "./effects";
import { Bike3D } from "./bike";
import { ProductShot, STUDIO } from "./product";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { ARButton, type ARKey } from "./ar";
import { cn } from "@/lib/utils";
import { MetalFigure } from "./fx";

/* ---------------------------------------------------------------- Configurator */
const BATT = [{ n: "Стандарт", k: 1, p: 0 }, { n: "+20% емкости", k: 1.2, p: 60000 }, { n: "Вторая батарея", k: 2, p: 140000 }];
const CTRL = [{ n: "Stock", p: 0, d: "ровный отклик" }, { n: "Sport", p: 25000, d: "резкий старт" }, { n: "Pro tune", p: 60000, d: "тонкая настройка под райдера" }];
const PAINT: { n: string; c?: string }[] = [{ n: "Заводской" }, { n: "Flare", c: "#ff4a2b" }, { n: "Иней", c: "#eef1f4" }, { n: "Графит", c: "#23272d" }, { n: "Небо", c: "#9cc9ff" }, { n: "Бордо", c: "#7a1b2e" }];
const DECAL = [{ n: "Без наклеек", p: 0, txt: "" }, { n: "GT", p: 7000, txt: "GT" }, { n: "E-RIZZ", p: 7000, txt: "E-RIZZ" }, { n: "Номер райдера", p: 14000, txt: "RIZZ 01" }];
/* Конструктор показывает фото героя серии; цвет пластика имитируем фильтром (черное, белое и хром не меняются). */
const CFG_N: Record<Ver, number> = { base: 2, sport: 10, pro: 14, road: 16 };
const BASE_HUE: Record<Ver, number> = { base: 12, sport: 78, pro: 70, road: 0 };
const paintFilter = (i: number, v: Ver) => {
  const b = BASE_HUE[v];
  return ["none", `hue-rotate(${9 - b}deg) saturate(1.35)`, "grayscale(1) brightness(1.22)", "grayscale(1) brightness(.72)", `hue-rotate(${213 - b}deg) saturate(.75) brightness(1.08)`, `hue-rotate(${347 - b}deg) saturate(1.2) brightness(.72)`][i] ?? "none";
};
const KIT = [{ n: "Без пакета", p: 0 }, { n: "Защита: рама, радиатор, руки", p: 18000 }, { n: "Свет и номер для дороги", p: 26000 }];

function Price({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const cur = useRef(value);
  useEffect(() => {
    const el = ref.current!;
    if (reduceMotion()) { el.textContent = "+" + rub(value); cur.current = value; return; }
    const o = { v: cur.current };
    const tw = gsap.to(o, { v: value, duration: 0.5, ease: "power2.out", onUpdate: () => { el.textContent = "+" + rub(o.v); cur.current = o.v; } });
    return () => { tw.kill(); };
  }, [value]);
  return <span ref={ref}>+{rub(value)}</span>;
}

export function Configurator() {
  const { t, addCart, setDriveFor } = useApp();
  const [ver, setVer] = useState<Ver>("sport");
  const [bt, setBt] = useState(0);
  const [ct, setCt] = useState(0);
  const [cl, setCl] = useState(0);
  const [dc, setDc] = useState(0);
  const [kt, setKt] = useState(0);
  const m = GT.find((g) => g.ver === ver)!;
  const hero = L_BY[m.id];
  const opts = BATT[bt].p + CTRL[ct].p + (cl ? 12000 : 0) + DECAL[dc].p + KIT[kt].p;
  const kwh = hero?.kwh ? Math.round(hero.kwh * BATT[bt].k * 100) / 100 : null;
  const summary = `${m.name}: батарея ${BATT[bt].n}${kwh ? ` (${num(kwh)} кВт·ч)` : ""}, контроллер ${CTRL[ct].n}, цвет ${PAINT[cl].n}${DECAL[dc].txt ? ", " + DECAL[dc].n : ""}${kt ? ", " + KIT[kt].n : ""}`;
  const id = `build-${ver}${bt}${ct}${cl}${dc}${kt}`;

  const Opt = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <fieldset className="border-0 p-0"><legend className="mono mb-2 text-sky">{label}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>
  );
  return (
    <section id="config" className="dark-zone relative isolate overflow-hidden py-24 sm:py-36" aria-labelledby="config-h">
      <div className="bg-horizon absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
      <div className="grain pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <MetalFigure kind="voxels" className="absolute right-[4%] top-10 hidden h-64 w-64 xl:block" />
            <div className="container-x">
        <Reveal>
          <Eyebrow n="06" dark>конструктор</Eyebrow>
          <H2><span id="config-h">{t("Собери", "Соберите")}</span> <span className="chrome-text">{t("свой build", "свою конфигурацию")}</span></H2>
          <p className="muted mt-4 max-w-2xl text-lg">{t("Серия, батарея, контроллер, цвет, наклейки, пакет. Стоимость опций пересчитывается сразу, базовую цену фиксируем после теста образца.", "Серия, батарея, контроллер, цвет, наклейки и пакет. Стоимость опций пересчитывается сразу, базовая цена фиксируется после теста образца.")}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:gap-6">
          <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-frost/20 bg-deep/45 sm:min-h-[520px]">
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_55%,rgba(185,194,204,.22),transparent_70%)]" />
            <div className="absolute inset-x-[4%] bottom-[14%] top-[6%]">
              <img src={studio(CFG_N[m.ver])} alt={`${m.name}, цвет: ${PAINT[cl].n}`} className="h-full w-full object-contain transition-[filter] duration-500" style={{ filter: paintFilter(cl, m.ver) }} />
            </div>
            {DECAL[dc].txt && <div className="font-display pointer-events-none absolute left-[44%] top-[44%] -rotate-[8deg] rounded bg-flare px-2 py-0.5 text-[clamp(9px,1.5vw,18px)] font-extrabold text-ink shadow-lg">{DECAL[dc].txt}</div>}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="mono text-sky">{m.name}</div>
                <div className="mono muted max-w-[20rem] truncate sm:max-w-[36rem]">{summary}</div>
              </div>
            </div>
          </div>
          <div className="space-y-5 rounded-3xl border border-frost/20 bg-deep/55 p-5 backdrop-blur sm:p-6">
            <Opt label="01 серия">
              {GT.map((x) => <button key={x.id} className="chip !text-frost aria-pressed:!text-ink" aria-pressed={ver === x.ver} onClick={() => setVer(x.ver)}>{x.short} · {x.wheels}</button>)}
            </Opt>
            <Opt label="02 батарея">
              {BATT.map((x, i) => <button key={x.n} className="chip !text-frost aria-pressed:!text-ink" aria-pressed={bt === i} onClick={() => setBt(i)}>{x.n}</button>)}
            </Opt>
            <Opt label="03 контроллер">
              {CTRL.map((x, i) => <button key={x.n} className="chip !text-frost aria-pressed:!text-ink" aria-pressed={ct === i} onClick={() => setCt(i)} title={x.d}>{x.n}</button>)}
            </Opt>
            <Opt label="04 цвет пластика">
              {PAINT.map((p, i) => (
                <button key={p.n} aria-pressed={cl === i} aria-label={`Цвет: ${p.n}`} onClick={() => setCl(i)}
                  className={cn("h-11 w-11 cursor-pointer rounded-full border-2", cl === i ? "border-flare ring-2 ring-flare/40" : "border-frost/40")}
                  style={{ background: p.c ?? "linear-gradient(135deg,#222,#ff4a2b)" }} />
              ))}
            </Opt>
            <Opt label="05 наклейки">
              {DECAL.map((x, i) => <button key={x.n} className="chip !text-frost aria-pressed:!text-ink" aria-pressed={dc === i} onClick={() => setDc(i)}>{x.n}</button>)}
            </Opt>
            <Opt label="06 пакет">
              {KIT.map((x, i) => <button key={x.n} className="chip !text-frost aria-pressed:!text-ink" aria-pressed={kt === i} onClick={() => setKt(i)}>{x.n}</button>)}
            </Opt>
            <div className="border-t border-frost/25 pt-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><div className="mono muted">опции</div><div className="font-display text-3xl font-extrabold" aria-live="polite"><Price value={opts} /></div></div>
                <div className="text-right"><div className="mono muted">бронь сейчас</div><div className="font-display text-3xl font-extrabold text-flare">{rub(DEPOSIT)}</div></div>
              </div>
              <p className="muted mt-2 text-xs">{t("Цена опций ориентировочная. Базовую цену модели назовем после теста образца, бронь вернем, если не подойдет.", "Цена опций ориентировочная. Базовая цена модели фиксируется после теста образца, бронь возвращается.")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <InteractiveHoverButton text="Забронировать" className="h-14 w-56 border-frost/40 bg-transparent text-frost" onClick={() => addCart({ id, name: `Build · ${m.name}`, sub: `${summary}; опции ${rub(opts)}`, price: DEPOSIT, variant: m.ver, paint: PAINT[cl].c })} data-testid="cfg-add" />
                <button className="btn-ghost" onClick={() => { setDriveFor(m.id); scrollToId("drive"); }}>Сначала тест-драйв</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Quiz */
type Sc = Partial<Record<string, number>>;
interface Q { q: [string, string]; a: { l: [string, string]; s: Sc; d?: DirKey }[] }
const QUIZ: Q[] = [
  { q: ["Что катаем?", "Какая техника вас интересует?"], a: [
    { l: ["Первый байк для подростка", "Первый байк для подростка"], s: { "gt-spark-14": 4, "gt-spark-17": 3 }, d: "first" },
    { l: ["Эндуро и лес", "Эндуро и бездорожье"], s: { "gt-send-19": 3, "gt-send-19r": 3, "gt-ridge-21": 2 }, d: "enduro" },
    { l: ["Город и трасса", "Город и трасса"], s: { "gt-pulse-17": 4, "gt-pulse-duo": 2, "gt-drift-19": 2 }, d: "city" },
    { l: ["Багги, квадрик, снег", "Багги, квадроцикл, снегоход"], s: {}, d: "buggy" },
  ] },
  { q: ["Кто поедет?", "Кто будет ездить?"], a: [
    { l: ["Подросток, рост до 165", "Подросток, рост до 165 см"], s: { "gt-spark-12": 2, "gt-spark-14": 3, "gt-spark-14s": 2 } },
    { l: ["Подросток повыше или новичок", "Подросток повыше или новичок"], s: { "gt-spark-17": 3, "gt-spark-17s": 2, "gt-send-19c": 2, "gt-pulse-17c": 2 } },
    { l: ["Взрослый, есть опыт", "Взрослый с опытом"], s: { "gt-send-19r": 3, "gt-send-19s": 2, "gt-ridge-21": 2, "gt-pulse-17": 2 } },
  ] },
  { q: ["Где будешь кататься?", "Где вы планируете ездить?"], a: [
    { l: ["Двор, парк, дача", "Двор, парк, дача"], s: { "gt-spark-14": 2, "gt-pulse-17c": 2, "gt-pulse-duo": 2 } },
    { l: ["Лес, песок, овраги", "Лес, песок, грунт"], s: { "gt-send-19": 2, "gt-send-19r": 2, "gt-spark-17s": 1 } },
    { l: ["Горы и тяжелый рельеф", "Горы и тяжелый рельеф"], s: { "gt-ridge-21": 3, "gt-ridge-21s": 2, "gt-send-19x": 1 } },
    { l: ["Асфальт каждый день", "Асфальт каждый день"], s: { "gt-pulse-17": 3, "gt-pulse-duo": 2, "gt-pulse-17r": 1 } },
  ] },
  { q: ["Что важнее?", "Что для вас важнее?"], a: [
    { l: ["Простота и цена", "Простота и цена"], s: { "gt-spark-14": 2, "gt-send-19": 2, "gt-pulse-17c": 2 } },
    { l: ["Запас хода", "Запас хода"], s: { "gt-send-19r": 2, "gt-pulse-duo": 3, "gt-send-19s": 2 } },
    { l: ["Мощность и оснащение", "Мощность и оснащение"], s: { "gt-send-19x": 2, "gt-send-19f": 3, "gt-pulse-17r": 2 } },
  ] },
];

export function Quiz() {
  const { t, addCart, toggleCompare, setDriveFor, setDir } = useApp();
  const [step, setStep] = useState(0);
  const [score, setScore] = useState<Record<string, number>>({});
  const [dk, setDk] = useState<DirKey | null>(null);
  const done = step >= QUIZ.length;
  const pick = (a: Q["a"][number]) => {
    const n = { ...score };
    for (const k in a.s) n[k] = (n[k] || 0) + (a.s[k] || 0);
    if (a.d) setDk(a.d);
    setScore(n); setStep(step + 1);
  };
  const res = useMemo(() => {
    if (!done) return null;
    const d = DIRS.find((x) => x.key === dk) ?? DIRS[1];
    if (d.key === "buggy" || d.key === "quad" || d.key === "snow") return { d, id: null as string | null };
    const pool = LINEUP.filter((m) => (d.key === "first" ? m.group === "spark" : d.key === "city" ? m.group === "road" : m.group === "send" || m.group === "ridge"));
    const best = pool.map((m) => [m.id, score[m.id] || 0] as const).sort((a, b) => b[1] - a[1])[0];
    return { d, id: best ? best[0] : null };
  }, [done, score, dk]);
  const m = res && res.id ? L_BY[res.id] : null;

  return (
    <section id="quiz" className="light-zone bg-silk relative isolate py-24 sm:py-36" aria-labelledby="quiz-h">
      <div className="grain pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <Eyebrow n="07">подбор</Eyebrow>
          <H2><span id="quiz-h">{t("Не знаешь, что", "Не знаете, что")}</span><br /><span className="text-flare">выбрать?</span></H2>
          <p className="mt-4 max-w-md text-lg text-mute">{t("Четыре вопроса, и мы подскажем модель из 20. Если не наше, подберем под заказ.", "Четыре вопроса, и мы подскажем модель из двадцати. Если подходящей нет, подберем технику под заказ.")}</p>
        </Reveal>
        <div className="rounded-3xl bg-ink p-6 text-frost sm:p-8" aria-live="polite">
          {!done ? (
            <>
              <div className="mono mb-4 flex items-center justify-between text-sky"><span>вопрос {step + 1} / {QUIZ.length}</span><span className="h-1 w-24 overflow-hidden rounded bg-frost/20"><span className="block h-full bg-flare" style={{ width: `${(step / QUIZ.length) * 100}%` }} /></span></div>
              <h3 className="font-display text-2xl font-extrabold uppercase leading-tight sm:text-3xl">{t(QUIZ[step].q[0], QUIZ[step].q[1])}</h3>
              <div className="mt-6 grid gap-3">
                {QUIZ[step].a.map((a) => (
                  <button key={a.l[0]} onClick={() => pick(a)} className="min-h-14 cursor-pointer rounded-2xl border border-frost/30 px-5 py-3 text-left text-lg font-semibold transition hover:border-flare hover:bg-flare hover:text-ink">{t(a.l[0], a.l[1])}</button>
                ))}
              </div>
            </>
          ) : res && (
            <div>
              <div className="mono text-sky">{t("твой результат", "ваш результат")}: {res.d.ru}{m ? ` / серия ${verLabel(m.ser)}` : ""}</div>
              <div className="mt-4 grid items-center gap-4 sm:grid-cols-2">
                {m ? <div className="h-[260px] rounded-2xl p-3" style={{ background: STUDIO[m.ser] }}><ProductShot m={m} className="h-full w-full" /></div> : <div className="grid min-h-[200px] place-items-center rounded-2xl bg-kelp p-6 text-center"><span className="font-display chrome-text text-4xl font-extrabold uppercase">{res.d.ru}</span></div>}
                <div>
                  <h3 className="font-display text-3xl font-extrabold uppercase leading-none">{m ? m.name : t("Под заказ", "Под заказ")}</h3>
                  {m ? <p className="muted mt-1">{m.role}. {m.chassis}.</p> : <p className="muted mt-1">{t("Такую технику мы подбираем под заказ: оставь заявку, и мы пришлем варианты.", "Такую технику мы подбираем под заказ: оставьте заявку, и мы пришлем варианты.")}</p>}
                  {m && <ul className="mt-3 text-sm">{lSpec(m).slice(0, 5).map((x) => <li key={x.k}><span className="muted">{x.k}:</span> {x.v}</li>)}</ul>}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {m && <button className="btn-solid" onClick={() => addCart({ id: m.id, name: m.name, sub: "бронь", price: DEPOSIT, variant: glbKey(m), paint: m.paint })}>Забронировать</button>}
                {m && <ARButton k={glbKey(m) as ARKey} name={m.name} />}
                {m && <button className="btn-ghost" onClick={() => { toggleCompare(m.id); scrollToId("compare"); }}>Сравнить</button>}
                <button className="btn-ghost" onClick={() => { setDriveFor(m ? m.id : "gt-pulse-17"); scrollToId("drive"); }}>{m ? "Тест-драйв" : "Оставить заявку"}</button>
                <button className="btn-ghost" onClick={() => { setDir(res.d.key); scrollToId("directions"); }}>Все в направлении</button>
                <button className="mono inline-flex min-h-11 cursor-pointer items-center gap-2 px-2 text-frost/80 hover:text-sky" onClick={() => { setStep(0); setScore({}); setDk(null); }}><RotateCcw size={16} />еще раз</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Compare */
type Row = { k: string; get: (id: string) => number | string | null; best?: "max" | "min"; show?: (id: string) => string };
const ROWS: Row[] = [
  { k: "Серия", get: (i) => verLabel(L_BY[i].ser) },
  { k: "Колеса, дюймы", get: (i) => L_BY[i].wheels },
  { k: "Мощность", get: (i) => L_BY[i].peak, show: (i) => (L_BY[i].peak ? `${num(L_BY[i].peak!)} кВт` : "уточняется"), best: "max" },
  { k: "Батарея", get: (i) => L_BY[i].kwh, show: (i) => (L_BY[i].kwh ? `${num(L_BY[i].kwh!)} кВт·ч` : "уточняется"), best: "max" },
  { k: "Скорость", get: (i) => L_BY[i].kmh, show: (i) => `${L_BY[i].kmh} км/ч`, best: "max" },
  { k: "Запас хода", get: (i) => L_BY[i].range },
  { k: "Седло", get: (i) => L_BY[i].seat, show: (i) => (L_BY[i].seat ? `${L_BY[i].seat} мм` : "уточняется") },
  { k: "Масса", get: (i) => L_BY[i].kg },
  { k: "Статус", get: (i) => STATUS[L_BY[i].status][0] },
];
export function Compare() {
  const { t, compare, toggleCompare, addCart } = useApp();
  const ids = compare.filter((id) => L_BY[id]);
  return (
    <section id="compare" className="relative bg-frost py-24 sm:py-36" aria-labelledby="cmp-h">
      <div className="container-x">
        <Reveal>
          <Eyebrow n="08">сравнение</Eyebrow>
          <H2><span id="cmp-h">{t("Сравни", "Сравните")}</span> <span className="text-flare">2-3 модели</span></H2>
        </Reveal>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Выбор моделей для сравнения">
          {LINEUP.map((m) => <button key={m.id} className="chip !min-h-10 !px-3 text-sm" aria-pressed={compare.includes(m.id)} onClick={() => toggleCompare(m.id)}>{m.name.replace("GT ", "")}</button>)}
        </div>
        <p className="mono mt-2 text-mute">{t("выбери от 2 до 3 моделей", "выберите от 2 до 3 моделей")}</p>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-ink/20 bg-sleet">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <caption className="sr-only-x">Сравнение выбранных моделей</caption>
            <thead>
              <tr>
                <th className="w-[18%] p-2 sm:p-4" scope="col"><span className="sr-only-x">Параметр</span></th>
                {ids.map((id) => (
                  <th key={id} scope="col" className="p-2 align-bottom sm:p-4">
                    <div className="h-28 overflow-hidden rounded-xl p-2 sm:h-40" style={{ background: STUDIO[L_BY[id].ser] }}><ProductShot m={L_BY[id]} className="h-full w-full" /></div>
                    <div className="font-display mt-2 text-base font-extrabold uppercase sm:text-xl">{L_BY[id].name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => {
                const vals = ids.map((id) => r.get(id));
                const nums = vals.filter((v): v is number => typeof v === "number");
                const best = r.best && nums.length > 1 ? (r.best === "max" ? Math.max(...nums) : Math.min(...nums)) : null;
                return (
                  <tr key={r.k} className="border-t border-ink/15">
                    <th scope="row" className="mono p-4 font-normal text-mute">{r.k}</th>
                    {vals.map((v, i) => (
                      <td key={ids[i]} className="p-4 text-base font-semibold sm:text-lg"><span className={cn(best !== null && v === best && "rounded-full bg-flare px-3 py-1")}>{r.show ? r.show(ids[i]) : v}</span></td>
                    ))}
                  </tr>
                );
              })}
              <tr className="border-t border-ink/15">
                <th scope="row" className="p-4" />
                {ids.map((id) => <td key={id} className="p-4"><button className="btn-ghost" onClick={() => addCart({ id, name: L_BY[id].name, sub: "бронь", price: DEPOSIT, variant: glbKey(L_BY[id]), paint: L_BY[id].paint })}>Забронировать</button></td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-mute">{t("Цветом отмечено лучшее значение в строке. Данные производителей, уточняются на тестах.", "Цветом отмечено лучшее значение в строке. Данные производителей, уточняются на тестах.")}</p>
      </div>
    </section>
  );
}
