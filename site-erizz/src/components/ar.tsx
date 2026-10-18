import { useEffect, useRef, useState } from "react";
import { Box, Smartphone, X, QrCode, Move3d } from "lucide-react";
import QRCode from "qrcode";
import { useApp } from "@/lib/state";

/* AR: model-viewer (WebXR на Android, Scene Viewer, Quick Look на iPhone).
   GLB для просмотра: models/ar/<key>.glb, USDZ для iPhone: models/<key>.usdz. Реальный масштаб, метры. */
export type ARKey = "base" | "sport" | "pro" | "road" | "roadpro";
export const AR_LABEL: Record<ARKey, string> = { base: "GT Spark", sport: "GT Send 19", pro: "GT Ridge 21", road: "GT Pulse 17", roadpro: "GT Pulse 17 R" };
export function openAR(key: string, name?: string) {
  window.dispatchEvent(new CustomEvent("erizz-ar", { detail: { key, name } }));
}

let mvLoad: Promise<void> | null = null;
function loadModelViewer() {
  if (customElements.get("model-viewer")) return Promise.resolve();
  if (!mvLoad) {
    mvLoad = new Promise<void>((res, rej) => {
      const s = document.createElement("script");
      s.src = `${import.meta.env.BASE_URL}vendor/model-viewer-umd.min.js`;
      s.onload = () => {
        const C = customElements.get("model-viewer") as unknown as { meshoptDecoderLocation?: string } | undefined;
        if (C) C.meshoptDecoderLocation = new URL(`${import.meta.env.BASE_URL}vendor/meshopt_decoder.js`, location.href).href;
        res();
      };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  return mvLoad;
}

const isMobile = () => typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;

type MV = HTMLElement & { canActivateAR?: boolean; activateAR?: () => Promise<void> };

export function ARLayer() {
  const { t } = useApp();
  const [st, setSt] = useState<{ key: ARKey; name: string } | null>(null);
  const [can, setCan] = useState<boolean | null>(null);
  const [qr, setQr] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const mv = useRef<MV | null>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as { key: ARKey; name?: string };
      setSt({ key: d.key, name: d.name ?? AR_LABEL[d.key] ?? "GT" });
    };
    window.addEventListener("erizz-ar", on);
    const q = new URLSearchParams(location.search).get("ar") as ARKey | null;
    if (q && AR_LABEL[q]) setSt({ key: q, name: new URLSearchParams(location.search).get("n") ?? AR_LABEL[q] });
    return () => window.removeEventListener("erizz-ar", on);
  }, []);

  useEffect(() => {
    if (!st) return;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setSt(null); };
    window.addEventListener("keydown", k);
    setCan(null);
    const url = new URL(location.href);
    url.search = ""; url.hash = "";
    url.searchParams.set("ar", st.key); url.searchParams.set("n", st.name); url.searchParams.set("skip", "1");
    QRCode.toDataURL(url.href, { margin: 1, width: 360, color: { dark: "#0e1013", light: "#eef1f4" } }).then(setQr).catch(() => setQr(""));
    let dead = false;
    loadModelViewer().then(() => {
      if (dead || !box.current) return;
      box.current.innerHTML = "";
      const el = document.createElement("model-viewer") as MV;
      const base = import.meta.env.BASE_URL;
      el.setAttribute("src", `${base}models/ar/${st.key}.glb`);
      el.setAttribute("ios-src", `${base}models/${st.key}.usdz`);
      el.setAttribute("alt", `${st.name}, 3D-модель для дополненной реальности`);
      el.setAttribute("ar", "");
      el.setAttribute("ar-modes", "webxr scene-viewer quick-look");
      el.setAttribute("ar-scale", "fixed");
      el.setAttribute("ar-placement", "floor");
      el.setAttribute("camera-controls", "");
      el.setAttribute("touch-action", "pan-y");
      el.setAttribute("auto-rotate", "");
      el.setAttribute("rotation-per-second", "18deg");
      el.setAttribute("shadow-intensity", "1");
      el.setAttribute("shadow-softness", "0.8");
      el.setAttribute("exposure", "1.05");
      el.setAttribute("environment-image", "neutral");
      el.setAttribute("camera-orbit", "-30deg 76deg auto");
      el.setAttribute("interaction-prompt", "none");
      el.style.cssText = "width:100%;height:100%;background:transparent;--poster-color:transparent;";
      // свой слот кнопки AR скрываем: запускаем своей кнопкой
      const slot = document.createElement("span"); slot.setAttribute("slot", "ar-button"); slot.style.display = "none"; el.appendChild(slot);
      el.addEventListener("load", () => { if (!dead) setCan(!!el.canActivateAR); });
      box.current.appendChild(el);
      mv.current = el;
    }).catch(() => setCan(false));
    return () => { dead = true; document.body.style.overflow = ""; window.removeEventListener("keydown", k); };
  }, [st]);

  if (!st) return null;
  const mobile = isMobile();
  const start = () => { mv.current?.activateAR?.(); };
  return (
    <div className="fixed inset-0 z-[400]" role="dialog" aria-modal="true" aria-label={`${st.name} у вас дома: дополненная реальность`}>
      <div className="absolute inset-0 bg-deep/85 backdrop-blur-md" onClick={() => setSt(null)} />
      <div className="dark-zone relative mx-auto flex h-full max-w-[1400px] flex-col p-3 sm:p-6 lg:flex-row lg:gap-6">
        <button ref={close} className="absolute right-4 top-4 z-10 grid h-12 w-12 cursor-pointer place-items-center rounded-full border border-frost/30 bg-deep/70 text-frost hover:border-sky" aria-label="Закрыть AR" onClick={() => setSt(null)}><X /></button>
        <div className="relative min-h-[46vh] flex-1 overflow-hidden rounded-3xl border border-frost/15 bg-[radial-gradient(60%_60%_at_50%_60%,#2a3038,#0e1013_75%)]">
          <div ref={box} className="absolute inset-0" />
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-flare" /><span className="mono text-frost/80">{st.name} / масштаб 1:1</span></div>
          <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 text-frost/70"><Move3d size={16} aria-hidden="true" /><span className="mono">{t("покрути пальцем или мышью", "поверните пальцем или мышью")}</span></div>
        </div>
        <aside className="mt-3 flex w-full shrink-0 flex-col gap-4 rounded-3xl border border-frost/15 bg-ink/90 p-5 text-frost lg:mt-0 lg:w-[380px] lg:p-7">
          <p className="mono text-sky">AR / дополненная реальность</p>
          <h3 className="font-display text-3xl font-extrabold uppercase leading-none">{t("Поставь", "Поставьте")} {st.name} {t("у себя", "у себя дома")}</h3>
          <p className="muted">{t("Байк встанет на пол в реальном размере: в комнате, во дворе, в гараже. Можно обойти вокруг и сфотографировать.", "Модель встанет на пол в реальном размере: в комнате, во дворе или в гараже. Ее можно обойти и сфотографировать.")}</p>
          {mobile ? (
            <>
              <button className="btn-solid flex !min-h-14 items-center justify-center gap-2 text-lg" onClick={start} disabled={can === false} aria-disabled={can === false}>
                <Smartphone size={22} aria-hidden="true" />{can === null ? "Загружаем модель…" : can ? t("Запустить AR", "Запустить AR") : "AR недоступен"}
              </button>
              {can === false && <p className="text-sm text-frost/80">{t("Этот браузер не умеет AR. Открой сайт в Safari на iPhone или в Chrome на Android.", "Этот браузер не поддерживает AR. Откройте сайт в Safari на iPhone или в Chrome на Android.")}</p>}
              <ul className="mono space-y-1 text-frost/70"><li>iPhone: Quick Look</li><li>Android: Scene Viewer / WebXR</li></ul>
            </>
          ) : (
            <>
              <div className="flex items-start gap-4">
                {qr ? <img src={qr} width={168} height={168} alt={`QR-код: открыть ${st.name} в AR на телефоне`} className="rounded-xl" /> : <div className="grid h-[168px] w-[168px] place-items-center rounded-xl bg-frost/10"><QrCode aria-hidden="true" /></div>}
                <ol className="space-y-2 text-sm">
                  <li><b>1.</b> {t("Наведи камеру телефона на код", "Наведите камеру телефона на код")}</li>
                  <li><b>2.</b> {t("Нажми «Запустить AR»", "Нажмите «Запустить AR»")}</li>
                  <li><b>3.</b> {t("Покажи камере пол", "Покажите камере пол")}</li>
                </ol>
              </div>
              <p className="muted text-sm">{t("На компьютере модель можно крутить прямо здесь.", "На компьютере модель можно вращать прямо здесь.")}</p>
            </>
          )}
          <div className="sky-line" />
          <p className="flex gap-2 text-xs text-frost/60"><Box size={16} className="shrink-0" aria-hidden="true" />{t("3D-модель иллюстративная: финальный дизайн GT утверждается по образцам. Исходные модели CC BY, авторы в подвале сайта.", "3D-модель иллюстративная: финальный дизайн GT утверждается по образцам. Исходные модели CC BY, авторы указаны в подвале сайта.")}</p>
        </aside>
      </div>
    </div>
  );
}

/** Кнопка «Посмотреть у себя (AR)» для карточек и секций. */
export function ARButton({ k, name, className, dark = true }: { k: ARKey; name: string; className?: string; dark?: boolean }) {
  return (
    <button className={(dark ? "btn-ghost !text-frost" : "btn-ghost") + " inline-flex items-center gap-2 " + (className ?? "")} onClick={() => openAR(k, name)} data-cursor="AR">
      <Smartphone size={18} aria-hidden="true" />AR у себя
    </button>
  );
}
