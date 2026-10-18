import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { ArrowRight } from "lucide-react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { reduceMotion, useApp, type Theme } from "@/lib/state";
import { cn } from "@/lib/utils";

/* ================================================================
   Эффекты v3: зерно, подсветка рамок, кинематографичная смена темы,
   кнопки с заливкой, HUD-трекер, шейдеры (WebGPU, с CSS-запасом).
   ================================================================ */

/** WebGPU есть и анимации не отключены. Шейдеры грузим только тогда. */
/** ?fx=off в адресе выключает все шейдеры (на случай слабого ноутбука на показе). */
const fxOff = () => { try { const q = new URLSearchParams(location.search).get("fx"); if (q) localStorage.setItem("erizz-fx", q); return (q ?? localStorage.getItem("erizz-fx")) === "off"; } catch { return false; } };
export const gpuOk = () => typeof navigator !== "undefined" && "gpu" in navigator && !reduceMotion() && innerWidth >= 900 && !fxOff();

/** Если шейдер упадет в рендере, страница не должна побелеть: ловим ошибку и молча убираем эффект. */
class Safe extends Component<{ children: ReactNode; fallback?: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e: unknown) { console.info("[fx] эффект отключен после ошибки:", e); }
  render() { return this.state.err ? (this.props.fallback ?? null) : this.props.children; }
}
const finePointer = () => typeof matchMedia !== "undefined" && matchMedia("(pointer: fine)").matches;

const FX = {
  Cursor: lazy(() => import("./shaderfx").then((m) => ({ default: m.CursorFlow }))),
  Hero: lazy(() => import("./shaderfx").then((m) => ({ default: m.HeroSky }))),
  Cells: lazy(() => import("./shaderfx").then((m) => ({ default: m.CellsBg }))),
  Metal: lazy(() => import("./shaderfx").then((m) => ({ default: m.MetalShape }))),
  Paint: lazy(() => import("./shaderfx").then((m) => ({ default: m.PaintBg }))),
};

/** Монтирует детей, только когда блок рядом с экраном: GPU не греется на всей странице сразу. */
function Near({ children, margin = "200px" }: { children: ReactNode; margin?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: margin });
    io.observe(el); return () => io.disconnect();
  }, [margin]);
  return <div ref={ref} className="absolute inset-0">{on && children}</div>;
}

const off = (set: (v: boolean) => void) => (r?: unknown) => { console.info("[fx] шейдер выключен:", r); set(true); };

function useGpu() {
  const [ok, setOk] = useState(false);
  useEffect(() => { setOk(gpuOk()); }, []);
  return ok;
}

/** Курсор-шлейф как ChromaFlow: только мышь, только WebGPU. */
export function FxCursor({ theme }: { theme: Theme }) {
  const [ok, setOk] = useState(false);
  const [dead, setDead] = useState(false);
  useEffect(() => { setOk(gpuOk() && finePointer()); }, []);
  if (!ok || dead) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[250]" style={{ mixBlendMode: theme === "night" ? "screen" : "multiply" }}>
      <Safe><Suspense fallback={null}><FX.Cursor theme={theme} onFail={off(setDead)} /></Suspense></Safe>
    </div>
  );
}

/** Фон первого экрана: CSS-градиент с зерном всегда, поверх живой шейдер, если есть WebGPU. */
export function HeroBackdrop({ theme }: { theme: Theme }) {
  const ok = useGpu();
  const [dead, setDead] = useState(false);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className={cn("absolute inset-0 transition-opacity duration-700", "bg-silk", theme === "day" ? "opacity-100" : "opacity-0")} />
      <div className={cn("absolute inset-0 transition-opacity duration-700", "bg-horizon", theme === "night" ? "opacity-100" : "opacity-0")} />
      {ok && !dead && <Near><Safe><Suspense fallback={null}><FX.Hero theme={theme} onFail={off(setDead)} /></Suspense></Safe></Near>}
      <div className="grain absolute inset-0" />
    </div>
  );
}

