import { DEPOSIT, SCENES, lSpec, num, photo, rub, studio, type LModel, type Ver } from "@/lib/data";
import { useApp, scrollToId } from "@/lib/state";
import { cn } from "@/lib/utils";
import { MorphTile } from "./morph";

/* Фон под фото модели берется из темы (день: студия как у Zero, ночь: темная студия с подсветкой). */
export const STUDIO: Record<Ver, string> = { base: "var(--t-tile)", sport: "var(--t-tile)", pro: "var(--t-tile)", road: "var(--t-tile)" };

/** Студийный кадр модели 16:9: общий масштаб и линия земли, тень на полу из темы. */
export function ProductShot({ m, sm = true, eager, className, imgClass, zoom = 1 }: { m: LModel; sm?: boolean; eager?: boolean; className?: string; imgClass?: string; zoom?: number }) {
  return (
    <div className={cn("relative aspect-[16/9]", className)}>
      <div className="absolute inset-0" style={zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: "50% 93%" } : undefined}>
        <div className="glow" aria-hidden="true" />
        <div className="floor" aria-hidden="true" />
        <img src={studio(m.n, sm)} alt={`${m.name}, фото в профиль`} loading={eager ? "eager" : "lazy"} decoding="async" className={cn("prod-img absolute inset-0 h-full w-full object-contain", imgClass)} />
      </div>
    </div>
  );
}

const specLine = (m: LModel) => `${m.peak ? `${num(m.peak)} кВт` : "кВт уточн."} · ${m.kwh ? `${num(m.kwh)} кВт·ч` : "АКБ уточн."} · ${m.kmh} км/ч`;

/** Лицевая сторона карточки: только фото, название и одна строка цифр. */
export function ProductFace({ m }: { m: LModel }) {
  return (
    <div className="t-tile relative flex h-full flex-col justify-between overflow-hidden rounded-xl p-4 sm:p-5" style={{ color: "var(--t-fg)" }}>
      <div className="flex items-start justify-between gap-2">
        <span className="mono t-mute">{String(m.n).padStart(2, "0")}</span>
        {m.status === "order" && <span className="mono rounded-full bg-flare px-2.5 py-1 text-ink">первая партия</span>}
      </div>
      <ProductShot m={m} zoom={1.32} className="-mx-3 transition-transform duration-700 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.03]" />
      <div>
        <div className="font-display text-lg font-extrabold uppercase leading-tight sm:text-xl">{m.name}</div>
        <div className="mono t-mute mt-1.5">{specLine(m)}</div>
      </div>
    </div>
  );
}

/** Раскрытая карточка: коллаж в сетке 12 колонок. */
export function ProductCollage({ m }: { m: LModel }) {
  const { t, addCart, setDriveFor, toggleCompare, compare, setCartOpen } = useApp();
  const sc = SCENES[m.group];
  const inCmp = compare.includes(m.id);
  const close = () => (document.querySelector(".morph-open button[aria-label=Закрыть]") as HTMLElement | null)?.click();
  const spec = lSpec(m);
  return (
    <div className="t-zone flex min-h-full flex-col md:h-full">
      <div className="flex h-16 shrink-0 items-center gap-3 px-5 pr-20 md:px-6">
        <span className="mono t-label">{String(m.n).padStart(2, "0")} / {m.role} / {m.wheels}</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-3 pb-3 md:grid-cols-12 md:grid-rows-[minmax(0,1fr)_auto] md:px-4 md:pb-4">
        <div data-tile className="t-tile relative min-h-[46svh] overflow-hidden rounded-xl md:col-span-8 md:min-h-0">
          <ProductShot m={m} sm={false} eager zoom={1.08} className="absolute inset-x-[3%] bottom-[2%]" />
          <h3 className="font-display absolute left-5 top-5 text-4xl font-extrabold uppercase leading-[0.95] sm:left-7 sm:top-6 sm:text-6xl">{m.name}</h3>
        </div>
        <figure data-tile className="relative min-h-[240px] overflow-hidden rounded-xl md:col-span-4 md:row-span-2 md:min-h-0">
          <img src={photo(sc[0])} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </figure>
        <div data-tile className="grid gap-4 rounded-xl border t-line p-5 md:col-span-8 md:grid-cols-[1.4fr_1fr] md:p-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {spec.map((x) => (
              <div key={x.k} className="border-t t-line pt-2">
                <dt className="mono t-mute">{x.k}</dt>
                <dd className="font-display text-base font-extrabold leading-tight">{x.v}</dd>
                {x.s && <dd className="mono t-mute opacity-80">{x.s}</dd>}
              </div>
            ))}
          </dl>
          <div className="flex flex-col justify-between gap-4">
            <p className="leading-snug">{m.chassis[0].toUpperCase() + m.chassis.slice(1)}. {t("Приезжай на тест-драйв: шлем и защиту дадим.", "Приезжайте на тест-драйв: шлем и защиту дадим.")}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <button className="btn-solid" onClick={() => { addCart({ id: m.id, name: m.name, sub: `бронь · ${m.wheels}`, price: DEPOSIT, variant: "sport", paint: m.paint }); setCartOpen(true); }}>Бронь {rub(DEPOSIT)}</button>
              <button className="min-h-11 cursor-pointer font-semibold underline-offset-4 hover:underline" onClick={() => { setDriveFor(m.id); close(); setTimeout(() => scrollToId("drive"), 850); }}>Тест-драйв</button>
              <button className="min-h-11 cursor-pointer font-semibold underline-offset-4 hover:underline" onClick={() => toggleCompare(m.id)}>{inCmp ? "В сравнении ✓" : "Сравнить"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Карточка модели: вся карточка кликается и раскрывается в коллаж. */
export function LCard({ m, className }: { m: LModel; className?: string }) {
  return (
    <MorphTile label={`${m.name}: подробнее`} className={cn("aspect-[4/3.4]", className)} detail={<ProductCollage m={m} />}>
      <ProductFace m={m} />
    </MorphTile>
  );
}
