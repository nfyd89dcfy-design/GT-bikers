import { useEffect, useRef } from "react";
import { Check, MapPin, Wrench, Truck, PaintBucket, Gauge } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useApp, reduceMotion } from "@/lib/state";
import { GlowCard } from "./ui/spotlight-card";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { BlockGrid } from "./shaders";
import { Bike3D, type BikeApi } from "./bike";
import { cn } from "@/lib/utils";
import { photo } from "@/lib/data";

/* ---------------------------------------------------------------- Assembly (3D, scroll) */
const STEPS = [
  ["Колеса и тормоза", "19/18, шины с шашками, гидравлика 220/203 мм"],
  ["Рама и батарея", "Батарея 72 В 60 А·ч в корпусе с охлаждением"],
  ["Вилка и руль", "Перевернутая вилка, ход 200 мм, широкий руль"],
  ["Мотор и подвеска", "6 кВт номинал, 17 кВт пик, моноамортизатор 208 мм"],
];
const CALLS = [
  { l: "батарея 4,32 кВт·ч", x: 50, y: 52, at: 0.52 },
  { l: "пик 17 кВт", x: 44, y: 70, at: 0.6 },
  { l: "ход вилки 200 мм", x: 70, y: 36, at: 0.68 },
  { l: "110 км/ч / 120 км", x: 24, y: 40, at: 0.76 },
];

export function Assembly() {
  const { t } = useApp();
  const root = useRef<HTMLElement>(null);
  const bike = useRef<BikeApi>(null);
  useEffect(() => {
    if (reduceMotion() || !root.current) {
      root.current?.querySelectorAll<HTMLElement>(".asm-call").forEach((e) => (e.style.opacity = "1"));
      return;
    }
    const y = { v: 1.0 };
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ wide: "(min-width: 1024px)", narrow: "(max-width: 1023px)" }, (c) => {
        const wide = c.conditions!.wide;
        const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: wide ? { trigger: root.current, start: "top top", end: "+=1500", scrub: 1.1, pin: true, anticipatePin: 1 } : { trigger: root.current, start: "top 80%", end: "bottom 30%", scrub: 1.1 } });
        tl.fromTo(y, { v: 1.0 }, { v: -0.5, duration: 0.55, onUpdate: () => bike.current?.setYaw(y.v) }, 0)
          .to(y, { v: -0.7, duration: 0.45, onUpdate: () => bike.current?.setYaw(y.v) }, 0.55);
        CALLS.forEach((c2, i) => tl.fromTo(`.asm-call-${i}`, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.08, ease: "power2.out" }, c2.at));
        STEPS.forEach((_, i) => tl.fromTo(`.asm-step-${i}`, { opacity: 0.35 }, { opacity: 1, duration: 0.05 }, [0.02, 0.18, 0.34, 0.5][i]));
        tl.to(".asm-bar", { scaleX: 1, duration: 1 }, 0);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="build" ref={root} className="dark-zone relative isolate overflow-hidden py-20 lg:flex lg:h-[100svh] lg:min-h-[680px] lg:flex-col lg:py-0 lg:pt-20" aria-labelledby="build-h">
      <BlockGrid a="#07080a" b="#20252c" line="#59616b" gain={0.9} cells={18} rotation={45} lineAmt={0.2} react={0.6} seed={5} className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-70" />
      <div className="container-x relative flex flex-1 flex-col">
        <Eyebrow n="04" dark>конструкция / скролль</Eyebrow>
        <h2 id="build-h" className="font-display text-[clamp(28px,4.6vw,72px)] font-extrabold uppercase leading-[0.95]">
          {t("Смотри, из чего собран", "Из чего собран")} <span className="chrome-text">GT Send 19 R</span>
        </h2>
        <div className="relative mt-2 flex-1">
          <div className="relative mx-auto w-full max-w-[1500px] lg:absolute lg:inset-0">
            <Bike3D ref={bike} variant="sport" yaw={1.0} pitch={0.1} sway={0} label="GT Send 19 R: 3D-модель, вращается при прокрутке" className="h-[300px] sm:h-[420px] lg:h-full" />
            {CALLS.map((c, i) => (
              <div key={c.l} className={cn("asm-call pointer-events-none absolute z-10 hidden items-center gap-2 sm:flex", `asm-call-${i}`)} style={{ left: `${c.x}%`, top: `${c.y}%` }}>
                <span className="relative grid h-3 w-3 place-items-center"><span className="ping absolute h-3 w-3 rounded-full bg-flare/70" /><span className="h-2 w-2 rounded-full bg-flare" /></span>
                <span className="mono rounded-full bg-deep/85 px-3 py-1 text-frost">{c.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 grid gap-3 pb-6 sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s[0]} className={cn("asm-step border-t border-frost/30 pt-2", `asm-step-${i}`)}>
              <div className="mono text-sky">0{i + 1}</div>
              <div className="font-display text-sm font-bold uppercase sm:text-base">{s[0]}</div>
              <p className="muted hidden text-sm sm:block">{s[1]}</p>
            </div>
          ))}
          <div className="col-span-full h-1 overflow-hidden rounded bg-frost/15" aria-hidden="true"><div className="asm-bar h-full origin-left scale-x-0 bg-flare" style={reduceMotion() ? { transform: "scaleX(1)" } : undefined} /></div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Perks */
