import { useId } from "react";
import { cn } from "@/lib/utils";
import { MARK_D, STROKES, WORD_D } from "./logo-paths";

/* Логотип GREEN TRAIL (20.10): рукописный знак GT и подпись GREEN TRAIL.
   Цвет берется из currentColor, на темном фоне знак сам светлеет.
   mode="draw": знак прорисовывается штрихами в порядке письма (маска со stroke-dashoffset),
   потом проявляется подпись. Тайминги в index.css (.sig-*). */
export { MARK_D } from "./logo-paths";
type Mode = "static" | "draw" | "hidden";
/* задержка и длительность каждого штриха, с: G, внутренний штрих G, ножка T, перекладина T */
const TIMING: [number, number][] = [[0, 0.62], [0.6, 0.22], [0.8, 0.3], [1.06, 0.36]];
const VB_MARK = "165 350 925 468";
const VB_LOCKUP = "165 350 925 550";

function Mark({ mode, id }: { mode: Mode; id: string }) {
  if (mode !== "draw") return <path d={MARK_D} fill="currentColor" fillRule="evenodd" />;
  return (
    <>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">
          {STROKES.map((d, i) => (
            <path key={i} d={d} pathLength={1} className="sig-stroke" fill="none" stroke="#fff" strokeWidth={100} strokeLinecap="butt" strokeLinejoin="round"
              style={{ ["--sd" as string]: `${TIMING[i][0]}s`, ["--sl" as string]: `${TIMING[i][1]}s` }} />
          ))}
        </mask>
      </defs>
      <path d={MARK_D} fill="currentColor" fillRule="evenodd" mask={`url(#${id})`} />
      {/* страховка: в конце знак показан целиком, даже если маска где-то не докрыла */}
      <path d={MARK_D} fill="currentColor" fillRule="evenodd" className="sig-full" />
    </>
  );
}

/** Знак GT без подписи. Ширина задается классом. */
export function GTMark({ className, title, mode = "static" }: { className?: string; title?: string; mode?: Mode }) {
  const id = "sig" + useId().replace(/[:«»]/g, "");
  return (
    <svg viewBox={VB_MARK} className={cn("block h-auto", mode === "hidden" && "opacity-0", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <Mark mode={mode === "hidden" ? "static" : mode} id={id} />
    </svg>
  );
}

/** Полный логотип: знак и подпись GREEN TRAIL. */
export function GTLockup({ className, title, mode = "static" }: { className?: string; title?: string; mode?: Mode }) {
  const id = "sig" + useId().replace(/[:«»]/g, "");
  return (
    <svg viewBox={VB_LOCKUP} className={cn("block h-auto", mode === "hidden" && "opacity-0", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <Mark mode={mode === "hidden" ? "static" : mode} id={id} />
      <path d={WORD_D} fill="currentColor" fillRule="evenodd" className={mode === "draw" ? "sig-word" : undefined} />
    </svg>
  );
}

/** Логотип в шапке: только знак. size в rem задает масштаб. */
export function Logo({ size = 1, className, mode = "static" }: { size?: number; className?: string; mode?: Mode }) {
  return (
    <span className={cn("inline-flex items-center", className)} style={{ fontSize: `${size}rem` }}>
      <GTMark className="w-[4.2em]" mode={mode} />
    </span>
  );
}
