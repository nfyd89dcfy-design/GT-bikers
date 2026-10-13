import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(ScrollTrigger, SplitText);

/* ---------- materials ---------- */
const C = { pine: 0x0f1a16, frame: 0x14191a, accent: 0x7c4dff, ember: 0xff4b1f, fog: 0xe8edea };
const mats = () => ({
  frame: new THREE.MeshStandardMaterial({ color: C.frame, roughness: 0.82, metalness: 0.25 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x0b0e0e, roughness: 0.9, metalness: 0.1 }),
  tire: new THREE.MeshStandardMaterial({ color: 0x0a0c0c, roughness: 0.95, metalness: 0 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x8f9a96, roughness: 0.35, metalness: 0.9 }),
  accent: new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.55, metalness: 0.1 }),
  ember: new THREE.MeshStandardMaterial({ color: C.ember, roughness: 0.5, metalness: 0.1, emissive: 0xff3a10, emissiveIntensity: 0.25 }),
  light: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.4 })
});

const V = (x, y, z) => new THREE.Vector3(x, y, z);
function tube(a, b, r, m, r2) {
  const va = V(...a), vb = V(...b), len = va.distanceTo(vb);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r2 ?? r, r, len, 18), m);
  mesh.position.copy(va).add(vb).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), vb.clone().sub(va).normalize());
  return mesh;
}
function box(w, h, d, m, rad) {
  const g = rad ? new RoundedBoxGeometry(w, h, d, 4, Math.min(w, h, d) * 0.42) : new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(g, m);
}

function wheel(R, tr, m, knobs, hubMat) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(R, tr, 20, 72), m.tire); g.add(tire);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R - tr * 0.7, tr * 0.28, 12, 64), m.metal); g.add(rim);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const s = tube([0, 0, (i % 2 ? 1 : -1) * 0.012], [Math.cos(a) * (R - tr), Math.sin(a) * (R - tr), 0], 0.004, m.metal); g.add(s);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.2, R * 0.2, tr * 2.2, 28), hubMat || m.dark); hub.rotation.x = Math.PI / 2; g.add(hub);
  const rotor = new THREE.Mesh(new THREE.TorusGeometry(R * 0.38, 0.006, 8, 40), m.metal); rotor.position.z = tr * 1.2; g.add(rotor);
  if (knobs) {
    const kg = new THREE.BoxGeometry(tr * 0.7, tr * 0.5, tr * 1.5);
    for (let i = 0; i < 44; i++) { const a = (i / 44) * Math.PI * 2; const k = new THREE.Mesh(kg, m.tire); k.position.set(Math.cos(a) * (R + tr * 0.9), Math.sin(a) * (R + tr * 0.9), 0); k.rotation.z = a; g.add(k); }
  }
  return g;
}