/** Ячеистая текстура (WorleyNoise) для темных секций. */
export function CellsBackdrop({ tone = "steel" }: { tone?: "steel" | "flare" }) {
  const { theme } = useApp();
  const ok = useGpu();
  const [dead, setDead] = useState(false);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {ok && !dead && <Near><Safe><Suspense fallback={null}><FX.Cells tone={tone} theme={theme} onFail={off(setDead)} /></Suspense></Safe></Near>}
      <div className="grain absolute inset-0" />
    </div>
  );
}

/** Фигура: жидкий металл / хром / вокселы. Без WebGPU остается CSS-шар. */
export function MetalFigure({ kind, className }: { kind: "liquid" | "chrome" | "voxels"; className?: string }) {
  const ok = useGpu();
  const [dead, setDead] = useState(false);
  return (
    <div aria-hidden="true" className={cn("pointer-events-none relative", className)}>
      {(!ok || dead) && <div className={cn("css-orb absolute inset-[18%]", kind === "voxels" && "css-orb--blocks")} />}
      {ok && !dead && <Near><Safe fallback={<div className="css-orb absolute inset-[18%]" />}><Suspense fallback={<div className="css-orb absolute inset-[18%]" />}><FX.Metal kind={kind} onFail={off(setDead)} /></Suspense></Safe></Near>}
    </div>
  );
}

/** Акварельный градиент для стартового экрана. */
export function PaintBackdrop() {
  const ok = useGpu();
  const [dead, setDead] = useState(false);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="bg-horizon absolute inset-0" />
      {ok && !dead && <Safe><Suspense fallback={null}><FX.Paint onFail={off(setDead)} /></Suspense></Safe>}
      <div className="grain absolute inset-0" />
    </div>
  );
}

/* ---------------------------------------------------------------- Подсветка рамок (как GlowCard, без backdrop-filter) */
const SPOT = ".spot, .btn-solid, .btn-ghost, .t-chip, .chip, .cta";
export function useSpotlight() {
  useEffect(() => {
    if (!finePointer() || reduceMotion()) return;
    const seen = new Set<HTMLElement>();
    const io = new IntersectionObserver((es) => es.forEach((e) => { const el = e.target as HTMLElement; if (e.isIntersecting) seen.add(el); else { seen.delete(el); el.style.setProperty("--so", "0"); } }));
    const scan = () => document.querySelectorAll<HTMLElement>(SPOT).forEach((el) => { if (!el.dataset.spot) { el.dataset.spot = "1"; io.observe(el); } });
    scan();
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    let x = -1e4, y = -1e4, raf = 0;
    const tick = () => {
      raf = 0;
      seen.forEach((el) => {
        const r = el.getBoundingClientRect();
        const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom);
        const d = Math.hypot(dx, dy);
        el.style.setProperty("--mx", `${(x - r.left).toFixed(1)}px`);
        el.style.setProperty("--my", `${(y - r.top).toFixed(1)}px`);
        el.style.setProperty("--so", d > 220 ? "0" : (1 - d / 220).toFixed(3));
      });
    };
    const move = (e: PointerEvent) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(tick); };
    const scroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    document.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    return () => { io.disconnect(); mo.disconnect(); document.removeEventListener("pointermove", move); window.removeEventListener("scroll", scroll); cancelAnimationFrame(raf); };
  }, []);
}

/* ---------------------------------------------------------------- Кнопка CTA: точка разливается в заливку, текст уезжает, появляется стрелка */
export function Cta({ children, className, variant = "flare", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "flare" | "ink" | "frost" }) {
  return (
    <button {...p} className={cn("cta group", `cta--${variant}`, className)}>
      <span className="cta__dot" aria-hidden="true" />
      <span className="cta__a">{children}</span>
      <span className="cta__b" aria-hidden="true">{children}<ArrowRight size={18} /></span>
    </button>
  );
}

