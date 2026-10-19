import { useRef, useState } from "react";
import { Smartphone, ScanLine, Ruler } from "lucide-react";
import { useApp } from "@/lib/state";
import { Bike3D, type BikeApi } from "./bike";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { openAR, type ARKey } from "./ar";
import { MetalFigure } from "./fx";

const PAINT: [string, string | undefined][] = [["Заводской", undefined], ["Flare", "#ff4a2b"], ["Иней", "#eef1f4"], ["Графит", "#23272d"], ["Небо", "#9cc9ff"], ["Бордо", "#7a1b2e"]];
const MODELS: { k: ARKey; n: string; w: string; size: string }[] = [
  { k: "base", n: "GT Trail 14", w: "14/12", size: "1,62 м" },
  { k: "sport", n: "GT Race 19", w: "19/18", size: "1,98 м" },
  { k: "pro", n: "GT Trail 21 Pro", w: "21/18", size: "2,14 м" },
  { k: "road", n: "GT City", w: "17/17", size: "2,02 м" },
  { k: "roadpro", n: "GT City Pro", w: "17/17", size: "2,06 м" },
];

export function Viewer3D() {
  const { t } = useApp();
  const [i, setI] = useState(1);
  const [paint, setPaint] = useState(0);
  const [yaw, setYaw] = useState(-0.55);
  const api = useRef<BikeApi>(null);
  const m = MODELS[i];
  return (
    <section id="viewer" className="dark-zone relative isolate overflow-hidden py-24 sm:py-36" aria-labelledby="viewer-h">
      <div className="bg-horizon absolute inset-0 -z-10" aria-hidden="true" />
      <div className="grain pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <MetalFigure kind="chrome" className="absolute right-[3%] top-6 hidden h-72 w-72 lg:block" />
      <div className="container-x">
        <Reveal className="lg:pr-[320px]">
          <Eyebrow dark>3D / AR</Eyebrow>
          <H2><span id="viewer-h">{t("Покрути и поставь", "Рассмотрите и поставьте")}</span> <span className="text-sky">{t("у себя дома", "у себя дома")}</span></H2>
          <p className="muted mt-4 max-w-2xl text-lg">
            {t("Тяни, чтобы вращать, меняй модель и цвет. Кнопка AR ставит байк в комнату или во двор в реальном размере.", "Потяните, чтобы повернуть, меняйте модель и цвет. Кнопка AR ставит модель в комнату или во двор в реальном размере.")}
          </p>
        </Reveal>
        <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-[1fr_360px] lg:gap-6">
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-frost/20 bg-deep/40 sm:min-h-[580px]" data-cursor="drag">
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_58%,rgba(185,194,204,.2),transparent_70%)]" />
            <Bike3D ref={api} variant={m.k} paint={PAINT[paint][1]} poster={`${import.meta.env.BASE_URL}models/poster-${m.k}.webp`} interactive yaw={-0.55} sway={0.05} label={`${m.n}, 3D-модель: тяните, чтобы повернуть`} className="absolute inset-0 h-full w-full" />
            <span className="mono absolute left-4 top-4 rounded-full bg-deep/70 px-3 py-1 text-sky">{m.n} / колеса {m.w}</span>
            <span className="mono absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-deep/70 px-3 py-1 text-frost/80"><Ruler size={14} aria-hidden="true" />длина {m.size}</span>
          </div>
          <div className="flex flex-col gap-5 rounded-3xl border border-frost/20 bg-deep/50 p-5 backdrop-blur">
            <div>
              <div className="mono mb-2 text-sky">модель</div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Модель">
                {MODELS.map((x, j) => <button key={x.k} aria-pressed={i === j} onClick={() => setI(j)} className="chip text-sm !text-frost aria-pressed:!text-ink">{x.n.replace("GT ", "")}</button>)}
              </div>
            </div>
            <div>
              <div className="mono mb-2 text-sky">цвет пластика</div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Цвет пластика">
                {PAINT.map(([n, c], j) => (
                  <button key={n} aria-pressed={paint === j} onClick={() => setPaint(j)} className="chip flex items-center gap-2 !px-3 text-sm !text-frost aria-pressed:!text-ink">
                    <span className="h-4 w-4 rounded-full border border-frost/60" style={{ background: c ?? "linear-gradient(135deg,#222,#ff4a2b)" }} />{n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="yaw" className="mono mb-2 block text-sky">{t("поверни", "поворот")}</label>
              <input id="yaw" type="range" min={-3.14} max={3.14} step={0.01} value={yaw} onChange={(e) => { setYaw(+e.target.value); api.current?.setYaw(+e.target.value); }} className="h-11 w-full accent-[#ff4a2b]" />
            </div>
            <InteractiveHoverButton text={t("Поставить у себя (AR)", "Посмотреть дома (AR)")} className="h-14 w-full border-frost/40 bg-transparent pl-8 text-frost" onClick={() => openAR(m.k, m.n)} data-cursor="AR" />
            <p className="muted flex gap-2 text-sm"><Smartphone size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{t("iPhone: откроется Quick Look. Android: Scene Viewer. На компьютере покажем QR-код.", "iPhone: откроется Quick Look. Android: Scene Viewer. На компьютере появится QR-код для телефона.")}</p>
            <p className="muted flex gap-2 text-sm"><ScanLine size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{t("После прихода образцов заменим модели на лидар-сканы реальных байков из шоурума.", "После прихода образцов модели заменятся на лидар-сканы реальных байков из шоурума.")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