/* type: city | enduro | quad | buggy */
export function buildVehicle(type, m = mats()) {
  const root = new THREE.Group();
  const add = (name, obj) => { obj.name = name; root.add(obj); return obj; };
  if (type === 'quad' || type === 'buggy') {
    const R = type === 'quad' ? 0.3 : 0.34, tr = type === 'quad' ? 0.14 : 0.12, wb = 0.62, tk = type === 'quad' ? 0.46 : 0.55;
    [[wb, tk], [wb, -tk], [-wb, tk], [-wb, -tk]].forEach(([x, z], i) => {
      const w = wheel(R, tr, m, true, m.ember); w.position.set(x, R + 0.02, z); add('w' + i, w);
    });
    const body = new THREE.Group();
    const floor = box(1.5, 0.08, 0.7, m.frame); floor.position.set(0, 0.34, 0); body.add(floor);
    const hood = box(0.7, 0.2, 0.62, m.frame, true); hood.position.set(0.68, 0.5, 0); body.add(hood);
    const rear = box(0.5, 0.2, 0.7, m.frame, true); rear.position.set(-0.62, 0.5, 0); body.add(rear);
    add('body', body);
    const axles = new THREE.Group();
    axles.add(tube([wb, 0.3, tk], [wb, 0.3, -tk], 0.03, m.metal), tube([-wb, 0.3, tk], [-wb, 0.3, -tk], 0.03, m.metal));
    add('axles', axles);
    if (type === 'quad') {
      const seat = box(0.55, 0.12, 0.28, m.dark, true); seat.position.set(-0.15, 0.68, 0); add('seat', seat);
      const bars = new THREE.Group();
      bars.add(tube([0.35, 0.5, 0], [0.4, 0.98, 0], 0.025, m.metal), tube([0.4, 0.98, 0.36], [0.4, 0.98, -0.36], 0.02, m.frame));
      [0.36, -0.36].forEach(z => { const gr = tube([0.4, 0.98, z], [0.4, 0.98, z * 1.25], 0.032, m.accent); bars.add(gr); });
      add('bars', bars);
      const rack = box(0.4, 0.04, 0.5, m.frame); rack.position.set(-0.7, 0.72, 0); add('rack', rack);
      const batt = box(0.5, 0.2, 0.34, m.dark); batt.position.set(0.1, 0.5, 0); add('battery', batt);
      const lamp = box(0.04, 0.08, 0.26, m.light); lamp.position.set(0.97, 0.52, 0); add('light', lamp);
    } else {
      const cage = new THREE.Group();
      [[0.3, 0.38], [0.3, -0.38], [-0.45, 0.38], [-0.45, -0.38]].forEach(([x, z]) => cage.add(tube([x, 0.38, z], [x, 1.18, z], 0.022, m.frame)));
      cage.add(tube([0.3, 1.18, 0.38], [0.3, 1.18, -0.38], 0.022, m.frame), tube([-0.45, 1.18, 0.38], [-0.45, 1.18, -0.38], 0.022, m.frame));
      cage.add(tube([0.3, 1.18, 0.38], [-0.45, 1.18, 0.38], 0.022, m.accent), tube([0.3, 1.18, -0.38], [-0.45, 1.18, -0.38], 0.022, m.accent));
      cage.add(tube([0.3, 0.7, 0.38], [-0.45, 0.7, 0.38], 0.018, m.frame), tube([0.3, 0.7, -0.38], [-0.45, 0.7, -0.38], 0.018, m.frame));
      add('cage', cage);
      [0.17, -0.17].forEach((z, i) => { const s = box(0.3, 0.5, 0.26, m.dark, true); s.position.set(-0.1, 0.62, z); add('seat' + i, s); });
      const wheelb = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 28), m.accent); wheelb.position.set(0.22, 0.72, 0.17); wheelb.rotation.y = 1.1; add('steer', wheelb);
      const batt = box(0.7, 0.16, 0.5, m.dark); batt.position.set(-0.55, 0.45, 0); add('battery', batt);
      const lamp = box(0.04, 0.08, 0.5, m.light); lamp.position.set(0.96, 0.52, 0); add('light', lamp);
    }
    return root;
  }
  const en = type === 'enduro';
  const R = en ? 0.4 : 0.34, tr = en ? 0.075 : 0.035, wbh = 0.58, ay = R + 0.01;
  const rw = wheel(R, tr, m, en, m.ember); rw.position.set(-wbh, ay, 0); add('wheelR', rw);
  const fw = wheel(R, tr, m, en, m.dark); fw.position.set(wbh, ay, 0); add('wheelF', fw);
  const lean = en ? 0.26 : 0.14; // fork rake
  const head = [0.36, ay + (en ? 0.62 : 0.56), 0], headB = [0.4, ay + (en ? 0.44 : 0.4), 0];
  const bb = [-0.04, ay - 0.1, 0], seatTop = [-0.3, ay + (en ? 0.66 : 0.6), 0];
  const frame = new THREE.Group();
  frame.add(tube(seatTop, head, 0.026, m.frame), tube(bb, seatTop, 0.026, m.frame), tube([-wbh, ay, 0.06], bb, 0.02, m.frame), tube([-wbh, ay, -0.06], bb, 0.02, m.frame), tube([-wbh, ay, 0.06], seatTop, 0.016, m.frame), tube([-wbh, ay, -0.06], seatTop, 0.016, m.frame));
  const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 20), m.frame); hb.position.set(0.38, ay + (en ? 0.53 : 0.48), 0); hb.rotation.z = -0.25; frame.add(hb);
  add('frame', frame);
  const battery = box(0.62, 0.11, 0.14, m.dark, true); battery.position.copy(V(...headB).add(V(...bb)).multiplyScalar(0.5)).add(V(0, 0.01, 0)); battery.rotation.z = Math.atan2(headB[1] - bb[1], headB[0] - bb[0]); add('battery', battery);
  const strip = box(0.46, 0.012, 0.145, m.ember); strip.position.copy(battery.position); strip.position.y += 0.062; strip.rotation.z = battery.rotation.z; add('strip', strip);
  const fork = new THREE.Group();
  [0.065, -0.065].forEach(z => fork.add(tube([0.34, head[1] + 0.03, z], [wbh, ay, z], 0.019, m.metal, 0.014)));
  fork.add(tube([0.33, head[1] + 0.03, 0.065], [0.33, head[1] + 0.03, -0.065], 0.02, m.frame));
  add('fork', fork);
  const bars = new THREE.Group();
  const by = head[1] + (en ? 0.2 : 0.16);
  bars.add(tube([0.34, head[1] + 0.03, 0], [0.31, by, 0], 0.022, m.frame));
  const w2 = en ? 0.34 : 0.26;
  bars.add(tube([0.31, by, w2], [0.31, by, -w2], 0.015, m.frame));
  [1, -1].forEach(s => { bars.add(tube([0.31, by, s * w2], [0.31, by, s * (w2 + 0.1)], 0.021, m.accent)); bars.add(tube([0.31, by, s * w2 * 0.9], [0.4, by - 0.04, s * w2 * 0.9], 0.008, m.metal)); });
  add('bars', bars);
  const seat = box(en ? 0.62 : 0.4, 0.07, 0.15, m.dark, true); seat.position.set(seatTop[0] - (en ? 0.12 : 0.02), seatTop[1] + 0.05, 0); add('seat', seat);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.34, R * 0.34, 0.1, 32), m.frame); motor.rotation.x = Math.PI / 2; motor.position.set(-wbh, ay, 0); add('motor', motor);
  const mring = new THREE.Mesh(new THREE.TorusGeometry(R * 0.34, 0.008, 8, 40), m.ember); mring.position.set(-wbh, ay, 0.055); add('mring', mring);
  const ctrl = box(0.16, 0.06, 0.08, m.frame); ctrl.position.set(-0.2, ay + 0.28, 0.07); add('controller', ctrl);
  const lamp = box(0.04, 0.07, 0.1, m.light); lamp.position.set(0.44, head[1] + 0.02, 0); add('light', lamp);
  const fender = new THREE.Mesh(new THREE.TorusGeometry(R + tr + 0.03, 0.012, 8, 40, Math.PI * 0.6), m.frame); fender.position.set(wbh, ay, 0); fender.rotation.z = Math.PI * 0.2; fender.scale.z = 3; add('fender', fender);
  if (en) { const plate = box(0.2, 0.2, 0.02, m.accent); plate.position.set(0.5, head[1] - 0.08, 0); plate.rotation.y = Math.PI / 2; plate.rotation.z = 0.2; add('plate', plate); }
  return root;
}

