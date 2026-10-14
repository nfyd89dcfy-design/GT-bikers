import { useEffect, useRef } from "react";
import { Check, MapPin, Wrench, Truck, PaintBucket, Gauge } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useApp, reduceMotion } from "@/lib/state";
import { img, photo } from "@/lib/data";
import { GlowCard } from "./ui/spotlight-card";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { Marble } from "./shaders";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Assembly (scroll) */
const PIECES = [
  { f: "asm-body", from: { yPercent: 70, scale: 0.7, opacity: 0 }, at: 0.15, z: 2 },
  { f: "asm-rear-wheel", from: { xPercent: 90, yPercent: 40, rotation: 540, opacity: 0 }, at: 0, z: 3, origin: "83.5% 70.9%" },
  { f: "asm-front-wheel", from: { xPercent: -90, yPercent: 40, rotation: -540, opacity: 0 }, at: 0.05, z: 3, origin: "16.4% 76.2%" },
  { f: "asm-front", from: { xPercent: -60, yPercent: -80, rotation: -18, opacity: 0 }, at: 0.35, z: 4 },
  { f: "asm-seat", from: { xPercent: 60, yPercent: -110, rotation: 22, opacity: 0 }, at: 0.5, z: 4 },
];
const STEPS = [
  ["Колеса", "Колеса с дисковыми тормозами едут на место"],
  ["Рама и батарея", "Рама встает вокруг аккумуляторного блока"],
  ["Вилка и руль", "Подвеска и руль собираются в передний узел"],
  ["Седло и хвост", "Последний штрих, байк готов к drop"],
];
const CALLS = [
  { l: "батарея 2,9-4 кВт·ч", x: 41, y: 52, at: 0.62 },
  { l: "пик 15-20 кВт", x: 57, y: 74, at: 0.7 },
  { l: "подвеска", x: 24, y: 32, at: 0.78 },
  { l: "контроллер Pro", x: 66, y: 22, at: 0.86 },
];

