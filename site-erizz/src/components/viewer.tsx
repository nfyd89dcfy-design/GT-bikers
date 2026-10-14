import type * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { Box, Smartphone, X } from "lucide-react";
import { useApp, reduceMotion } from "@/lib/state";
import { hasWebGL, GridBg } from "./shaders";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { img } from "@/lib/data";

const COLORS: [string, string][] = [["Flare", "#ff4a2b"], ["Glacier", "#b9c2cc"], ["Ink", "#1b3a3e"], ["Frost", "#e8f0ee"]];

export function Viewer3D() {
  const { t } = useApp();
  const wrap = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState(0);
  const [explode, setExplode] = useState(0);
  const [ar, setAr] = useState(false);
  const [gl] = useState(() => hasWebGL());
  const api = useRef<{ setColor: (c: string) => void; setExplode: (v: number) => void } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!gl || !wrap.current) return;
    let dead = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (dead || !wrap.current) return;
      const el = wrap.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(1.75, devicePixelRatio));
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:pan-y";
      renderer.domElement.setAttribute("aria-label", "Интерактивная 3D-модель байка: тяните, чтобы повернуть");
      renderer.domElement.setAttribute("role", "img");
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
      cam.position.set(2.7, 1.3, 3.0);
      scene.add(new THREE.HemisphereLight(0xe4e8ec, 0x0e1013, 1.25));
      const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 4); scene.add(key);
      const rim = new THREE.DirectionalLight(0xff4a2b, 1.6); rim.position.set(-4, 2, -3); scene.add(rim);

      const black = new THREE.MeshStandardMaterial({ color: 0x0e1517, roughness: 0.55, metalness: 0.4 });
      const metal = new THREE.MeshStandardMaterial({ color: 0xb9c7c5, roughness: 0.3, metalness: 0.9 });
      const body = new THREE.MeshStandardMaterial({ color: 0xff4a2b, roughness: 0.35, metalness: 0.25 });
      const accent = new THREE.MeshStandardMaterial({ color: 0xb9c2cc, roughness: 0.4, metalness: 0.3, emissive: 0x20242a });

      const bike = new THREE.Group();
      scene.add(bike);
      const parts: { g: THREE.Object3D; dir: THREE.Vector3 }[] = [];
      const add = (g: THREE.Object3D, d: [number, number, number]) => { bike.add(g); parts.push({ g: g, dir: new THREE.Vector3(...d) }); g.userData.base = g.position.clone(); return g; };
      const rod = (a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) => {
        const len = a.distanceTo(b);
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), m);
        mesh.position.copy(a).lerp(b, 0.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        return mesh;
      };
      const wheel = () => {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.085, 16, 48), black));
        g.add(new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.018, 8, 48), metal));
        for (let i = 0; i < 16; i++) { const s = rod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos((i / 16) * 6.283) * 0.37, Math.sin((i / 16) * 6.283) * 0.37, 0), 0.004, metal); g.add(s); }
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16).rotateX(Math.PI / 2), accent));
        return g;
      };
      const fw = wheel(); fw.position.set(0.95, 0.46, 0); add(fw, [1.3, 0, 0]);
      const rw = wheel(); rw.position.set(-0.85, 0.46, 0); add(rw, [-1.3, 0, 0]);
      // рама и вилка
      const frame = new THREE.Group();
      const P = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
      [[P(0.52, 0.95), P(-0.2, 0.82)], [P(0.52, 0.95), P(0.0, 0.3)], [P(-0.2, 0.82), P(0.0, 0.3)], [P(0.0, 0.3), P(-0.85, 0.46, 0.08)], [P(0.0, 0.3), P(-0.85, 0.46, -0.08)], [P(-0.2, 0.82), P(-0.8, 0.5, 0.08)], [P(-0.2, 0.82), P(-0.8, 0.5, -0.08)]].forEach(([a, b]) => frame.add(rod(a, b, 0.032, body)));
      add(frame, [0, 0.5, 0]);
      const fork = new THREE.Group();
      [0.07, -0.07].forEach((z) => fork.add(rod(P(0.55, 1.0, z), P(0.95, 0.46, z), 0.026, metal)));
      fork.add(rod(P(0.46, 1.16, 0), P(0.64, 1.1, 0), 0.03, black));
      const bars = rod(P(0.5, 1.2, 0.36), P(0.5, 1.2, -0.36), 0.022, black); fork.add(bars);
      fork.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 12).rotateX(Math.PI / 2), accent).translateX(0.5).translateY(1.2).translateZ(0.42));
      fork.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 12).rotateX(Math.PI / 2), accent).translateX(0.5).translateY(1.2).translateZ(-0.42));
      add(fork, [0.6, 0.7, 0]);
      const batt = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.36, 0.3), body); batt.position.set(0.08, 0.62, 0); batt.rotation.z = 0.12;
      add(batt, [0, -0.9, 0]);
      const cell = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.31), accent); cell.position.set(0.08, 0.7, 0); cell.rotation.z = 0.12; add(cell, [0, -0.9, 0]);
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.28, 24).rotateX(Math.PI / 2), metal); motor.position.set(-0.04, 0.3, 0); add(motor, [0, -0.5, 0.8]);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.09, 0.26), black); seat.position.set(-0.45, 0.93, 0); seat.rotation.z = 0.06; add(seat, [-0.4, 0.8, 0]);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.2), body); tail.position.set(-0.98, 1.0, 0); tail.rotation.z = 0.25; add(tail, [-0.6, 0.8, 0]);
      const fend = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.18), body); fend.position.set(1.0, 0.98, 0); fend.rotation.z = -0.12; add(fend, [0.8, 0.5, 0]);
      bike.position.y = 0.02;

      // платформа
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.9, 1.96, 96).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xb9c2cc }));
      ring.position.y = 0.001; scene.add(ring);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.9, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xb9c2cc, transparent: true, opacity: 0.1 }));
      scene.add(disc);

      const controls = new OrbitControls(cam, renderer.domElement);
      controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true;
      controls.target.set(0, 0.5, 0);
      controls.autoRotate = !reduceMotion(); controls.autoRotateSpeed = 1.6;
      controls.minPolarAngle = 0.5; controls.maxPolarAngle = 1.55;
      let ex = 0, ext = 0;
      api.current = { setColor: (c) => body.color.set(c), setExplode: (v) => { ext = v; } };
      const size = () => { const r = el.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / Math.max(1, r.height); cam.fov = r.width < 600 ? 46 : 36; cam.updateProjectionMatrix(); };
      size();
      const ro = new ResizeObserver(size); ro.observe(el);
      let vis = true, raf = 0;
      const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; }); io.observe(el);
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!vis) return;
        ex += (ext - ex) * 0.08;
        parts.forEach((p) => p.g.position.copy(p.g.userData.base).addScaledVector(p.dir, ex * 0.9));
        if (!reduceMotion()) { fw.rotation.z -= 0.01 + 0.0; rw.rotation.z -= 0.01; }
        controls.update();
        renderer.render(scene, cam);
      };
      tick();
      setReady(true);
      cleanup = () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose(); renderer.dispose(); renderer.domElement.remove(); };
    })();
    return () => { dead = true; cleanup(); };
  }, [gl]);

  useEffect(() => { api.current?.setColor(COLORS[color][1]); }, [color, ready]);
  useEffect(() => { api.current?.setExplode(explode); }, [explode, ready]);

  return (
    <section id="viewer" className="dark-zone relative isolate overflow-hidden py-28 sm:py-40" aria-labelledby="viewer-h">
      <GridBg className="absolute inset-0 -z-10 h-full w-full" />
      <div className="container-x">
        <Reveal>
          <Eyebrow n="04" dark>3D / AR</Eyebrow>
          <H2><span id="viewer-h">{t("Покрути", "Рассмотрите")}</span> <span className="text-gold">{t("байк как хочешь", "байк со всех сторон")}</span></H2>
          <p className="muted mt-4 max-w-2xl text-lg">
            {t("Тяни, чтобы вращать. Ползунок разбирает байк на узлы. Это простая процедурная модель, в проде тут будут лидар-сканы реальных байков.", "Потяните, чтобы повернуть модель. Ползунок разбирает байк на узлы. Это упрощенная процедурная модель, в рабочей версии здесь будут лидар-сканы реальных байков.")}
          </p>
        </Reveal>
        <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-[1fr_320px]">
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-frost/20 bg-deep/40 sm:min-h-[520px]" data-cursor="drag">
            <div ref={wrap} className="absolute inset-0" />
            {!gl && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <div>
                  <img src={img("79bike-falcon-gt-1.webp")} alt="FALCON GT" className="mx-auto w-[80%] max-w-lg" />
                  <p className="muted mt-3 text-sm">WebGL недоступен, показываем фото. 3D включится в браузере с WebGL.</p>
                </div>
              </div>
            )}
            <span className="mono absolute left-4 top-4 rounded-full bg-deep/70 px-3 py-1 text-gold">процедурная модель / макет</span>
          </div>
          <div className="flex flex-col gap-5 rounded-3xl border border-frost/20 bg-deep/50 p-5 backdrop-blur">
            <div>
              <div className="mono mb-2 text-gold">цвет рамы</div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Цвет модели">
                {COLORS.map(([n, c], i) => (
                  <button key={n} aria-pressed={color === i} onClick={() => setColor(i)} className="chip flex items-center gap-2 !px-3 text-sm !text-frost aria-pressed:!text-ink">
                    <span className="h-4 w-4 rounded-full border border-frost/60" style={{ background: c }} />{n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="expl" className="mono mb-2 block text-gold">{t("разбери на узлы", "разбор на узлы")}</label>
              <input id="expl" type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(+e.target.value)} className="h-11 w-full accent-[#ff4a2b]" />
            </div>
            <InteractiveHoverButton text={t("Посмотреть дома (AR)", "Посмотреть дома (AR)")} className="h-14 w-full border-frost/40 bg-transparent pl-8 text-frost" onClick={() => setAr(true)} data-cursor="AR" />
            <p className="muted flex gap-2 text-sm"><Smartphone size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{t("Честно: сейчас кнопка только показывает пояснение. В проде будут лидар-модели, WebXR на Android и Quick Look на iPhone.", "Сейчас кнопка показывает только пояснение. В рабочей версии будут лидар-модели, WebXR на Android и Quick Look на iPhone.")}</p>
            <p className="muted flex gap-2 text-sm"><Box size={18} className="mt-0.5 shrink-0" aria-hidden="true" />three.js, вращение мышью и касанием.</p>
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
              <li>лидар-сканы реальных байков</li>
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