const recolor=()=>{}; const tagFrame=()=>{};
function centerOnGround(root) { const b = new THREE.Box3().setFromObject(root); const c = b.getCenter(V(0, 0, 0)); root.position.x -= c.x; root.position.z -= c.z; root.position.y -= b.min.y; }

/* ---------- common renderer ---------- */
function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
  return r;
}
function envMap(r, scene) { const p = new THREE.PMREMGenerator(r); scene.environment = p.fromScene(new RoomEnvironment(), 0.04).texture; }
function fit(r, cam, el) { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
function visible(el, cb) { let v = true; new IntersectionObserver(e => { v = e[e.length - 1].isIntersecting; cb && cb(v); }, { rootMargin: '100px' }).observe(el); return () => v; }
function groundShadow(scene, w = 4) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.ShadowMaterial({ opacity: 0.22 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g); return g;
}
function lights(scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb3a8, 0.5));
  const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(2.5, 4, 3); d.castShadow = true; d.shadow.mapSize.set(1024, 1024);
  Object.assign(d.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 12 }); scene.add(d);
  const rim = new THREE.DirectionalLight(0xff6a3a, 1.1); rim.position.set(-3, 1.5, -2.5); scene.add(rim);
}
function shadowize(root) { root.traverse(o => { if (o.isMesh) o.castShadow = true; }); }

