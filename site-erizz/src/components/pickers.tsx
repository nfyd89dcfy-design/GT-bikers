import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, BatteryCharging, Check, Cpu, Disc3, Gauge, Mountain, RotateCcw, Shield, Shirt, Snowflake, X, Zap, type LucideIcon } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { reduceMotion, scrollToId, useApp } from "@/lib/state";
import { LINEUP, L_BY, num, studio, type LModel } from "@/lib/data";
import { PARTS, type Box, type PartKey } from "@/lib/parts";
import { cn } from "@/lib/utils";
import { Cta } from "./fx";

/* ================================================================
   Подбор тюнинга и экипировки: кнопка "проваливается" в полноэкранный экран
   (круг раскрывается от точки клика), внутри три шага. Логика схематичная, для показа механики.
   ================================================================ */

export type Origin = { x: number; y: number };
export const originOf = (e: React.MouseEvent): Origin => {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  return { x: e.clientX || r.left + r.width / 2, y: e.clientY || r.top + r.height / 2 };
};
type Close = (after?: () => void) => void;

/** Полноэкранный слой: открывается кругом от кнопки, закрывается кругом обратно. */
export function Dive({ at, onClose, label, children }: { at: Origin; onClose: () => void; label: string; children: (close: Close) => ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const R = () => Math.hypot(Math.max(at.x, innerWidth - at.x), Math.max(at.y, innerHeight - at.y)) + 40;
  const close: Close = (after) => {
    if (busy.current) return;
    const done = () => { document.body.style.overflow = ""; onClose(); after?.(); };
    if (!el.current || reduceMotion()) return done();
    busy.current = true;
    gsap.fromTo(el.current, { clipPath: `circle(${R()}px at ${at.x}px ${at.y}px)` }, { clipPath: `circle(0px at ${at.x}px ${at.y}px)`, duration: 0.6, ease: "expo.inOut", onComplete: done });
  };
  useLayoutEffect(() => {
    const p = el.current!;
    document.body.style.overflow = "hidden";
    if (!reduceMotion()) {
      gsap.fromTo(p, { clipPath: `circle(0px at ${at.x}px ${at.y}px)` }, { clipPath: `circle(${R()}px at ${at.x}px ${at.y}px)`, duration: 0.85, ease: "expo.inOut", clearProps: "clipPath" });
      gsap.fromTo(p.querySelectorAll("[data-in]"), { y: 36, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.7, ease: "power3.out", delay: 0.35 });
    }
    p.querySelector<HTMLElement>("[data-close]")?.focus({ preventScroll: true });
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", k);
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, []); // eslint-disable-line
  return createPortal(
    <div ref={el} className="dive t-zone fixed inset-0 z-[400] overflow-y-auto overscroll-contain" role="dialog" aria-modal="true" aria-label={label}>
      <div className="grain pointer-events-none fixed inset-0" aria-hidden="true" />
      {children(close)}
    </div>,
    document.body,
  );
}

/** Шапка шага: подпись, полоска шагов, назад и закрыть. */
function DiveHead({ title, steps, cur, onBack, close }: { title: string; steps: string[]; cur: number; onBack?: () => void; close: Close }) {
  return (
    <header className="dive__head sticky top-0 z-20 border-b t-line">
      <div className="container-x flex min-h-16 items-center gap-4 py-3">
        {onBack ? (
          <button className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border t-line" onClick={onBack} aria-label="Назад"><ArrowLeft size={18} /></button>
        ) : <span className="h-11 w-11 shrink-0" />}
        <span className="mono t-label hidden sm:inline">{title}</span>
        <ol className="mx-auto flex items-center gap-2 sm:mx-0 sm:ml-auto" aria-label="Шаги">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2" aria-current={i === cur ? "step" : undefined}>
              <span className={cn("block h-1.5 rounded-full transition-all duration-500", i === cur ? "w-10 bg-flare" : i < cur ? "w-5 bg-flare/60" : "w-5 bg-[var(--t-line)]")} />
              <span className={cn("mono hidden md:inline", i === cur ? "" : "t-mute")}>{s}</span>
            </li>
          ))}
        </ol>
        <button data-close className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border t-line sm:ml-4" onClick={() => close()} aria-label="Закрыть"><X size={18} /></button>
      </div>
    </header>
  );
}

