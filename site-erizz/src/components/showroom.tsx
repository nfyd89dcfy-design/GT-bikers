import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useApp, reduceMotion } from "@/lib/state";
import { hasWebGL } from "./shaders";
import { Eyebrow, H2, Reveal } from "./ui-bits";
import { photo } from "@/lib/data";
import { cn } from "@/lib/utils";

/* ---------- схема юга (адаптация карты из прошлой версии) ---------- */
function MapSvg() {
  const pt = (lon: number, lat: number): [number, number] => [(lon - 30) * 28 + 20, (58 - lat) * 30 + 20];
  const mo = pt(37.6, 55.75), ro = pt(39.7, 47.2), kr = pt(38.97, 45.04);
  const dots: { x: number; y: number; r: number }[] = [];
  for (let x = 20; x < 510; x += 14) for (let y = 20; y < 430; y += 14) {
    const k = Math.sin(x * 0.05) * Math.cos(y * 0.04);
    if (k > -0.2) dots.push({ x, y, r: 1.2 + Math.max(0, k) * 1.2 });
  }
  return (
    <svg viewBox="0 0 520 470" role="img" aria-label="Схема: Москва, Ростов-на-Дону с шоурумом и Краснодарский край" className="h-full w-full">
      <rect width="520" height="470" fill="#d9dee3" />
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#0e1013" opacity=".16" />)}
      <path d={`M${mo} Q${mo[0] + 60},${(mo[1] + ro[1]) / 2} ${ro}`} fill="none" stroke="#ff4a2b" strokeWidth="3" strokeDasharray="6 6" />
      <path d={`M${ro} L${kr}`} stroke="#ff4a2b" strokeWidth="3" fill="none" />
      <ellipse cx={kr[0]} cy={kr[1] + 6} rx="86" ry="42" fill="rgba(185,194,204,.28)" stroke="#0e1013" strokeDasharray="4 5" strokeWidth="2" />
      <g><circle cx={mo[0]} cy={mo[1]} r="11" fill="#0e1013" /><text x={mo[0] + 20} y={mo[1] + 5} fill="#0e1013" fontFamily="Onest" fontWeight="600" fontSize="15">Москва · доставка</text></g>
      <g>
        <circle cx={ro[0]} cy={ro[1]} r="22" fill="none" stroke="#ff4a2b" strokeWidth="3"><animate attributeName="r" values="14;30;14" dur="2.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;0;1" dur="2.4s" repeatCount="indefinite" /></circle>
        <circle cx={ro[0]} cy={ro[1]} r="12" fill="#ff4a2b" stroke="#0e1013" strokeWidth="3" />
        <text x={ro[0] + 24} y={ro[1] - 8} fill="#0e1013" fontFamily="Onest" fontWeight="800" fontSize="16">Ростов-на-Дону</text>
        <text x={ro[0] + 24} y={ro[1] + 10} fill="#0e1013" fontFamily="Onest" fontSize="13">шоурум · сервис · склад</text>
      </g>
      <g><circle cx={kr[0]} cy={kr[1]} r="9" fill="#0e1013" /><text x={kr[0] - 60} y={kr[1] + 52} fill="#0e1013" fontFamily="Onest" fontWeight="600" fontSize="15">Краснодарский край · выезд</text></g>
      <text x="16" y="458" fill="#5a626c" fontFamily="Onest" fontSize="12">схема условная, не карта</text>
    </svg>
  );
}

/* ---------- 3D-тур ---------- */
interface Stop { n: string; h: string; ty: string; vy: string; pos: [number, number, number]; look: [number, number, number]; plan: [number, number] }
const STOPS: Stop[] = [
  { n: "1", h: "Вход", ty: "Ресепшн, кофе и стена с новинками. Отсюда видно весь зал.", vy: "Ресепшн и стена с новинками. Отсюда виден весь зал.", pos: [0, 1.6, 5], look: [0, 1.5, -2], plan: [140, 168] },
  { n: "2", h: "Электро-эндуро", ty: "Три уровня lite, pro, ultra рядом: сядь на каждый.", vy: "Три уровня lite, pro, ultra рядом: можно сесть на каждый.", pos: [-1.2, 1.6, 1.4], look: [-5.5, 1.2, -0.5], plan: [50, 100] },
  { n: "3", h: "ATV и UTV", ty: "Квадрики и багги для грязи, поля и дальних выездов.", vy: "Квадроциклы и багги для бездорожья и дальних выездов.", pos: [1.2, 1.6, 1.4], look: [5.5, 1.2, -0.5], plan: [230, 100] },
  { n: "4", h: "Custom", ty: "Стена с цветами, наклейками и грипсами: собираем build на месте.", vy: "Стена с цветами, наклейками и аксессуарами: конфигурацию можно собрать на месте.", pos: [0, 1.6, -1.2], look: [0, 1.7, -5.9], plan: [140, 30] },
  { n: "5", h: "Сервис", ty: "Верстак, диагностика, батареи. Свой склад запчастей.", vy: "Верстак, диагностика, обслуживание батарей. Собственный склад запчастей.", pos: [-1.5, 1.6, 1.0], look: [-3.5, 1.0, 5.8], plan: [60, 168] },
];