/* ---------- viewer (drag rotate) ---------- */
export function createViewer(canvas, opt = {}) {
  const host = opt.host || canvas.parentElement;
  const r = makeRenderer(canvas), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  envMap(r, scene); lights(scene); groundShadow(scene);
  let model = null, type = opt.type || 'city', yaw = -0.6, pitch = 0.12, vel = 0.0035, drag = false, lx = 0, ly = 0, auto = !opt.still, dist = 4.3, zoomK = 1;
  const pivot = new THREE.Group(); scene.add(pivot);
  const M = mats(); let colors = { frame: C.frame, accent: C.accent };
  function set(t) {
    if (model) pivot.remove(model);
    type = t; model = buildVehicle(t, M); centerOnGround(model); shadowize(model); pivot.add(model);
    dist = t === 'buggy' ? 5.2 : t === 'quad' ? 4.5 : 4.0;
  }
  set(type);
  const down = e => { drag = true; lx = e.clientX; ly = e.clientY; auto = false; canvas.setPointerCapture(e.pointerId); canvas.classList.add('drag'); };
  const move = e => { if (!drag) return; yaw += (e.clientX - lx) * 0.01; pitch = Math.max(-0.1, Math.min(0.8, pitch + (e.clientY - ly) * 0.006)); lx = e.clientX; ly = e.clientY; };
  const up = () => { drag = false; canvas.classList.remove('drag'); };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') yaw -= 0.15; if (e.key === 'ArrowRight') yaw += 0.15; auto = false; });
  const isVis = visible(host);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function loop() {
    requestAnimationFrame(loop); if (!isVis()) return;
    fit(r, cam, host);
    if (auto && !reduce) yaw += 0.006;
    const d = dist * zoomK; pivot.rotation.y = yaw;
    cam.position.set(0, 0.9 + pitch * 2.2, d * (cam.aspect < 1 ? 1.45 : 1)); cam.lookAt(0, 0.45, 0);
    r.render(scene, cam);
  }
  loop();
  return { setType: set, setColors(c) { colors = { ...colors, ...c }; M.frame.color.set(colors.frame); M.accent.color.set(colors.accent); }, auto(v) { auto = v; }, get type() { return type; }, snapshot() { return canvas.toDataURL(); } };
}

/* ---------- hero: assembly on scroll ---------- */
export function createHero(canvas, host, { onProgress } = {}) {
  const r = makeRenderer(canvas), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  envMap(r, scene); lights(scene); groundShadow(scene, 6);
  const HM = mats(); let model, type = 'city', progress = 1, yawBase = -0.55, mx = 0, my = 0;
  const parts = [];
  function set(t) {
    if (model) scene.remove(model); parts.length = 0; type = t;
    model = buildVehicle(t, HM); centerOnGround(model); shadowize(model); scene.add(model);
    const n = model.children.length;
    model.children.forEach((o, i) => {
      const a = i * 2.399, rr = 1.6 + (i % 3) * 0.7;
      parts.push({ o, home: o.position.clone(), rot: o.rotation.clone(), from: V(Math.cos(a) * rr, 0.8 + (i % 4) * 0.5, Math.sin(a) * rr), d: (i / n) * 0.55, spin: (i % 2 ? 1 : -1) * (1 + (i % 3)) });
    });
    apply();
  }
  const ease = x => 1 - Math.pow(1 - x, 3);
  function apply() {
    parts.forEach(p => {
      const k = ease(Math.max(0, Math.min(1, (progress - p.d) / 0.42)));
      p.o.position.copy(p.home).addScaledVector(p.from, 1 - k); p.o.rotation.set(p.rot.x, p.rot.y + (1 - k) * p.spin, p.rot.z + (1 - k) * 0.6 * p.spin);
      p.o.visible = k > 0.001;
    });
  }
  set(type);
  const isVis = visible(host); const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  function loop() {
    requestAnimationFrame(loop); if (!isVis()) return;
    fit(r, cam, host);
    const narrow = cam.aspect < 0.9, sc = narrow ? 0.62 : 0.72;
    const yaw = -0.62 + progress * 0.3 + (reduce ? 0 : mx * 0.3 + Math.sin(performance.now() * 0.00035) * 0.12);
    model.rotation.y += (yaw - model.rotation.y) * 0.08;
    const wob = Math.sin(performance.now() * 0.0004) * 0.02;
    const dd = narrow ? 5.4 : 4.3 + (1 - progress) * 1.2, ox = narrow ? 0 : -0.8 * dd / 4.3; cam.position.set(ox, (narrow ? 1.2 : 0.8) + (reduce ? 0 : my * 0.3), dd); cam.lookAt(ox, narrow ? 1.0 : 0.5 + wob, 0);
    model.scale.setScalar(sc * (type === 'buggy' ? 0.8 : 1));
    r.render(scene, cam);
  }
  loop();
  if (!reduce) {
    const st = { v: 0 };
    progress = 0; apply();
    ScrollTrigger.create({
      trigger: host.closest('.hero'), start: 'top top', end: '+=140%', pin: host.closest('.hero-pin'), scrub: 0.6,
      onUpdate: s => { progress = Math.min(1, s.progress * 1.5); apply(); onProgress && onProgress(progress); }
    });
    // intro assembly so the first screen is alive before scroll
    gsap.to(st, { v: 1, duration: 1.8, ease: 'power3.out', delay: 0.15, onUpdate() { if (ScrollTrigger.getAll().length && window.scrollY < 10) { progress = Math.max(progress, st.v * 0.62); apply(); onProgress && onProgress(progress); } } });
  } else { progress = 1; apply(); onProgress && onProgress(1); }
  return { dbg: () => ({ vis: parts.filter(p => p.o.visible).length, n: parts.length, sc: model.scale.x, cam: cam.position.toArray(), ry: model.rotation.y, mp: model.position.toArray(), a: cam.aspect }), setType: t => { set(t); if (reduce) { progress = 1; apply(); } else apply(); }, get progress() { return progress; } };
}

