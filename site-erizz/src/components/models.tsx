import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useApp, reduceMotion, scrollToId } from "@/lib/state";
import { DIRS, GT, dirStats, fmtRange, gtSpec, rub, verLabel, type GTModel } from "@/lib/data";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { GlowCard } from "./ui/spotlight-card";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { MorphTile } from "./morph";
import { ObjectTracker } from "./effects";
import { Bike3D, BikeThumb, type BikeApi } from "./bike";
import { BlockGrid } from "./shaders";
import { cn } from "@/lib/utils";

export const verBadge = (v: "base" | "sport" | "pro") => (v === "pro" ? "badge-pro" : v === "sport" ? "badge-sport" : "badge-base");

/* ---------------------------------------------------------------- Pinned model sections */
function fillRange(el: HTMLElement | null, lo: number, hi: number, dec: number) {
  if (!el) return;
  const f = (n: number) => n.toFixed(dec).replace(".", ",").replace(/,0$/, "");
  el.textContent = `${f(lo)}-${f(hi)}`;
}

const GRID_TONES: Record<string, { a: string; b: string; line: string; gain: number }> = {
  base: { a: "#0e1013", b: "#2b3037", line: "#8d97a2", gain: 0.9 },
  sport: { a: "#ff4a2b", b: "#ff8a6a", line: "#14161a", gain: 0.55 },
  pro: { a: "#4a0e1c", b: "#8a2236", line: "#9cc9ff", gain: 0.8 },
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

  useEffect(() => {
    const el = root.current!;
    const full = () => { fillRange(kwRef.current, g.kw[0], g.kw[1], 0); fillRange(kwhRef.current, g.kwh[0], g.kwh[1], 1); };
    if (reduceMotion()) { full(); return; }
    const q = (s: string) => el.querySelector(s);
    const qa = (s: string) => el.querySelectorAll(s);
    const kw = { a: 0, b: 0 }, kwh = { a: 0, b: 0 }, yaw = { v: 0.5 };
    const upd = () => { fillRange(kwRef.current, kw.a, kw.b, 0); fillRange(kwhRef.current, kwh.a, kwh.b, 1); };
    const ctx = gsap.context(() => {
      // вход: контент виден сразу, лишь мягко выезжает
      gsap.from(qa(".sz-in"), { y: 40, opacity: 0, stagger: 0.08, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 75%", once: true } });
      const mm = gsap.matchMedia();
      mm.add({ wide: "(min-width: 1024px)", narrow: "(max-width: 1023px)" }, (c) => {
        const wide = c.conditions!.wide;
        const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: wide ? { trigger: el, start: "top top", end: "+=1500", scrub: 1.1, pin: true, anticipatePin: 1 } : { trigger: el, start: "top 85%", end: "bottom 25%", scrub: 1.1 } });
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
    <section ref={root} id={`model-${g.ver}`} className={cn("relative isolate overflow-hidden py-24 lg:flex lg:h-[100svh] lg:min-h-[700px] lg:flex-col lg:py-0 lg:pt-20", col)} style={{ background: g.bg }} aria-label={`${g.name}: колеса ${g.wheels}`}>
      <BlockGrid a={tone.a} b={tone.b} line={tone.line} gain={tone.gain} cells={g.ver === "pro" ? 18 : 14} rotation={g.ver === "sport" ? 0 : g.ver === "pro" ? 45 : 0} contrast={0.4} lineAmt={g.ver === "sport" ? 0.18 : 0.3} react={0.55} seed={index * 7 + 1} className="pointer-events-none absolute inset-0 -z-20 h-full w-full opacity-[0.35]" />
      <div className="brushed-dark pointer-events-none absolute inset-0 -z-10 opacity-[0.12] mix-blend-overlay" />
      {/* огромное слово */}
      <div className="sz-word pointer-events-none absolute left-0 top-[18%] z-0 select-none whitespace-nowrap font-display text-[30vw] font-extrabold uppercase leading-none lg:top-[8%] lg:text-[26vw]" aria-hidden="true" style={{ WebkitTextStroke: `2px ${stroke}`, color: "transparent", opacity: 0.18 }}>{g.word} {g.word}</div>
      {/* контурные диаметры колес */}
      <div className="sz-num-r pointer-events-none absolute bottom-[1%] left-[-1vw] z-0 select-none font-display text-[34vw] font-extrabold leading-[0.8] lg:text-[24vw]" aria-hidden="true" style={{ WebkitTextStroke: `2px ${stroke}`, color: "transparent", opacity: 0.5 }}>{wr}</div>
      <div className="sz-num-f pointer-events-none absolute bottom-[1%] right-[-1vw] z-0 select-none font-display text-[34vw] font-extrabold leading-[0.8] lg:text-[24vw]" aria-hidden="true" style={{ WebkitTextStroke: `2px ${stroke}`, color: "transparent", opacity: 0.5 }}>{wf}</div>

      <div className="container-x relative z-10 grid flex-1 items-center gap-6 lg:grid-cols-[minmax(230px,19%)_1fr_minmax(290px,22%)] lg:gap-0">
        <div className="sz-in relative z-20 lg:self-start lg:pt-6">
          <p className="mono flex items-center gap-3"><span className="inline-block h-px w-10 bg-current" />0{index + 1} / колеса {g.wheels}</p>
          <h2 className="font-display mt-3 text-[clamp(44px,6.4vw,112px)] font-extrabold uppercase leading-[0.9]">GT<br />{g.short}</h2>
          <p className={cn("mt-4 max-w-xs text-base sm:text-lg", sub)}>{t(g.tag[0], g.tag[1])}</p>
          <div className="sz-bar mt-6 h-[3px] w-40 bg-current opacity-60" />
          <p className={cn("mt-4 max-w-xs text-sm", sub)}>{t(g.look[0], g.look[1])}</p>
        </div>

        <div className="sz-in relative z-10 -mx-5 lg:-mx-[11%]">
          <div className="relative mx-auto w-full max-w-[1500px]">
            <Bike3D ref={bike} variant={g.ver} yaw={0.6} pitch={0.12} sway={0.06} label={`${g.name}, 3D-модель`} className="h-[300px] sm:h-[420px] lg:h-[min(68svh,740px)]" />
            <ObjectTracker wheels={g.wheels} facing="right" className="pointer-events-none absolute inset-0 h-full w-full" stroke="#9cc9ff" />
          </div>
        </div>

        <aside className={cn("sz-in relative z-20 rounded-3xl border p-5 backdrop-blur-md sm:p-7 lg:self-center", dark ? "border-ink/25 bg-frost/45" : "border-frost/25 bg-deep/50")} aria-live="polite">
          <div className="flex items-center justify-between">
            <span className={cn("mono rounded-full px-3 py-1 font-bold", verBadge(g.ver))}>{verLabel(g.ver)}</span>
            <span className="mono">{g.wheels}</span>
          </div>
          <div className="font-display mt-3 text-2xl font-extrabold uppercase">{g.name}</div>
          <div className="sky-line mt-3" />
          <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-1">
            <div><dt className="mono opacity-70">пик, целевой</dt><dd className="font-display text-2xl font-extrabold leading-none sm:text-4xl xl:text-5xl"><span ref={kwRef}>{fmtRange(g.kw)}</span> <span className="text-base font-semibold">кВт</span></dd></div>
            <div><dt className="mono opacity-70">энергия, целевая</dt><dd className="font-display whitespace-nowrap text-2xl font-extrabold leading-none sm:text-4xl xl:text-5xl"><span ref={kwhRef}>{fmtRange(g.kwh)}</span> <span className="text-base font-semibold">кВт·ч</span></dd></div>
          </dl>
          <p className="mono mt-3 opacity-70">целевая спецификация, уточняется</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-2"><span className="font-display text-xl font-extrabold">{rub(g.price)}</span><span className="mono opacity-70">примерная цена</span></div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-solid !min-h-11 !px-5 text-sm" onClick={() => addCart({ id: g.id, name: g.name, sub: `колеса ${g.wheels} · примерная цена`, price: g.price, variant: g.ver })}>В корзину</button>
            <button className="btn-ghost !min-h-11 text-sm" onClick={() => { setDriveFor(g.id); scrollToId("drive"); }}>Тест-драйв</button>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function PinnedSizes() {
  const prevs = ["#0e1013", GT[0].bg, GT[1].bg];
  useEffect(() => { const t = setTimeout(() => ScrollTrigger.refresh(), 400); return () => clearTimeout(t); }, []);
  return (
    <div id="models" aria-label="Линейка GT: Base, Sport, Pro">
      {GT.map((g, i) => <PinnedModel key={g.id} g={g} prev={prevs[i]} index={i} />)}
    </div>
  );
}

/* ---------------------------------------------------------------- Lineup (grid + morph) */
function GTCard({ g }: { g: GTModel }) {
  const { t, addCart, setDriveFor, toggleCompare, compare, setCartOpen } = useApp();
  const inCmp = compare.includes(g.id);
  return (
    <MorphTile label={`${g.name}: подробнее`} className="aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5]"
      detail={
        <div className="grid h-full min-h-0 gap-0 bg-ink text-frost md:grid-cols-[1.25fr_1fr]">
          <div className="relative grid min-h-[280px] place-items-center overflow-hidden" style={{ background: g.bg }}>
            <BlockGrid a={GRID_TONES[g.ver].a} b={GRID_TONES[g.ver].b} line={GRID_TONES[g.ver].line} gain={GRID_TONES[g.ver].gain} cells={12} className="pointer-events-none absolute inset-0 h-full w-full opacity-50" seed={3} />
            <Bike3D variant={g.ver} interactive yaw={-0.5} sway={0.1} label={`${g.name}, 3D-модель: потяни, чтобы повернуть`} className="relative h-[300px] md:h-[min(70vh,620px)]" />
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
            <span className={cn("mono w-fit rounded-full px-3 py-1 font-bold", verBadge(g.ver))}>{verLabel(g.ver)}</span>
            <h3 className="font-display text-4xl font-extrabold uppercase leading-none sm:text-6xl">{g.name}</h3>
            <p className="muted text-lg">{t(g.tag[0], g.tag[1])} {t(g.look[0], g.look[1])}</p>
            <div className="sky-line" />
            <dl className="grid grid-cols-3 gap-4">
              {gtSpec(g).map((x) => <div key={x.k}><dt className="mono muted">{x.k}</dt><dd className="font-display text-xl font-extrabold sm:text-2xl">{x.v}</dd></div>)}
            </dl>
            <p className="mono text-sky">целевая спецификация, уточняется</p>
            <div className="font-display text-2xl font-extrabold">{rub(g.price)} <span className="mono muted">примерная цена</span></div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-solid" onClick={() => { addCart({ id: g.id, name: g.name, sub: "примерная цена", price: g.price, variant: g.ver }); setCartOpen(true); }}>В корзину</button>
              <button className="btn-ghost" onClick={() => toggleCompare(g.id)}>{inCmp ? "Убрать из сравнения" : "Сравнить"}</button>
              <button className="btn-ghost" onClick={() => { setDriveFor(g.id); (document.querySelector(".morph-open button[aria-label=Закрыть]") as HTMLElement | null)?.click(); setTimeout(() => scrollToId("drive"), 850); }}>Тест-драйв</button>
            </div>
          </div>
        </div>
      }
    >
      <div className="metal-hover relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-frost/15 p-5 text-frost" style={{ background: `linear-gradient(160deg, ${g.bg}, #0e1013 82%)` }}>
        <div className="flex items-start justify-between">
          <span className={cn("mono rounded-full px-3 py-1 font-bold", verBadge(g.ver))}>{verLabel(g.ver)}</span>
          <span className="mono rounded-full bg-deep/60 px-3 py-1">{g.wheels}</span>
        </div>
        <BikeThumb variant={g.ver} yaw={-0.5} w={760} h={500} alt={`${g.name}, 3D-рендер`} className="mx-auto my-2 w-full object-contain transition-transform duration-500 group-hover:scale-105" />
        <div>
          <div className="font-display text-3xl font-extrabold uppercase">{g.name}</div>
          <div className="mono mt-1 text-frost/80">{fmtRange(g.kw)} кВт / {fmtRange(g.kwh)} кВт·ч</div>
          <div className="mt-2 flex items-center justify-between text-sm"><span>{rub(g.price)} <span className="mono opacity-70">прим.</span></span><span className="mono text-sky">подробнее</span></div>
        </div>
      </div>
    </MorphTile>
  );
}

export function LineupGrid() {
  const { t } = useApp();
  return (
    <section id="lineup" className="dark-zone relative overflow-hidden py-24 sm:py-36" aria-labelledby="lineup-h">
      <BlockGrid a="#07080a" b="#1c2026" line="#59616b" gain={0.8} cells={16} lineAmt={0.22} react={0.5} className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-60" seed={11} />
      <div className="container-x">
        <Reveal>
          <Eyebrow n="02" dark>линейка</Eyebrow>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <H2><span id="lineup-h">{t("Три модели,", "Три модели,")}</span><br /><span className="chrome-text">Base, Sport, Pro</span></H2>
            <p className="muted max-w-xl text-lg">{t("Нажми на карточку, чтобы раскрыть модель на весь экран и покрутить ее в 3D.", "Нажмите на карточку, чтобы раскрыть модель на весь экран и повернуть ее в 3D.")}</p>
          </div>
          <div className="chrome-line mt-6 max-w-md" />
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
          {GT.map((g) => <GTCard key={g.id} g={g} />)}
        </div>
        <p className="muted mt-6 max-w-3xl text-sm">{t("Названия рабочие. Мощность и энергия целевые, мы уточняем их после испытаний образцов. Цены ориентировочные.", "Названия рабочие. Мощность и энергия целевые и уточняются после испытаний образцов. Цены ориентировочные.")}</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Directions (фильтр) */
export function Directions() {
  const { dir, setDir, t, addCart, setDriveFor } = useApp();
  const d = DIRS.find((x) => x.key === dir) ?? DIRS[0];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduceMotion() || !ref.current) return;
    gsap.fromTo(ref.current.children, { y: 36, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.55, ease: "power3.out" });
  }, [dir]);
  const stats = dirStats(d.cats);
  return (
    <section id="directions" className="relative bg-ink py-20 text-frost dark-zone sm:py-28" aria-labelledby="dir-h">
      <div className="container-x">
        <Reveal>
          <Eyebrow n="03" dark>направления</Eyebrow>
          <H2><span id="dir-h">{t("Куда", "Какое")}</span> <span className="chrome-text">{t("поедем?", "направление?")}</span></H2>
          <p className="muted mt-4 max-w-2xl text-lg">{t("Эндуро, город, багги, квадрик, снег: выбери, и подборка ниже поменяется.", "Эндуро, город, багги, квадроцикл, снег: выберите направление, и подборка ниже изменится.")}</p>
        </Reveal>
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Направления">
          {DIRS.map((x) => <button key={x.key} role="tab" aria-selected={x.key === dir} className="chip !text-frost aria-selected:!text-ink" onClick={() => setDir(x.key)}>{x.ru}</button>)}
        </div>
        <p className="mt-4 text-frost/80">{t(d.note[0], d.note[1])}</p>
        <div ref={ref} className="mt-8 grid gap-4 md:grid-cols-3 lg:gap-6">
          {d.ids.map((id) => {
            const g = GT.find((x) => x.id === id)!;
            return (
              <article key={id}>
                <GlowCard customSize glowColor="flare" className="touch-pan-y! h-full !p-0">
                  <div className="relative overflow-hidden rounded-t-2xl p-3" style={{ background: `linear-gradient(160deg, ${g.bg}, #0e1013)` }}>
                    <BikeThumb variant={g.ver} yaw={-0.5} w={640} h={400} alt={`${g.name}, 3D-рендер`} className="mx-auto w-full object-contain" />
                    <span className={cn("mono absolute left-4 top-4 rounded-full px-3 py-1 font-bold", verBadge(g.ver))}>{verLabel(g.ver)}</span>
                  </div>
                  <div className="p-5">
                    <div className="mono text-sky">{d.en}</div>
                    <h3 className="font-display text-2xl font-extrabold uppercase leading-tight">{g.name}</h3>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {gtSpec(g).map((s) => <div key={s.k} className="border-t border-frost/20 pt-2"><dt className="mono muted">{s.k}</dt><dd className="font-semibold">{s.v}</dd></div>)}
                    </dl>
                    <div className="mt-4"><div className="mono muted">примерная цена</div><div className="font-display text-xl font-extrabold">{rub(g.price)}</div></div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <InteractiveHoverButton text="В корзину" className="h-12 w-full flex-1 border-frost/40 bg-transparent text-frost sm:w-auto" onClick={() => addCart({ id, name: g.name, sub: `${d.ru} · примерная цена`, price: g.price, variant: g.ver })} />
                      <button className="btn-ghost !min-h-12 text-sm" onClick={() => { setDriveFor(id); scrollToId("drive"); }}>Тест-драйв</button>
                    </div>
                  </div>
                </GlowCard>
              </article>
            );
          })}
          {d.ids.length < 3 && (
            <article className={d.ids.length === 0 ? "md:col-span-3" : "md:col-span-1"}>
              <GlowCard customSize glowColor="flare" className="h-full !p-0">
                <div className="flex h-full flex-col justify-between gap-6 p-6 sm:p-8">
                  <div>
                    <div className="mono text-sky">{d.en} / под заказ</div>
                    <h3 className="font-display mt-2 text-3xl font-extrabold uppercase leading-tight sm:text-4xl">{d.ids.length === 0 ? t("Подберем под твою задачу", "Подберем под вашу задачу") : t("Нужно что-то еще?", "Нужно что-то другое?")}</h3>
                    <p className="muted mt-3 max-w-md">{t("Кроме линейки GT возим технику других классов под заказ: подбираем, считаем доставку и обслуживаем.", "Кроме линейки GT поставляем технику других классов под заказ: подбираем, считаем доставку и обслуживаем.")}</p>
                  </div>
                  {stats.rows.length > 0 && (
                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {stats.rows.map((s) => <div key={s.k} className="border-t border-frost/20 pt-2"><dt className="mono muted">{s.k}</dt><dd className="font-display text-lg font-extrabold">{s.v}</dd></div>)}
                    </dl>
                  )}
                  <div><button className="btn-solid" onClick={() => scrollToId("drive")}>{t("Оставить заявку", "Оставить заявку")}</button></div>
                </div>
              </GlowCard>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
