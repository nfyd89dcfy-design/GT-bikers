import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useApp, reduceMotion, scrollToId } from "@/lib/state";
import { DEPOSIT, DIRS, GROUPS, GT, LINEUP, L_BY, STATUS, dirStats, fmtRange, glbKey, lSpec, num, photo, rub, verLabel, type GTModel, type LModel, type Ver } from "@/lib/data";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { GlowCard } from "./ui/spotlight-card";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { MorphTile } from "./morph";
import { ObjectTracker } from "./effects";
import { Bike3D, type BikeApi } from "./bike";
import { LCard } from "./product";
import { BlockGrid } from "./shaders";
import { ARButton, type ARKey } from "./ar";
import { cn } from "@/lib/utils";

export const verBadge = (v: Ver) => (v === "pro" ? "badge-pro" : v === "sport" ? "badge-sport" : v === "road" ? "badge-road" : "badge-base");

/* ---------------------------------------------------------------- Pinned series sections */
function fillRange(el: HTMLElement | null, lo: number, hi: number, dec: number) {
  if (!el) return;
  const f = (n: number) => n.toFixed(dec).replace(".", ",").replace(/,0$/, "");
  el.textContent = `${f(lo)}-${f(hi)}`;
}

export const GRID_TONES: Record<Ver, { a: string; b: string; line: string; gain: number }> = {
  base: { a: "#0e1013", b: "#2b3037", line: "#8d97a2", gain: 0.9 },
  sport: { a: "#ff4a2b", b: "#ff8a6a", line: "#14161a", gain: 0.55 },
  pro: { a: "#4a0e1c", b: "#8a2236", line: "#9cc9ff", gain: 0.8 },
  road: { a: "#14161a", b: "#2a3038", line: "#9cc9ff", gain: 0.8 },
};