/* ---------- showroom tour ---------- */
export function createTour(canvas, host, hotLayer, stops, hotspots, onStop) {
  const r = makeRenderer(canvas), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(68, 1, 0.05, 60);
  scene.background = new THREE.Color(0xdfe6e2); scene.fog = new THREE.Fog(0xdfe6e2, 12, 30);
  envMap(r, scene);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xaab8b0, 0.7));
  const m = mats();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), new THREE.MeshStandardMaterial({ color: 0xbfc9c4, roughness: 0.55, metalness: 0.15 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallM = new THREE.MeshStandardMaterial({ color: 0xf3f6f4, roughness: 0.9 });
  const wall = (w, h, x, y, z, ry) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallM); o.position.set(x, y, z); o.rotation.y = ry; scene.add(o); return o; };
  wall(16, 4, 0, 2, -6, 0); wall(16, 4, 0, 2, 6, Math.PI); wall(12, 4, -8, 2, 0, Math.PI / 2); wall(12, 4, 8, 2, 0, -Math.PI / 2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), new THREE.MeshStandardMaterial({ color: 0xe9eeeb })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 4; scene.add(ceil);
  for (let i = -3; i <= 3; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 9), m.light); s.position.set(i * 2.2, 3.96, 0); scene.add(s); const pl = new THREE.PointLight(0xffffff, 6, 9); pl.position.set(i * 2.2, 3.5, 0); scene.add(pl); }
  // window glow on back wall
  const win = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.4), new THREE.MeshBasicMaterial({ color: 0xfff1e6 })); win.position.set(-4, 2.1, -5.98); scene.add(win);
  // logo wall (canvas texture)
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const cx = cv.getContext('2d');
  cx.fillStyle = '#0F1A16'; cx.fillRect(0, 0, 1024, 512); cx.strokeStyle = '#E8EDEA'; cx.lineCap = 'round'; cx.lineWidth = 36; cx.beginPath(); cx.moveTo(300, 110); cx.lineTo(300, 400); cx.moveTo(724, 110); cx.lineTo(724, 400); cx.stroke();
  cx.strokeStyle = '#FF4B1F'; cx.lineWidth = 30; cx.beginPath(); cx.moveTo(300, 255); cx.bezierCurveTo(340, 130, 400, 130, 430, 255); cx.bezierCurveTo(455, 340, 490, 340, 505, 255); cx.bezierCurveTo(515, 230, 535, 235, 545, 255); cx.lineTo(724, 255); cx.stroke();
  const lw = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })); lw.position.set(3.4, 2.1, -5.97); scene.add(lw);
  // plinths + vehicles
  const kinds = [['city', -2.4, -1.2, 0.5], ['enduro', 0.2, -2.6, 0.2], ['quad', 3.6, -0.8, -0.5], ['buggy', 0, 2.2, 0.8]];
  kinds.forEach(([t, x, z, ry]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.4, 0.12, 48), new THREE.MeshStandardMaterial({ color: 0x0f1a16, roughness: 0.6 })); p.position.set(x, 0.06, z); scene.add(p);
    const rg = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.012, 6, 64), m.ember); rg.rotation.x = Math.PI / 2; rg.position.set(x, 0.125, z); scene.add(rg);
    const v = buildVehicle(t); centerOnGround(v); v.position.add(V(x, 0.12, z)); v.rotation.y = ry; v.scale.setScalar(t === 'buggy' ? 0.85 : 1); tagFrame(v); scene.add(v);
  });
  // custom wall + service bench
  for (let i = 0; i < 7; i++) { const t = box(0.5, 0.3, 0.05, i % 3 === 0 ? m.accent : i % 3 === 1 ? m.ember : m.dark); t.position.set(-7.9 + 0.03, 1 + (i % 4) * 0.4, 1.5 + Math.floor(i / 4) * 0.7 - 0.4); t.rotation.y = Math.PI / 2; scene.add(t); }
  const bench = box(2.4, 0.9, 0.8, m.dark); bench.position.set(6.6, 0.45, 3.8); scene.add(bench);
  const bench2 = box(2.4, 0.04, 0.9, m.metal); bench2.position.set(6.6, 0.92, 3.8); scene.add(bench2);
  // cart
  const isVis = visible(host);
  let yaw = 0, pitch = 0, tYaw = 0, pos = V(...stops[0].p), drag = false, lx = 0, ly = 0, cur = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function go(i) {
    cur = i; const s = stops[i]; onStop && onStop(i);
    if (reduce) { pos.set(...s.p); yaw = s.yaw; return; }
    gsap.to(pos, { x: s.p[0], y: s.p[1], z: s.p[2], duration: 1.4, ease: 'power3.inOut' });
    const d = ((s.yaw - yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    gsap.to({ v: 0 }, { v: 1, duration: 1.4, ease: 'power3.inOut', onUpdate() { } });
    gsap.to(canvas, { duration: 0 });
    const o = { y: yaw }; gsap.to(o, { y: yaw + d, duration: 1.4, ease: 'power3.inOut', onUpdate: () => { yaw = o.y; } });
  }
  go(0);
  canvas.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!drag) return; yaw += (e.clientX - lx) * 0.006; pitch = Math.max(-0.35, Math.min(0.35, pitch + (e.clientY - ly) * 0.003)); lx = e.clientX; ly = e.clientY; });
  const up = () => { drag = false; }; canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  const hs = hotspots.map(h => { const b = document.createElement('button'); b.className = 'hot'; b.type = 'button'; b.innerHTML = '<i></i><span>' + h.label + '</span>'; b.addEventListener('click', () => h.onClick && h.onClick(h)); hotLayer.appendChild(b); return { ...h, el: b, v: V(...h.p) }; });
  function loop() {
    requestAnimationFrame(loop); if (!isVis()) return;
    fit(r, cam, host);
    cam.position.copy(pos); cam.rotation.set(pitch, 0, 0, 'YXZ'); cam.rotation.y = yaw; cam.rotation.order = 'YXZ';
    r.render(scene, cam);
    const w = host.clientWidth, h = host.clientHeight; cam.updateMatrixWorld();
    hs.forEach(o => {
      const p = o.v.clone().project(cam); const on = p.z < 1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05;
      o.el.style.display = on ? '' : 'none'; if (on) o.el.style.transform = `translate(${(p.x * 0.5 + 0.5) * w}px,${(-p.y * 0.5 + 0.5) * h}px) translate(-50%,-50%)`;
    });
  }
  loop();
  return { go, get cur() { return cur; } };
}