const PERKS = [
  { icon: MapPin, ph: "garage_moody", h: "Шоурум", ty: "Приходи, потрогай, сядь. Ростов-на-Дону, прототип 3D-тура ниже.", vy: "Приезжайте, посмотрите и сядьте на технику. Ростов-на-Дону, 3D-тур ниже.", span: "lg:col-span-7" },
  { icon: Gauge, ph: "backlit_dust", h: "Тест-драйв", ty: "Кати до покупки: выбираешь город, дату и модель.", vy: "Прокатитесь до покупки: выберите город, дату и модель.", span: "lg:col-span-5" },
  { icon: Wrench, ph: "garage_service", h: "Сервис", ty: "Диагностика, батареи, расходники. Свой склад запчастей.", vy: "Диагностика, обслуживание батарей, расходники. Собственный склад запчастей.", span: "lg:col-span-4" },
  { icon: Truck, ph: "night_road", h: "Доставка", ty: "Москва, Ростов, Краснодарский край. Опт отдельным рейсом.", vy: "Москва, Ростов-на-Дону, Краснодарский край. Оптовые партии отдельным рейсом.", span: "lg:col-span-4" },
  { icon: PaintBucket, ph: "workshop", h: "Custom", ty: "Цвет, наклейки, грипсы, батарея: собери свой build.", vy: "Цвет, наклейки, аксессуары, батарея: соберите свою конфигурацию.", span: "lg:col-span-4" },
];
export function Perks() {
  const { t } = useApp();
  return (
    <section className="dark-zone relative py-24 sm:py-36" aria-labelledby="perks-h">
      <div className="container-x">
        <Reveal>
          <Eyebrow n="05" dark>почему мы</Eyebrow>
          <H2><span id="perks-h">{t("Не просто", "Больше,")}</span> <span className="text-sky">{t("магазин", "чем магазин")}</span></H2>
        </Reveal>
        <div className="mt-10 grid gap-4 lg:grid-cols-12">
          {PERKS.map((p) => (
            <Reveal key={p.h} className={p.span}>
              <GlowCard customSize glowColor="flare" className="touch-pan-y! h-[300px] !p-0 sm:h-[340px]">
                <div className="relative row-span-2 h-full overflow-hidden rounded-2xl">
                  <img src={photo(p.ph, true)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/30 to-transparent" />
                  <div className="relative flex h-full flex-col justify-end p-5">
                    <p.icon className="mb-3 text-sky" size={28} aria-hidden="true" />
                    <h3 className="font-display text-2xl font-extrabold uppercase">{p.h}</h3>
                    <p className="mt-1 max-w-md text-frost/90">{t(p.ty, p.vy)}</p>
                  </div>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
        <ul className="mt-10 grid gap-3 text-sm sm:grid-cols-3">
          {["Розница и опт", "Москва, Ростов-на-Дону, Краснодарский край", "Байк под ключ: подбор, сборка, выдача"].map((x) => (
            <li key={x} className="flex items-center gap-2 border-t border-frost/25 pt-3"><Check size={16} className="text-sky" aria-hidden="true" />{x}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
