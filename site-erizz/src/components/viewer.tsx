import { useRef, useState } from "react";
import { Box, Smartphone, X } from "lucide-react";
import { useApp } from "@/lib/state";
import { GT, type Ver } from "@/lib/data";
import { BlockGrid } from "./shaders";
import { Bike3D, type BikeApi } from "./bike";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";

const PAINT: [string, string | undefined][] = [["Заводской", undefined], ["Flare", "#ff4a2b"], ["Бордо", "#7a1b2e"], ["Сталь", "#aeb7c1"], ["Графит", "#23272d"]];

export function Viewer3D() {
  const { t } = useApp();
  const [ver, setVer] = useState<Ver>("pro");
  const [paint, setPaint] = useState(0);
  const [yaw, setYaw] = useState(-0.55);
  const [ar, setAr] = useState(false);
  const api = useRef<BikeApi>(null);
  const g = GT.find((x) => x.ver === ver)!;
  return (
    <section id="viewer" className="dark-zone relative isolate overflow-hidden py-24 sm:py-36" aria-labelledby="viewer-h">
      <BlockGrid a="#07080a" b="#1b2026" line="#59616b" gain={0.85} cells={20} lineAmt={0.25} react={0.7} seed={21} className="absolute inset-0 -z-10 h-full w-full opacity-80" />
      <div className="container-x">
        <Reveal>
          <Eyebrow n="04" dark>3D / AR</Eyebrow>
          <H2><span id="viewer-h">{t("Покрути", "Рассмотрите")}</span> <span className="text-sky">{t("байк как хочешь", "байк со всех сторон")}</span></H2>
          <p className="muted mt-4 max-w-2xl text-lg">
            {t("Тяни, чтобы вращать, и меняй модель и цвет пластика. Это процедурные модели E-Rizz, в рабочей версии здесь будут сканы реальных байков.", "Потяните, чтобы повернуть, и меняйте модель и цвет пластика. Это процедурные модели E-Rizz, в рабочей версии здесь будут сканы реальных байков.")}
          </p>
        </Reveal>
        <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-[1fr_340px] lg:gap-6">
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-frost/20 bg-deep/40 sm:min-h-[580px]" data-cursor="drag">
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_58%,rgba(185,194,204,.2),transparent_70%)]" />
            <Bike3D ref={api} variant={ver} paint={PAINT[paint][1]} interactive yaw={-0.55} sway={0.05} label={`${g.name}, 3D-модель: тяните, чтобы повернуть`} className="absolute inset-0 h-full w-full" />
            <span className="mono absolute left-4 top-4 rounded-full bg-deep/70 px-3 py-1 text-sky">{g.name} / колеса {g.wheels}</span>
          </div>
          <div className="flex flex-col gap-5 rounded-3xl border border-frost/20 bg-deep/50 p-5 backdrop-blur">
            <div>
              <div className="mono mb-2 text-sky">модель</div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Модель">
                {GT.map((x) => <button key={x.id} aria-pressed={ver === x.ver} onClick={() => setVer(x.ver)} className="chip text-sm !text-frost aria-pressed:!text-ink">{x.short}</button>)}
              </div>
            </div>
            <div>
              <div className="mono mb-2 text-sky">цвет пластика</div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Цвет пластика">
                {PAINT.map(([n, c], i) => (
                  <button key={n} aria-pressed={paint === i} onClick={() => setPaint(i)} className="chip flex items-center gap-2 !px-3 text-sm !text-frost aria-pressed:!text-ink">
                    <span className="h-4 w-4 rounded-full border border-frost/60" style={{ background: c ?? "linear-gradient(135deg,#222,#9aa3ad)" }} />{n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="yaw" className="mono mb-2 block text-sky">{t("поверни", "поворот")}</label>
              <input id="yaw" type="range" min={-3.14} max={3.14} step={0.01} value={yaw} onChange={(e) => { setYaw(+e.target.value); api.current?.setYaw(+e.target.value); }} className="h-11 w-full accent-[#ff4a2b]" />
            </div>
            <InteractiveHoverButton text="Посмотреть дома (AR)" className="h-14 w-full border-frost/40 bg-transparent pl-8 text-frost" onClick={() => setAr(true)} data-cursor="AR" />
            <p className="muted flex gap-2 text-sm"><Smartphone size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{t("Сейчас кнопка показывает только пояснение. В проде будут WebXR на Android и Quick Look на iPhone.", "Сейчас кнопка показывает только пояснение. В рабочей версии будут WebXR на Android и Quick Look на iPhone.")}</p>
            <p className="muted flex gap-2 text-sm"><Box size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{t("Свои модели: положи base.glb, sport.glb, pro.glb в public/models.", "Свои модели: положите base.glb, sport.glb, pro.glb в public/models.")}</p>
          </div>
        </div>
      </div>
      {ar && (
        <div role="dialog" aria-modal="true" aria-label="AR: пояснение" className="fixed inset-0 z-[150] grid place-items-center bg-deep/80 p-5 backdrop-blur" onClick={() => setAr(false)}>
          <div className="relative max-w-md rounded-3xl bg-frost p-7 text-ink" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-3 top-3 grid h-11 w-11 cursor-pointer place-items-center rounded-full hover:bg-ink/10" aria-label="Закрыть" onClick={() => setAr(false)} autoFocus><X /></button>
            <h3 className="font-display text-2xl font-extrabold uppercase">AR: прототип</h3>
            <p className="mt-3">{t("Здесь ничего не запустится: это макет. В рабочем сайте байк появится у тебя в комнате в масштабе 1:1.", "Здесь ничего не запустится: это макет. В рабочем сайте модель появится у вас дома в масштабе 1:1.")}</p>
            <ul className="mt-3 list-disc pl-5 text-sm text-mute">
              <li>сканы или модели реальных байков</li>
              <li>Android: WebXR, iPhone: Quick Look (USDZ)</li>
              <li>кнопка сохранится на карточках моделей</li>
            </ul>
            <button className="btn-solid mt-5" onClick={() => setAr(false)}>Понятно</button>
          </div>
        </div>
      )}
    </section>
  );
}