/* ---------- still renders (product pictures from the same 3D model) ---------- */
let stillR, stillEnv; const stillCache = new Map();
export function renderStill(type, { frame = C.frame, accent = C.accent } = {}, w = 720, h = 470, yaw = -0.55) {
  const key = [type, frame, accent, w, h, yaw].join('|'); if (stillCache.has(key)) return stillCache.get(key);
  if (!stillR) { const c = document.createElement('canvas'); stillR = makeRenderer(c); stillR.setPixelRatio(1); const p = new THREE.PMREMGenerator(stillR); stillEnv = p.fromScene(new RoomEnvironment(), 0.04).texture; }
  const scene = new THREE.Scene(); scene.environment = stillEnv; lights(scene); groundShadow(scene, 6);
  const M = mats(); M.frame.color.set(frame); M.accent.color.set(accent);
  const v = buildVehicle(type, M); centerOnGround(v); shadowize(v); v.rotation.y = yaw; scene.add(v);
  const cam = new THREE.PerspectiveCamera(28, w / h, 0.1, 50); const d = type === 'buggy' ? 5.6 : type === 'quad' ? 4.6 : 4.0;
  cam.position.set(0, 1.1, d); cam.lookAt(0, 0.42, 0); stillR.setSize(w, h, false); stillR.render(scene, cam);
  const url = stillR.domElement.toDataURL('image/png'); stillCache.set(key, url); return url;
}