/* ---------------------------------------------------------------- Кинематографичная смена темы: круг раскрывается от переключателя */
export function switchTheme(next: Theme, set: (t: Theme) => void, from?: { x: number; y: number }) {
  const d = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
  const apply = () => { document.documentElement.dataset.theme = next; flushSync(() => set(next)); };
  if (!d.startViewTransition || reduceMotion()) { set(next); return; }
  const x = from?.x ?? innerWidth - 80, y = from?.y ?? 32;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.documentElement.classList.add("vt-run");
  const vt = d.startViewTransition(apply);
  vt.ready.then(() => {
    const easing = "cubic-bezier(.76,0,.24,1)";
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 1000, easing, pseudoElement: "::view-transition-new(root)" },
    );
    const ring = document.createElement("div");
    ring.className = "vt-ring" + (next === "night" ? " vt-ring--night" : "");
    ring.style.left = `${x}px`; ring.style.top = `${y}px`;
    document.body.appendChild(ring);
    ring.animate([{ width: "0px", height: "0px", opacity: 1 }, { width: `${r * 2}px`, height: `${r * 2}px`, opacity: 0.9, offset: 0.85 }, { width: `${r * 2}px`, height: `${r * 2}px`, opacity: 0 }], { duration: 1000, easing }).finished.then(() => ring.remove());
  }).catch(() => {});
  vt.finished.finally(() => document.documentElement.classList.remove("vt-run"));
}

/** Тумблер день/ночь: солнце превращается в луну, на дорожке облака и звезды. */
export function CineSwitch({ theme, onChange, className }: { theme: Theme; onChange: (t: Theme, from: { x: number; y: number }) => void; className?: string }) {
  const night = theme === "night";
  return (
    <button
      role="switch" aria-checked={night} aria-label={night ? "Ночное оформление, включить дневное" : "Дневное оформление, включить ночное"}
      className={cn("cine", night && "cine--night", className)}
      onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); onChange(night ? "day" : "night", { x: r.left + r.width / 2, y: r.top + r.height / 2 }); }}
    >
      <span className="cine__stars" aria-hidden="true"><i /><i /><i /><i /><i /></span>
      <span className="cine__clouds" aria-hidden="true"><i /><i /></span>
      <span className="cine__knob" aria-hidden="true"><span className="cine__crater" /><span className="cine__crater" /><span className="cine__crater" /></span>
    </button>
  );
}

/* ---------------------------------------------------------------- HUD-трекер поверх фото (в духе ObjectTracker) */
export type Hud = { x: number; y: number; w: number; h: number; l: string; b?: boolean };
export function Tracker({ boxes, run }: { boxes: Hud[]; run: boolean }) {
  return (
    <div aria-hidden="true" className={cn("hud pointer-events-none absolute inset-0 hidden lg:block", run && "hud--on")}>
      <div className="hud__scan" />
      {boxes.map((b, i) => (
        <div key={b.l} className="hud__box" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, ["--i" as string]: i }}>
          <i /><i /><i /><i />
          <span className={cn("hud__label mono", b.b && "hud__label--b")}>{b.l}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- Заголовки: строки выезжают из-под маски при прокрутке */
export function useHeadingReveal() {
  useEffect(() => {
    if (reduceMotion()) return;
    const splits: SplitText[] = [];
    const tm = setTimeout(() => {
      document.querySelectorAll<HTMLElement>("main section:not(#top) .h-hero, main section:not(#top) h2.font-display").forEach((el) => {
        if (el.dataset.split) return; el.dataset.split = "1";
        const s = new SplitText(el, { type: "lines", mask: "lines" });
        splits.push(s);
        gsap.from(s.lines, { yPercent: 105, duration: 0.9, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 88%", once: true }, onComplete: () => s.revert() });
      });
      ScrollTrigger.refresh();
    }, 400);
    return () => { clearTimeout(tm); splits.forEach((s) => s.revert()); };
  }, []);
}