/** Где ставить подпись у рамки, чтобы соседние не налезали. */
const LABEL_AT: Record<PartKey, "t" | "b" | "r"> = { rw: "t", fw: "t", bat: "t", ctl: "b", mot: "b", fork: "r", bar: "t", all: "t" };
/** Фото байка с рамками узлов. silhouette: схема для "другого байка". */
function BikeHud({ n, marks, silhouette, className }: { n: number; marks: { k: PartKey; l: string }[]; silhouette?: boolean; className?: string }) {
  const P = PARTS[n];
  return (
    <div className={cn("relative aspect-[16/9] w-full", className)}>
      <img src={studio(n)} alt="" className={cn("absolute inset-0 h-full w-full object-contain transition-[filter] duration-500", silhouette && "dive__sil")} />
      {marks.map((m, i) => {
        const [x, y, w, h] = P[m.k] as Box;
        return (
          <div key={m.k + m.l} className="dive__mark" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, ["--i" as string]: i }}>
            <i /><i /><i /><i />
            <span className={cn("mono", (LABEL_AT[m.k] === "b" || (LABEL_AT[m.k] === "t" && y < 14)) && "dive__mark-b", LABEL_AT[m.k] === "r" && "dive__mark-r")}>{m.l}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- Тюнинг под байк */
type Other = { cls: 0 | 1 | 2 };
const OTHER = [
  { t: "Питбайк", v: "48-60 В", p: "до 6 кВт", n: 2, peak: 5, range: 45 },
  { t: "Легкий эндуро", v: "60-74 В", p: "6-20 кВт", n: 9, peak: 16, range: 70 },
  { t: "Мощный эндуро", v: "74-104 В", p: "от 20 кВт", n: 12, peak: 30, range: 80 },
] as const;
const GROUPS: { k: LModel["group"] | "other"; t: string }[] = [
  { k: "mini", t: "Mini" }, { k: "trail", t: "Trail" }, { k: "trailpro", t: "Trail Pro" }, { k: "race", t: "Race" }, { k: "road", t: "Road" }, { k: "other", t: "Другой байк" },
];
type Goal = "power" | "range" | "winter" | "city" | "dirt" | "protect";
const GOALS: { k: Goal; i: LucideIcon; t: string; d: string; parts: [PartKey, string][] }[] = [
  { k: "power", i: Zap, t: "Резче разгон и выше пик", d: "контроллер, прошивка, дисплей", parts: [["ctl", "контроллер"], ["bar", "дисплей"]] },
  { k: "range", i: BatteryCharging, t: "Дальше на одном заряде", d: "емкость АКБ и быстрая зарядка", parts: [["bat", "АКБ"]] },
  { k: "winter", i: Snowflake, t: "Ездить зимой", d: "гусеница и лыжа или шипы", parts: [["rw", "гусеница или шипы"], ["fw", "лыжа"]] },
  { k: "city", i: Disc3, t: "Город и асфальт", d: "дорожная резина", parts: [["rw", "дорожная резина"], ["fw", "дорожная резина"]] },
  { k: "dirt", i: Mountain, t: "Грязь, лес и песок", d: "резина с шашкой и защита днища", parts: [["rw", "шашка"], ["mot", "защита днища"]] },
  { k: "protect", i: Shield, t: "Чтобы меньше ломалось", d: "руль, накладки, защита вилки", parts: [["bar", "руль"], ["fork", "защита вилки"]] },
];
type Item = { k: PartKey; i: LucideIcon; t: string; d: string; h: number; tag: string };

function tuneFor(m: LModel | null, o: Other | null, goals: Goal[]) {
  const road = m?.group === "road";
  const ctrl = m ? (m.id === "gt-race-19" || m.id === "gt-race-21" ? "S1201500" : m.id === "gt-roadster" ? "S120650" : "S801100") : o!.cls === 2 ? "S120650" : "S801100";
  const wheels = m ? m.wheels : "под ваш размер";
  const items: Item[] = [];
  if (goals.includes("power")) {
    items.push({ k: "ctl", i: Cpu, t: `Контроллер Moxin ${ctrl}`, d: "Прямая замена штатного блока. Настроим отклик ручки и пик под райдера.", h: 3, tag: "хит" });
    items.push({ k: "bar", i: Gauge, t: "Дисплей 5 дюймов", d: "Скорость, заряд, режимы и ошибки контроллера на руле.", h: 0.5, tag: "в комплект" });
  }
  if (goals.includes("range")) {
    const kwh = m?.kwh;
    items.push({ k: "bat", i: BatteryCharging, t: "АКБ +20% емкости", d: kwh ? `Было ${num(kwh)} кВт·ч, станет около ${num(Math.round(kwh * 12) / 10)} кВт·ч. Та же посадка в раму.` : "Подберем емкость под раму и контроллер.", h: 1, tag: "под заказ" });
    items.push({ k: "bat", i: Zap, t: "Быстрая зарядка", d: "Заряжается быстрее штатной, есть режим хранения на зиму.", h: 0, tag: "в наличии" });
  }
  if (goals.includes("winter")) {
    if (road) items.push({ k: "rw", i: Snowflake, t: "Шипованная резина", d: `Комплект ${wheels} на оба колеса: город зимой без гусеницы.`, h: 1, tag: "сезон" });
    else {
      items.push({ k: "rw", i: Snowflake, t: "Гусеница", d: "Ставится вместо заднего колеса, байк едет по снегу и льду.", h: 3, tag: "сезон" });
      items.push({ k: "fw", i: Snowflake, t: "Лыжа", d: "Ставится вместо переднего колеса, руль остается тем же.", h: 1, tag: "сезон" });
    }
  }
  if (goals.includes("city")) items.push({ k: "fw", i: Disc3, t: road ? "Спортивная дорожная резина" : "Дорожная резина", d: `Комплект ${wheels} на оба колеса: тише, мягче и держит асфальт.`, h: 1, tag: "в наличии" });
  if (goals.includes("dirt")) {
    items.push({ k: "rw", i: Mountain, t: road ? "Резина для грунта" : "Резина с шашкой", d: "Цепляется в грязи и песке, не забивается.", h: 1, tag: "в наличии" });
    items.push({ k: "mot", i: Shield, t: "Защита днища", d: "Алюминиевая плита закрывает мотор и АКБ от камней.", h: 1, tag: "в наличии" });
  }
  if (goals.includes("protect")) {
    items.push({ k: "bar", i: Shield, t: "Руль и накладка", d: "Усиленный руль и мягкая накладка на перемычку.", h: 1, tag: "в наличии" });
    items.push({ k: "fork", i: Shield, t: "Защита вилки", d: "Кожухи на перья: меньше сколов на штоках.", h: 0.5, tag: "в наличии" });
  }
  // схема "было / станет": оценка, точный прирост покажет стенд
  const peak = m?.peak ?? OTHER[o!.cls].peak;
  const rng = m ? parseInt(m.range.replace(/[^\d]/g, " ").trim().split(" ")[0] || "60", 10) : OTHER[o!.cls].range;
  let peak2 = peak, rng2 = rng;
  if (goals.includes("power")) { peak2 = Math.min(53.9, Math.round((peak * 1.5 + 3) * 10) / 10); rng2 = Math.round(rng2 * 0.92); }
  if (goals.includes("range")) rng2 = Math.round(rng2 * 1.25);
  const season = road ? 8 : 7, season2 = goals.includes("winter") ? 12 : season;
  const surf = [road ? "асфальт" : "грунт"];
  if (goals.includes("city") && !road) surf.push("асфальт");
  if (goals.includes("dirt")) surf.push(road ? "грунт" : "грязь и песок");
  if (goals.includes("winter")) surf.push("снег");
  const hours = Math.max(0.5, items.reduce((a, b) => a + b.h, 0));
  return { items, ctrl, rows: [
    { k: "пик мощности", u: "кВт", a: peak, b: peak2, max: Math.max(peak2, 10) * 1.1 },
    { k: "запас хода", u: "км", a: rng, b: rng2, max: Math.max(rng, rng2) * 1.15 },
    { k: "сезон", u: "мес. в году", a: season, b: season2, max: 12 },
  ], surf, hours };
}

export function TunePicker({ at, onClose }: { at: Origin; onClose: () => void }) {
  const { t, say } = useApp();
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState<(typeof GROUPS)[number]["k"]>("trail");
  const [bike, setBike] = useState<string | null>(null);
  const [other, setOther] = useState<Other | null>(null);
  const [goals, setGoals] = useState<Goal[]>(["power"]);
  const scroller = useRef<HTMLDivElement>(null);
  const m = bike ? L_BY[bike] : null;
  const n = m ? m.n : other ? OTHER[other.cls].n : 9;
  const name = m ? m.name : other ? `${OTHER[other.cls].t.toLowerCase()} ${OTHER[other.cls].v}` : "";
  const res = useMemo(() => (m || other ? tuneFor(m, other, goals) : null), [m, other, goals]);
  const go = (s: number) => { setStep(s); scroller.current?.closest(".dive")?.scrollTo({ top: 0, behavior: "smooth" }); };
  const pickBike = (id: string) => { setBike(id); setOther(null); window.setTimeout(() => go(1), 260); };
  const pickOther = (c: Other["cls"]) => { setOther({ cls: c }); setBike(null); window.setTimeout(() => go(1), 260); };
  const toggle = (g: Goal) => setGoals((x) => (x.includes(g) ? x.filter((y) => y !== g) : [...x, g]));
  const preview = GOALS.filter((g) => goals.includes(g.k)).flatMap((g) => g.parts.map(([k, l]) => ({ k, l })))
    .filter((x, i, a) => a.findIndex((y) => y.k === x.k) === i);

  return (
    <Dive at={at} onClose={onClose} label="Подбор тюнинга под байк">
      {(close) => (
        <div ref={scroller} className="relative">
          <DiveHead title="подбор тюнинга" steps={["байк", "задача", "сборка"]} cur={step} onBack={step > 0 ? () => go(step - 1) : undefined} close={close} />
          <div className="container-x pb-20 pt-8 sm:pt-12">
            {step === 0 && (
              <div key="s0" className="dive-step">
                <p data-in className="mono t-label">шаг 1 из 3</p>
                <h2 data-in className="h-hero mt-3 text-[clamp(30px,4.4vw,64px)]">{t("Какой у тебя байк?", "Какой у вас байк?")}</h2>
                <p data-in className="t-mute mt-3 max-w-xl text-lg">{t("Выбери модель GT или другой байк по напряжению. Совместимость проверим на стенде.", "Выберите модель GT или другой байк по напряжению. Совместимость проверим на стенде.")}</p>
                <div data-in className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Серии">
                  {GROUPS.map((g) => (
                    <button key={g.k} role="tab" aria-selected={tab === g.k} className="t-chip min-h-11 cursor-pointer rounded-full px-4 text-sm font-semibold" onClick={() => setTab(g.k)}>{g.t}</button>
                  ))}
                </div>
                {tab !== "other" ? (
                  <ul data-in className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {LINEUP.filter((x) => x.group === tab).map((x) => (
                      <li key={x.id}>
                        <button onClick={() => pickBike(x.id)} aria-pressed={bike === x.id} className={cn("dive-card t-tile spot group w-full cursor-pointer rounded-xl p-3 text-left", bike === x.id && "is-on")}>
                          <img src={studio(x.n, true)} alt="" loading="lazy" className="aspect-[16/9] w-full object-contain transition-transform duration-500 group-hover:scale-[1.05]" />
                          <span className="font-display mt-2 block text-base font-extrabold uppercase leading-tight">{x.name}</span>
                          <span className="mono t-mute mt-1 block">{x.wheels} · {x.peak ? `${num(x.peak)} кВт` : "мощность уточняется"}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul data-in className="mt-6 grid gap-3 md:grid-cols-3">
                    {OTHER.map((x, i) => (
                      <li key={x.t}>
                        <button onClick={() => pickOther(i as Other["cls"])} aria-pressed={other?.cls === i} className={cn("dive-card t-tile spot group w-full cursor-pointer rounded-xl p-4 text-left", other?.cls === i && "is-on")}>
                          <img src={studio(x.n, true)} alt="" loading="lazy" className="dive__sil aspect-[16/9] w-full object-contain" />
                          <span className="font-display mt-2 block text-lg font-extrabold uppercase leading-tight">{x.t}</span>
                          <span className="mono t-mute mt-1 block">{x.v} · {x.p}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {step === 1 && (
              <div key="s1" className="dive-step grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start">
                <div className="lg:sticky lg:top-28">
                  <p className="mono t-label">шаг 2 из 3 / {name}</p>
                  <h2 className="h-hero mt-3 text-[clamp(30px,4.4vw,64px)]">Чего не хватает?</h2>
                  <div className="t-tile mt-6 rounded-2xl p-3 sm:p-5"><BikeHud n={n} silhouette={!m} marks={preview} /></div>
                </div>
                <div>
                  <p className="t-mute text-lg">Можно выбрать несколько.</p>
                  <ul className="mt-4 grid gap-2">
                    {GOALS.map((g) => {
                      const on = goals.includes(g.k);
                      return (
                        <li key={g.k}>
                          <button onClick={() => toggle(g.k)} aria-pressed={on} className={cn("dive-goal spot flex min-h-[76px] w-full cursor-pointer items-center gap-4 rounded-xl border t-line px-4 py-3 text-left", on && "is-on")}>
                            <g.i size={22} aria-hidden="true" className="shrink-0 text-flare" />
                            <span className="flex-1"><span className="block text-lg font-semibold leading-tight">{g.t}</span><span className="t-mute text-sm">{g.d}</span></span>
                            <span className="dive-goal__box grid h-7 w-7 shrink-0 place-items-center rounded-full border t-line">{on && <Check size={16} />}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Cta disabled={!goals.length} onClick={() => go(2)} className={cn(!goals.length && "pointer-events-none opacity-40")}>Собрать комплект</Cta>
                    <span className="mono t-mute">{goals.length ? `выбрано: ${goals.length}` : "выберите хотя бы одно"}</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && res && (
              <div key="s2" className="dive-step">
                <p className="mono t-label">шаг 3 из 3 / сборка</p>
                <h2 className="h-hero mt-3 text-[clamp(28px,4vw,58px)] !leading-[1.02]">{m ? m.name : name}<br /><span className="text-flare">злее без нового байка</span></h2>
                <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
                  <div className="t-tile rounded-2xl p-3 sm:p-6 lg:sticky lg:top-24">
                    <BikeHud n={n} silhouette={!m} marks={res.items.map((x) => ({ k: x.k, l: x.t })).filter((x, i, a) => a.findIndex((y) => y.k === x.k) === i)} />
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      {res.rows.map((r) => (
                        <div key={r.k}>
                          <div className="mono t-mute">{r.k}</div>
                          <div className="font-display mt-1 text-2xl font-extrabold leading-none">{num(r.a)} <span className="t-mute">→</span> <span className={r.b > r.a ? "text-flare" : ""}>{num(r.b)}</span> <span className="mono t-mute text-xs">{r.u}</span></div>
                          <div className="relative mt-2 h-2 overflow-hidden rounded-full" style={{ background: "var(--t-line)" }}>
                            <div className="dive-bar absolute inset-y-0 left-0 rounded-full bg-flare" style={{ width: `${(r.b / r.max) * 100}%` }} />
                            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(r.a / r.max) * 100}%`, background: "var(--t-fg)", opacity: 0.55 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mono t-mute mt-4">ездит по: {res.surf.join(" · ")} / оценка, точный прирост покажет стенд</p>
                  </div>
                  <div>
                    <ul className="grid gap-2">
                      {res.items.map((x, i) => (
                        <li key={x.t} className="dive-item t-tile flex gap-4 rounded-xl p-4" style={{ ["--i" as string]: i }}>
                          <x.i size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-flare" />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="text-lg font-semibold leading-tight">{x.t}</span><span className="mono t-mute">{x.tag}</span></div>
                            <p className="t-mute mt-1 text-sm leading-snug">{x.d}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between rounded-xl border t-line p-4">
                      <span className="mono t-mute">установка в сервисе</span>
                      <span className="font-semibold">около {num(res.hours)} ч{res.hours <= 8 ? ", за один визит" : ", за два визита"}</span>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <Cta onClick={() => close(() => { scrollToId("service"); say(t("Подбор сохранили: ждем тебя в сервисе (макет)", "Подбор сохранили: ждем вас в сервисе (макет)")); })}>Записаться на установку</Cta>
                      <button className="mono inline-flex min-h-11 cursor-pointer items-center gap-2 px-2 t-mute hover:text-flare" onClick={() => { setGoals(["power"]); go(0); }}><RotateCcw size={16} />другой байк</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Dive>
  );
}

/* ---------------------------------------------------------------- Комплект экипировки */
const shop = (n: string) => `${import.meta.env.BASE_URL}shop/${n}.webp`;
function HelmetArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden="true">
      <path d="M40 128C26 84 46 30 100 22C132 18 156 30 166 52L172 70L141 72C135 80 135 92 139 99L170 104L196 114C196 122 190 130 182 134L160 142L72 144C56 144 44 138 40 128Z" fill="var(--t-fg)" />
      <path d="M143 77L169 75L171 97L142 95C140 89 140 83 143 77Z" fill="var(--color-sky)" />
      <path d="M58 82C90 78 118 77 142 79" stroke="var(--color-flare)" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M116 30C146 26 180 34 199 50L194 61L160 61C150 49 134 41 114 39Z" fill="var(--color-flare)" />
      <path d="M60 118C88 126 128 126 160 118" stroke="var(--t-bg)" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".35" />
      <path d="M176 112l10 4M172 120l10 4" stroke="var(--t-bg)" strokeWidth="3" strokeLinecap="round" opacity=".45" />
    </svg>
  );
}
function ArmorArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden="true">
      <path d="M60 16h80l18 18-6 34 10 70-34 10H72l-34-10 10-70-6-34z" fill="var(--t-fg)" opacity=".9" />
      <path d="M100 24v120M70 60h60M72 92h56M74 122h52" stroke="var(--t-bg)" strokeWidth="5" opacity=".55" />
      <path d="M60 16 42 34l6 34M140 16l18 18-6 34" stroke="var(--color-flare)" strokeWidth="7" fill="none" strokeLinejoin="round" />
    </svg>
  );
}
type Ride = "mx" | "city" | "winter";
const RIDES: { k: Ride; t: string; d: string; i: LucideIcon }[] = [
  { k: "mx", t: "Кросс и эндуро", d: "лес, трасса, прыжки", i: Mountain },
  { k: "city", t: "Город", d: "двор, асфальт, поездки", i: Disc3 },
  { k: "winter", t: "Зима", d: "снег, гусеница, холод", i: Snowflake },
];
type GearItem = { k: string; img?: string; art?: "helmet" | "armor" | "thermo"; t: string; size: string; note: string };

function gearFor(teen: boolean, h: number, ride: Ride, full: boolean) {
  const form = teen ? (h < 135 ? "YS" : h < 148 ? "YM" : h < 160 ? "YL" : h < 170 ? "S" : "M") : h < 165 ? "S" : h < 175 ? "M" : h < 185 ? "L" : h < 193 ? "XL" : "2XL";
  const boots = Math.round((0.15 * h + 1.5) * 1.5);
  const gloves = h < 140 ? "YS" : h < 152 ? "YM" : h < 162 ? "YL" : h < 172 ? "S" : h < 182 ? "M" : h < 190 ? "L" : "XL";
  const helmet = teen ? (h < 145 ? "YM, обхват 51-52 см" : h < 160 ? "YL, обхват 53-54 см" : "S, обхват 55-56 см") : h < 170 ? "M, обхват 57-58 см" : h < 185 ? "L, обхват 59-60 см" : "XL, обхват 61-62 см";
  const out: GearItem[] = [
    { k: "helmet", art: "helmet", t: ride === "city" ? "Шлем с визором" : "Кроссовый шлем", size: helmet, note: "Точный размер меряем по обхвату головы" },
  ];
  if (ride !== "city") out.push({ k: "goggles", img: "goggles", t: ride === "winter" ? "Маска с двойной линзой" : "Маска с прозрачной линзой", size: teen && h < 150 ? "Youth" : "один размер", note: ride === "winter" ? "Не запотевает на морозе" : "Плотно садится в вырез шлема" });
  out.push({ k: "gloves", img: "gloves", t: ride === "winter" ? "Утепленные перчатки" : "Перчатки для кросса", size: gloves, note: "Пальцы чувствуют рычаги" });
  out.push({ k: "boots", img: "boots", t: "Мотоботы", size: `${boots} EU`, note: "Защита голеностопа и голени" });
  if (full || ride === "mx") out.push({ k: "kit", img: "kit", t: ride === "city" ? "Брюки и джерси" : "Джерси и штаны", size: form, note: "Свободно поверх защиты" });
  if (full) {
    out.push({ k: "armor", art: "armor", t: "Защита тела", size: teen && h < 160 ? "Youth" : "Adult", note: "Грудь, спина и плечи" });
    out.push({ k: "brace", img: "brace", t: "Ортезы на колени", size: h < 150 ? "Youth" : h < 170 ? "S/M" : h < 185 ? "M/L" : "L/XL", note: "Держат колено при приземлении" });
  }
  if (ride === "winter") out.push({ k: "thermo", art: "thermo", t: "Термобелье и подшлемник", size: form, note: "Первый слой, отводит влагу" });
  if (full && ride === "mx") out.push({ k: "pack", img: "pack", t: "Рюкзак с питьевой системой", size: "один размер", note: "Вода и инструмент на длинном выезде" });
  return { out, form };
}

export function GearPicker({ at, onClose }: { at: Origin; onClose: () => void }) {
  const { t, say } = useApp();
  const [step, setStep] = useState(0);
  const [teen, setTeen] = useState<boolean | null>(null);
  const [h, setH] = useState(160);
  const [ride, setRide] = useState<Ride>("mx");
  const [full, setFull] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const go = (s: number) => { setStep(s); scroller.current?.closest(".dive")?.scrollTo({ top: 0, behavior: "smooth" }); };
  const pick = (v: boolean) => { setTeen(v); setH(v ? 155 : 176); window.setTimeout(() => go(1), 240); };
  const res = useMemo(() => gearFor(!!teen, h, ride, full), [teen, h, ride, full]);
  // к родителям всегда на "вы", даже если сайт в режиме "на ты": тексты для подростка без t()

  return (
    <Dive at={at} onClose={onClose} label="Подбор комплекта экипировки">
      {(close) => (
        <div ref={scroller} className="relative">
          <DiveHead title="подбор экипировки" steps={["для кого", "рост и езда", "комплект"]} cur={step} onBack={step > 0 ? () => go(step - 1) : undefined} close={close} />
          <div className="container-x pb-20 pt-8 sm:pt-12">
            {step === 0 && (
              <div key="g0" className="dive-step">
                <p data-in className="mono t-label">шаг 1 из 3</p>
                <h2 data-in className="h-hero mt-3 text-[clamp(30px,4.4vw,64px)]">Для кого комплект?</h2>
                <ul data-in className="mt-8 grid gap-3 md:grid-cols-2">
                  {[
                    { v: false, t: "Для себя", d: t("Подберем по твоему росту и стилю езды.", "Подберем по вашему росту и стилю езды."), img: "kit" },
                    { v: true, t: "Для подростка", d: "Для заботливых родителей: соберем полный комплект под рост, с запасом на вырост.", img: "boots" },
                  ].map((x) => (
                    <li key={x.t}>
                      <button onClick={() => pick(x.v)} aria-pressed={teen === x.v} className={cn("dive-card t-tile spot group flex w-full cursor-pointer items-center gap-5 rounded-2xl p-5 text-left sm:p-7", teen === x.v && "is-on")}>
                        <img src={shop(x.img)} alt="" className="h-28 w-28 shrink-0 object-contain transition-transform duration-500 group-hover:scale-[1.06] sm:h-36 sm:w-36" />
                        <span><span className="font-display block text-2xl font-extrabold uppercase leading-tight">{x.t}</span><span className="t-mute mt-2 block leading-snug">{x.d}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step === 1 && (
              <div key="g1" className="dive-step grid gap-10 lg:grid-cols-2">
                <div>
                  <p className="mono t-label">шаг 2 из 3</p>
                  <h2 className="h-hero mt-3 text-[clamp(30px,4.4vw,64px)] !leading-[1.04]">{teen ? "Рост вашего подростка" : t("Твой рост", "Ваш рост")}</h2>
                  <div className="mt-8 flex items-end gap-4">
                    <span className="font-display text-[clamp(64px,9vw,128px)] font-extrabold leading-none">{h}</span>
                    <span className="mono t-mute pb-3">см / форма {res.form} / ботинки {Math.round((0.15 * h + 1.5) * 1.5)} EU</span>
                  </div>
                  <input type="range" min={120} max={200} value={h} onChange={(e) => setH(+e.target.value)} className="dive-range mt-6 w-full" aria-label="Рост, см" />
                  <div className="mono t-mute mt-2 flex justify-between"><span>120</span><span>160</span><span>200</span></div>
                  {teen && <p className="mt-6 max-w-md rounded-xl border t-line p-4 leading-snug">Подростки быстро растут: форму и ботинки возьмите на размер больше, а шлем только точно по размеру.</p>}
                </div>
                <div>
                  <p className="mono t-label">{teen ? "где катается" : t("где катаешься", "где катаетесь")}</p>
                  <ul className="mt-3 grid gap-2">
                    {RIDES.map((r) => (
                      <li key={r.k}>
                        <button onClick={() => setRide(r.k)} aria-pressed={ride === r.k} className={cn("dive-goal spot flex min-h-[68px] w-full cursor-pointer items-center gap-4 rounded-xl border t-line px-4 py-3 text-left", ride === r.k && "is-on")}>
                          <r.i size={22} aria-hidden="true" className="shrink-0 text-flare" />
                          <span className="flex-1"><span className="block text-lg font-semibold leading-tight">{r.t}</span><span className="t-mute text-sm">{r.d}</span></span>
                          <span className="dive-goal__box grid h-7 w-7 shrink-0 place-items-center rounded-full border t-line">{ride === r.k && <Check size={16} />}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mono t-label mt-6">защита</p>
                  <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Уровень защиты">
                    <button role="radio" aria-checked={!full} aria-pressed={!full} className="t-chip min-h-11 cursor-pointer rounded-full px-4 text-sm font-semibold" onClick={() => setFull(false)}>База: шлем, руки, ноги</button>
                    <button role="radio" aria-checked={full} aria-pressed={full} className="t-chip min-h-11 cursor-pointer rounded-full px-4 text-sm font-semibold" onClick={() => setFull(true)}>Полная защита</button>
                  </div>
                  <div className="mt-8"><Cta onClick={() => go(2)}>Собрать комплект</Cta></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div key="g2" className="dive-step">
                <p className="mono t-label">шаг 3 из 3 / рост {h} см / {RIDES.find((r) => r.k === ride)!.t.toLowerCase()}</p>
                <h2 className="h-hero mt-3 text-[clamp(28px,4vw,58px)] !leading-[1.04]">{teen ? "Комплект для вашего подростка" : t("Твой комплект", "Ваш комплект")}<br /><span className="text-flare">{res.out.length} вещей</span></h2>
                <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {res.out.map((g, i) => (
                    <li key={g.k} className="dive-item t-tile spot flex min-h-[260px] flex-col rounded-xl p-4" style={{ ["--i" as string]: i }}>
                      <div className="relative flex h-36 items-center justify-center">
                        {g.img ? <img src={shop(g.img)} alt="" loading="lazy" className="max-h-36 w-full object-contain" /> : g.art === "helmet" ? <div className="h-32 w-40"><HelmetArt /></div> : g.art === "armor" ? <div className="h-32 w-40"><ArmorArt /></div> : <Shirt size={88} strokeWidth={1.2} aria-hidden="true" />}
                      </div>
                      <div className="mt-3 text-base font-semibold leading-tight">{g.t}</div>
                      <div className="mt-2 inline-flex w-fit rounded-full bg-flare px-2.5 py-1 text-xs font-bold text-ink">{g.size}</div>
                      <p className="t-mute mt-2 text-sm leading-snug">{g.note}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <p className="max-w-2xl leading-snug">{teen ? "Приходите на примерку вместе с подростком: подгоним шлем и ботинки, форму возьмем с запасом на вырост." : t("Приходи на примерку: подгоним шлем и ботинки, остальное по таблице размеров.", "Приходите на примерку: подгоним шлем и ботинки, остальное по таблице размеров.")}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Cta onClick={() => close(() => { scrollToId("showroom"); say(teen ? "Комплект сохранили: ждем вас на примерке (макет)" : t("Комплект сохранили: ждем на примерке (макет)", "Комплект сохранили: ждем вас на примерке (макет)")); })}>Записаться на примерку</Cta>
                    <button className="mono inline-flex min-h-11 cursor-pointer items-center gap-2 px-2 t-mute hover:text-flare" onClick={() => go(1)}><RotateCcw size={16} />изменить</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Dive>
  );
}

/** Хук для кнопок: где кликнули, оттуда и раскрываем. */
export function useDive() {
  const [at, setAt] = useState<Origin | null>(null);
  useEffect(() => () => { document.body.style.overflow = ""; }, []);
  return { at, open: (e: React.MouseEvent) => setAt(originOf(e)), close: () => setAt(null) };
}