/* ---------- shader background ---------- */
const FRAG = `#version 300 es
precision highp float; out vec4 o;
uniform vec2 uRes; uniform float uT; uniform vec2 uM; uniform vec3 uBg, uInk, uHot; uniform float uK;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(3.1,1.7);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes; vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y; float t=uT*.05;
  vec2 m=(uM-.5)*vec2(uRes.x/uRes.y,1.);
  float d=length(p-m); p+= (p-m)*exp(-d*3.)*.12;
  vec2 q=vec2(fbm(p*1.5+t),fbm(p*1.5+vec2(5.2,1.3)-t));
  vec2 r=vec2(fbm(p*2.+q*2.+vec2(1.7,9.2)+t*1.3),fbm(p*2.+q*2.+vec2(8.3,2.8)-t));
  float f=fbm(p*1.3+r*1.7+uK);
  float L=f*8.; float aa=min(fwidth(L)*1.1,.07);
  float ln=1.-smoothstep(0.,aa+.035,abs(fract(L)-.5)-.455);
  float bloom=exp(-length((uv-vec2(.72+.1*sin(uT*.2),.42))*vec2(1.,.8))*3.2)*(.55+.45*f);
  bloom+=exp(-d*4.)*.5;
  vec3 col=uBg;
  col=mix(col,mix(uHot,vec3(1.,.86,.8),.35),bloom*.38);
  col=mix(col,uInk,ln*(.07+.12*smoothstep(.2,.8,f)));
  float grain=h(gl_FragCoord.xy+uT)*.03; col+=grain-.015;
  o=vec4(col,1.);
}`;
export function createShader(canvas, host, { bg = [0.91, 0.929, 0.918], ink = [0.06, 0.1, 0.086], hot = [1, 0.294, 0.12], k = 0 } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
  if (!gl) { canvas.style.display = 'none'; return null; }
  const mk = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(x)); return x; };
  const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, `#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { canvas.style.display = 'none'; return null; }
  gl.useProgram(pr); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  const u = { res: U('uRes'), t: U('uT'), m: U('uM'), bg: U('uBg'), ink: U('uInk'), hot: U('uHot'), k: U('uK') };
  const st = { bg, ink, hot, k }; let mx = 0.6, my = 0.5, tx = 0.6, ty = 0.5; const isVis = visible(host);
  addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = 1 - (e.clientY - r.top) / r.height; });
  const dpr = Math.min(devicePixelRatio, 1.5) * 0.6;
  function draw(time) {
    requestAnimationFrame(draw); if (!isVis()) return;
    const w = Math.max(2, Math.floor(host.clientWidth * dpr)), h = Math.max(2, Math.floor(host.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    gl.uniform2f(u.res, w, h); gl.uniform1f(u.t, time * 0.001); gl.uniform2f(u.m, mx, my); gl.uniform3fv(u.bg, st.bg); gl.uniform3fv(u.ink, st.ink); gl.uniform3fv(u.hot, st.hot); gl.uniform1f(u.k, st.k);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(draw);
  return { set(o) { Object.assign(st, o); } };
}

export { gsap, ScrollTrigger, SplitText, THREE };
