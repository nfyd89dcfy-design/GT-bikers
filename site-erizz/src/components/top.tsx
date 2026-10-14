import { useEffect, useRef, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { gsap, SplitText } from "@/lib/gsap";
import { useApp, reduceMotion, scrollToId, type Voice } from "@/lib/state";
import { GT_BY, fmtRange, rub } from "@/lib/data";
import { BlockGrid, ChromeText } from "./shaders";
import { Bike3D } from "./bike";
import { ParticleField, ObjectTracker } from "./effects";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Header */
const NAV: [string, string][] = [
  ["models", "Линейка"], ["build", "Сборка"], ["config", "Конструктор"], ["viewer", "3D"], ["delivery", "Доставка"], ["showroom", "Шоурум"], ["media", "Медиа"],
];

export function Header() {
  const { voice, setVoice, cart, setCartOpen, t } = useApp();
  const [open, setOpen] = useState(false);
  const n = cart.reduce((a, c) => a + c.qty, 0);
  const go = (id: string) => { setOpen(false); scrollToId(id); };
  return (
    <header className="fixed inset-x-0 top-0 z-[60] border-b border-ink/15 bg-sleet/80 text-ink backdrop-blur-md">
      <div className="container-x flex h-16 items-center gap-3">
        <a href="#top" className="font-display text-xl font-extrabold tracking-tight" aria-label="E-Rizz, на главную">
          E-RIZZ<span className="text-flare">.</span>
        </a>
        <nav className="ml-6 hidden items-center gap-5 lg:flex" aria-label="Разделы">
          {NAV.map(([id, l]) => <button key={id} onClick={() => go(id)} className="mono min-h-11 cursor-pointer hover:text-flare">{l}</button>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div role="group" aria-label="Обращение" className="flex overflow-hidden rounded-full border border-ink/40 text-sm font-semibold">
            {(["ty", "vy"] as const).map((v) => (
              <button key={v} aria-pressed={voice === v} onClick={() => setVoice(v)} className={cn("min-h-11 min-w-11 cursor-pointer px-3", voice === v ? "bg-ink text-frost" : "hover:bg-ink/10")}>{v === "ty" ? "ты" : "вы"}</button>
            ))}
          </div>
          <button onClick={() => setCartOpen(true)} className="relative grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-full border border-ink/40 hover:bg-ink/10" aria-label={`Корзина, товаров: ${n}`}>
            <ShoppingBag size={20} />
            {n > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-flare px-1 text-[11px] font-bold">{n}</span>}
          </button>
          <button onClick={() => go("drive")} className="btn-solid hidden !min-h-11 !px-5 sm:block">{t("На тест-драйв", "Записаться на тест-драйв")}</button>
          <button className="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-full border border-ink/40 lg:hidden" aria-expanded={open} aria-label="Меню" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-ink/15 bg-sleet px-5 pb-5 lg:hidden" aria-label="Разделы (мобильное меню)">
          {[...NAV, ["drive", "Тест-драйв"] as [string, string]].map(([id, l]) => (
            <button key={id} onClick={() => go(id)} className="block min-h-12 w-full cursor-pointer border-b border-ink/10 text-left font-display text-lg font-bold uppercase">{l}</button>
          ))}
        </nav>
      )}
    </header>
  );
}

/* ---------------------------------------------------------------- Tone gate (единственная заставка) */
export function ToneGate() {
  const { gateOpen, setGateOpen, setVoice } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const narrow = typeof innerWidth !== "undefined" && innerWidth < 700;
  useEffect(() => {
    document.body.style.overflow = gateOpen ? "hidden" : "";
    if (!gateOpen || !ref.current) return;
    ref.current.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    if (reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(".gate-in", { y: 34, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power3.out" });
    }, ref);
    return () => ctx.revert();
  }, [gateOpen]);
  if (!gateOpen) return null;
  const pick = (v: Voice) => {
    setVoice(v);
    const done = () => { setGateOpen(false); window.scrollTo(0, 0); };
    if (reduceMotion() || !ref.current) return done();
    gsap.to(ref.current, { yPercent: -100, duration: 0.85, ease: "power4.inOut", onComplete: done });
  };
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Выбор обращения" className="dark-zone brushed-dark fixed inset-0 z-[200] grid place-items-center overflow-y-auto px-5">
      <BlockGrid a="#07080a" b="#2a3038" line="#8d97a2" cells={16} scale={2.2} contrast={0.8} gain={1} lineAmt={0.3} react={1.4} speed={1.4} seed={4} className="pointer-events-none absolute inset-0 h-full w-full opacity-90" />
      <ParticleField text="E-RIZZ" count={4200} className="pointer-events-none absolute inset-0 h-full w-full" box={narrow ? { x: 0.04, y: 0.03, w: 0.92, h: 0.3 } : { x: 0.04, y: 0.12, w: 0.92, h: 0.76 }} tones={["#3a4048", "#59616b", "#8d97a2", "#e4e8ec", "#ff4a2b"]} size={1.25} cursorRadius={0.22} wobble={0.7} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_50%,rgba(7,8,10,.78),transparent_80%)]" />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center py-12 text-center">
        <span className="gate-in font-display text-2xl font-extrabold">E-RIZZ<span className="text-flare">.</span></span>
        <div className="chrome-line gate-in my-8 w-40" />
        <h1 className="gate-in font-display chrome-text text-[clamp(34px,7vw,92px)] font-extrabold uppercase leading-[0.95]">Мне комфортно общаться</h1>
        <p className="gate-in muted mt-4 max-w-md">От выбора зависит тон текстов на сайте. Поменять его можно в любой момент в шапке.</p>
        <div className="gate-in mt-9 flex flex-wrap justify-center gap-4">
          <InteractiveHoverButton text="на ты" className="h-16 w-60 border-frost/40 bg-transparent text-lg text-frost" onClick={() => pick("ty")} />
          <InteractiveHoverButton text="на вы" className="h-16 w-60 border-frost/40 bg-transparent text-lg text-frost" onClick={() => pick("vy")} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Hero */
function CountR({ lo, hi, dec = 0 }: { lo: number; hi: number; dec?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const f = (n: number) => n.toFixed(dec).replace(".", ",").replace(/,0$/, "");
  useEffect(() => {
    const el = ref.current!;
    if (reduceMotion()) { el.textContent = fmtRange([lo, hi]); return; }
    const o = { a: 0, b: 0 };
    const tw = gsap.to(o, { a: lo, b: hi, duration: 1.6, ease: "power3.out", delay: 0.3, onUpdate: () => { el.textContent = `${f(o.a)}-${f(o.b)}`; } });
    return () => { tw.kill(); };
  }, [lo, hi]); // eslint-disable-line
  return <span ref={ref}>{fmtRange([lo, hi])}</span>;
}

export function Hero() {
  const { t } = useApp();
  const g = GT_BY["gt-sport"];
  const root = useRef<HTMLElement>(null);
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (reduceMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      const split = new SplitText(h1.current!, { type: "words,chars", charsClass: "hc" });
      gsap.from(split.chars, { yPercent: 110, opacity: 0, stagger: 0.012, duration: 0.8, ease: "power4.out", delay: 0.15 });
      gsap.to(".hero-bike", { yPercent: 8, scale: 1.04, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-chrome", { yPercent: -35, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
    }, root);
    const mv = (e: PointerEvent) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      gsap.to(".hero-chrome-in", { x: -x * 24, y: -y * 10, duration: 1, ease: "power2.out" });
    };
    window.addEventListener("pointermove", mv);
    return () => { ctx.revert(); window.removeEventListener("pointermove", mv); };
  }, []);

  return (
    <section id="top" ref={root} className="relative isolate overflow-hidden pt-16 lg:h-[max(100svh,820px)]" aria-label="Главный экран">
      <div className="brushed absolute inset-0 -z-20 opacity-90" />
      <BlockGrid a="#dfe3e8" b="#b7c0ca" line="#8d97a2" cells={13} scale={2.4} contrast={0.5} gain={0.75} lineAmt={0.3} react={0.45} seed={2} className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-70 mix-blend-multiply" />
      <ParticleField text="SEND IT" count={3600} tones={["#8d97a2", "#59616b", "#2b3037", "#14171b", "#ff4a2b"]} box={{ x: 0.3, y: 0.34, w: 0.7, h: 0.5 }} cursorMode="push" className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full opacity-45 lg:block" size={1.2} />
      <div className="hero-chrome pointer-events-none absolute inset-x-0 top-[68px] z-0 sm:top-[72px]">
        <div className="hero-chrome-in mx-auto h-[20vw] min-h-[96px] w-[98%] max-w-[1700px]"><ChromeText text="E-RIZZ" className="h-full w-full" /></div>
      </div>
      <div className="container-x relative z-10 flex h-full flex-col">
        <div className="relative z-10 pt-[calc(max(96px,20vw)+30px)] lg:max-w-[40%]">
          <p className="mono mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-flare" />GT / drop 01</p>
          <h1 ref={h1} className="font-display text-[clamp(26px,3.1vw,52px)] font-extrabold uppercase leading-[1] [overflow-wrap:normal] [hyphens:none]" aria-label={t("Катай так, чтобы оборачивались", "Электробайки с характером")}>
            {t("Катай так, чтобы оборачивались", "Электробайки с характером")}
          </h1>
          <p className="mt-3 max-w-md text-base text-ink/85">
            {t("Три модели: Base, Sport и Pro. Электробайки, ATV, UTV и снег. Розница и опт, шоурум в Ростове, доставка по всей России.", "Три модели: Base, Sport и Pro. Электробайки, ATV, UTV и снежная техника. Розница и опт, шоурум в Ростове-на-Дону, доставка по всей России.")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <InteractiveHoverButton text={t("Собрать свой", "Собрать байк")} className="h-14 w-52 bg-ink text-frost" onClick={() => scrollToId("config")} />
            <InteractiveHoverButton text="Линейка GT" className="h-14 w-48" onClick={() => scrollToId("models")} />
          </div>
        </div>
        <div className="hero-bike pointer-events-none relative z-0 mt-2 lg:absolute lg:inset-x-0 lg:bottom-[11%] lg:mt-0">
          <div className="relative ml-auto w-full lg:w-[74%] lg:max-w-[1300px]">
            <Bike3D variant="sport" yaw={-0.55} pitch={0.1} sway={0.14} label="GT Sport, 3D-модель" className="h-[300px] sm:h-[420px] lg:h-[min(64svh,640px)]" />
            <ObjectTracker wheels={g.wheels} facing="right" className="absolute inset-0 h-full w-full" />
          </div>
        </div>
        <div className="relative z-10 mt-auto pb-6">
          <div className="grid grid-cols-2 items-end gap-x-6 gap-y-3 border-t border-ink/30 pt-4 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <div className="mono">{g.name}</div>
              <div className="mt-1 text-sm">примерная цена от <b>{rub(g.price)}</b></div>
              <div className="mono mt-1 text-mute">целевая спецификация, уточняется</div>
            </div>
            <div><div className="font-display text-[clamp(26px,3.4vw,56px)] font-extrabold leading-none"><CountR lo={g.kw[0]} hi={g.kw[1]} /><span className="ml-1 text-[0.4em] font-semibold">кВт</span></div><div className="mono mt-1 text-mute">пик</div></div>
            <div><div className="font-display text-[clamp(26px,3.4vw,56px)] font-extrabold leading-none"><CountR lo={g.kwh[0]} hi={g.kwh[1]} dec={1} /><span className="ml-1 text-[0.4em] font-semibold">кВт·ч</span></div><div className="mono mt-1 text-mute">энергия</div></div>
            <div><div className="font-display text-[clamp(26px,3.4vw,56px)] font-extrabold leading-none">{g.wheels}</div><div className="mono mt-1 text-mute">колеса, дюймы</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
