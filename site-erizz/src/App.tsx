import { useEffect } from "react";
import { AppProvider, useApp } from "@/lib/state";
import { ScrollTrigger } from "@/lib/gsap";
import { ToneGate } from "@/components/top";
import { BuildScroll, Catalog, Header2, Hero2 } from "@/components/v2";
import { Directions } from "@/components/models";
import { Viewer3D } from "@/components/viewer";
import { Compare, Configurator, Quiz } from "@/components/tools";
import { Delivery } from "@/components/delivery";
import { Showroom } from "@/components/showroom";
import { CartDrawer, Drive, Footer, Service } from "@/components/media";
import { ARLayer } from "@/components/ar";
import { Atmos } from "@/components/atmos";

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
      <a href="#catalog" className="sr-only-x focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[700] focus:rounded-full focus:bg-flare focus:px-4 focus:py-2">К контенту</a>
      <Header2 />
      <main>
        <Hero2 />
        <Catalog />
        <BuildScroll />
        <Directions />
        <Atmos />
        <Viewer3D />
        <Configurator />
        <Quiz />
        <Compare />
        <Delivery />
        <Showroom />
        <Service />
        <Drive />
      </main>
      <Footer />
      <CartDrawer />
      <Toast />
      <ARLayer />
      <ToneGate />
    </>
  );
}
export default function App() { return <AppProvider><Page /></AppProvider>; }
