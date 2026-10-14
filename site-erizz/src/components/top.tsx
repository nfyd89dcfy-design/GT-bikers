import { useEffect, useRef, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { gsap, SplitText } from "@/lib/gsap";
import { useApp, reduceMotion, scrollToId } from "@/lib/state";
import { CATALOG, DIRS, photo, priceOf, rub, spec, modelName, type Dir } from "@/lib/data";
import { Marble, ChromeText } from "./shaders";
import { GlowCard } from "./ui/spotlight-card";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Header */
const NAV: [string, string][] = [
  ["lineup", "Линейка"], ["build", "Сборка"], ["config", "Конструктор"], ["viewer", "3D"], ["showroom", "Шоурум"], ["media", "Медиа"], ["service", "Сервис"],
];

export function Header() {
  const { voice, setVoice, cart, setCartOpen, t } = useApp();
  const [open, setOpen] = useState(false);
  const n = cart.reduce((a, c) => a + c.qty, 0);
  const go = (id: string) => { setOpen(false); scrollToId(id); };
  return (
    <header className="fixed inset-x-0 top-0 z-[60] border-b border-ink/15 bg-sleet/85 text-ink backdrop-blur-md">
      <div className="container-x flex h-16 items-center gap-3">
        <a href="#top" className="font-display text-xl font-extrabold tracking-tight" aria-label="E-Rizz, на главную" data-cursor="home">
          E-RIZZ<span className="text-flare">.</span>
        </a>
        <nav className="ml-6 hidden items-center gap-5 lg:flex" aria-label="Разделы">
          {NAV.map(([id, l]) => (
            <button key={id} onClick={() => go(id)} className="mono min-h-11 cursor-pointer hover:text-flare">{l}</button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div role="group" aria-label="Обращение" className="flex overflow-hidden rounded-full border border-ink/40 text-sm font-semibold">
            {(["ty", "vy"] as const).map((v) => (
              <button key={v} aria-pressed={voice === v} onClick={() => setVoice(v)}
                className={cn("min-h-11 min-w-11 cursor-pointer px-3", voice === v ? "bg-ink text-frost" : "hover:bg-ink/10")}>
                {v === "ty" ? "ты" : "вы"}
              </button>
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

/* ---------------------------------------------------------------- Gate */
function DirTile({ d, i, onPick }: { d: Dir; i: number; onPick: () => void }) {
  const { t } = useApp();
  const hero = CATALOG[d.hero];
  return (
    <button onClick={onPick} data-cursor="выбрать" className="gate-tile group block h-full w-full cursor-pointer text-left" aria-label={`${d.ru}: ${t(d.note[0], d.note[1])}`}>
      <GlowCard customSize glowColor="orange" className="touch-pan-y! h-[148px] w-full overflow-hidden !p-0 sm:h-[230px]">
        <div className="relative row-span-2 h-full w-full overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(80%_80%_at_70%_30%,rgba(111,224,208,.28),transparent_70%)]" />
          <img src={photo(d.hero)} alt="" loading="eager" className={cn("absolute right-[-6%] top-[12%] w-[68%] max-w-none transition-transform duration-500 group-hover:scale-110 group-focus-visible:scale-110", !hero.cut && "inset-0 !right-0 !top-0 h-full w-full object-cover opacity-80")} />
          <div className="absolute inset-0 bg-gradient-to-t from-deep/85 via-deep/10 to-transparent" />
          <div className="relative flex h-full flex-col justify-between p-4 text-frost">
            <span className="mono text-aqua">0{i + 1}</span>
            <div>
              <div className="font-display text-xl font-extrabold uppercase leading-none sm:text-2xl">{d.ru}</div>
              <div className="mt-1 hidden text-xs text-frost/80 sm:block sm:text-sm">{t(d.note[0], d.note[1])}</div>
            </div>
          </div>
        </div>
      </GlowCard>
    </button>
  );
}

export function Gate() {
  const { gateOpen, setGateOpen, setDir, voice, setVoice, t } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.body.style.overflow = gateOpen ? "hidden" : "";
    if (!gateOpen || !ref.current) return;
    ref.current.querySelector<HTMLElement>("button.gate-tile")?.focus({ preventScroll: true });
    if (reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(".gate-in", { y: 30, opacity: 0, stagger: 0.07, duration: 0.7, ease: "power3.out" });
      gsap.from(".gate-tile", { y: 50, opacity: 0, scale: 0.94, stagger: 0.07, duration: 0.7, delay: 0.25, ease: "back.out(1.4)" });
    }, ref);
    return () => ctx.revert();
  }, [gateOpen]);
  if (!gateOpen) return null;
  const pick = (d: Dir) => {
    setDir(d.key);
    const done = () => { setGateOpen(false); window.scrollTo(0, 0); };
    if (reduceMotion() || !ref.current) return done();
    gsap.to(ref.current, { yPercent: -100, duration: 0.8, ease: "power4.inOut", onComplete: done });
  };
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Выбор направления" className="dark-zone fixed inset-0 z-[200] overflow-y-auto">
      <Marble a="#0b2a2e" b="#1d6a66" c="#071b1e" scale={1.6} turb={5} className="fixed inset-0 h-full w-full opacity-80" />
      <div className="container-x relative flex min-h-full flex-col justify-center py-10">
        <div className="gate-in mb-6 flex items-center justify-between gap-4">
          <span className="font-display text-2xl font-extrabold">E-RIZZ<span className="text-flare">.</span></span>
          <div role="group" aria-label="Обращение" className="flex overflow-hidden rounded-full border border-frost/40 text-sm font-semibold">
            {(["ty", "vy"] as const).map((v) => (
              <button key={v} aria-pressed={voice === v} onClick={() => setVoice(v)} className={cn("min-h-11 min-w-14 cursor-pointer px-4", voice === v ? "bg-aqua text-ink" : "hover:bg-frost/10")}>{v === "ty" ? "на ты" : "на вы"}</button>
            ))}
          </div>
        </div>
        <h1 className="gate-in font-display text-[clamp(34px,7vw,104px)] font-extrabold uppercase leading-[0.92]">
          {t("Что катаем", "Что вас интересует")}<span className="text-flare">?</span>
        </h1>
        <p className="gate-in muted mt-3 max-w-xl text-base sm:text-lg">
          {t("Выбери направление, и мы соберем сайт под него. Передумать можно в любой момент.", "Выберите направление, и мы соберем страницу под него. Изменить выбор можно в любой момент.")}
        </p>
        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {DIRS.map((d, i) => <DirTile key={d.key} d={d} i={i} onPick={() => pick(d)} />)}
        </div>
        <button className="gate-in mono mt-6 min-h-11 cursor-pointer self-start text-frost/70 underline underline-offset-4 hover:text-aqua" onClick={() => { setGateOpen(false); }}>
          {t("пока просто посмотрю", "просто посмотреть сайт")}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Hero */
function Count({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (reduceMotion()) { el.textContent = String(to) + suffix; return; }
    const o = { v: 0 };
    const tw = gsap.to(o, { v: to, duration: 1.4, ease: "power3.out", onUpdate: () => { el.textContent = (to % 1 ? o.v.toFixed(1) : Math.round(o.v)) + suffix; } });
    return () => { tw.kill(); };
  }, [to, suffix]);
  return <span ref={ref}>{to}{suffix}</span>;
}

export function Hero() {
  const { dir, setDir, t } = useApp();
  const d = DIRS.find((x) => x.key === dir)!;
  const top = d.hero;
  const m = CATALOG[top];
  const root = useRef<HTMLElement>(null);
  const bike = useRef<HTMLImageElement>(null);
  const h1 = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (reduceMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      const split = new SplitText(h1.current!, { type: "words,chars", charsClass: "hc" });
      gsap.from(split.chars, { yPercent: 110, opacity: 0, stagger: 0.012, duration: 0.8, ease: "power4.out", delay: 0.1 });
      gsap.to(".hero-bike", { yPercent: 14, scale: 1.06, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-chrome", { yPercent: -30, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-bike", { y: "-=10", duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
    }, root);
    const mv = (e: PointerEvent) => {
      const x = (e.clientX / innerWidth - 0.5), y = (e.clientY / innerHeight - 0.5);
      gsap.to(".hero-bike-in", { x: x * 40, rotate: x * 2.2, duration: 0.8, ease: "power2.out" });
      gsap.to(".hero-chrome-in", { x: -x * 26, y: -y * 10, duration: 1, ease: "power2.out" });
    };
    window.addEventListener("pointermove", mv);
    return () => { ctx.revert(); window.removeEventListener("pointermove", mv); };
  }, []);

  useEffect(() => {
    if (reduceMotion()) return;
    gsap.fromTo(".hero-bike-in", { opacity: 0, xPercent: 12 }, { opacity: 1, xPercent: 0, duration: 0.9, ease: "power3.out" });
  }, [dir]);

  return (
    <section id="top" ref={root} className="relative isolate overflow-hidden pt-16 sm:h-[max(100svh,860px)] sm:min-h-[900px]" aria-label="Главный экран">
      <Marble a="#e3ebe8" b="#8fe9db" c="#9bb5b1" scale={1.5} turb={5} className="absolute inset-0 -z-10 h-full w-full" />
      <div className="hero-chrome pointer-events-none absolute inset-x-0 top-[68px] z-0 sm:top-[72px]">
        <div className="hero-chrome-in mx-auto h-[20vw] min-h-[96px] w-[98%] max-w-[1500px]">
          <ChromeText text="E-RIZZ" className="h-full w-full" />
        </div>
      </div>

      <div className="container-x relative z-10 flex h-full flex-col">
        <div className="relative z-10 pt-[calc(max(96px,20vw)+30px)] sm:pt-[calc(20vw+34px)] lg:max-w-[44%] min-[1500px]:pt-[330px]">
          <p className="mono mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-flare" />{d.en} / {t("drop 01", "коллекция 01")}</p>
          <h1 ref={h1} className="font-display text-[clamp(26px,3.1vw,46px)] font-extrabold uppercase leading-[1] [overflow-wrap:normal] [hyphens:none]" aria-label={t("Катай так, чтобы оборачивались", "Электробайки с характером")}>
            {t("Катай так, чтобы оборачивались", "Электробайки с характером")}
          </h1>
          <p className="mt-3 max-w-md text-base text-ink/85">
            {t("Электробайки, ATV, UTV и снег. Розница и опт. Шоурум в Ростове, доставка по югу и в Москву.", "Электробайки, ATV, UTV и снежная техника. Розница и опт. Шоурум в Ростове-на-Дону, доставка по югу России и в Москву.")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <InteractiveHoverButton text={t("Собрать свой", "Собрать байк")} className="h-14 w-52 bg-ink text-frost" onClick={() => scrollToId("config")} data-cursor="build" />
            <InteractiveHoverButton text={t("Тест-драйв", "Записаться")} className="h-14 w-44" onClick={() => scrollToId("drive")} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Направление">
            {DIRS.map((x) => (
              <button key={x.key} className="chip !min-h-11 !px-4 text-sm" aria-pressed={x.key === dir} onClick={() => setDir(x.key)}>{x.ru}</button>
            ))}
          </div>
        </div>

        <div className="hero-bike pointer-events-none relative z-0 mt-2 overflow-hidden sm:absolute sm:inset-x-0 sm:bottom-[15%] sm:mt-0 sm:overflow-visible">
          <div className="hero-bike-in ml-auto w-[100%] max-w-none sm:w-[62%] sm:max-w-[960px] sm:translate-x-[2%] lg:w-[58%]">
            <img ref={bike} src={photo(top)} alt={`${modelName(top)}, фото из каталога`} className="w-full drop-shadow-[0_40px_30px_rgba(7,27,30,.35)]" style={m.cut ? undefined : { borderRadius: 24 }} />
          </div>
        </div>

        <div className="relative z-10 mt-auto pb-6">
          <div className="grid grid-cols-2 items-end gap-x-6 gap-y-3 border-t border-ink/30 pt-4 sm:grid-cols-5">
            <div className="col-span-2 sm:col-span-1">
              <div className="mono">{modelName(top)}</div>
              <div className="mt-1 text-sm">{t("примерная цена от", "примерная цена от")} <b>{rub(priceOf(top))}</b></div>
              <button className="mono mt-1 min-h-9 cursor-pointer underline underline-offset-4 hover:text-flare" onClick={() => scrollToId("lineup")}>{t("в линейку", "к линейке")}</button>
            </div>
            {spec(m).filter((s) => s.k !== "батарея").slice(0, 4).map((s) => {
              const num = parseFloat(s.v);
              const unit = s.v.replace(/^[\d.]+\s?/, "");
              return (
                <div key={s.k}>
                  <div className="font-display text-[clamp(28px,3.6vw,52px)] font-extrabold leading-none"><Count to={num} /><span className="ml-1 text-[0.4em] font-semibold">{unit}</span></div>
                  <div className="mono mt-1 text-mute">{s.k}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
