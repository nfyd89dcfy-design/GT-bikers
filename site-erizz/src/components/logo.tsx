import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/* Знак GT по мотивам нынешнего: квадратная рамка, засечный G, буква T выходит за рамку справа внизу.
   Выбран вариант 4 «Спорт» (18.10). 5 вариантов, на показе переключаются адресом ?logo=1…5 (запоминается в браузере). */
type V = { font: string; fw: number; frame: string; g: string; t: string; sw?: number; gap?: number; outline?: number; gs?: number; gy?: number; ts?: number; ty?: number; tx?: number };
const GOLD = "#c8a24a";
export const LOGOS: Record<number, { name: string; v: V }> = {
  1: { name: "Наследие", v: { font: "'Playfair Display', serif", fw: 900, frame: GOLD, g: GOLD, t: GOLD } },
  2: { name: "Наследие + акцент", v: { font: "'Playfair Display', serif", fw: 900, frame: "currentColor", g: "currentColor", t: "var(--color-flare)" } },
  3: { name: "Строгий Bodoni", v: { font: "'Bodoni Moda', serif", fw: 800, frame: "currentColor", g: "currentColor", t: "currentColor", sw: 6 } },
  4: { name: "Спорт", v: { font: "'Archivo Black', sans-serif", fw: 400, frame: "currentColor", g: "currentColor", t: "var(--color-flare)", sw: 12, gs: 150, gy: 160, ts: 132, ty: 236, tx: 170 } },
  5: { name: "Контур", v: { font: "'Playfair Display', serif", fw: 900, frame: GOLD, g: GOLD, t: GOLD, outline: 3.4, sw: 3.4, gap: 6 } },
};

const pick = () => {
  try {
    const q = Number(new URLSearchParams(location.search).get("logo"));
    if (LOGOS[q]) { localStorage.setItem("gt-logo", String(q)); return q; }
    const s = Number(localStorage.getItem("gt-logo"));
    return LOGOS[s] ? s : 4;
  } catch { return 4; }
};

export function GTMark({ className, variant, bold }: { className?: string; variant?: number; bold?: boolean }) {
  const [auto] = useState(pick);
  const o = LOGOS[variant ?? auto].v;
  const id = useId().replace(/:/g, "");
  const sw = (o.sw ?? 9) * (bold ? 1.5 : 1), gap = o.gap ?? 7;
  const T = <text x={o.tx ?? 168} y={o.ty ?? 236} fontFamily={o.font} fontWeight={o.fw} fontSize={o.ts ?? 150} textAnchor="middle">T</text>;
  const G = <text x={100} y={o.gy ?? 168} fontFamily={o.font} fontWeight={o.fw} fontSize={o.gs ?? 168} textAnchor="middle">G</text>;
  const paint = (c: string) => (o.outline ? { fill: "none", stroke: c, strokeWidth: o.outline * (bold ? 2 : 1) } : { fill: c });
  return (
    <svg viewBox="0 0 240 262" className={cn("block h-auto", className)} aria-hidden="true">
      <defs>
        <mask id={`m${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="262">
          <rect width="240" height="262" fill="#fff" />
          <g fill="#000" stroke="#000" strokeWidth={gap * 2} strokeLinejoin="round">{T}</g>
        </mask>
      </defs>
      <rect x="22" y="22" width="178" height="178" fill="none" stroke={o.frame} strokeWidth={sw} mask={`url(#m${id})`} />
      <g {...paint(o.g)} mask={`url(#m${id})`}>{G}</g>
      <g {...paint(o.t)}>{T}</g>
    </svg>
  );
}

/** Логотип в шапке: знак + подпись. */
export function Logo({ size = 1, className, sub = true }: { size?: number; className?: string; sub?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)} style={{ fontSize: `${size}rem` }}>
      <GTMark className="w-[2.3em]" />
      {sub && <span className="mono hidden leading-tight sm:block" style={{ fontSize: "10px" }}>GT<br />электробайки</span>}
    </span>
  );
}
