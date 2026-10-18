import { BatteryCharging, Cpu, Disc3, Snowflake, Wrench, Zap } from "lucide-react";
import { useApp } from "@/lib/state";
import { Cta } from "./fx";

const shop = (n: string) => `${import.meta.env.BASE_URL}shop/${n}.webp`;

/* ---------------------------------------------------------------- Тюнинг: проще поменять контроллер, чем байк */
/* Фото Unsplash подключаем по ссылке, как требуют правила Unsplash (скачивание отмечено через API). */
const U = (id: string, w = 1200) => `https://images.unsplash.com/${id}?ixlib=rb-4.1.0&auto=format&fit=crop&w=${w}&q=72`;
const PH = { tire: "photo-1565218889312-9bcb403c40c0", teen: "photo-1624968249941-a77cf4883e5e", snow: "photo-1613422220187-92de42161442" };

/* Контроллеры Moxin: данные из исследования GT (12.10.2026) и прайса завода */
const MOXIN: { m: string; v: string; d: string; w: number }[] = [
  { m: "S801100", v: "48-72 В", d: "пик до 53,9 кВт, фазный ток 1000 А. Прямая замена штатного блока на платформах 60-74 В", w: 0.62 },
  { m: "S120650", v: "до 104 В", d: "вариант для мощных сборок на 97-104 В", w: 0.74 },
  { m: "S1201500", v: "97-104 В", d: "для самых мощных платформ и тяжелых сборок", w: 0.96 },
];

function ControllerArt() {
  return (
    <svg viewBox="0 0 320 200" className="h-auto w-full" aria-hidden="true">
      <path d="M40 150 C 10 150 10 185 -10 190" stroke="var(--color-flare)" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M40 132 C 0 132 0 170 -10 172" stroke="var(--t-fg)" strokeWidth="7" fill="none" strokeLinecap="round" opacity=".85" />
      <path d="M40 114 C 4 114 6 150 -10 152" stroke="#8d97a2" strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="40" y="40" width="240" height="130" rx="18" fill="var(--t-fg)" opacity=".92" />
      {Array.from({ length: 11 }).map((_, i) => <rect key={i} x={58 + i * 20} y="28" width="10" height="16" rx="3" fill="var(--t-fg)" opacity=".75" />)}
      <rect x="62" y="64" width="196" height="82" rx="10" fill="none" stroke="var(--t-bg)" strokeOpacity=".22" strokeWidth="2" />
      <text x="160" y="104" textAnchor="middle" fontFamily="Martian Mono Variable, monospace" fontSize="15" letterSpacing="3" fill="var(--t-bg)">MOXIN</text>
      <text x="160" y="128" textAnchor="middle" fontFamily="Martian Mono Variable, monospace" fontSize="10" letterSpacing="2" fill="var(--color-flare)">FOC · IP68</text>
      <circle cx="262" cy="58" r="5" fill="var(--color-flare)"><animate attributeName="opacity" values="1;.25;1" dur="1.6s" repeatCount="indefinite" /></circle>
    </svg>
  );
}

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
          <p className="t-mute max-w-xl text-lg leading-snug">{t("Контроллеры Moxin, моторы, колеса, резина и гусеницы на зиму. Подберем под твою модель и поставим в сервисе.", "Контроллеры Moxin, моторы, колеса, резина и гусеницы на зиму. Подберем под вашу модель и установим в сервисе.")}</p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-6">
          {/* контроллеры Moxin: главный апсейл */}
          <article className="t-tile spot relative overflow-hidden rounded-xl p-6 md:col-span-4 md:row-span-2 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_260px] lg:items-start">
              <div>
                <div className="flex items-center gap-3"><Cpu size={22} aria-hidden="true" className="text-flare" /><span className="mono t-mute">контроллеры Moxin</span></div>
                <h3 className="h-hero mt-5 text-[clamp(26px,3vw,46px)]">{t("Проще поменять контроллер, чем байк", "Проще заменить контроллер, чем байк")}</h3>
                <p className="t-mute mt-3 max-w-lg">{t("Тот же байк, но резче разгон и выше пик. Штатные блоки держат 4-35 кВт, Moxin S801100 до 53,9 кВт. Сколько добавит именно твой байк, решают батарея и BMS: проверим на стенде.", "Тот же байк, но резче разгон и выше пик. Штатные блоки держат 4-35 кВт, Moxin S801100 до 53,9 кВт. Реальный прирост определяют батарея и BMS: проверим на стенде.")}</p>
              </div>
              <div className="hidden lg:block"><ControllerArt /></div>
            </div>
            <ul className="mt-7 grid gap-4" aria-label="Модели Moxin">
              {MOXIN.map((x, i) => (
                <li key={x.m} className="grid grid-cols-[110px_1fr] items-center gap-4 sm:grid-cols-[130px_1fr]">
                  <div><span className="font-display block text-lg font-extrabold uppercase leading-none">{x.m}</span><span className="mono t-mute">{x.v}</span></div>
                  <div>
                    <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "var(--t-line)" }}>
                      <div className="tier-bar h-full rounded-full" style={{ width: `${x.w * 100}%`, background: "var(--color-flare)", ["--d" as string]: `${i * 0.15}s` }} />
                    </div>
                    <span className="t-mute mt-1.5 block text-sm leading-snug">{x.d}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mono t-mute mt-6">IP68 · КПД 99% · гироскоп · гарантия 1 год · дисплеи 3, 5 и 7 дюймов</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Cta onClick={() => say("Заглушка: подбор контроллера под модель")}>{t("Подобрать под мой байк", "Подобрать под мой байк")}</Cta>
              <span className="mono t-mute">совместимость подтверждаем по модели</span>
            </div>
          </article>

          {/* гусеница и лыжа: зима */}
          <article className="relative min-h-[280px] overflow-hidden rounded-xl md:col-span-2">
            <img src={U(PH.snow, 900)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <img src={shop("snowkit")} alt="Электробайк с гусеницей и лыжей для зимы" loading="lazy" className="pointer-events-none absolute -right-2 bottom-16 w-[52%] drop-shadow-[0_12px_20px_rgba(0,0,0,.5)]" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="flex items-center gap-3"><Snowflake size={20} aria-hidden="true" className="text-flare" /><span className="mono text-white/70">зима</span></div>
              <h3 className="font-display mt-2 text-xl font-extrabold uppercase leading-tight">Гусеница и лыжа</h3>
              <p className="mt-1 text-sm text-white/80">Байк едет по снегу, сезон не заканчивается в октябре.</p>
            </div>
          </article>

          {/* дорожная резина: школьники ставят сами */}
          <article className="relative min-h-[280px] overflow-hidden rounded-xl md:col-span-2">
            <div className="absolute inset-0 grid grid-cols-2">
              <img src={U(PH.teen, 700)} alt="" loading="lazy" className="h-full w-full object-cover" />
              <img src={U(PH.tire, 700)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="flex items-center gap-3"><Disc3 size={20} aria-hidden="true" className="text-flare" /><span className="mono text-white/70">колеса и резина</span></div>
              <h3 className="font-display mt-2 text-xl font-extrabold uppercase leading-tight">Дорожная резина</h3>
              <p className="mt-1 text-sm text-white/80">{t("Школьники сами ставят дорожную резину, и питбайк едет по городу. Комплекты: дорожная, шипы на зиму, грязевая на лето.", "Дорожная резина, и питбайк едет по городу. Комплекты: дорожная, шипы на зиму, грязевая на лето.")}</p>
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
