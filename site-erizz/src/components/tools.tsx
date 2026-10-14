import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useApp, reduceMotion, scrollToId } from "@/lib/state";
import { DIRS, GT, GT_BY, fmtRange, gtSpec, rub, verLabel, type Ver } from "@/lib/data";
import { BlockGrid } from "./shaders";
import { ObjectTracker } from "./effects";
import { Bike3D, BikeThumb } from "./bike";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Configurator */
const BATT = [{ n: "Стандарт", k: 1, p: 0 }, { n: "+10%", k: 1.1, p: 35000 }, { n: "+20%", k: 1.2, p: 80000 }, { n: "Dual", k: 2, p: 150000 }];
const CTRL = [{ n: "Stock", p: 0, d: "ровный отклик" }, { n: "Sport", p: 25000, d: "резкий старт" }, { n: "Pro tune", p: 60000, d: "тонкая настройка" }];
const PAINT: { n: string; c?: string }[] = [{ n: "Стандарт" }, { n: "Flare", c: "#ff4a2b" }, { n: "Бордо", c: "#7a1b2e" }, { n: "Сталь", c: "#aeb7c1" }, { n: "Графит", c: "#23272d" }];
const DECAL = [{ n: "Без наклеек", p: 0, txt: "" }, { n: "send it", p: 7000, txt: "SEND IT" }, { n: "roost", p: 7000, txt: "ROOST" }, { n: "custom plate", p: 14000, txt: "RIZZ 01" }];

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
  const [ver, setVer] = useState<Ver>("sport");
  const [bt, setBt] = useState(0);
  const [ct, setCt] = useState(0);
  const [cl, setCl] = useState(0);
  const [dc, setDc] = useState(0);
  const m = GT.find((g) => g.ver === ver)!;
  const total = m.price + BATT[bt].p + CTRL[ct].p + (cl ? 12000 : 0) + DECAL[dc].p;
  const kwhTop = Math.round(m.kwh[1] * BATT[bt].k * 10) / 10;
  const summary = `${m.name}, АКБ до ${String(kwhTop).replace(".", ",")} кВт·ч (${BATT[bt].n}), контроллер ${CTRL[ct].n}, цвет: ${PAINT[cl].n}${DECAL[dc].txt ? ", наклейки " + DECAL[dc].n : ""}`;
  const id = `build-${ver}${bt}${ct}${cl}${dc}`;

  const Opt = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <fieldset className="border-0 p-0"><legend className="mono mb-2 text-gold">{label}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>
  );
  return (
    <section id="config" className="dark-zone relative isolate overflow-hidden py-20 sm:py-28" aria-labelledby="config-h">
      <BlockGrid a="#07080a" b="#1f242b" line="#6b747e" gain={0.9} cells={15} lineAmt={0.3} react={0.8} seed={9} className="absolute inset-0 -z-10 h-full w-full opacity-80" />
      <div className="container-x">
        <Reveal>
          <Eyebrow n="05" dark>конструктор</Eyebrow>
          <H2><span id="config-h">{t("Собери", "Соберите")}</span> <span className="chrome-text">{t("свой build", "свою конфигурацию")}</span></H2>
          <p className="muted mt-4 max-w-2xl text-lg">{t("Модель, батарея, контроллер, цвет, наклейки. Цена пересчитывается сразу, она примерная.", "Модель, батарея, контроллер, цвет и наклейки. Стоимость пересчитывается сразу, цена примерная.")}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:gap-6">
          <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-frost/20 bg-deep/45 sm:min-h-[520px]">
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_55%,rgba(185,194,204,.22),transparent_70%)]" />
            <div className="absolute inset-0">
              <Bike3D variant={m.ver} paint={PAINT[cl].c} interactive yaw={-0.5} sway={0.08} label={`${m.name}, цвет: ${PAINT[cl].n}. Потяни, чтобы повернуть`} className="h-full w-full" />
              <ObjectTracker wheels={m.wheels} facing="right" className="pointer-events-none absolute inset-0 h-full w-full" />
            </div>
            {DECAL[dc].txt && <div className="font-display pointer-events-none absolute left-[44%] top-[46%] -rotate-[8deg] rounded bg-flare px-2 py-0.5 text-[clamp(9px,1.5vw,18px)] font-extrabold text-ink shadow-lg">{DECAL[dc].txt}</div>}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="mono text-gold">{m.name}</div>
              <div className="mono muted max-w-[20rem] truncate sm:max-w-none">{summary}</div>
            </div>
          </div>
          <div className="space-y-5 rounded-3xl border border-frost/20 bg-deep/55 p-5 backdrop-blur sm:p-6">
            <Opt label="01 модель">
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
                  style={{ background: p.c ?? "linear-gradient(135deg,#222,#9aa3ad)" }} />
              ))}
            </Opt>
            <Opt label="05 кастом-наклейки">
              {DECAL.map((x, i) => <button key={x.n} className="chip !text-frost aria-pressed:!text-ink" aria-pressed={dc === i} onClick={() => setDc(i)}>{x.n}</button>)}
            </Opt>
            <p className="muted text-xs">{t("Цвет перекрашивает пластик в 3D, наклейки в макете показаны плашкой. Спецификации целевые.", "Цвет перекрашивает пластик в 3D, наклейки в макете показаны плашкой. Спецификации целевые.")}</p>
            <div className="border-t border-frost/25 pt-4">
              <div className="mono muted">примерная цена</div>
              <div className="font-display text-4xl font-extrabold" aria-live="polite"><Price value={total} /></div>
              <div className="mt-4 flex flex-wrap gap-3">
                <InteractiveHoverButton text="В корзину" className="h-14 w-52 border-frost/40 bg-transparent text-frost" onClick={() => addCart({ id, name: `E-Rizz build · ${m.name}`, sub: summary, price: total, variant: m.ver, paint: PAINT[cl].c })} data-testid="cfg-add" />
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
interface Q { q: [string, string]; a: { l: [string, string]; s: Partial<Record<string, number>> }[] }
const QUIZ: Q[] = [
  { q: ["Что катаем?", "Какая техника вас интересует?"], a: [
    { l: ["Эндуро", "Эндуро"], s: { enduro: 5 } },
    { l: ["Город", "Город"], s: { city: 5 } },
    { l: ["Багги", "Багги"], s: { buggy: 5 } },
    { l: ["Квадрик", "Квадроцикл"], s: { quad: 5 } },
    { l: ["Снег", "Снег"], s: { snow: 5 } },
  ] },
  { q: ["Какая нужна посадка?", "Какая посадка вам подходит?"], a: [
    { l: ["Компактная, 17/14", "Компактная, колеса 17/14"], s: { base: 3 } },
    { l: ["Взрослый легкий трейл, 19/18", "Взрослый легкий трейл, колеса 19/18"], s: { sport: 3 } },
    { l: ["Полноразмерный эндуро, 21/18", "Полноразмерный эндуро, колеса 21/18"], s: { pro: 3 } },
  ] },
  { q: ["Где будешь кататься?", "Где вы планируете ездить?"], a: [
    { l: ["Двор и ровные дорожки", "Двор и ровные дорожки"], s: { base: 2 } },
    { l: ["Лес, песок, овраги", "Лес, песок, грунтовые дороги"], s: { sport: 2 } },
    { l: ["Горы и тяжелый рельеф", "Горы и тяжелый рельеф"], s: { pro: 2 } },
  ] },
  { q: ["Что важнее?", "Что для вас важнее?"], a: [
    { l: ["Цена и простота", "Цена и простота"], s: { base: 3 } },
    { l: ["Баланс", "Баланс"], s: { sport: 3 } },
    { l: ["Мощность и оснащение", "Мощность и оснащение"], s: { pro: 3 } },
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
    if (d.ids.length === 0) return { d, id: null as string | null };
    const vs = (["base", "sport", "pro"] as const).map((v) => [v, score[v] || 0] as const).sort((a, b) => b[1] - a[1]);
    const pick = d.key === "city" ? "base" : vs[0][0];
    return { d, id: `gt-${pick}` as string | null };
  }, [done, score]);
  const gt = res && res.id ? GT_BY[res.id] : null;

  return (
    <section id="quiz" className="relative py-20 sm:py-28" aria-labelledby="quiz-h">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <Eyebrow n="06">подбор</Eyebrow>
          <H2><span id="quiz-h">{t("Не знаешь, что", "Не знаете, что")}</span><br /><span className="text-flare">выбрать?</span></H2>
          <p className="mt-4 max-w-md text-lg text-mute">{t("Четыре вопроса, и мы подскажем направление и модель: Base, Sport или Pro.", "Четыре вопроса, и мы подскажем направление и модель: Base, Sport или Pro.")}</p>
        </Reveal>
        <div className="rounded-3xl bg-ink p-6 text-frost sm:p-8" aria-live="polite">
          {!done ? (
            <>
              <div className="mono mb-4 flex items-center justify-between text-gold"><span>вопрос {step + 1} / {QUIZ.length}</span><span className="h-1 w-24 overflow-hidden rounded bg-frost/20"><span className="block h-full bg-flare" style={{ width: `${(step / QUIZ.length) * 100}%` }} /></span></div>
              <h3 className="font-display text-2xl font-extrabold uppercase leading-tight sm:text-3xl">{t(QUIZ[step].q[0], QUIZ[step].q[1])}</h3>
              <div className="mt-6 grid gap-3">
                {QUIZ[step].a.map((a) => (
                  <button key={a.l[0]} onClick={() => pick(a.s)} className="min-h-14 cursor-pointer rounded-2xl border border-frost/30 px-5 py-3 text-left text-lg font-semibold transition hover:border-flare hover:bg-flare hover:text-ink">{t(a.l[0], a.l[1])}</button>
                ))}
              </div>
            </>
          ) : res && (
            <div>
              <div className="mono text-gold">{t("твой результат", "ваш результат")}: {res.d.ru}{gt ? ` / ${verLabel(gt.ver)}` : ""}</div>
              <div className="mt-4 grid items-center gap-4 sm:grid-cols-2">
                {gt ? <div className="rounded-2xl p-2" style={{ background: `linear-gradient(160deg, ${gt.bg}, #0e1013)` }}><BikeThumb variant={gt.ver} yaw={-0.5} w={560} h={380} alt={`${gt.name}, 3D-рендер`} className="w-full" /></div> : <div className="grid min-h-[200px] place-items-center rounded-2xl bg-kelp p-6 text-center"><span className="font-display chrome-text text-4xl font-extrabold uppercase">{res.d.ru}</span></div>}
                <div>
                  <h3 className="font-display text-3xl font-extrabold uppercase leading-none">{gt ? gt.name : t("Под заказ", "Под заказ")}</h3>
                  {gt ? <p className="muted mt-1">{t(gt.tag[0], gt.tag[1])}</p> : <p className="muted mt-1">{t("Такую технику мы подбираем под заказ: оставь заявку, и мы пришлем варианты.", "Такую технику мы подбираем под заказ: оставьте заявку, и мы пришлем варианты.")}</p>}
                  {gt && <ul className="mt-3 text-sm">{gtSpec(gt).map((x) => <li key={x.k}><span className="muted">{x.k}:</span> {x.v}</li>)}</ul>}
                  {gt && <p className="mono mt-1 text-gold">целевая спецификация, уточняется</p>}
                  {gt && <div className="mt-3 font-display text-xl font-extrabold">{rub(gt.price)} <span className="mono muted">примерная цена</span></div>}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {gt && <button className="btn-solid" onClick={() => addCart({ id: gt.id, name: gt.name, sub: "примерная цена", price: gt.price, variant: gt.ver })}>В корзину</button>}
                {gt && <button className="btn-ghost" onClick={() => { toggleCompare(gt.id); scrollToId("compare"); }}>Сравнить</button>}
                <button className="btn-ghost" onClick={() => { setDriveFor(gt ? gt.id : "gt-sport"); scrollToId("drive"); }}>{gt ? "Тест-драйв" : "Оставить заявку"}</button>
                <button className="btn-ghost" onClick={() => { setDir(res.d.key); scrollToId(gt ? "lineup" : "directions"); }}>{gt ? "Вся линейка" : "Все в направлении"}</button>
                <button className="mono inline-flex min-h-11 cursor-pointer items-center gap-2 px-2 text-frost/80 hover:text-gold" onClick={() => { setStep(0); setScore({}); }}><RotateCcw size={16} />еще раз</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Compare */
type Row = { k: string; get: (id: string) => number | string | null; unit?: string; best?: "max" | "min"; show?: (id: string) => string };
const ROWS: Row[] = [
  { k: "Колеса, дюймы", get: (i) => GT_BY[i].wheels },
  { k: "Пик, целевой", get: (i) => GT_BY[i].kw[1], show: (i) => `${fmtRange(GT_BY[i].kw)} кВт`, best: "max" },
  { k: "Энергия, целевая", get: (i) => GT_BY[i].kwh[1], show: (i) => `${fmtRange(GT_BY[i].kwh)} кВт·ч`, best: "max" },
  { k: "Модель", get: (i) => verLabel(GT_BY[i].ver) },
  { k: "Примерная цена", get: (i) => GT_BY[i].price, show: (i) => rub(GT_BY[i].price), best: "min" },
];
export function Compare() {
  const { t, compare, toggleCompare, addCart } = useApp();
  const ids = compare.filter((id) => GT_BY[id]);
  return (
    <section id="compare" className="relative bg-frost py-20 sm:py-28" aria-labelledby="cmp-h">
      <div className="container-x">
        <Reveal>
          <Eyebrow n="07">сравнение</Eyebrow>
          <H2><span id="cmp-h">{t("Сравни", "Сравните")}</span> <span className="text-flare">2-3 модели</span></H2>
        </Reveal>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Выбор моделей для сравнения">
          {GT.map((g) => g.id).map((id) => <button key={id} className="chip !min-h-11 text-sm" aria-pressed={compare.includes(id)} onClick={() => toggleCompare(id)}>{GT_BY[id].name.replace("GT ", "")}</button>)}
        </div>
        <p className="mono mt-2 text-mute">{t("выбери от 2 до 3 моделей", "выберите от 2 до 3 моделей")}</p>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-ink/20 bg-sleet">
          <table className="w-full min-w-[470px] border-collapse text-left">
            <caption className="sr-only-x">Сравнение выбранных моделей</caption>
            <thead>
              <tr>
                <th className="w-[20%] p-2 sm:p-4" scope="col"><span className="sr-only-x">Параметр</span></th>
                {ids.map((id) => (
                  <th key={id} scope="col" className="p-2 align-bottom sm:p-4">
                    <div className="grid place-items-center overflow-hidden rounded-xl" style={{ background: `linear-gradient(160deg, ${GT_BY[id].bg}, #0e1013)` }}><BikeThumb variant={GT_BY[id].ver} yaw={-0.5} w={420} h={280} alt={`${GT_BY[id].name}, 3D-рендер`} className="h-24 w-auto sm:h-36" /></div>
                    <div className="mono mt-2 text-mute">{verLabel(GT_BY[id].ver)}</div>
                    <div className="font-display text-base font-extrabold uppercase sm:text-xl">{GT_BY[id].name}</div>
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
                      <td key={ids[i]} className="p-4 text-lg font-semibold"><span className={cn(best !== null && v === best && "rounded-full bg-flare px-3 py-1")}>{r.show ? r.show(ids[i]) : v}</span></td>
                    ))}
                  </tr>
                );
              })}
              <tr className="border-t border-ink/15">
                <th scope="row" className="p-4" />
                {ids.map((id) => <td key={id} className="p-4"><button className="btn-ghost" onClick={() => addCart({ id, name: GT_BY[id].name, sub: "примерная цена", price: GT_BY[id].price, variant: GT_BY[id].ver })}>В корзину</button></td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-mute">{t("Цветом отмечено лучшее значение в строке (для цены: минимальное). Мощность и энергия целевые, уточняются.", "Цветом отмечено лучшее значение в строке (для цены: минимальное). Мощность и энергия целевые, уточняются.")}</p>
      </div>
    </section>
  );
}
