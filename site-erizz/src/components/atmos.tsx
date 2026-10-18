import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useApp, reduceMotion, scrollToId } from "@/lib/state";
import { photo } from "@/lib/data";
import { MorphTile } from "./morph";
import { Eyebrow, H2, Reveal } from "./ui-bits";

/* Атмосфера: плитки раскрываются в коллаж (как в Touski): главное фото, 2-3 дополнительных и короткий текст. */
const SCENES: { k: string; t: string; en: string; main: string; more: string[]; ty: string; vy: string; to: string; span: string }[] = [
  { k: "night", t: "Ночь", en: "after dark", main: "night_motion", more: ["night_blur", "night_orange", "night_mountain"], ty: "Город пустеет, свет фар и тишина мотора. Pulse 17 и Send 19 любят ночь.", vy: "Город пустеет, остаются свет фар и тишина мотора. Pulse 17 и Send 19 хорошо смотрятся ночью.", to: "catalog", span: "md:col-span-7 md:row-span-2" },
  { k: "dust", t: "Пыль", en: "send it", main: "dust_rider", more: ["bw_dust", "orange_dust", "dust_turn"], ty: "Песок, вираж, облако за спиной. Send и Ridge для тех, кто едет туда, где нет асфальта.", vy: "Песок, вираж и облако пыли. Серии Send и Ridge для поездок туда, где нет асфальта.", to: "catalog", span: "md:col-span-5" },
  { k: "first", t: "Первый байк", en: "first ride", main: "kid_rider", more: ["kids_pair", "backlit_dust"], ty: "Spark: низкое седло, понятная мощность, тест-драйв вместе с родителями.", vy: "Серия Spark: низкое седло, плавная мощность и тест-драйв вместе с родителями.", to: "catalog", span: "md:col-span-5" },
];

export function Atmos() {
  const { t } = useApp();
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reduceMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".atm-img").forEach((el) => {
        gsap.fromTo(el, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <section id="atmos" ref={root} className="dark-zone relative overflow-hidden bg-deep py-24 sm:py-36" aria-labelledby="atm-h">
      <div className="container-x">
        <Reveal>
          <Eyebrow n="09" dark>атмосфера</Eyebrow>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <H2><span id="atm-h">{t("Где мы", "Где мы")}</span> <span className="chrome-text">{t("катаем", "ездим")}</span></H2>
            <p className="muted max-w-md">{t("Нажми на кадр: он раскроется в коллаж.", "Нажмите на кадр: он раскроется в коллаж.")}</p>
          </div>
        </Reveal>
        <div className="mt-10 grid auto-rows-[260px] grid-cols-1 gap-3 sm:auto-rows-[320px] md:grid-cols-12 lg:gap-4">
          {SCENES.map((s) => (
            <MorphTile key={s.k} label={`${s.t}: открыть коллаж`} className={s.span}
              media={<img src={photo(s.main)} alt="" loading="lazy" className="atm-img absolute inset-0 h-full w-full object-cover" />}
              detail={
                <div className="grid h-full min-h-0 grid-cols-1 gap-2 bg-deep p-2 text-frost md:grid-cols-[1.4fr_1fr] md:p-3">
                  <div data-tile className="relative min-h-[40vh] overflow-hidden rounded-2xl">
                    <img src={photo(s.main)} alt={s.t} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep/90 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 sm:p-10">
                      <p className="mono text-sky">{s.en}</p>
                      <h3 className="font-display mt-2 text-4xl font-extrabold uppercase sm:text-6xl">{s.t}</h3>
                      <p className="mt-3 max-w-lg text-frost/90">{t(s.ty, s.vy)}</p>
                      <button className="btn-solid mt-5" onClick={(e) => { e.stopPropagation(); (document.querySelector(".morph-open button[aria-label=Закрыть]") as HTMLElement | null)?.click(); setTimeout(() => scrollToId(s.to), 850); }}>{t("Смотреть модели", "Смотреть модели")}</button>
                    </div>
                  </div>
                  <div className="grid grid-rows-3 gap-2">
                    {s.more.slice(0, 3).map((m) => <div key={m} data-tile className="relative min-h-[120px] overflow-hidden rounded-2xl"><img src={photo(m)} alt="" className="absolute inset-0 h-full w-full object-cover" /></div>)}
                  </div>
                </div>
              }
            >
              <div className="relative h-full w-full cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-t from-deep/85 via-deep/10 to-transparent" />
                <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-4 sm:p-6">
                  <div><p className="mono text-sky">{s.en}</p><h3 className="font-display text-2xl font-extrabold uppercase sm:text-4xl">{s.t}</h3></div>
                  
                </div>
              </div>
            </MorphTile>
          ))}
        </div>
      </div>
    </section>
  );
}
