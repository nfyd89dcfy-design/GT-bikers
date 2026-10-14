import { useEffect } from "react";
import { AppProvider, useApp } from "@/lib/state";
import { ScrollTrigger } from "@/lib/gsap";
import { Cursor } from "@/components/cursor";
import { Gate, Header, Hero } from "@/components/top";
import { Assembly, Lineup, Perks } from "@/components/lineup";
import { Viewer3D } from "@/components/viewer";
import { Compare, Configurator, Quiz } from "@/components/tools";
import { Showroom } from "@/components/showroom";
import { CartDrawer, Drive, Footer, Media, Service } from "@/components/media";

const WORDS = ["drop", "roost", "send it", "lite", "pro", "ultra", "custom", "build", "e-rizz"];

function Marquee() {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="overflow-hidden border-y border-ink/25 bg-flare py-3 text-ink" aria-hidden="true">
      <div className="marq-track">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0">
            {row.map((w, i) => <span key={i} className="font-display px-6 text-2xl font-extrabold uppercase sm:text-3xl">{w} <span className="px-3">/</span></span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function Toast() {
  const { toast } = useApp();
  return <div role="status" aria-live="polite" className={"fixed bottom-5 left-1/2 z-[300] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-frost shadow-xl transition " + (toast ? "opacity-100" : "pointer-events-none opacity-0")}>{toast}</div>;
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
      <a href="#lineup" className="sr-only-x focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[500] focus:rounded-full focus:bg-flare focus:px-4 focus:py-2">К контенту</a>
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Lineup />
        <Assembly />
        <Perks />
        <Viewer3D />
        <Configurator />
        <Quiz />
        <Compare />
        <Showroom />
        <Media />
        <Service />
        <Drive />
      </main>
      <Footer />
      <CartDrawer />
      <Toast />
      <Gate />
      <Cursor />
    </>
  );
}
export default function App() { return <AppProvider><Page /></AppProvider>; }
