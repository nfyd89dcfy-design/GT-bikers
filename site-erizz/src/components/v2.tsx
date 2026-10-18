import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useApp, reduceMotion, scrollToId, type Theme } from "@/lib/state";
import { GROUPS, LINEUP, L_BY, studio } from "@/lib/data";
import { LCard } from "./product";
import { CineSwitch, Cta, HeroBackdrop, CellsBackdrop, Tracker, switchTheme, type Hud } from "./fx";
import { cn } from "@/lib/utils";

export { Logo } from "./logo";
import { Logo } from "./logo";

/* ---------------------------------------------------------------- Шапка */
const NAV: [string, string][] = [["catalog", "Модели"], ["tuning", "Тюнинг"], ["gear", "Экипировка"], ["config", "Конструктор"], ["viewer", "3D и AR"], ["showroom", "Шоурум"]];

export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useApp();
  return <CineSwitch theme={theme} className={className} onChange={(v, from) => switchTheme(v, setTheme, from)} />;
}

export function Header2() {
  const { cart, setCartOpen } = useApp();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const f = () => {
      setSolid(window.scrollY > 40);
    };
    f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f);
  }, []);
  const n = cart.reduce((a, c) => a + c.qty, 0);
  const go = (id: string) => { setOpen(false); scrollToId(id); };
  return (
    <header className={cn("fixed inset-x-0 top-0 z-[60] border-b transition-[background-color,border-color] duration-300", solid || open ? "t-line backdrop-blur-[12px]" : "border-transparent")} style={{ background: solid || open ? "var(--t-head)" : "transparent", color: "var(--t-fg)" }}>
      <div className="container-x flex h-16 items-center gap-4">
        <a href="#top" aria-label="GT, на главную" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Logo size={0.95} /></a>
        <nav className="ml-8 hidden items-center gap-7 lg:flex" aria-label="Разделы">
          {NAV.map(([id, l]) => <button key={id} onClick={() => go(id)} className="min-h-11 cursor-pointer text-[14px] font-semibold opacity-75 transition-opacity hover:opacity-100">{l}</button>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitch />
          <button onClick={() => setCartOpen(true)} className="relative grid min-h-10 min-w-10 cursor-pointer place-items-center rounded-full border t-line" aria-label={`Корзина, товаров: ${n}`}>
            <ShoppingBag size={18} />
            {n > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-flare px-1 text-[11px] font-bold text-ink">{n}</span>}
          </button>
          <Cta className="hidden !min-h-10 !px-5 text-sm sm:inline-flex" onClick={() => go("drive")}>Тест-драйв</Cta>
          <button className="grid min-h-10 min-w-10 cursor-pointer place-items-center rounded-full border t-line lg:hidden" aria-expanded={open} aria-label={open ? "Закрыть меню" : "Меню"} onClick={() => setOpen((o) => !o)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
      {open && (
        <nav className="container-x grid gap-1 pb-5 lg:hidden" aria-label="Разделы">
          {[...NAV, ["drive", "Тест-драйв"] as [string, string]].map(([id, l]) => <button key={id} onClick={() => go(id)} className="h-hero min-h-12 cursor-pointer border-b t-line py-2 text-left text-2xl">{l}</button>)}
        </nav>
      )}
    </header>
  );
}

/* ---------------------------------------------------------------- Первый экран: днем Send 19 S, ночью флагман Factory */
type Spec = [number, number, string, string];
const HEROES: Record<Theme, { id: string; label: string; specs: Spec[]; hud: Hud[] }> = {
  day: { id: "gt-send-19s", label: "серия Send / спортивный trail", specs: [[17, 0, "кВт", "пиковая мощность"], [3.24, 2, "кВт·ч", "батарея"], [105, 0, "км/ч", "максимальная скорость"], [140, 0, "км", "запас хода при 30-35 км/ч"]], hud: [{ x: 41, y: 43, w: 17, h: 18, l: "АКБ · 3,24 кВт·ч" }, { x: 44, y: 63, w: 13, h: 14, l: "мотор · 17 кВт пик", b: true }, { x: 60, y: 54, w: 23, h: 40, l: "колесо · 19″" }] },
  night: { id: "gt-send-19f", label: "серия Send / флагман", specs: [[35, 0, "кВт", "пиковая мощность"], [100, 0, "км/ч", "максимальная скорость"], [120, 0, "км", "запас хода при 45 км/ч"], [95, 0, "кг", "снаряженная масса"]], hud: [{ x: 37, y: 40, w: 23, h: 22, l: "рама · кованый алюминий" }, { x: 46, y: 63, w: 11, h: 14, l: "мотор · 35 кВт пик", b: true }, { x: 60, y: 57, w: 22, h: 37, l: "вилка · 220 мм" }] },
};

function Count({ v, dec }: { v: number; dec: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current!; const f = (n: number) => n.toFixed(dec).replace(".", ",");
    if (reduceMotion()) { el.textContent = f(v); return; }
    const o = { a: 0 }; const tw = gsap.to(o, { a: v, duration: 0.9, ease: "power2.out", delay: 0.5, onUpdate: () => { el.textContent = f(o.a); } });
    return () => { tw.kill(); };
  }, [v, dec]);
  return <span ref={ref}>0</span>;
}

export function Hero2() {
  const { theme, t } = useApp();
  const h = HEROES[theme];
  const m = L_BY[h.id];
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reduceMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-in", { y: 26, opacity: 0, stagger: 0.08, duration: 0.9, ease: "power3.out", delay: 0.1 });
      gsap.from(".hero-bike", { x: 80, opacity: 0, duration: 1.2, ease: "power3.out", delay: 0.2 });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <section id="top" ref={root} className="relative isolate overflow-hidden pt-20 sm:pt-24" style={{ color: "var(--t-fg)" }} aria-labelledby="hero-h">
      <HeroBackdrop theme={theme} />
      <div className="container-x relative">
        <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative z-10 max-w-[760px]">
            <p className="hero-in mono t-label">{m.name} / {h.label}</p>
            <h1 id="hero-h" className="hero-in h-hero mt-4 text-[clamp(32px,4.9vw,76px)]">Харизма<br />на электротяге</h1>
            <p className="hero-in t-mute mt-5 max-w-[26rem] text-lg leading-snug">{t("Свои электробайки GT: тест-драйв, сервис и честные цифры.", "Собственные электробайки GT: тест-драйв, сервис и честные цифры.")}</p>
            <div className="hero-in mt-7 flex flex-wrap items-center gap-5">
              <Cta className="!min-h-14 px-8 text-base" onClick={() => scrollToId("drive")}>Записаться на тест-драйв</Cta>
              <button className="min-h-11 cursor-pointer font-semibold underline-offset-4 hover:underline" onClick={() => scrollToId("catalog")}>Вся линейка →</button>
            </div>
          </div>
          <div className="hero-bike relative w-full lg:-ml-[4vw] lg:w-[60vw] lg:max-w-[1120px]">
            <div className="aspect-[16/9]" />
            {(["day", "night"] as Theme[]).map((k) => (
              <div key={k} className={cn("absolute inset-0 transition-opacity duration-700", theme === k ? "opacity-100" : "opacity-0")} aria-hidden={theme !== k}>
                <div className="glow" /><div className="floor" />
                <div className="absolute inset-0 origin-[50%_93%] scale-[1.12]">
                  <div className="bike-idle absolute inset-0">
                    <img src={studio(L_BY[HEROES[k].id].n)} alt={theme === k ? `${L_BY[HEROES[k].id].name}, фото в профиль` : ""} className="absolute inset-0 h-full w-full object-contain" fetchPriority={k === theme ? "high" : "low"} />
                    <Tracker boxes={HEROES[k].hud} run={theme === k} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <dl key={theme} className="grid grid-cols-2 gap-y-6 border-t t-line pb-14 pt-6 sm:grid-cols-4">
          {h.specs.map(([v, dec, u, l]) => (
            <div key={l}>
              <dd className="font-display text-[clamp(28px,3.6vw,52px)] leading-none"><Count v={v} dec={dec} /> <span className="text-[0.48em]">{u}</span></dd>
              <dt className="mono t-mute mt-3">{l}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Каталог как у Zero: профиль, один масштаб, клик раскрывает коллаж */
export function Catalog() {
  const { t } = useApp();
  const [grp, setGrp] = useState<(typeof GROUPS)[number]["key"]>("all");
  const list = useMemo(() => (grp === "all" ? LINEUP : LINEUP.filter((m) => m.group === grp)), [grp]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduceMotion() || !ref.current) return;
    gsap.fromTo(ref.current.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.03, duration: 0.5, ease: "power3.out", clearProps: "transform" });
    const tm = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => clearTimeout(tm);
  }, [grp]);
  return (
    <section id="catalog" className="t-zone border-t t-line py-20 sm:py-28" aria-labelledby="cat-h">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mono t-label">линейка GT / 20 моделей</p>
            <h2 id="cat-h" className="h-hero mt-3 text-[clamp(36px,5vw,76px)]">Шесть серий,<br />одна марка</h2>
          </div>
        </div>
        <div className="sticky top-16 z-20 -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 py-2 sm:static sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:py-0" style={{ background: "var(--t-bg)" }} role="tablist" aria-label="Серии">
          {GROUPS.map((g) => <button key={g.key} role="tab" aria-selected={grp === g.key} className="t-chip min-h-10 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 text-sm font-semibold" onClick={() => setGrp(g.key)}>{g.ru}</button>)}
        </div>
        <div ref={ref} className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => <LCard key={m.id} m={m} />)}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Сборка: 6 слоев фото сходятся по прокрутке */
const LAYERS: { k: string; x: number; y: number }[] = [
  { k: "rear", x: -15, y: 0 },
  { k: "front", x: 15, y: 0 },
  { k: "fork", x: 10, y: -14 },
  { k: "power", x: 0, y: 13 },
  { k: "body", x: -2, y: -17 },
];
const STEPS: [string, string, string][] = [
  ["01", "Заднее колесо", "18 дюймов, шины с шашками"],
  ["02", "Переднее колесо", "19 дюймов, гидравлический тормоз"],
  ["03", "Вилка 220 мм", "полный ход для бездорожья"],
  ["04", "Мотор и батарея", "35 кВт в пике, система 109 В"],
  ["05", "Пластик и седло", "высота седла 880 мм"],
  ["06", "Кованая рама", "алюминий, 95 кг снаряженная масса"],
];

export function BuildScroll() {
  const { t } = useApp();
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!root.current || reduceMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: () => "+=" + window.innerHeight * (window.innerWidth < 768 ? 1.6 : 2.2), pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true } });
      tl.fromTo("[data-l=frame]", { opacity: 0.5, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, 0);
      LAYERS.forEach((l, i) => tl.fromTo(`[data-l=${l.k}]`, { xPercent: l.x, yPercent: l.y }, { xPercent: 0, yPercent: 0, duration: 1, ease: "power3.inOut" }, 0.1 + i * 0.16));
      STEPS.forEach((_, i) => tl.fromTo(`[data-step="${i}"]`, { opacity: 0.3 }, { opacity: 1, duration: 0.25 }, 0.25 + i * 0.22));
      tl.fromTo(".build-bar", { scaleX: 0 }, { scaleX: 1, ease: "none", duration: tl.duration() }, 0);
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={root} id="build" className="dark-zone relative isolate h-[100svh] min-h-[600px] overflow-hidden bg-ink text-frost" aria-labelledby="build-h">
      <CellsBackdrop />
      <div className="container-x flex h-full flex-col pb-6 pt-20 sm:pt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono text-sky">сборка / GT Send 19 Factory</p>
            <h2 id="build-h" className="h-hero mt-3 text-[clamp(30px,4.4vw,66px)]">{t("Смотри, из чего", "Посмотрите, из чего")}<br />собран флагман</h2>
          </div>
          <p className="max-w-xs text-frost/70">{t("Прокручивай: байк соберется из шести узлов.", "Прокрутите: байк соберется из шести узлов.")}</p>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <div className="relative aspect-[16/9]" style={{ width: "min(100%, calc((100svh - 380px) * 1.7778))" }}>
            <div className="build-glow absolute inset-[10%_12%_12%] rounded-full blur-[70px]" aria-hidden="true" />
            <div className="build-floor absolute bottom-[5%] left-1/2 h-[6%] w-[62%] -translate-x-1/2 rounded-full blur-[14px]" aria-hidden="true" />
            {["frame", ...LAYERS.map((l) => l.k)].map((k) => (
              <img key={k} data-l={k} src={`${import.meta.env.BASE_URL}build/${k}.webp`} alt={k === "frame" ? "GT Send 19 Factory собирается из узлов" : ""} className="absolute inset-0 h-full w-full object-contain will-change-transform" />
            ))}
          </div>
        </div>
        <ol className="mt-10 grid grid-cols-3 gap-x-4 gap-y-3 border-t border-frost/15 pt-4 lg:grid-cols-6">
          {STEPS.map(([n, h, p], i) => (
            <li key={n} data-step={i}>
              <span className="mono text-flare">{n}</span>
              <h3 className="mt-1 font-semibold leading-tight">{h}</h3>
              <p className="hidden text-sm text-frost/60 lg:block">{p}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="build-bar absolute bottom-0 left-0 h-[2px] w-full origin-left bg-flare" />
    </section>
  );
}

/* ---------------------------------------------------------------- Бегущая строка GT: разбавляет ритм между блоками */
const TICK = ["Spark", "питбайки 12-17″", "Send", "trail 19″", "Ridge", "эндуро 21″", "Pulse", "Drift", "Grand", "до 35 кВт пик", "тест-драйв в Ростове"];
export function Ticker() {
  const row = (k: string) => (
    <div key={k} className="flex shrink-0 items-center" aria-hidden={k === "b"}>
      {TICK.map((w, i) => (
        <span key={i} className="flex items-center gap-6 pr-6">
          {i % 2 === 0 ? <span className="h-hero text-[clamp(22px,2.6vw,40px)]">{w}</span> : <span className="mono text-frost/60">{w}</span>}
          <span className="gt-plate text-[13px] text-flare">GT</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="dark-zone relative overflow-hidden border-y border-frost/10 bg-ink py-5 text-frost" role="marquee" aria-label="Серии GT: Spark, Send, Ridge, Pulse, Drift, Grand">
      <div className="ticker">{row("a")}{row("b")}</div>
    </div>
  );
}
