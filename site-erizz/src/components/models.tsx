import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useApp, reduceMotion, scrollToId } from "@/lib/state";
import { CATALOG, DIRS, GT, SIZES, VER_NOTE, fmtRange, gtSpec, modelName, photo, priceOf, rub, sizeOf, spec, type GTModel, type GTSize } from "@/lib/data";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { GlowCard } from "./ui/spotlight-card";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { MorphTile } from "./morph";
import { ObjectTracker } from "./effects";
import { cn } from "@/lib/utils";

const verBadge = (v: "base" | "pro") => (v === "pro" ? "badge-pro" : "badge-base");

/* ---------------------------------------------------------------- Pinned size sections */
function fillRange(el: HTMLElement | null, lo: number, hi: number, dec: number) {
  if (!el) return;
  const f = (n: number) => n.toFixed(dec).replace(".", ",").replace(/,0$/, "");
  el.textContent = `${f(lo)}-${f(hi)}`;
}

function PinnedSize({ size, prev }: { size: GTSize; prev: string }) {
  const { t, addCart, setDriveFor } = useApp();
  const base = GT.find((g) => g.size === size.key && g.ver === "base")!;
  const pro = GT.find((g) => g.size === size.key && g.ver === "pro")!;
  const root = useRef<HTMLElement>(null);
  const [ver, setVer] = useState<"base" | "pro">("base");
  const cur = ver === "base" ? base : pro;
  const dark = size.fg === "dark";
  const kwRef = useRef<HTMLSpanElement>(null);
  const kwhRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current!;
    const showStatic = () => { fillRange(kwRef.current, base.kw[0], base.kw[1], 0); fillRange(kwhRef.current, base.kwh[0], base.kwh[1], 1); };
    if (reduceMotion()) { showStatic(); return; }
    const q = (s: string) => el.querySelector(s);
    const kw = { a: 0, b: 0 }, kwh = { a: 0, b: 0 };
    const upd = () => { fillRange(kwRef.current, kw.a, kw.b, 0); fillRange(kwhRef.current, kwh.a, kwh.b, 1); };
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ wide: "(min-width: 900px)", narrow: "(max-width: 899px)" }, (c) => {
        const wide = c.conditions!.wide;
        const tl = gsap.timeline({ defaults: { ease: "power2.out" }, scrollTrigger: { trigger: el, start: "top top", end: "+=2600", scrub: 0.8, pin: true, anticipatePin: 1 } });
        tl.to(q(".wipe"), { yPercent: -101, duration: 0.14, ease: "power3.inOut" }, 0)
          .fromTo(q(".sz-word"), { xPercent: 45, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.3 }, 0.02)
          .fromTo(q(".sz-bike"), { xPercent: 90, rotationY: -55, scale: 0.7, opacity: 0 }, { xPercent: 0, rotationY: -10, scale: 1, opacity: 1, duration: 0.3 }, 0.06)
          .fromTo(q(".sz-shadow"), { scaleX: 0.2, opacity: 0 }, { scaleX: 1, opacity: 0.55, duration: 0.3 }, 0.1)
          .fromTo(q(".sz-title"), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.2 }, 0.14)
          .fromTo(q(".sz-panel"), wide ? { xPercent: 120, opacity: 0 } : { yPercent: 100, opacity: 0 }, { xPercent: 0, yPercent: 0, opacity: 1, duration: 0.22 }, 0.26)
          .fromTo(kw, { a: 0, b: 0 }, { a: base.kw[0], b: base.kw[1], duration: 0.22, onUpdate: upd }, 0.3)
          .fromTo(kwh, { a: 0, b: 0 }, { a: base.kwh[0], b: base.kwh[1], duration: 0.22, onUpdate: upd }, 0.3)
          .to(q(".sz-bike"), { rotationY: 16, duration: 0.3, ease: "none" }, 0.36)
          .call(() => setVer("base"), [], 0.5)
          // переключение Base -> Pro: шторка и перелет счетчиков
          .fromTo(q(".sz-pro"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.12, ease: "power3.inOut" }, 0.52)
          .set(q(".sz-base"), { opacity: 0 }, 0.65)
          .to(kw, { a: pro.kw[0], b: pro.kw[1], duration: 0.16, onUpdate: upd }, 0.52)
          .to(kwh, { a: pro.kwh[0], b: pro.kwh[1], duration: 0.16, onUpdate: upd }, 0.52)
          .call(() => setVer("pro"), [], 0.58)
          .to(q(".sz-bike"), { rotationY: -22, duration: 0.34, ease: "none" }, 0.6)
          .to(q(".sz-word"), { xPercent: -22, duration: 0.5, ease: "none" }, 0.5)
          .fromTo(q(".sz-cta"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.12 }, 0.78)
          .to({}, { duration: 0.06 }, 0.94);
        return () => { setVer("base"); };
      });
    }, el);
    return () => ctx.revert();
  }, [base, pro]);

  const col = dark ? "text-ink" : "text-frost";
  const sub = dark ? "text-ink/70" : "text-frost/75";
  return (
    <section ref={root} id={`size-${size.key}`} className={cn("relative isolate h-[100svh] min-h-[700px] overflow-hidden", col)} style={{ background: size.bg }} aria-label={`${size.code}: ${size.title}`}>
      <div className="brushed-dark pointer-events-none absolute inset-0 -z-10 opacity-[0.14] mix-blend-overlay" />
      <div className="wipe absolute inset-0 z-30" style={{ background: prev }} aria-hidden="true" />
      <div className="sz-word pointer-events-none absolute -bottom-[3vw] left-[-2vw] z-0 select-none whitespace-nowrap font-display text-[38vw] font-extrabold leading-none opacity-[0.12] sm:text-[30vw]" aria-hidden="true" style={{ WebkitTextStroke: `2px ${dark ? "#0e1013" : "#eef1f4"}`, color: "transparent", opacity: 0.35 }}>{size.word}</div>

      <div className="container-x relative z-10 flex h-full flex-col pt-20 sm:pt-24">
        <div className="sz-title">
          <p className="mono flex items-center gap-3"><span className="inline-block h-px w-10 bg-current" />GT {size.code} / колеса {size.wheels}</p>
          <h2 className="font-display mt-2 text-[clamp(30px,5.4vw,84px)] font-extrabold uppercase leading-[0.92]">{size.title}</h2>
          <p className={cn("mt-2 max-w-md text-base sm:text-lg", sub)}>{t(size.note[0], size.note[1])}</p>
        </div>

        <div className="relative flex-1" style={{ perspective: "1400px" }}>
          <div className="sz-bike absolute left-0 top-[6%] w-full will-change-transform sm:left-[2%] sm:top-[2%] sm:w-[66%]" style={{ transformStyle: "preserve-3d" }}>
            <div className="relative">
              <img src={photo(base.id)} alt={`${base.name}, фото`} className="sz-base w-full drop-shadow-[0_30px_26px_rgba(0,0,0,.35)]" />
              <img src={photo(pro.id)} alt={`${pro.name}, фото`} className="sz-pro absolute inset-0 w-full drop-shadow-[0_30px_26px_rgba(0,0,0,.35)]" style={reduceMotion() ? { clipPath: "inset(0 100% 0 0)" } : undefined} />
              <ObjectTracker wheels={size.wheels} className="pointer-events-none absolute inset-0 h-full w-full" stroke={dark ? "#c9a24b" : "#c9a24b"} />
            </div>
          </div>
          <div className="sz-shadow pointer-events-none absolute bottom-[8%] left-[4%] h-8 w-[56%] rounded-[50%] bg-black/60 blur-xl sm:bottom-[18%]" aria-hidden="true" />

          <aside className={cn("sz-panel absolute bottom-3 left-0 right-0 rounded-3xl border p-4 backdrop-blur-md sm:bottom-auto sm:left-auto sm:right-0 sm:top-[8%] sm:w-[340px] sm:p-6", dark ? "border-ink/25 bg-frost/55" : "border-frost/25 bg-deep/45")} aria-live="polite">
            <div className="flex items-center justify-between">
              <span className={cn("mono rounded-full px-3 py-1 font-bold", verBadge(ver))}>{ver === "pro" ? "Pro" : "Base"}</span>
              <span className="mono">{cur.wheels}</span>
            </div>
            <div className="font-display mt-2 text-2xl font-extrabold uppercase">{cur.name}</div>
            <div className="gold-line mt-2" />
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-1">
              <div><dt className="mono opacity-70">пик, целевой</dt><dd className="font-display text-3xl font-extrabold leading-none sm:text-4xl"><span ref={kwRef}>{fmtRange(base.kw)}</span> <span className="text-base font-semibold">кВт</span></dd></div>
              <div><dt className="mono opacity-70">энергия, целевая</dt><dd className="font-display text-3xl font-extrabold leading-none sm:text-4xl"><span ref={kwhRef}>{fmtRange(base.kwh)}</span> <span className="text-base font-semibold">кВт·ч</span></dd></div>
            </dl>
            <p className={cn("mt-3 hidden text-sm sm:block", sub)}>{t(VER_NOTE[ver][0], VER_NOTE[ver][1])}</p>
            <p className="mono mt-2 opacity-70">целевая спецификация, уточняется</p>
            <div className="sz-cta mt-3 flex flex-wrap items-center gap-2">
              <span className="font-display text-lg font-extrabold">{rub(cur.price)}</span><span className="mono opacity-70">примерная цена</span>
            </div>
            <div className="sz-cta mt-2 flex flex-wrap gap-2">
              <button className="btn-solid !min-h-11 !px-5 text-sm" onClick={() => addCart({ id: cur.id, name: cur.name, sub: `GT ${size.code} ${ver === "pro" ? "Pro" : "Base"} · примерная цена`, price: cur.price, img: photo(cur.id) })}>В корзину</button>
              <button className="btn-ghost !min-h-11 text-sm" onClick={() => { setDriveFor(cur.id); scrollToId("drive"); }}>Тест-драйв</button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export function PinnedSizes() {
  const prevs = ["#0e1013", SIZES[0].bg, SIZES[1].bg, SIZES[2].bg];
  return (
    <div id="models" aria-label="Линейка GT 4x2: четыре размера">
      {SIZES.map((s, i) => <PinnedSize key={s.key} size={s} prev={prevs[i]} />)}
    </div>
  );
}

/* ---------------------------------------------------------------- Lineup 4x2 (grid + morph) */
function GTCard({ g }: { g: GTModel }) {
  const { t, addCart, setDriveFor, toggleCompare, compare, setCartOpen } = useApp();
  const s = sizeOf(g.size);
  const inCmp = compare.includes(g.id);
  return (
    <MorphTile label={`${g.name}: подробнее`} className="aspect-[4/5] sm:aspect-[5/6]"
      detail={
        <div className="grid h-full min-h-0 gap-0 bg-ink text-frost md:grid-cols-2">
          <div className="relative grid min-h-[260px] place-items-center overflow-hidden p-6" style={{ background: s.bg }}>
            <div className="brushed-dark pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay" />
            <img src={photo(g.id)} alt={`${g.name}, фото`} className="relative w-full max-w-[640px] drop-shadow-[0_28px_22px_rgba(0,0,0,.4)]" />
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
            <span className={cn("mono w-fit rounded-full px-3 py-1 font-bold", verBadge(g.ver))}>{g.ver === "pro" ? "Pro" : "Base"}</span>
            <h3 className="font-display text-4xl font-extrabold uppercase leading-none sm:text-6xl">{g.name}</h3>
            <p className="muted text-lg">{s.title}. {t(VER_NOTE[g.ver][0], VER_NOTE[g.ver][1])}.</p>
            <div className="gold-line" />
            <dl className="grid grid-cols-3 gap-4">
              {gtSpec(g).map((x) => <div key={x.k}><dt className="mono muted">{x.k}</dt><dd className="font-display text-xl font-extrabold sm:text-2xl">{x.v}</dd></div>)}
            </dl>
            <p className="mono text-gold">целевая спецификация, уточняется</p>
            <div className="font-display text-2xl font-extrabold">{rub(g.price)} <span className="mono muted">примерная цена</span></div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-solid" onClick={() => { addCart({ id: g.id, name: g.name, sub: "примерная цена", price: g.price, img: photo(g.id) }); setCartOpen(true); }}>В корзину</button>
              <button className="btn-ghost" onClick={() => toggleCompare(g.id)}>{inCmp ? "Убрать из сравнения" : t("Сравнить", "Сравнить")}</button>
              <button className="btn-ghost" onClick={() => { setDriveFor(g.id); (document.querySelector(".morph-open button[aria-label=Закрыть]") as HTMLElement | null)?.click(); setTimeout(() => scrollToId("drive"), 850); }}>Тест-драйв</button>
            </div>
          </div>
        </div>
      }
    >
      <div className="metal-hover relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-frost/15 p-4 text-frost" style={{ background: `linear-gradient(160deg, ${s.bg}, #0e1013 78%)` }}>
        <div className="flex items-start justify-between">
          <span className={cn("mono rounded-full px-3 py-1 font-bold", verBadge(g.ver))}>{g.ver === "pro" ? "Pro" : "Base"}</span>
          <span className="mono rounded-full bg-deep/60 px-3 py-1">{g.wheels}</span>
        </div>
        <img src={photo(g.id)} alt={`${g.name}, фото`} loading="lazy" className="mx-auto my-2 max-h-[46%] w-[92%] object-contain drop-shadow-[0_16px_14px_rgba(0,0,0,.45)] transition-transform duration-500 group-hover:scale-105" />
        <div>
          <div className="font-display text-2xl font-extrabold uppercase">{g.name}</div>
          <div className="mono mt-1 text-frost/80">{fmtRange(g.kw)} кВт / {fmtRange(g.kwh)} кВт·ч</div>
          <div className="mt-2 flex items-center justify-between text-sm"><span>{rub(g.price)} <span className="mono opacity-70">прим.</span></span><span className="mono text-gold">подробнее</span></div>
        </div>
      </div>
    </MorphTile>
  );
}

export function LineupGrid() {
  const { t } = useApp();
  const [size, setSize] = useState<"all" | string>("all");
  const list = GT.filter((g) => size === "all" || g.size === size);
  return (
    <section id="lineup" className="dark-zone relative py-28 sm:py-40" aria-labelledby="lineup-h">
      <div className="container-x">
        <Reveal>
          <Eyebrow n="02" dark>линейка 4x2</Eyebrow>
          <H2><span id="lineup-h">{t("Четыре размера,", "Четыре размера,")}</span><br /><span className="chrome-text">Base и Pro</span></H2>
          <div className="chrome-line mt-6 max-w-md" />
          <p className="muted mt-5 max-w-2xl text-lg">{t("Сначала выбираешь посадку, потом Base или Pro. Нажми на карточку, чтобы раскрыть модель на весь экран.", "Сначала выбирается посадка, затем Base или Pro. Нажмите на карточку, чтобы раскрыть модель на весь экран.")}</p>
        </Reveal>
        <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Размер">
          {[["all", "Все"], ...SIZES.map((s) => [s.key, `${s.code} · ${s.wheels}`])].map(([k, l]) => (
            <button key={k} className="chip !text-frost aria-pressed:!text-ink" aria-pressed={size === k} onClick={() => setSize(k)}>{l}</button>
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {list.map((g) => <GTCard key={g.id} g={g} />)}
        </div>
        <p className="muted mt-6 max-w-3xl text-sm">{t("Названия рабочие. Мощность и энергия целевые, мы уточняем их после испытаний образцов. Цены ориентировочные. Младший Pro может пересекаться по мощности и цене со старшим Base: ты доплачиваешь за оснащение в своей посадке, а не обязан пересаживаться на байк крупнее.", "Названия рабочие. Мощность и энергия целевые и уточняются после испытаний образцов. Цены ориентировочные. Младший Pro может пересекаться по мощности и цене со старшим Base: вы доплачиваете за оснащение в своей посадке и не обязаны переходить на более крупный байк.")}</p>
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
  return (
    <section id="directions" className="relative bg-ink py-28 text-frost dark-zone sm:py-40" aria-labelledby="dir-h">
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
            const m = CATALOG[id];
            const name = modelName(id);
            const rows = m ? spec(m).slice(0, 4) : gtSpec(GT.find((g) => g.id === id)!);
            return (
              <article key={id}>
                <GlowCard customSize glowColor="flare" className="touch-pan-y! h-full !p-0">
                  <div className="relative min-h-[240px] overflow-hidden rounded-t-2xl sm:min-h-[280px]">
                    <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_55%,rgba(185,194,204,.28),transparent_72%)]" />
                    {(m ? m.cut : true) ? (
                      <img src={photo(id)} alt={`${name}, фото из каталога`} loading="lazy" className="absolute inset-x-[5%] top-1/2 w-[90%] -translate-y-1/2 transition-transform duration-500 hover:scale-105" />
                    ) : (
                      <img src={photo(id)} alt={`${name}, фото из каталога`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    {m && <span className="mono absolute right-4 top-4 rounded-full bg-deep/70 px-3 py-1 text-frost">{m.fuel === "ev" ? "электро" : "бензин"}</span>}
                    {!m && <span className={cn("mono absolute left-4 top-4 rounded-full px-3 py-1 font-bold", verBadge(GT.find((g) => g.id === id)!.ver))}>{GT.find((g) => g.id === id)!.ver === "pro" ? "Pro" : "Base"}</span>}
                  </div>
                  <div className="p-5">
                    <div className="mono text-gold">{d.en}</div>
                    <h3 className="font-display text-2xl font-extrabold uppercase leading-tight">{name}</h3>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {rows.map((s) => <div key={s.k} className="border-t border-frost/20 pt-2"><dt className="mono muted">{s.k}</dt><dd className="font-semibold">{s.v}</dd></div>)}
                      {rows.length === 0 && <div className="col-span-2 text-frost/70">{t("Характеристики уточняем", "Характеристики уточняются")}</div>}
                    </dl>
                    <div className="mt-4"><div className="mono muted">примерная цена</div><div className="font-display text-xl font-extrabold">{rub(priceOf(id))}</div></div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <InteractiveHoverButton text="В корзину" className="h-12 w-full flex-1 border-frost/40 bg-transparent text-frost sm:w-auto" onClick={() => addCart({ id, name, sub: `${d.ru} · примерная цена`, price: priceOf(id), img: photo(id) })} />
                      <button className="btn-ghost !min-h-12 text-sm" onClick={() => { setDriveFor(id); scrollToId("drive"); }}>Тест-драйв</button>
                    </div>
                  </div>
                </GlowCard>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
