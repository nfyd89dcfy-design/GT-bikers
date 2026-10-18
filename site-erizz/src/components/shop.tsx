import { BatteryCharging, Cpu, Disc3, Snowflake, Wrench, Zap } from "lucide-react";
import { useApp } from "@/lib/state";
import { photo } from "@/lib/data";
import { Cta } from "./fx";

const shop = (n: string) => `${import.meta.env.BASE_URL}shop/${n}.webp`;

/* ---------------------------------------------------------------- Тюнинг: проще поменять контроллер, чем байк */
const TIERS: [string, string, number][] = [["Сток", "как с завода", 0.42], ["Sport", "контроллер средней мощности", 0.68], ["Pro tune", "контроллер большой мощности + прошивка", 0.95]];

export function Tuning() {
  const { t, say } = useApp();
  return (
    <section id="tuning" className="t-zone relative py-24 sm:py-32" aria-labelledby="tun-h">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <p className="mono t-label">тюнинг и запчасти</p>
            <h2 id="tun-h" className="h-hero mt-3 text-[clamp(34px,4.6vw,72px)]">Злее без<br />нового байка</h2>
          </div>
          <p className="t-mute max-w-xl text-lg leading-snug">{t("Контроллеры, моторы, колеса, резина и гусеницы на зиму. Подберем под твою модель и поставим в сервисе.", "Контроллеры, моторы, колеса, резина и гусеницы на зиму. Подберем под вашу модель и установим в сервисе.")}</p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-6">
          {/* контроллер: главный апсейл */}
          <article className="t-tile spot relative overflow-hidden rounded-xl p-6 md:col-span-4 md:row-span-2 sm:p-8">
            <div className="flex items-center gap-3"><Cpu size={22} aria-hidden="true" className="text-flare" /><span className="mono t-mute">контроллер</span></div>
            <h3 className="h-hero mt-5 text-[clamp(26px,3vw,46px)]">{t("Проще поменять контроллер, чем байк", "Проще заменить контроллер, чем байк")}</h3>
            <p className="t-mute mt-3 max-w-lg">{t("Тот же байк, но резче разгон и выше скорость. Три уровня: от стока до полной настройки. Ставим за один визит.", "Тот же байк, но резче разгон и выше скорость. Три уровня: от стока до полной настройки. Устанавливаем за один визит.")}</p>
            <ul className="mt-8 grid gap-4" aria-label="Уровни контроллера">
              {TIERS.map(([n, d, w], i) => (
                <li key={n} className="grid grid-cols-[96px_1fr] items-center gap-4">
                  <span className="font-display text-lg font-extrabold uppercase">{n}</span>
                  <div>
                    <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "var(--t-line)" }}>
                      <div className="tier-bar h-full rounded-full" style={{ width: `${w * 100}%`, background: i ? "var(--color-flare)" : "var(--t-mute)", ["--d" as string]: `${i * 0.15}s` }} />
                    </div>
                    <span className="mono t-mute mt-1.5 block">{d}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Cta onClick={() => say("Заглушка: подбор тюнинга под модель")}>{t("Подобрать под мой байк", "Подобрать под мой байк")}</Cta>
              <span className="mono t-mute">шкала условная, цифры по модели уточним</span>
            </div>
          </article>

          {/* гусеницы на зиму */}
          <article className="t-tile spot relative min-h-[260px] overflow-hidden rounded-xl p-5 md:col-span-2">
            <div className="flex items-center gap-3"><Snowflake size={20} aria-hidden="true" className="text-flare" /><span className="mono t-mute">зима</span></div>
            <h3 className="font-display mt-3 text-xl font-extrabold uppercase leading-tight">Гусеница и лыжа</h3>
            <p className="t-mute mt-1 text-sm">Байк едет по снегу, сезон не заканчивается в октябре.</p>
            <img src={shop("snowkit")} alt="Электробайк с гусеницей и лыжей для зимы" loading="lazy" className="pointer-events-none mx-auto mt-2 h-40 w-auto object-contain" />
          </article>

          {/* колеса и резина */}
          <article className="relative min-h-[260px] overflow-hidden rounded-xl md:col-span-2">
            <img src={photo("garage_service")} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="flex items-center gap-3"><Disc3 size={20} aria-hidden="true" className="text-flare" /><span className="mono text-white/70">колеса и резина</span></div>
              <h3 className="font-display mt-2 text-xl font-extrabold uppercase leading-tight">Дорожная резина</h3>
              <p className="mt-1 text-sm text-white/80">{t("Поставил дорожную резину, и питбайк едет по городу. Шипы на зиму, грязевая на лето.", "Дорожная резина, и питбайк едет по городу. Шипы на зиму, грязевая на лето.")}</p>
            </div>
          </article>

          {[
            { i: Zap, k: "моторы", h: "Ступичные и мид-драйв", p: "Замена и апгрейд мотора под ту же раму." },
            { i: BatteryCharging, k: "батареи и зарядки", h: "+20% запаса хода", p: "Вторая батарея и быстрая зарядка." },
            { i: Wrench, k: "руль, защита, пластик", h: "Мелочи, которые ломаются", p: "Рули, накладки, защита вилки, пластик." },
          ].map((c) => (
            <article key={c.k} className="t-tile spot relative overflow-hidden rounded-xl p-5 md:col-span-2">
              <div className="flex items-center gap-3"><c.i size={20} aria-hidden="true" className="text-flare" /><span className="mono t-mute">{c.k}</span></div>
              <h3 className="font-display mt-3 text-lg font-extrabold uppercase leading-tight">{c.h}</h3>
              <p className="t-mute mt-1 text-sm">{c.p}</p>
              {c.k === "руль, защита, пластик" && <div className="mt-3 flex gap-2"><img src={shop("barpad")} alt="" loading="lazy" className="h-16 w-auto object-contain" /><img src={shop("forkguard")} alt="" loading="lazy" className="h-16 w-auto object-contain" /></div>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Экипировка: байк любой, без экипировки это снаряд */
const GEAR: { img: string; k: string; n: string; b: string }[] = [
  { img: "kit", k: "форма", n: "Джерси и штаны", b: "FOX" },
  { img: "boots", k: "обувь", n: "Мотоботы", b: "FOX" },
  { img: "goggles", k: "очки", n: "Маска с прозрачной линзой", b: "100%" },
  { img: "gloves", k: "перчатки", n: "Перчатки для кросса", b: "100%" },
  { img: "brace", k: "защита", n: "Ортезы на колени", b: "Mobius" },
  { img: "pack", k: "рюкзак", n: "Рюкзак для экипировки", b: "USWE" },
];

export function Gear() {
  const { t, say } = useApp();
  return (
    <section id="gear" className="t-zone relative border-t t-line py-24 sm:py-32" aria-labelledby="gear-h">
      <div className="container-x">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="mono t-label">экипировка</p>
            <h2 id="gear-h" className="h-hero mt-3 text-[clamp(34px,4.6vw,72px)]">Байк любой.<br /><span className="text-flare">Без экипировки</span><br />это снаряд</h2>
            <p className="t-mute mt-5 max-w-md text-lg leading-snug">{t("Шлем, маска, перчатки, защита колен, ботинки и форма. Брендовая экипировка в шоуруме, размер подберем на месте.", "Шлем, маска, перчатки, защита колен, ботинки и форма. Брендовая экипировка в шоуруме, размер подберем на месте.")}</p>
            <div className="spot mt-6 max-w-md rounded-xl border t-line p-5">
              <p className="mono t-label">родителям</p>
              <p className="mt-2 leading-snug">{t("Покупаешь байк подростку? Соберем полный комплект под рост, с запасом на вырост.", "Покупаете байк подростку? Соберем полный комплект под рост, с запасом на вырост.")}</p>
            </div>
            <div className="mt-6"><Cta onClick={() => say("Заглушка: подбор комплекта экипировки")}>Подобрать комплект</Cta></div>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {GEAR.map((g) => (
              <li key={g.img} className="t-tile spot group relative flex min-h-[250px] flex-col overflow-hidden rounded-xl p-4">
                <span className="mono t-mute">{g.k}</span>
                <div className="relative my-3 flex flex-1 items-center justify-center">
                  <img src={shop(g.img)} alt={`${g.n}, ${g.b}`} loading="lazy" className="max-h-56 w-full object-contain transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.04]" />
                </div>
                <div className="font-display text-base font-extrabold uppercase leading-tight">{g.n}</div>
                <div className="mono t-mute mt-1">{g.b} / в шоуруме</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
