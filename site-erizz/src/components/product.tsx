import { DEPOSIT, SCENES, glbKey, lSpec, num, photo, prod, rub, verLabel, type LModel, type Ver } from "@/lib/data";
import { useApp, scrollToId } from "@/lib/state";
import { cn } from "@/lib/utils";
import { ARButton, type ARKey } from "./ar";
import { Bike3D } from "./bike";
import { StatusPill, verBadge } from "./models";

/* Студийный фон под фото модели: мягкий свет сверху, оттенок серии. */
export const STUDIO: Record<Ver, string> = {
  base: "radial-gradient(120% 85% at 50% 30%, #30353d 0%, #16191d 55%, #0c0e11 100%)",
  sport: "radial-gradient(120% 85% at 50% 30%, #3b2620 0%, #191514 55%, #0c0e11 100%)",
  pro: "radial-gradient(120% 85% at 50% 30%, #35202a 0%, #181316 55%, #0c0e11 100%)",
  road: "radial-gradient(120% 85% at 50% 30%, #243041 0%, #141a22 55%, #0c0e11 100%)",
};

export const wheelNum = (m: LModel) => {
  const v = parseInt(m.wheels, 10);
  return Number.isFinite(v) ? String(v) : "";
};

/** Фото модели с тенью на полу. */
export function ProductShot({ m, sm = true, eager, className, imgClass }: { m: LModel; sm?: boolean; eager?: boolean; className?: string; imgClass?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div aria-hidden="true" className="absolute inset-x-[14%] bottom-[5%] h-[9%] rounded-[50%] bg-black/70 blur-xl" />
      <img
        src={prod(m.n, sm)}
        alt={`${m.name}, фото модели`}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={cn("prod-img relative h-full w-full object-contain drop-shadow-[0_22px_28px_rgba(0,0,0,.5)]", imgClass)}
      />
    </div>
  );
}

/** Контурная цифра колеса на фоне карточки. */
export function WheelMark({ m, className }: { m: LModel; className?: string }) {
  const w = wheelNum(m);
  if (!w) return null;
  return <span aria-hidden="true" className={cn("outline-num pointer-events-none absolute select-none font-display font-extrabold leading-none", className)}>{w}</span>;
}

/** Карточка модели в сетке (лицевая сторона MorphTile). */
export function ProductFace({ m }: { m: LModel }) {
  return (
    <div className="prod-card relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-frost/10 p-4 text-frost sm:p-5" style={{ background: STUDIO[m.ser] }}>
      <WheelMark m={m} className="-right-3 top-6 text-[9.5rem] sm:text-[11rem]" />
      <div className="relative flex items-start justify-between gap-2">
        <span className="mono text-frost/60">{String(m.n).padStart(2, "0")} / 20</span>
        <StatusPill m={m} />
      </div>
      <ProductShot m={m} className="relative -mx-2 h-[52%] transition-transform duration-700 ease-out group-hover:-translate-y-1 group-hover:scale-[1.04]" />
      <div className="relative">
        <div className="mono text-sky">{m.wheels} / {m.role}</div>
        <div className="font-display mt-1 text-xl font-extrabold uppercase leading-tight sm:text-2xl">{m.name}</div>
        <div className="mono mt-2 text-frost/75">{m.peak ? `${num(m.peak)} кВт` : "кВт уточн."} · {m.kwh ? `${num(m.kwh)} кВт·ч` : "АКБ уточн."} · {m.kmh} км/ч</div>
      </div>
    </div>
  );
}