function Tour() {
  const { t } = useApp();
  const wrap = useRef<HTMLDivElement>(null);
  const hs = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const go = useRef<(i: number) => void>(() => {});
  const [gl] = useState(() => hasWebGL());
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { setStarted(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el); return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!gl || !started || !wrap.current) return;
    let dead = false, cleanup = () => {};
    (async () => {
      const THREE = await import("three");
      if (dead || !wrap.current) return;
      const el = wrap.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(1.5, devicePixelRatio));
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:pan-y;position:absolute;inset:0";
      renderer.domElement.setAttribute("role", "img");
      renderer.domElement.setAttribute("aria-label", "3D-тур по шоуруму: перетаскивайте, чтобы осмотреться");
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x121418); scene.fog = new THREE.Fog(0x121418, 9, 24);
      const cam = new THREE.PerspectiveCamera(62, 1, 0.1, 60);
      scene.add(new THREE.HemisphereLight(0xe6fffa, 0x0e1013, 1.5));
      const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(2, 6, 3); scene.add(sun);
      const mk = (w: number, h: number, d: number, c: number, x: number, y: number, z: number, em = 0) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, emissive: em, emissiveIntensity: em ? 1 : 0 }));
        m.position.set(x, y, z); scene.add(m); return m;
      };
      const gc = document.createElement("canvas"); gc.width = gc.height = 128;
      const g = gc.getContext("2d")!; g.fillStyle = "#16393d"; g.fillRect(0, 0, 128, 128); g.strokeStyle = "#245358"; g.lineWidth = 3; g.strokeRect(0, 0, 128, 128);
      const gt = new THREE.CanvasTexture(gc); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(7, 6);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.9 }));
      fl.rotation.x = -Math.PI / 2; scene.add(fl);
      const wall = 0x23272e;
      mk(14, 4, 0.2, wall, 0, 2, -6); mk(0.2, 4, 12, wall, -7, 2, 0); mk(0.2, 4, 12, wall, 7, 2, 0); mk(14, 4, 0.2, wall, 0, 2, 6); mk(14, 0.2, 12, 0x0b0d10, 0, 4, 0);
      for (let i = 0; i < 5; i++) mk(2.4, 0.06, 0.12, 0xeef1f4, -5.2 + i * 2.6, 3.9, -1.5 + (i % 2 ? 2 : 0), 0xeef1f4);
      mk(14, 0.04, 0.1, 0xff4a2b, 0, 0.05, -5.9, 0xff4a2b);
      // кастом-стена: образцы цветов
      [0xff4a2b, 0xb9c2cc, 0xeef1f4, 0x1c2026, 0xc9a24b].forEach((c, i) => { for (let r = 0; r < 3; r++) mk(0.6, 0.6, 0.12, c, -2.4 + i * 1.2, 1.1 + r * 0.8, -5.8); });
      // верстак
      mk(3, 1, 0.9, 0x2f343c, -3.5, 0.5, 5.4); mk(3, 0.06, 1, 0xff4a2b, -3.5, 1.02, 5.4, 0xff4a2b);
      const loader = new THREE.TextureLoader();
      const bill = (id: string, x: number, z: number, ry: number, w: number, y = 0.1) => {
        const tx = loader.load(photo(id), (t2) => { const a = t2.image.width / t2.image.height; m.scale.set(1, 1 / a, 1); m.position.y = y + (w / a) / 2; });
        tx.colorSpace = THREE.SRGBColorSpace;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.MeshBasicMaterial({ map: tx, transparent: true, alphaTest: 0.08, side: THREE.DoubleSide }));
        m.position.set(x, y + w / 2, z); m.rotation.y = ry; scene.add(m);
        const p = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.45, w * 0.5, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0x2f343c }));
        p.position.set(x, 0.05, z); scene.add(p);
      };
      bill("79bike-titaone-s", -5.6, -2.8, Math.PI / 2, 3);
      bill("79bike-falcon-pro", -5.6, -0.4, Math.PI / 2, 3.2);
      bill("79bike-falcon-gt-1", -5.6, 2.0, Math.PI / 2, 3.4);
      bill("jq-jq-s1000", 5.6, -2.6, -Math.PI / 2, 2.7);
      bill("jq-jq-u1000", 5.6, -0.2, -Math.PI / 2, 3);
      bill("juhool-ssv-raider-pro", 5.6, 2.2, -Math.PI / 2, 2.8, 0.05);
      bill("79bike-falcon-gt-1", 0, -4.6, 0, 2.8);
      bill("79bike-falcon-pro", -3.6, 4.4, Math.PI, 2.2, 1.0);

      const cp = new THREE.Vector3(...STOPS[0].pos), tg = new THREE.Vector3(...STOPS[0].look);
      let yaw = 0, pit = 0, cur = 0;
      const set = (i: number) => {
        cur = (i + STOPS.length) % STOPS.length; const s = STOPS[cur];
        if (reduceMotion()) { cp.set(...s.pos); tg.set(...s.look); } else {
          gsap.to(cp, { x: s.pos[0], y: s.pos[1], z: s.pos[2], duration: 1.1, ease: "power3.inOut" });
          gsap.to(tg, { x: s.look[0], y: s.look[1], z: s.look[2], duration: 1.1, ease: "power3.inOut" });
        }
        yaw = 0; pit = 0; setIdx(cur);
      };
      go.current = set;
      let drag: { x: number; y: number } | null = null;
      const down = (e: PointerEvent) => { drag = { x: e.clientX, y: e.clientY }; };
      const up = () => { drag = null; };
      const move = (e: PointerEvent) => {
        if (!drag) return;
        yaw += (e.clientX - drag.x) * 0.005; pit = Math.max(-0.5, Math.min(0.5, pit + (e.clientY - drag.y) * 0.003));
        drag = { x: e.clientX, y: e.clientY };
      };
      renderer.domElement.addEventListener("pointerdown", down); window.addEventListener("pointerup", up); renderer.domElement.addEventListener("pointermove", move);
      const size = () => { const r = el.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / Math.max(1, r.height); cam.fov = r.width < 600 ? 74 : 62; cam.updateProjectionMatrix(); };
      size(); const ro = new ResizeObserver(size); ro.observe(el);
      let vis = true, raf = 0; const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; }); io.observe(el);
      const tmp = new THREE.Vector3();
      const btns = hs.current ? Array.from(hs.current.children) as HTMLElement[] : [];
      const tick = () => {
        raf = requestAnimationFrame(tick); if (!vis) return;
        cam.position.copy(cp);
        const dir = tg.clone().sub(cp); dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -yaw); dir.y += pit * dir.length() * 0.6;
        cam.lookAt(cp.clone().add(dir));
        const w = el.clientWidth, h = el.clientHeight;
        STOPS.forEach((s, i) => {
          const b = btns[i]; if (!b) return;
          tmp.set(s.look[0], Math.max(1.3, s.look[1] + 0.5), s.look[2]).project(cam);
          const on = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05 && i !== cur;
          b.style.display = on ? "" : "none"; b.style.left = ((tmp.x + 1) / 2) * w + "px"; b.style.top = ((1 - tmp.y) / 2) * h + "px";
        });
        renderer.render(scene, cam);
      };
      tick(); set(0);
      cleanup = () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener("pointerup", up); renderer.dispose(); renderer.domElement.remove(); };
    })();
    return () => { dead = true; cleanup(); };
  }, [gl, started]);

  const s = STOPS[idx];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="relative min-h-[340px] overflow-hidden rounded-3xl border border-ink/30 bg-ink sm:min-h-[460px]" data-cursor="drag">
        <div ref={wrap} className="absolute inset-0" />
        <div ref={hs} className="pointer-events-none absolute inset-0 overflow-hidden">
          {STOPS.map((x, i) => (
            <button key={x.n} className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-flare px-3 py-2 text-xs font-bold text-ink shadow-lg" style={{ display: "none" }} onClick={() => go.current(i)} aria-label={`Перейти: ${x.h}`}>{x.n} {x.h}</button>
          ))}
        </div>
        {!gl && <div className="absolute inset-0 grid place-items-center p-6 text-center text-frost"><p>WebGL недоступен: 3D-тур появится в браузере с WebGL. Схема зала справа.</p></div>}
        <div className="mono absolute left-4 top-4 rounded-full bg-deep/75 px-3 py-1 text-gold">прототип 3D-тура</div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-frost">
          <button className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-deep/80 hover:bg-flare hover:text-ink" aria-label="Предыдущая точка" onClick={() => go.current(idx - 1)}><ChevronLeft /></button>
          <div className="min-w-0 flex-1 rounded-2xl bg-deep/80 px-4 py-2 backdrop-blur">
            <div className="mono text-gold">точка {s.n} из {STOPS.length}</div>
            <div className="font-display text-lg font-extrabold uppercase leading-tight">{s.h}</div>
            <div className="hidden text-sm text-frost/85 sm:block">{t(s.ty, s.vy)}</div>
          </div>
          <button className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-deep/80 hover:bg-flare hover:text-ink" aria-label="Следующая точка" onClick={() => go.current(idx + 1)}><ChevronRight /></button>
        </div>
      </div>
      <div className="rounded-3xl border border-ink/30 bg-frost p-4">
        <div className="mono mb-2 text-mute">план зала</div>
        <svg viewBox="0 0 280 200" className="w-full" role="group" aria-label="План зала шоурума">
          <rect x="10" y="10" width="260" height="180" fill="none" stroke="#0e1013" strokeWidth="2" />
          {STOPS.map((x, i) => (
            <g key={x.n} tabIndex={0} role="button" aria-label={x.h} className="cursor-pointer outline-none" onClick={() => go.current(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") go.current(i); }}>
              <circle cx={x.plan[0]} cy={x.plan[1]} r="12" fill={i === idx ? "#ff4a2b" : "#d9dee3"} stroke="#0e1013" strokeWidth="2" />
              <text x={x.plan[0]} y={x.plan[1] + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0e1013" fontFamily="Martian Mono Variable" pointerEvents="none">{x.n}</text>
            </g>
          ))}
        </svg>
        <ol className="mt-2 space-y-1 text-sm">
          {STOPS.map((x, i) => (
            <li key={x.n}><button className={cn("min-h-9 w-full cursor-pointer rounded-lg px-2 text-left hover:bg-ink/10", i === idx && "bg-ink font-semibold text-frost hover:bg-ink")} onClick={() => go.current(i)}>{x.n}. {x.h}</button></li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function Showroom() {
  const { t } = useApp();
  return (
    <section id="showroom" className="relative py-28 sm:py-40" aria-labelledby="show-h">
      <div className="container-x">
        <Reveal>
          <Eyebrow n="10">шоурум</Eyebrow>
          <H2><span id="show-h">{t("Заходи", "Приезжайте")}</span> <span className="text-flare">{t("в Ростов", "в Ростов-на-Дону")}</span></H2>
          <p className="mt-4 max-w-2xl text-lg text-mute">{t("Офлайн-шоурум, сервис и склад в Ростове-на-Дону. Из Москвы и Краснодарского края везем технику к тебе.", "Офлайн-шоурум, сервис и склад в Ростове-на-Дону. В Москву и Краснодарский край доставляем технику.")}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="overflow-hidden rounded-3xl border border-ink/30"><MapSvg /></div>
          <div className="rounded-3xl border border-ink/30 bg-frost p-5 text-sm">
            <div className="mono text-mute">шоурум E-Rizz</div>
            <p className="font-display mt-2 text-2xl font-extrabold uppercase">Ростов-на-Дону</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <div><dt className="mono text-mute">адрес</dt><dd className="font-semibold">ул. Примерная, 0 (заглушка)</dd></div>
              <div><dt className="mono text-mute">телефон</dt><dd className="font-semibold">+7 (000) 000-00-00</dd></div>
              <div><dt className="mono text-mute">часы</dt><dd className="font-semibold">ежедневно 10:00-20:00</dd></div>
            </dl>
            <ul className="mt-5 divide-y divide-ink/15 border-y border-ink/15">
              {[["Ростов-на-Дону", "шоурум, сервис, склад, тест-драйв на месте"], ["Москва", "доставка, выдача и тест-драйв по записи"], ["Краснодарский край", "выезд с тест-драйвом, доставка по договоренности"]].map(([c, d]) => (
                <li key={c} className="flex flex-wrap items-baseline justify-between gap-2 py-3"><b className="font-display uppercase">{c}</b><span className="text-mute">{d}</span></li>
              ))}
            </ul>
            <p className="mt-4 text-mute">{t("Адрес и телефон пока заглушки. Сайт-макет: настоящие данные подставим перед запуском.", "Адрес и телефон пока заглушки. Настоящие данные будут подставлены перед запуском.")}</p>
          </div>
        </div>
        <div className="mt-4"><Tour /></div>
      </div>
    </section>
  );
}
