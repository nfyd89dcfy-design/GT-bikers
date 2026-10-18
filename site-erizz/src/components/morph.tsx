import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { Flip } from "gsap/Flip";
import { reduceMotion } from "@/lib/state";
import { cn } from "@/lib/utils";

gsap.registerPlugin(Flip);

/**
 * Плитка, которая морфится в полноэкранный вид (gsap Flip, общий элемент).
 * Важно: не класть внутрь элементов с transform / backdrop-filter, иначе position: fixed сломается.
 */
export function MorphTile({ label, className, children, detail, media, onOpen }: { label: string; className?: string; children: ReactNode; detail: ReactNode; media?: ReactNode; onOpen?: () => void }) {
  const fig = useRef<HTMLDivElement>(null);
  const det = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const busy = useRef(false);

  const run = (to: boolean) => {
    const f = fig.current!;
    if (busy.current || f.classList.contains("morph-open") === to) return;
    if (to) onOpen?.();
    const apply = () => { f.classList.toggle("morph-open", to); setOpen(to); document.body.style.overflow = to ? "hidden" : ""; };
    if (reduceMotion()) { apply(); if (to) closeBtn.current?.focus(); else f.focus(); return; }
    busy.current = true;
    const state = Flip.getState(f, { props: "borderRadius" });
    apply();
    Flip.from(state, {
      duration: 0.75, ease: "power3.inOut", scale: false, absolute: false, props: "borderRadius", zIndex: 320,
      onComplete: () => {
        busy.current = false;
        if (to) {
          closeBtn.current?.focus();
          if (det.current) {
            const tiles = det.current.querySelectorAll<HTMLElement>("[data-tile]");
            if (tiles.length) gsap.fromTo(tiles, { y: 40, opacity: 0, scale: 0.96, clipPath: "inset(12% 8% 12% 8% round 18px)" }, { y: 0, opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0% round 16px)", stagger: 0.07, duration: 0.7, ease: "expo.out", clearProps: "clipPath,transform" });
            else gsap.fromTo(det.current.children, { y: 28, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: "power3.out" });
          }
        }
        else f.focus({ preventScroll: true });
      },
    });
  };
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") run(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }); // eslint-disable-line

  return (
    <div className={cn("relative", className)}>
      {open && <div className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-sm" onClick={() => run(false)} aria-hidden="true" />}
      <div
        ref={fig}
        role={open ? "dialog" : "button"}
        aria-modal={open || undefined}
        aria-label={label}
        tabIndex={open ? -1 : 0}
        onClick={() => { if (!open) run(true); }}
        onKeyDown={(e) => { if (!open && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); run(true); } }}
        className="morph group absolute inset-0 overflow-hidden rounded-2xl"
        data-cursor={undefined}
      >
        {media}
        <div className="relative h-full w-full group-[.morph-open]:hidden">{children}</div>
        <div ref={det} className="relative hidden h-full w-full group-[.morph-open]:block">{detail}</div>
        <button
          ref={closeBtn}
          className="absolute right-3 top-3 z-20 hidden h-11 w-11 cursor-pointer place-items-center rounded-full bg-frost text-ink group-[.morph-open]:grid"
          aria-label="Закрыть"
          onClick={(e) => { e.stopPropagation(); run(false); }}
        ><X /></button>
      </div>
    </div>
  );
}
