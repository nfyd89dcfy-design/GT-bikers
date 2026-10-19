import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { BikeView, Variant } from "@/lib/bike3d";
import { cn } from "@/lib/utils";

export type { Variant } from "@/lib/bike3d";
export interface BikeApi { setYaw(v: number): void; setPitch(v: number): void; setSway(v: number): void }
const isTouch = () => typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
const reduce = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

interface Props { variant: Variant; paint?: string; yaw?: number; pitch?: number; sway?: number; interactive?: boolean; className?: string; label?: string; spin?: number; poster?: string }

/** Живая 3D-модель байка. Создается лениво при приближении к экрану, рендер на паузе вне экрана. */
export const Bike3D = forwardRef<BikeApi, Props>(function Bike3D({ variant, paint, yaw = -0.55, pitch = 0.14, sway = 0.18, interactive, className, label, spin = 0.35, poster }, ref) {
  const cv = useRef<HTMLCanvasElement>(null);
  const view = useRef<BikeView | null>(null);
  const [on, setOn] = useState(false);
  const [shown, setShown] = useState(false);
  /* текущие параметры: если модель успели переключить, пока грузился 3D-модуль, создаем вид уже с новой */
  const first = useRef({ variant, paint, yaw, pitch, sway, interactive, spin });
  first.current = { ...first.current, variant, paint };
  useImperativeHandle(ref, () => ({ setYaw: (v) => view.current?.setYaw(v), setPitch: (v) => view.current?.setPitch(v), setSway: (v) => view.current?.setSway(v) }), []);
  useEffect(() => {
    const el = cv.current!; let dead = false;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: "600px" });
    io.observe(el);
    return () => { dead = true; io.disconnect(); view.current?.dispose(); view.current = null; void dead; };
  }, []);
  useEffect(() => {
    if (!on || view.current) return;
    let dead = false; const f = first.current;
    import("@/lib/bike3d").then((m) => {
      if (dead || !cv.current) return;
      const g = first.current;
      view.current = m.createBikeView(cv.current, { ...f, variant: g.variant, paint: g.paint, sway: reduce() ? 0 : f.sway, spin: reduce() ? 0 : f.spin, lod: isTouch() ? "lo" : "hi", interactive: f.interactive && !isTouch(), onReady: (ok) => setShown(ok) });
    });
    return () => { dead = true; };
  }, [on]);
  const mounted = useRef(false);
  useEffect(() => { if (!mounted.current) { mounted.current = true; return; } view.current?.setVariant(variant, paint); }, [variant, paint]);
  useEffect(() => { view.current?.setPitch(pitch); }, [pitch]);
  const cvEl = <canvas ref={cv} role="img" aria-label={label ?? "3D-модель байка GT"} className={cn("block w-full", className)} style={{ touchAction: "pan-y" }} />;
  if (!poster) return cvEl;
  /* постер: готовый кадр модели, виден, пока грузится или пересобирается 3D */
  return (
    <>
      <img src={poster} alt="" aria-hidden="true" className={cn("pointer-events-none object-contain transition-opacity duration-300", className, shown ? "opacity-0" : "opacity-100")} />
      {cvEl}
    </>
  );
});

/** Превью-картинка: рендер 3D-модели в PNG (корзина, сравнение, карточки). */
const mem = new Map<string, string>();
export function BikeThumb({ variant, paint, yaw = -0.55, w = 480, h = 320, className, alt }: { variant: Variant; paint?: string; yaw?: number; w?: number; h?: number; className?: string; alt?: string }) {
  const key = `${variant}|${w}|${h}|${yaw}|${paint ?? ""}`;
  const [src, setSrc] = useState(mem.get(key) ?? "");
  useEffect(() => {
    if (mem.has(key)) { setSrc(mem.get(key)!); return; }
    let dead = false;
    import("@/lib/bike3d").then((m) => m.renderPreview(variant, { w, h, yaw, paint })).then((u) => { mem.set(key, u); if (!dead) setSrc(u); });
    return () => { dead = true; };
  }, [key]); // eslint-disable-line
  return src ? <img src={src} alt={alt ?? `3D-рендер ${variant}`} className={className} width={w} height={h} /> : <div className={cn("animate-pulse", className)} style={{ aspectRatio: `${w}/${h}` }} role="img" aria-label="Рендер загружается" />;
}

/** Синхронный доступ к закешированному превью для корзины: возвращает data URL после рендера. */
export async function previewUrl(variant: Variant, w = 160, h = 110, paint?: string): Promise<string> {
  const key = `${variant}|${w}|${h}|-0.55|${paint ?? ""}`;
  if (mem.has(key)) return mem.get(key)!;
  const m = await import("@/lib/bike3d"); const u = await m.renderPreview(variant, { w, h, paint }); mem.set(key, u); return u;
}