export function Assembly() {
  const { t } = useApp();
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reduceMotion() || !root.current) {
      root.current?.querySelectorAll<HTMLElement>(".asm-call").forEach((e) => (e.style.opacity = "1"));
      return;
    }
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1px)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" }, scrollTrigger: { trigger: root.current, start: "top top", end: "+=2600", scrub: 0.7, pin: true, anticipatePin: 1 } });
        PIECES.forEach((p) => {
          const el = `.asm-${p.f}`;
          tl.from(el, { ...p.from, duration: 0.42, transformOrigin: p.origin || "50% 50%" }, p.at);
        });
        CALLS.forEach((c, i) => tl.fromTo(`.asm-call-${i}`, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.08 }, c.at));
        STEPS.forEach((_, i) => {
          tl.fromTo(`.asm-step-${i}`, { opacity: 0.35 }, { opacity: 1, duration: 0.05 }, [0.05, 0.22, 0.4, 0.55][i]);
        });
        tl.to(".asm-stage", { x: 0, scale: 1.04, duration: 0.2 }, 0.9);
        tl.to(".asm-bar", { scaleX: 1, ease: "none", duration: 1.1 }, 0);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="build" ref={root} className="dark-zone relative isolate h-[100svh] min-h-[640px] overflow-hidden" aria-labelledby="build-h">
      <Marble a="#0e1013" b="#2a2f37" c="#050608" scale={1.8} turb={7} className="absolute inset-0 -z-10 h-full w-full opacity-90" />
      <div className="container-x relative flex h-full flex-col pt-24">
        <Eyebrow n="04" dark>сборка / скролль</Eyebrow>
        <h2 id="build-h" className="font-display text-[clamp(28px,4.6vw,64px)] font-extrabold uppercase leading-[0.95]">
          {t("Смотри, как собирается", "Как собирается")} <span className="chrome-text">GT T19 Pro</span>
        </h2>
        <div className="relative mt-2 flex-1">
          <div className="asm-stage absolute inset-x-0 top-1/2 mx-auto aspect-[900/567] w-[min(94vw,880px,calc((100svh-410px)*1.587))] -translate-y-1/2">
            <img src={img("79bike-falcon-gt-1.webp")} alt="" className="absolute inset-0 h-full w-full opacity-[0.09]" />
            {PIECES.map((p) => (
              <img key={p.f} src={img(`${p.f}.webp`)} alt="" className={cn("absolute inset-0 h-full w-full will-change-transform", `asm-${p.f}`)} style={{ zIndex: p.z }} />
            ))}
            <span className="sr-only-x">Фото GT T19 Pro, собранное из пяти частей: колеса, рама, вилка, седло.</span>
            {CALLS.map((c, i) => (
              <div key={c.l} className={cn("asm-call absolute z-10 flex items-center gap-2", `asm-call-${i}`)} style={{ left: `${c.x}%`, top: `${c.y}%` }}>
                <span className="relative grid h-3 w-3 place-items-center"><span className="ping absolute h-3 w-3 rounded-full bg-flare/70" /><span className="h-2 w-2 rounded-full bg-flare" /></span>
                <span className="mono rounded-full bg-deep/85 px-2 py-1 text-frost sm:px-3">{c.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 grid gap-3 pb-6 sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s[0]} className={cn("asm-step border-t border-frost/30 pt-2", `asm-step-${i}`)}>
              <div className="mono text-gold">0{i + 1}</div>
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
  { icon: MapPin, h: "Шоурум", ty: "Приходи, потрогай, сядь. Ростов-на-Дону, прототип 3D-тура ниже.", vy: "Приезжайте, посмотрите и сядьте на технику. Ростов-на-Дону, 3D-тур ниже.", photo: "nicot-kr2-250cbf-p21", span: "lg:col-span-7" },
  { icon: Gauge, h: "Тест-драйв", ty: "Кати до покупки: выбираешь город, дату и модель.", vy: "Прокатитесь до покупки: выберите город, дату и модель.", photo: "nicot-cqr-125re-p25", span: "lg:col-span-5" },
  { icon: Wrench, h: "Сервис", ty: "Диагностика, батареи, расходники. Свой склад запчастей.", vy: "Диагностика, обслуживание батарей, расходники. Собственный склад запчастей.", photo: "nicot-kr4-125re-p29", span: "lg:col-span-4" },
  { icon: Truck, h: "Доставка", ty: "Москва, Ростов, Краснодарский край. Опт отдельным рейсом.", vy: "Москва, Ростов-на-Дону, Краснодарский край. Оптовые партии отдельным рейсом.", photo: "zzssv-zz1400-2", span: "lg:col-span-4" },
  { icon: PaintBucket, h: "Custom", ty: "Цвет, наклейки, грипсы, батарея: собери свой build.", vy: "Цвет, наклейки, аксессуары, батарея: соберите свою конфигурацию.", photo: "nicot-ht5-450nc-p35", span: "lg:col-span-4" },
];
export function Perks() {
  const { t } = useApp();
  return (
    <section className="dark-zone relative py-28 sm:py-40" aria-labelledby="perks-h">
      <div className="container-x">
        <Reveal>
          <Eyebrow n="05" dark>почему мы</Eyebrow>
          <H2><span id="perks-h">{t("Не просто", "Больше,")}</span> <span className="text-gold">{t("магазин", "чем магазин")}</span></H2>
        </Reveal>
        <div className="mt-10 grid gap-4 lg:grid-cols-12">
          {PERKS.map((p) => (
            <Reveal key={p.h} className={p.span}>
              <GlowCard customSize glowColor="flare" className="touch-pan-y! h-[300px] !p-0 sm:h-[340px]">
                <div className="relative row-span-2 h-full overflow-hidden rounded-2xl">
                  <img src={photo(p.photo)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/55 to-deep/10" />
                  <div className="relative flex h-full flex-col justify-end p-5">
                    <p.icon className="mb-3 text-gold" size={28} aria-hidden="true" />
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
            <li key={x} className="flex items-center gap-2 border-t border-frost/25 pt-3"><Check size={16} className="text-gold" aria-hidden="true" />{x}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