/** Раскрытая карточка: коллаж (фото модели, кадры в деле, характеристики, 3D и AR). */
export function ProductCollage({ m }: { m: LModel }) {
  const { t, addCart, setDriveFor, toggleCompare, compare, setCartOpen } = useApp();
  const key = glbKey(m) as ARKey;
  const sc = SCENES[m.group];
  const inCmp = compare.includes(m.id);
  const close = () => (document.querySelector(".morph-open button[aria-label=Закрыть]") as HTMLElement | null)?.click();
  const spec = lSpec(m);
  return (
    <div className="grid min-h-full grid-cols-1 gap-2 bg-deep p-2 text-frost md:h-full md:grid-cols-12 md:grid-rows-6 md:p-3">
      {/* 1. Модель */}
      <div data-tile className="relative min-h-[56svh] overflow-hidden rounded-2xl md:col-span-7 md:row-span-4 md:min-h-0" style={{ background: STUDIO[m.ser] }}>
        <WheelMark m={m} className="right-2 top-2 text-[13rem] sm:text-[19rem]" />
        <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2 sm:left-7 sm:top-7">
          <span className={cn("mono rounded-full px-3 py-1 font-bold", verBadge(m.ser))}>{verLabel(m.ser)}</span>
          <StatusPill m={m} />
        </div>
        <ProductShot m={m} sm={false} eager className="absolute inset-x-[4%] bottom-[16%] top-[12%]" />
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-deep/90 via-deep/40 to-transparent p-5 pt-16 sm:p-7 sm:pt-20">
          <p className="mono text-sky">{String(m.n).padStart(2, "0")} / {m.role} / {m.wheels}</p>
          <h3 className="font-display mt-1 text-4xl font-extrabold uppercase leading-[0.95] sm:text-6xl">{m.name}</h3>
        </div>
      </div>
      {/* 2. В деле */}
      <figure data-tile className="relative min-h-[240px] overflow-hidden rounded-2xl md:col-span-5 md:row-span-3 md:min-h-0">
        <img src={photo(sc[0])} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep/80 to-transparent" />
        <figcaption className="mono absolute bottom-4 left-4 text-frost/90">в деле / съемка GT в плане</figcaption>
      </figure>
      {/* 3. Характеристики и действия */}
      <div data-tile className="flex flex-col justify-between gap-5 rounded-2xl bg-kelp p-5 sm:p-7 md:col-span-5 md:col-start-8 md:row-span-3 md:row-start-4 md:overflow-y-auto">
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
          {spec.map((x) => (
            <div key={x.k} className="border-t border-frost/15 pt-2">
              <dt className="mono text-frost/55">{x.k}</dt>
              <dd className="font-display text-lg font-extrabold leading-tight sm:text-xl">{x.v}</dd>
              {x.s && <dd className="mono text-frost/45">{x.s}</dd>}
            </div>
          ))}
        </dl>
        <div>
          <p className="mono text-frost/55">{m.chassis}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button className="btn-solid" onClick={() => { addCart({ id: m.id, name: m.name, sub: `бронь · ${m.wheels}`, price: DEPOSIT, variant: key, paint: m.paint }); setCartOpen(true); }}>Бронь {rub(DEPOSIT)}</button>
            <button className="btn-ghost !text-frost" onClick={() => { setDriveFor(m.id); close(); setTimeout(() => scrollToId("drive"), 850); }}>{t("Тест-драйв", "Тест-драйв")}</button>
            <button className="btn-ghost !text-frost" onClick={() => toggleCompare(m.id)}>{inCmp ? "В сравнении" : "Сравнить"}</button>
          </div>
        </div>
      </div>
      {/* 4. Второй кадр */}
      <figure data-tile className="relative min-h-[200px] overflow-hidden rounded-2xl md:col-span-3 md:col-start-1 md:row-span-2 md:row-start-5 md:min-h-0">
        <img src={photo(sc[1])} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </figure>
      {/* 5. 3D и AR */}
      <div data-tile className="relative min-h-[300px] overflow-hidden rounded-2xl bg-ink md:col-span-4 md:col-start-4 md:row-span-2 md:row-start-5 md:min-h-0">
        <Bike3D variant={key} paint={m.paint} interactive yaw={-0.5} sway={0.08} label={`${m.name}: 3D-макет серии, потяни, чтобы повернуть`} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute left-4 top-4 mono text-frost/70">3D-макет серии / крути</div>
        <div className="absolute bottom-3 left-3"><ARButton k={key} name={m.name} className="!min-h-11 bg-deep/60 text-sm backdrop-blur" /></div>
      </div>
    </div>
  );
}
