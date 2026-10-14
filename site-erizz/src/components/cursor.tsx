import { useEffect, useRef } from "react";
import { reduceMotion } from "@/lib/state";

/** Кастомный курсор из прошлой версии: точка с лерпом, на [data-cursor] вырастает и показывает подпись. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const coarse = matchMedia("(hover: none), (pointer: coarse)").matches;
    if (coarse || reduceMotion()) return;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    const mv = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; c.classList.add("on"); };
    const f = () => { x += (tx - x) * 0.25; y += (ty - y) * 0.25; c.style.transform = `translate(${x}px,${y}px)`; raf = requestAnimationFrame(f); };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest?.("[data-cursor]") as HTMLElement | null;
      if (t) { c.classList.add("big"); c.textContent = t.dataset.cursor || ""; } else { c.classList.remove("big"); c.textContent = ""; }
    };
    const leave = () => c.classList.remove("on");
    window.addEventListener("pointermove", mv);
    document.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(f);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", mv); document.removeEventListener("pointerover", over); document.documentElement.removeEventListener("pointerleave", leave); };
  }, []);
  return <div ref={ref} className="cur" aria-hidden="true" />;
}