function PinnedModel({ g, prev, index }: { g: GTModel; prev: string; index: number }) {
  const { t, addCart, setDriveFor } = useApp();
  const root = useRef<HTMLElement>(null);
  const bike = useRef<BikeApi>(null);
  const kwRef = useRef<HTMLSpanElement>(null);
  const kwhRef = useRef<HTMLSpanElement>(null);
  const dark = g.fg === "dark";
  const [wf, wr] = g.wheels.split("/");
  const tone = GRID_TONES[g.ver];
  const hero = L_BY[g.id];

  useEffect(() => {
    const el = root.current!;
    const full = () => { fillRange(kwRef.current, g.kw[0], g.kw[1], 0); fillRange(kwhRef.current, g.kwh[0], g.kwh[1], 1); };
    if (reduceMotion()) { full(); return; }
    const q = (s: string) => el.querySelector(s);
    const qa = (s: string) => el.querySelectorAll(s);
    const kw = { a: 0, b: 0 }, kwh = { a: 0, b: 0 }, yaw = { v: 0.5 };
    const upd = () => { fillRange(kwRef.current, kw.a, kw.b, 0); fillRange(kwhRef.current, kwh.a, kwh.b, 1); };
    const ctx = gsap.context(() => {
      gsap.from(qa(".sz-in"), { y: 40, opacity: 0, stagger: 0.08, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 75%", once: true } });
      const mm = gsap.matchMedia();
      mm.add({ wide: "(min-width: 1024px)", narrow: "(max-width: 1023px)" }, (c) => {
        const wide = c.conditions!.wide;
        const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: wide ? { trigger: el, start: "top top", end: "+=1400", scrub: 1.1, pin: true, anticipatePin: 1 } : { trigger: el, start: "top 85%", end: "bottom 25%", scrub: 1.1 } });
        tl.fromTo(el, { backgroundColor: prev }, { backgroundColor: g.bg, duration: 0.18 }, 0)
          .fromTo(yaw, { v: 0.6 }, { v: -0.85, duration: 1, onUpdate: () => bike.current?.setYaw(yaw.v) }, 0)
          .fromTo(q(".sz-word"), { xPercent: 8 }, { xPercent: -12, duration: 1 }, 0)
          .fromTo(q(".sz-num-f"), { xPercent: 14, yPercent: 8 }, { xPercent: -4, yPercent: -2, duration: 1 }, 0)
          .fromTo(q(".sz-num-r"), { xPercent: -14, yPercent: 8 }, { xPercent: 4, yPercent: -2, duration: 1 }, 0)
          .fromTo(kw, { a: 0, b: 0 }, { a: g.kw[0], b: g.kw[1], duration: 0.4, ease: "power2.out", onUpdate: upd }, 0)
          .fromTo(kwh, { a: 0, b: 0 }, { a: g.kwh[0], b: g.kwh[1], duration: 0.4, ease: "power2.out", onUpdate: upd }, 0)
          .fromTo(q(".sz-bar"), { scaleX: 0 }, { scaleX: 1, duration: 0.9, transformOrigin: "left" }, 0.05);
        return () => { bike.current?.setYaw(-0.55); };
      });
    }, el);
    return () => ctx.revert();
  }, [g, prev]);

  const col = dark ? "text-ink" : "text-frost";
  const sub = dark ? "text-ink/75" : "text-frost/75";
  const stroke = dark ? "#0e1013" : "#eef1f4";
  return (
    <section ref={root} id={`model-${g.ver}`} className={cn("relative isolate overflow-hidden py-24 lg:flex lg:h-[100svh] lg:min-h-[700px] lg:flex-col lg:py-0 lg:pt-20", col)} style={{ background: g.bg }} aria-label={`Серия ${g.series}: ${g.name}, колеса ${g.wheels}`}>
      <BlockGrid a={tone.a} b={tone.b} line={tone.line} gain={tone.gain} cells={g.ver === "pro" ? 18 : 14} rotation={g.ver === "pro" ? 45 : 0} contrast={0.4} lineAmt={g.ver === "sport" ? 0.18 : 0.3} react={0.55} seed={index * 7 + 1} className="pointer-events-none absolute inset-0 -z-20 h-full w-full opacity-[0.35]" />
      <div className="brushed-dark pointer-events-none absolute inset-0 -z-10 opacity-[0.12] mix-blend-overlay" />
      <div className="sz-word pointer-events-none absolute left-0 top-[18%] z-0 select-none whitespace-nowrap font-display text-[30vw] font-extrabold uppercase leading-none lg:top-[8%] lg:text-[24vw]" aria-hidden="true" style={{ WebkitTextStroke: `2px ${stroke}`, color: "transparent", opacity: 0.16 }}>{g.word} {g.word}</div>
      <div className="sz-num-r pointer-events-none absolute bottom-[1%] left-[-1vw] z-0 select-none font-display text-[34vw] font-extrabold leading-[0.8] lg:text-[24vw]" aria-hidden="true" style={{ WebkitTextStroke: `2px ${stroke}`, color: "transparent", opacity: 0.5 }}>{wr ?? wf}</div>
      <div className="sz-num-f pointer-events-none absolute bottom-[1%] right-[-1vw] z-0 select-none font-display text-[34vw] font-extrabold leading-[0.8] lg:text-[24vw]" aria-hidden="true" style={{ WebkitTextStroke: `2px ${stroke}`, color: "transparent", opacity: 0.5 }}>{wf}</div>

      <div className="container-x relative z-10 grid flex-1 items-center gap-6 lg:grid-cols-[minmax(230px,19%)_1fr_minmax(290px,22%)] lg:gap-0">
        <div className="sz-in relative z-20 lg:self-start lg:pt-6">
          <p className="mono flex items-center gap-3"><span className="inline-block h-px w-10 bg-current" />0{index + 1} / серия {g.series} / {g.count} {g.count > 4 ? "моделей" : "модели"}</p>
          <h2 className="font-display mt-3 text-[clamp(44px,6.2vw,108px)] font-extrabold uppercase leading-[0.9]">GT<br />{g.short}</h2>
          <p className={cn("mt-4 max-w-xs text-base sm:text-lg", sub)}>{t(g.tag[0], g.tag[1])}</p>
          <div className="sz-bar mt-6 h-[3px] w-40 bg-current opacity-60" />
          <p className={cn("mono mt-4 max-w-xs", sub)}>{g.models}</p>
        </div>

        <div className="sz-in relative z-10 -mx-5 lg:-mx-[11%]">
          <div className="relative mx-auto w-full max-w-[1500px]">
            <Bike3D ref={bike} variant={g.ver} yaw={0.6} pitch={0.12} sway={0.06} label={`${g.name}, 3D-модель`} className="h-[300px] sm:h-[420px] lg:h-[min(68svh,740px)]" />
            <ObjectTracker wheels={g.wheels} facing="right" className="pointer-events-none absolute inset-0 h-full w-full" stroke="#9cc9ff" />
          </div>
        </div>

        <aside className={cn("sz-in relative z-20 rounded-3xl border p-5 backdrop-blur-md sm:p-7 lg:self-center", dark ? "border-ink/25 bg-frost/45" : "border-frost/25 bg-deep/50")} aria-live="polite">
          <div className="flex items-center justify-between">
            <span className={cn("mono rounded-full px-3 py-1 font-bold", verBadge(g.ver))}>серия {g.series}</span>
            <span className="mono">{g.wheels}</span>
          </div>
          <div className="font-display mt-3 text-2xl font-extrabold uppercase">{g.name}</div>
          <div className="sky-line mt-3" />
          <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-1">
            <div><dt className="mono opacity-70">мощность в серии</dt><dd className="font-display text-2xl font-extrabold leading-none sm:text-4xl xl:text-5xl"><span ref={kwRef}>{fmtRange(g.kw)}</span> <span className="text-base font-semibold">кВт</span></dd></div>
            <div><dt className="mono opacity-70">батарея в серии</dt><dd className="font-display whitespace-nowrap text-2xl font-extrabold leading-none sm:text-4xl xl:text-5xl"><span ref={kwhRef}>{fmtRange(g.kwh)}</span> <span className="text-base font-semibold">кВт·ч</span></dd></div>
          </dl>
          {hero && <p className="mono mt-3 opacity-80">{hero.name}: {hero.peak ? `${num(hero.peak)} кВт` : ""} · {hero.kwh ? `${num(hero.kwh)} кВт·ч` : ""} · {hero.kmh} км/ч</p>}
          <p className="mono mt-1 opacity-60">данные производителя, уточняются на тестах</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-2"><span className="font-display text-xl font-extrabold">бронь {rub(DEPOSIT)}</span><span className="mono opacity-70">цена после теста образца</span></div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-solid !min-h-11 !px-5 text-sm" onClick={() => addCart({ id: g.id, name: g.name, sub: `бронь · колеса ${g.wheels}`, price: DEPOSIT, variant: g.ver })}>Забронировать</button>
            <ARButton k={g.ver as ARKey} name={g.name} dark={!dark} className="!min-h-11 text-sm" />
            <button className="btn-ghost !min-h-11 text-sm" onClick={() => { setDriveFor(g.id); scrollToId("drive"); }}>Тест-драйв</button>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function PinnedSizes() {
  const prevs = ["#0e1013", GT[0].bg, GT[1].bg, GT[2].bg];
  useEffect(() => { const t = setTimeout(() => ScrollTrigger.refresh(), 400); return () => clearTimeout(t); }, []);
  return (
    <div id="models" aria-label="Серии GT: Spark, Send, Ridge, Pulse">
      {GT.map((g, i) => <PinnedModel key={g.id} g={g} prev={prevs[i]} index={i} />)}
    </div>
  );
}

/* ---------------------------------------------------------------- Lineup: 20 моделей (grid + morph) */
export function StatusPill({ m }: { m: LModel }) {
  const [l, c] = STATUS[m.status];
  return <span className="mono inline-flex items-center gap-1.5 rounded-full bg-deep/70 px-2.5 py-1 text-frost"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{l}</span>;
}

export function LineupGrid() {
  const { t } = useApp();
  const [grp, setGrp] = useState<(typeof GROUPS)[number]["key"]>("all");
  const list = useMemo(() => (grp === "all" ? LINEUP : LINEUP.filter((m) => m.group === grp)), [grp]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduceMotion() || !ref.current) return;
    gsap.fromTo(ref.current.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.03, duration: 0.45, ease: "power3.out", clearProps: "transform" });
    const tm = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => clearTimeout(tm);
  }, [grp]);
  return (
    <section id="lineup" className="dark-zone relative overflow-hidden py-24 sm:py-36" aria-labelledby="lineup-h">
      <BlockGrid a="#07080a" b="#1c2026" line="#59616b" gain={0.8} cells={16} lineAmt={0.22} react={0.5} className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-50" seed={11} />
      <div className="container-x">
        <Reveal>
          <Eyebrow n="02" dark>вся линейка</Eyebrow>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <H2><span id="lineup-h">20 моделей,</span><br /><span className="chrome-text">четыре серии</span></H2>
            <p className="muted max-w-xl text-lg">{t("14 внедорожных и 6 дорожных. Нажми на карточку: модель раскроется на весь экран, ее можно покрутить и поставить у себя в AR.", "14 внедорожных и 6 дорожных моделей. Нажмите на карточку: модель раскроется на весь экран, ее можно повернуть и поставить у себя в AR.")}</p>
          </div>
          <div className="chrome-line mt-6 max-w-md" />
        </Reveal>
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Серии">
          {GROUPS.map((g) => <button key={g.key} role="tab" aria-selected={grp === g.key} className="chip !text-frost aria-selected:!text-ink" onClick={() => setGrp(g.key)}>{g.ru} <span className="mono ml-1 opacity-60">{g.note}</span></button>)}
        </div>
        <div ref={ref} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {list.map((m) => <LCard key={m.id} m={m} />)}
        </div>
        <p className="muted mt-6 max-w-3xl text-sm">{t("Названия рабочие. Характеристики по данным производителей, мы проверяем их на образцах. 3D-модели иллюстративные. Цены фиксируем после теста, бронь возвращается.", "Названия рабочие. Характеристики приведены по данным производителей и проверяются на образцах. 3D-модели иллюстративные. Цены фиксируются после теста, бронь возвращается.")}</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Directions (фильтр + фото) */
export function Directions() {
  const { dir, setDir, t, addCart, setDriveFor } = useApp();
  const d = DIRS.find((x) => x.key === dir) ?? DIRS[0];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduceMotion() || !ref.current) return;
    gsap.fromTo(ref.current.children, { y: 36, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.55, ease: "power3.out", clearProps: "transform" });
  }, [dir]);
  const stats = dirStats(d.cats);
  return (
    <section id="directions" className="relative overflow-hidden bg-ink py-20 text-frost dark-zone sm:py-28" aria-labelledby="dir-h">
      <div className="absolute inset-0 -z-0">
        {DIRS.map((x) => <img key={x.key} src={photo(x.photo)} alt="" loading="lazy" className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700", x.key === dir ? "opacity-35" : "opacity-0")} />)}
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/70 to-ink" />
      </div>
      <div className="container-x relative">
        <Reveal>
          <Eyebrow n="03" dark>направления</Eyebrow>
          <H2><span id="dir-h">{t("Куда", "Какое")}</span> <span className="chrome-text">{t("поедем?", "направление?")}</span></H2>
          <p className="muted mt-4 max-w-2xl text-lg">{t("Первый байк, эндуро, город, багги, квадрик, снег: выбери, и подборка ниже поменяется.", "Первый байк, эндуро, город, багги, квадроцикл, снег: выберите направление, и подборка ниже изменится.")}</p>
        </Reveal>
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Направления">
          {DIRS.map((x) => <button key={x.key} role="tab" aria-selected={x.key === dir} className="chip !text-frost aria-selected:!text-ink" onClick={() => setDir(x.key)}>{x.ru}</button>)}
        </div>
        <p className="mt-4 text-frost/85">{t(d.note[0], d.note[1])}</p>
        <div ref={ref} className="mt-8 grid gap-4 md:grid-cols-3 lg:gap-6">
          {d.ids.map((id) => <LCard key={id} m={L_BY[id]} />)}
          {d.ids.length < 3 && (
            <article className={d.ids.length === 0 ? "md:col-span-3" : "md:col-span-1"}>
              <GlowCard customSize glowColor="flare" className="h-full !p-0">
                <div className="grid h-full gap-0 md:grid-cols-[1fr_1.1fr]">
                  <div className="relative min-h-[220px] overflow-hidden rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                    <img src={photo(d.photo)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                    <span className="mono absolute bottom-4 left-4 text-frost/90">{d.en}</span>
                  </div>
                  <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
                    <div>
                      <div className="mono text-sky">{d.en} / под заказ</div>
                      <h3 className="font-display mt-2 text-3xl font-extrabold uppercase leading-tight sm:text-4xl">{t("Подберем под твою задачу", "Подберем под вашу задачу")}</h3>
                      <p className="muted mt-3 max-w-md">{t("Кроме линейки GT возим технику других классов под заказ: подбираем, считаем доставку и обслуживаем.", "Кроме линейки GT поставляем технику других классов под заказ: подбираем, считаем доставку и обслуживаем.")}</p>
                    </div>
                    {stats.rows.length > 0 && (
                      <dl className="grid grid-cols-2 gap-4">
                        {stats.rows.map((s) => <div key={s.k} className="border-t border-frost/20 pt-2"><dt className="mono muted">{s.k}</dt><dd className="font-display text-lg font-extrabold">{s.v}</dd></div>)}
                      </dl>
                    )}
                    <div><button className="btn-solid" onClick={() => scrollToId("drive")}>Оставить заявку</button></div>
                  </div>
                </div>
              </GlowCard>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
