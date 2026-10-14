import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { reduceMotion } from "@/lib/state";
import { cn } from "@/lib/utils";

export function Reveal({ children, className, delay = 0, y = 36 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduceMotion()) return;
    const el = r.current!;
    const tw = gsap.fromTo(el, { y, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    return () => { tw.scrollTrigger?.kill(); tw.kill(); };
  }, [y, delay]);
  return <div ref={r} className={className}>{children}</div>;
}

export function Eyebrow({ n, children, dark }: { n: string; children: ReactNode; dark?: boolean }) {
  return (
    <p className={cn("mono mb-4 flex items-center gap-3", dark ? "text-aqua" : "text-mute")}>
      <span className="inline-block h-px w-10 bg-current" aria-hidden="true" />
      <span>{n}</span><span>{children}</span>
    </p>
  );
}

export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("font-display text-[clamp(30px,5.2vw,76px)] font-extrabold uppercase leading-[0.95]", className)}>{children}</h2>;
}
