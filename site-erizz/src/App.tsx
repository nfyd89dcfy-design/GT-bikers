import { useEffect } from "react";
import { AppProvider, useApp } from "@/lib/state";
import { ScrollTrigger } from "@/lib/gsap";
import { BoltCursor, ParticleField } from "@/components/effects";
import { Header, Hero, ToneGate } from "@/components/top";
import { Assembly, Perks } from "@/components/lineup";
import { Directions, LineupGrid, PinnedSizes } from "@/components/models";
import { Viewer3D } from "@/components/viewer";
import { Compare, Configurator, Quiz } from "@/components/tools";
import { Delivery } from "@/components/delivery";
import { Showroom } from "@/components/showroom";
import { CartDrawer, Drive, Footer, Media, Service } from "@/components/media";

const WORDS = ["drop", "roost", "send it", "base", "pro", "custom", "build", "e-rizz"];

function Marquee({ reverse, dark }: { reverse?: boolean; dark?: boolean }) {
  const row = [...WORDS, ...WORDS];
  return (
    <div className={"overflow-hidden py-4 " + (dark ? "bg-ink text-frost" : "brushed text-ink")} aria-hidden="true">
      <div className="marq-track" style={reverse ? { animationDirection: "reverse" } : undefined}>
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0">
            {row.map((w, i) => <span key={i} className={"font-display px-6 text-4xl font-extrabold uppercase sm:text-6xl " + (i % 3 === 0 ? "chrome-text-dark" : "")} style={i % 3 === 0 && dark ? { backgroundImage: "linear-gradient(180deg,#fff,#8d97a2 50%,#fff)" } : undefined}>{w}<span className="px-5 text-flare">/</span></span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Воздух между секциями: поле частиц собирается в слово и разлетается от курсора. */
function Space({ word }: { word: string }) {
  return (
    <div className="dark-zone relative h-[44vh] min-h-[260px] overflow-hidden bg-deep" role="presentation">
      <ParticleField text={word} count={3200} className="absolute inset-0 h-full w-full" tones={["#3a4048", "#59616b", "#8d97a2", "#e4e8ec", "#ff4a2b"]} size={1.1} cursorRadius={0.2} />
      <div className="chrome-line absolute inset-x-0 top-0" />
      <div className="chrome-line absolute inset-x-0 bottom-0" />
    </div>
  );
}

function Toast() {
  const { toast } = useApp();
  return <div role="status" aria-live="polite" className={"fixed bottom-5 left-1/2 z-[600] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-frost shadow-xl transition " + (toast ? "opacity-100" : "pointer-events-none opacity-0")}>{toast}</div>;
}

function Page() {
  const { dir, gateOpen } = useApp();
  useEffect(() => {
    const r = () => ScrollTrigger.refresh();
    window.addEventListener("load", r);
    document.fonts?.ready.then(r);
    const t = setTimeout(r, 1200);
    return () => { window.removeEventListener("load", r); clearTimeout(t); };
  }, []);
  useEffect(() => { const t = setTimeout(() => ScrollTrigger.refresh(), 700); return () => clearTimeout(t); }, [dir, gateOpen]);
  return (
    <>
      <a href="#lineup" className="sr-only-x focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[700] focus:rounded-full focus:bg-flare focus:px-4 focus:py-2">К контенту</a>
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Space word="SEND IT" />
        <PinnedSizes />
        <Marquee dark reverse />
        <LineupGrid />
        <Directions />
        <Assembly />
        <Perks />
        <Space word="ROOST" />
        <Viewer3D />
        <Configurator />
        <Quiz />
        <Compare />
        <Delivery />
        <Showroom />
        <Media />
        <Service />
        <Drive />
      </main>
      <Footer />
      <CartDrawer />
      <Toast />
      <ToneGate />
      <BoltCursor />
    </>
  );
}
export default function App() { return <AppProvider><Page /></AppProvider>; }
