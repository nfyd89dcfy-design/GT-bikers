/* Процедурные 3D-модели E-Rizz (three.js) + общий рендерер + загрузчик GLB.
   Модели: Base / Sport / Pro. Если в public/models лежит base.glb | sport.glb | pro.glb,
   используется он (GLTFLoader), иначе строится процедурная модель.
   Координаты: +X вперед, +Y вверх, Z вбок. Единицы: метры. */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

declare const __GLB_LIST__: string[];
export type Variant = "base" | "sport" | "pro" | "road" | "roadpro";
export type Lod = "hi" | "lo";

interface Pal {
  frame: string; frameM: number; frameR: number; plastic: string; plasticClear: boolean; rim: string; rimM: number; rimR: number;
  lowers: string; stanch: string; spring: string; battery: string; batteryM: number; batteryR: number; clamp: string; clampM: number; clampR: number;
  caliper: string; seat: string; decal: string; stripe: string | null; trim: string | null; wheelsIn: [number, number]; s: number;
}
export const PAL: Record<"base" | "sport" | "pro", Pal> = {
  base: { frame: "#101216", frameM: 0.45, frameR: 0.62, plastic: "#15171b", plasticClear: false, rim: "#3d434b", rimM: 0.95, rimR: 0.38, lowers: "#1b1e23", stanch: "#4a5058", spring: "#ff4a2b", battery: "#1a1d22", batteryM: 0.6, batteryR: 0.5, clamp: "#16181c", clampM: 0.7, clampR: 0.4, caliper: "#ff4a2b", seat: "#0c0d0f", decal: "#ff4a2b", stripe: "#ff4a2b", trim: null, wheelsIn: [17, 14], s: 0.9 },
  sport: { frame: "#9aa3ad", frameM: 0.95, frameR: 0.32, plastic: "#1f242a", plasticClear: true, rim: "#ff4a2b", rimM: 0.55, rimR: 0.3, lowers: "#c4ccd4", stanch: "#eef1f4", spring: "#ff4a2b", battery: "#262b32", batteryM: 0.8, batteryR: 0.35, clamp: "#e4e8ec", clampM: 1, clampR: 0.08, caliper: "#e4e8ec", seat: "#0c0d0f", decal: "#f2f4f6", stripe: "#ff4a2b", trim: "#e4e8ec", wheelsIn: [19, 18], s: 0.96 },
  pro: { frame: "#4d0f1e", frameM: 0.2, frameR: 0.32, plastic: "#6c1629", plasticClear: true, rim: "#2a5bd7", rimM: 0.85, rimR: 0.28, lowers: "#2a5bd7", stanch: "#c4d9f2", spring: "#9cc9ff", battery: "#dfe4e9", batteryM: 1, batteryR: 0.1, clamp: "#8db4e8", clampM: 1, clampR: 0.2, caliper: "#9cc9ff", seat: "#0c0d0f", decal: "#bcd9ff", stripe: "#9cc9ff", trim: "#bcd0e8", wheelsIn: [21, 18], s: 1 },
};

/* ------------------------------------------------------------ GLB */
const glbCache = new Map<Variant, Promise<THREE.Group | null>>();
function loadGLB(v: Variant): Promise<THREE.Group | null> {
  const name = `${v}.glb`;
  if (typeof __GLB_LIST__ === "undefined" || !__GLB_LIST__.includes(name)) return Promise.resolve(null);
  if (!glbCache.has(v)) {
    glbCache.set(v, fetch(`${import.meta.env.BASE_URL}models/${name}`).then((r) => (r.ok ? r.arrayBuffer() : null)).then((buf) => {
      if (!buf || new TextDecoder().decode(buf.slice(0, 4)) !== "glTF") return null;
      const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
      return new Promise<THREE.Group | null>((res) => ld.parse(buf, "", (g) => res(g.scene), () => res(null)));
    }).catch(() => null));
  }
  return glbCache.get(v)!.then((g) => (g ? (g.clone(true) as THREE.Group) : null));
}
/** Перекраска основного пластика GLB (материал GT_paint). */
function paintGLB(g: THREE.Object3D, paint?: string) {
  g.traverse((o) => {
    const m = o as THREE.Mesh; if (!m.isMesh) return;
    const arr = Array.isArray(m.material) ? m.material : [m.material];
    m.material = arr.map((mt) => {
      const mm = mt as THREE.MeshStandardMaterial;
      if (paint && mm.name === "GT_paint") { const c = mm.clone(); c.color.set(paint); return c; }
      return mt;
    }) as unknown as THREE.Material;
    if (Array.isArray(m.material) && m.material.length === 1) m.material = m.material[0];
  });
  return g;
}
const REAL_LEN: Record<string, number> = { base: 1.62, sport: 1.98, pro: 2.14, road: 2.02, roadpro: 2.06 };
function normalizeGLB(g: THREE.Group, v: Variant): THREE.Group {
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g, true);
  const size = box.getSize(new THREE.Vector3());
  const wrap = new THREE.Group();
  if (size.z > size.x) g.rotation.y = Math.PI / 2;
  g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g, true);
  const s2 = b2.getSize(new THREE.Vector3());
  const L = Math.max(s2.x, s2.z) || 1;
  g.scale.multiplyScalar((REAL_LEN[v] ?? 1.95) / L);
  g.updateMatrixWorld(true);
  const b3 = new THREE.Box3().setFromObject(g, true);
  const c = b3.getCenter(new THREE.Vector3());
  g.position.set(-c.x, -b3.min.y, -c.z);
  g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = false; } });
  wrap.add(g);
  return wrap;
}

/* ------------------------------------------------------------ helpers */
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
type Mat = THREE.Material;
function mesh(g: THREE.BufferGeometry, m: Mat, cast = true) { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = false; return o; }
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, m: Mat, seg = 12) {
  const d = b.clone().sub(a); const len = d.length();
  const o = mesh(new THREE.CylinderGeometry(r, r, 1, seg), m); o.scale.y = len;
  o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(UP, d.normalize()); return o;
}
function beam(a: THREE.Vector3, b: THREE.Vector3, w: number, h: number, m: Mat) {
  const d = b.clone().sub(a); const len = d.length();
  const o = mesh(new RoundedBoxGeometry(w, len, h, 2, Math.min(w, h) * 0.3), m);
  o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(UP, d.normalize()); return o;
}
function tube(pts: THREE.Vector3[], r: number, m: Mat, closed = false, seg = 64) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed, "catmullrom", 0.35), seg, r, 10, closed), m);
}
function cyl(r: number, len: number, m: Mat, seg = 24) { const o = mesh(new THREE.CylinderGeometry(r, r, len, seg), m); o.rotation.x = Math.PI / 2; return o; }
const pw = (x: number, e: number) => Math.sign(x) * Math.pow(Math.abs(x), e);

function mats(p: Pal, paint?: string) {
  const phys = (color: string, metalness: number, roughness: number, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
    new THREE.MeshPhysicalMaterial({ color, metalness, roughness, envMapIntensity: 1.1, ...extra });
  const plast = paint ?? p.plastic;
  return {
    frame: phys(p.frame, p.frameM, p.frameR, p.plasticClear ? { clearcoat: 0.8, clearcoatRoughness: 0.2 } : {}),
    plastic: phys(plast, 0.15, 0.42, { clearcoat: p.plasticClear || paint ? 1 : 0.2, clearcoatRoughness: 0.18, side: THREE.DoubleSide }),
    rim: phys(p.rim, p.rimM, p.rimR, { side: THREE.DoubleSide }),
    lowers: phys(p.lowers, 0.95, 0.3),
    stanch: phys(p.stanch, 1, 0.16),
    spring: phys(p.spring, 0.5, 0.35),
    battery: phys(p.battery, p.batteryM, p.batteryR),
    clamp: phys(p.clamp, p.clampM, p.clampR),
    caliper: phys(p.caliper, 0.9, 0.25),
    seat: phys(p.seat, 0, 0.85),
    rubber: phys("#0b0c0e", 0, 0.92),
    dark: phys("#16181c", 0.85, 0.35),
    steel: phys("#aab3bd", 1, 0.22),
    disc: phys("#c0c8d0", 1, 0.2, { side: THREE.DoubleSide }),
    chain: phys("#2a2e34", 1, 0.3),
    chrome: phys("#f4f6f8", 1, 0.06),
    flare: phys("#ff4a2b", 0.2, 0.4, { clearcoat: 1 }),
    led: new THREE.MeshBasicMaterial({ color: "#fff6e8" }),
    ledR: new THREE.MeshBasicMaterial({ color: "#ff2a1a" }),
    stripe: new THREE.MeshBasicMaterial({ color: p.stripe ?? "#ff4a2b", side: THREE.DoubleSide }),
    trim: phys(p.trim ?? "#e4e8ec", 1, 0.12),
  };
}
type M = ReturnType<typeof mats>;

let logoCache: Record<string, THREE.CanvasTexture> = {};
function logoTex(color: string, sub: string) {
  const key = color + sub;
  if (logoCache[key]) return logoCache[key];
  const c = document.createElement("canvas"); c.width = 768; c.height = 256;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const draw = () => {
    const x = c.getContext("2d")!; x.clearRect(0, 0, 768, 256);
    x.fillStyle = color; x.textAlign = "left"; x.textBaseline = "middle";
    x.font = "800 150px Unbounded, Arial Black, sans-serif"; x.fillText("E-RIZZ", 24, 100);
    x.font = "600 44px 'Martian Mono Variable', Menlo, monospace"; x.globalAlpha = 0.85; x.fillText(sub, 30, 212);
    tex.needsUpdate = true;
  };
  draw();
  document.fonts?.load("800 150px Unbounded").then(draw).catch(() => {});
  logoCache[key] = tex; return tex;
}

/* ------------------------------------------------------------ wheel */
interface WheelOpts { R: number; inch: number; tireW: number; disc: number; sprocket: boolean; lod: Lod; m: M; discSide: 1 | -1 }
function makeWheel(o: WheelOpts) {
  const { R, inch, tireW, m, lod } = o;
  const g = new THREE.Group(); const spin = new THREE.Group(); g.add(spin);
  const rimR = inch * 0.0127 - 0.004; const hw = tireW / 2;
  const seg = lod === "hi" ? 96 : 48;
  // шина
  const rc = (rimR + R) / 2 - 0.004, hr = (R - rimR) / 2 + 0.004;
  const prof: THREE.Vector2[] = [];
  const N = 40;
  for (let i = 0; i <= N; i++) { const f = (i / N) * Math.PI * 2; prof.push(new THREE.Vector2(rc + hr * pw(Math.sin(f), 0.8), hw * pw(Math.cos(f), 0.62))); }
  const tg = new THREE.LatheGeometry(prof, seg); tg.rotateX(Math.PI / 2);
  spin.add(mesh(tg, m.rubber));
  // протектор-шашки
  const rows = lod === "hi" ? [-0.66, -0.33, 0, 0.33, 0.66] : [-0.5, 0, 0.5];
  const per = lod === "hi" ? 34 : 24;
  const kg = new RoundedBoxGeometry(0.02, 0.03, hw * 0.34, 1, 0.004);
  const knobs = new THREE.InstancedMesh(kg, m.rubber, rows.length * per); knobs.castShadow = true;
  const dm = new THREE.Object3D(); let k = 0;
  rows.forEach((rw, ri) => {
    for (let i = 0; i < per; i++) {
      const th = ((i + (ri % 2) * 0.5) / per) * Math.PI * 2; const z = rw * hw;
      const rr = rc + hr * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(rw), 1.6))) + 0.002;
      dm.position.set(Math.cos(th) * rr, Math.sin(th) * rr, z);
      dm.rotation.set(0, 0, th); dm.rotateY(rw * 0.7 + (rw === 0 ? 0 : 0.0)); dm.rotateX(rw * 0.5);
      dm.updateMatrix(); knobs.setMatrixAt(k++, dm.matrix);
    }
  });
  spin.add(knobs);
  // обод
  const rp = [V(rimR - 0.022, -0.026, 0), V(rimR - 0.002, -0.029, 0), V(rimR + 0.006, -0.022, 0), V(rimR + 0.006, 0.022, 0), V(rimR - 0.002, 0.029, 0), V(rimR - 0.022, 0.026, 0), V(rimR - 0.026, 0, 0)].map((v) => new THREE.Vector2(v.x, v.y));
  const rg = new THREE.LatheGeometry(rp, seg); rg.rotateX(Math.PI / 2); spin.add(mesh(rg, m.rim));
  // спицы
  const ns = lod === "hi" ? 36 : 18;
  const sg = new THREE.CylinderGeometry(0.0022, 0.0022, 1, 5);
  const spokes = new THREE.InstancedMesh(sg, m.steel, ns * 2); const mx = new THREE.Matrix4(); const q = new THREE.Quaternion(); const sc = new THREE.Vector3(); let si = 0;
  for (let i = 0; i < ns; i++) {
    const side = i % 2 ? 1 : -1; const th = (i / ns) * Math.PI * 2; const cross = (i % 4 < 2 ? 1 : -1) * 0.34;
    const a = V(Math.cos(th) * 0.03, Math.sin(th) * 0.03, side * 0.032);
    const b = V(Math.cos(th + cross) * (rimR - 0.024), Math.sin(th + cross) * (rimR - 0.024), side * 0.004);
    const d = b.clone().sub(a); const len = d.length();
    q.setFromUnitVectors(UP, d.normalize()); sc.set(1, len, 1);
    mx.compose(a.clone().add(b).multiplyScalar(0.5), q, sc); spokes.setMatrixAt(si++, mx);
  }
  spokes.count = si; spin.add(spokes);
  // ступица
  const hub = cyl(0.034, 0.07, m.dark, 24); spin.add(hub);
  [-1, 1].forEach((s) => { const f = cyl(0.046, 0.006, m.steel, 24); f.position.z = s * 0.034; spin.add(f); });
  const axle = cyl(0.012, 0.2, m.steel, 12); g.add(axle);
  // тормозной диск (с перфорацией)
  if (o.disc > 0) {
    const sh = new THREE.Shape(); sh.absarc(0, 0, o.disc, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); hole.absarc(0, 0, 0.045, 0, Math.PI * 2, true); sh.holes.push(hole);
    const nh = lod === "hi" ? 20 : 8;
    for (let i = 0; i < nh; i++) { const th = (i / nh) * Math.PI * 2; const p = new THREE.Path(); p.absarc(Math.cos(th) * (o.disc - 0.026), Math.sin(th) * (o.disc - 0.026), 0.0075, 0, Math.PI * 2, true); sh.holes.push(p); }
    const dg = new THREE.ExtrudeGeometry(sh, { depth: 0.004, bevelEnabled: false, curveSegments: 24 });
    const d = mesh(dg, m.disc); d.position.z = o.discSide * 0.048; spin.add(d);
    const cal = new THREE.Group();
    const body = mesh(new RoundedBoxGeometry(0.045, 0.06, 0.038, 2, 0.008), m.caliper); cal.add(body);
    const pad = mesh(new THREE.BoxGeometry(0.04, 0.05, 0.05), m.dark); cal.add(pad);
    const ang = o.discSide > 0 ? Math.PI * 0.82 : Math.PI * 0.18; // не вращается
    cal.position.set(Math.cos(ang) * (o.disc - 0.01), Math.sin(ang) * (o.disc - 0.01), o.discSide * 0.048); cal.rotation.z = ang - Math.PI / 2;
    g.add(cal);
  }
  // звезда
  if (o.sprocket) {
    const sh = new THREE.Shape(); const nt = lod === "hi" ? 36 : 24; const r0 = 0.078, r1 = 0.088;
    for (let i = 0; i < nt * 2; i++) { const th = (i / (nt * 2)) * Math.PI * 2; const r = i % 2 ? r0 : r1; const x = Math.cos(th) * r, y = Math.sin(th) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
    const hole = new THREE.Path(); hole.absarc(0, 0, 0.045, 0, Math.PI * 2, true); sh.holes.push(hole);
    const sp = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false }), m.trim); sp.position.z = -0.066; spin.add(sp);
  }
  return { group: g, spin, R };
}

/* ------------------------------------------------------------ bike */
export interface BikeBuild { group: THREE.Group; wheels: THREE.Group[]; rearZ: number }
export function buildBike(variant: "base" | "sport" | "pro", lod: Lod, paint?: string): BikeBuild {
  const p = PAL[variant]; const s = p.s; const m = mats(p, paint);
  const root = new THREE.Group(); const bike = new THREE.Group(); root.add(bike);
  const wheels: THREE.Group[] = [];
  const fr = p.wheelsIn[0] * 0.0127 + 0.068, rr = p.wheelsIn[1] * 0.0127 + 0.068;
  const a = (26 * Math.PI) / 180; const d = V(-Math.sin(a), Math.cos(a), 0); const nF = V(Math.cos(a), Math.sin(a), 0);
  const T = V(0.28 * s, 1.0 * s, 0); const off = 0.03;
  const L = (T.y + off * Math.sin(a) - fr) / Math.cos(a);
  const F = T.clone().addScaledVector(d, -L).addScaledVector(nF, off); F.y = fr; F.z = 0;
  const R = V(-0.68 * s, rr, 0); const Pv = V(-0.28 * s, 0.38 * s, 0);

  // колеса
  const fw = makeWheel({ R: fr, inch: p.wheelsIn[0], tireW: 0.092, disc: 0.13, sprocket: false, lod, m, discSide: 1 }); fw.group.position.copy(F);
  const rw = makeWheel({ R: rr, inch: p.wheelsIn[1], tireW: 0.125, disc: 0.1, sprocket: true, lod, m, discSide: 1 }); rw.group.position.copy(R);
  bike.add(fw.group, rw.group); wheels.push(fw.spin, rw.spin);

  // вилка перевернутая
  const along = (t: number, z: number) => T.clone().addScaledVector(d, -t).addScaledVector(nF, off * Math.min(1, t / L)).setZ(z);
  [-1, 1].forEach((z) => {
    const zz = z * 0.085;
    bike.add(rod(along(0.02, zz), along(L * 0.62, zz), 0.0185, m.stanch, 20));
    const low = rod(along(L * 0.5, zz), V(F.x, F.y, zz), 0.0245, m.lowers, 20); bike.add(low);
    const cap = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.016, 20), m.lowers); cap.position.copy(F).setZ(zz + z * 0.012); cap.rotation.x = Math.PI / 2; bike.add(cap);
    const topcap = rod(along(-0.02, zz), along(0.01, zz), 0.021, m.clamp, 16); bike.add(topcap);
  });
  // траверсы
  [0.025, 0.115].forEach((t, i) => {
    const c = mesh(new RoundedBoxGeometry(0.075, 0.04, 0.215, 3, 0.012), m.clamp);
    c.position.copy(along(t, 0)); c.rotation.z = a; bike.add(c);
    if (i === 0) { const bolt = cyl(0.01, 0.05, m.steel, 10); bolt.rotation.set(0, 0, 0); bolt.position.copy(along(t - 0.02, 0)); bolt.rotation.x = 0; bike.add(bolt); }
  });
  // рулевая
  bike.add(rod(along(0.1, 0).addScaledVector(nF, -0.012), along(-0.02, 0).addScaledVector(nF, -0.012), 0.03, m.frame, 20));
  // руль
  const bars = new THREE.Group(); bars.position.copy(along(-0.045, 0)); bars.rotation.z = a * 0.55; bike.add(bars);
  [-1, 1].forEach((z) => {
    const pts = [V(0, 0, 0), V(-0.004, 0.014, 0.09), V(-0.012, 0.06, 0.19), V(-0.05, 0.092, 0.29), V(-0.066, 0.098, 0.36)].map((v) => V(v.x, v.y, v.z * z));
    bars.add(tube(pts, 0.0118, m.chrome, false, 24));
    const grip = rod(V(-0.066, 0.098, 0.32 * z), V(-0.07, 0.1, 0.43 * z), 0.0185, m.rubber, 14); bars.add(grip);
    const endc = rod(V(-0.07, 0.1, 0.43 * z), V(-0.07, 0.1, 0.445 * z), 0.02, m.flare, 14); bars.add(endc);
    const lev = rod(V(-0.04, 0.1, 0.3 * z), V(0.1, 0.08, 0.325 * z), 0.006, m.caliper, 8); bars.add(lev);
    const pivot = mesh(new THREE.SphereGeometry(0.014, 10, 10), m.clamp); pivot.position.set(-0.04, 0.098, 0.3 * z); bars.add(pivot);
  });
  bars.add(rod(V(-0.012, 0.062, -0.19), V(-0.012, 0.062, 0.19), 0.008, m.chrome, 10));
  const disp = mesh(new RoundedBoxGeometry(0.05, 0.04, 0.09, 2, 0.008), m.dark); disp.position.set(-0.03, 0.09, 0); disp.rotation.z = -0.5; bars.add(disp);
  const scr = mesh(new THREE.PlaneGeometry(0.075, 0.03), new THREE.MeshBasicMaterial({ color: "#0e1013" })); scr.position.set(-0.052, 0.103, 0); scr.rotation.set(0, -Math.PI / 2, 0); scr.rotation.x = 0; scr.rotateZ(0); bars.add(scr);
  // тормозная магистраль
  const hose = tube([V(0.07, 0.086, 0.31), V(0.0, 0.05, 0.2), along(0.02, 0.12).setZ(0.115), along(L * 0.5, 0.11), V(F.x - 0.02, F.y + 0.1, 0.075)], 0.0045, m.dark, false, 40);
  bike.add(hose);
  // передний номерной щиток и фара
  const plate = mesh(new RoundedBoxGeometry(0.02, 0.17, 0.2, 3, 0.008), m.plastic); plate.position.copy(along(0.075, 0)).addScaledVector(nF, 0.065); plate.rotation.z = a - 0.06; bike.add(plate);
  const head = mesh(new RoundedBoxGeometry(0.014, 0.05, 0.11, 2, 0.006), m.led); head.position.copy(plate.position).addScaledVector(nF, 0.012).addScaledVector(d, 0.03); head.rotation.z = a; bike.add(head);
  const frontDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.057), new THREE.MeshBasicMaterial({ map: logoTex(p.decal, ""), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  frontDecal.position.copy(plate.position).addScaledVector(nF, 0.0115).addScaledVector(d, -0.04); frontDecal.rotation.set(0, Math.PI / 2, a); bike.add(frontDecal);
  // переднее крыло
  const ff = mesh(new THREE.CylinderGeometry(fr + 0.028, fr + 0.028, 0.115, 40, 1, true, Math.PI * 0.18, Math.PI * 0.62), m.plastic); ff.rotation.x = Math.PI / 2; ff.position.copy(F); bike.add(ff);
  const fm = mesh(new THREE.BoxGeometry(0.03, 0.06, 0.13), m.plastic); fm.position.copy(F).add(V(-Math.cos(a - 0.3) * 0, 0, 0)).add(V(0.02, fr + 0.03, 0)); bike.add(fm);

  // батарея с ребрами охлаждения
  const bx = 0.07 * s, by = 0.5 * s, bw = 0.42 * s, bh = 0.3 * s;
  const bat = mesh(new RoundedBoxGeometry(bw, bh, 0.2, 4, 0.03), m.battery); bat.position.set(bx, by, 0); bike.add(bat);
  const nf = lod === "hi" ? 9 : 5;
  [-1, 1].forEach((z) => {
    for (let i = 0; i < nf; i++) {
      const f = mesh(new RoundedBoxGeometry(bw * 0.8, 0.0075, 0.016, 1, 0.003), m.dark, false);
      f.position.set(bx, by - bh / 2 + 0.035 + (i * (bh - 0.07)) / (nf - 1), z * 0.1); bike.add(f);
    }
  });
  const cap = mesh(new RoundedBoxGeometry(bw * 0.96, 0.02, 0.19, 2, 0.008), m.trim); cap.position.set(bx, by - bh / 2, 0); bike.add(cap);
  // стяжки батареи
  [-0.16, 0.16].forEach((dx) => { const st = mesh(new THREE.BoxGeometry(0.02, bh + 0.02, 0.212), m.dark, false); st.position.set(bx + dx * s, by, 0); bike.add(st); });

  // рама: трубы
  const fz = 0.115;
  [-1, 1].forEach((z) => {
    bike.add(tube([V(0.27 * s, 0.9 * s, z * 0.07), V(0.3 * s, 0.7 * s, z * fz), V(0.27 * s, 0.46 * s, z * fz), V(0.16 * s, 0.34 * s, z * fz), V(-0.06 * s, 0.31 * s, z * fz), Pv.clone().setZ(z * 0.11)], 0.0185, m.frame, false, 60));
    bike.add(tube([V(0.26 * s, 0.93 * s, z * 0.06), V(0.05 * s, 0.84 * s, z * 0.1), V(-0.18 * s, 0.76 * s, z * 0.1), V(-0.27 * s, 0.6 * s, z * 0.115), Pv.clone().setZ(z * 0.115).add(V(0, 0.02, 0))], 0.0175, m.frame, false, 50));
    bike.add(tube([V(-0.2 * s, 0.77 * s, z * 0.09), V(-0.42 * s, 0.82 * s, z * 0.075), V(-0.62 * s, 0.82 * s, z * 0.07)], 0.014, m.frame, false, 24));
    bike.add(tube([V(-0.27 * s, 0.6 * s, z * 0.1), V(-0.46 * s, 0.73 * s, z * 0.08), V(-0.6 * s, 0.8 * s, z * 0.07)], 0.012, m.frame, false, 24));
  });
  const gus = mesh(new RoundedBoxGeometry(0.1, 0.12, 0.2, 2, 0.02), m.frame); gus.position.set(0.28 * s, 0.9 * s, 0); gus.rotation.z = 0.2; bike.add(gus);
  const pivotPlate = [-1, 1].map((z) => { const pl = mesh(new RoundedBoxGeometry(0.1, 0.16, 0.014, 2, 0.006), m.frame); pl.position.set(Pv.x + 0.012, Pv.y + 0.03, z * 0.122); bike.add(pl); return pl; });
  void pivotPlate;
  const pbolt = cyl(0.018, 0.28, m.steel, 14); pbolt.position.copy(Pv); bike.add(pbolt);
  // подрамник + защита днища
  const skid = mesh(new RoundedBoxGeometry(0.46 * s, 0.014, 0.19, 2, 0.006), m.steel); skid.position.set(0.0, 0.313 * s, 0); bike.add(skid);

  // маятник
  const sw = V(-0.5 * s, 0.34 * s, 0);
  [-1, 1].forEach((z) => {
    bike.add(beam(Pv.clone().setZ(z * 0.098), V(R.x + 0.04, R.y + 0.012, z * 0.095), 0.055, 0.032, m.frame));
    bike.add(beam(Pv.clone().add(V(0, -0.045, 0)).setZ(z * 0.098), V(R.x + 0.05, R.y - 0.045, z * 0.095), 0.025, 0.026, m.frame));
    const ax = mesh(new RoundedBoxGeometry(0.06, 0.08, 0.016, 2, 0.006), m.frame); ax.position.set(R.x, R.y, z * 0.098); bike.add(ax);
    const adj = mesh(new RoundedBoxGeometry(0.024, 0.026, 0.02, 1, 0.004), m.steel); adj.position.set(R.x - 0.045, R.y, z * 0.112); bike.add(adj);
  });
  bike.add(rod(V(sw.x, sw.y, -0.098), V(sw.x, sw.y, 0.098), 0.017, m.frame, 12));
  const raxle = cyl(0.014, 0.25, m.steel, 12); raxle.position.copy(R); bike.add(raxle);

  // моноамортизатор
  const sL = V(sw.x + 0.02 * s, sw.y + 0.045, 0), sU = V(-0.2 * s, 0.72 * s, 0);
  const sd = sU.clone().sub(sL); const sl = sd.length(); const sq = new THREE.Quaternion().setFromUnitVectors(UP, sd.clone().normalize());
  const shock = new THREE.Group(); shock.position.copy(sL); shock.quaternion.copy(sq);
  const body = mesh(new THREE.CylinderGeometry(0.02, 0.02, sl * 0.5, 18), m.stanch); body.position.y = sl * 0.3; shock.add(body);
  const cap2 = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 18), m.clamp); cap2.position.y = sl * 0.07; shock.add(cap2);
  const helix: THREE.Vector3[] = []; const turns = 9; const n = turns * 18;
  for (let i = 0; i <= n; i++) { const f = i / n; const th = f * turns * Math.PI * 2; helix.push(V(Math.cos(th) * 0.036, sl * (0.14 + f * 0.7), Math.sin(th) * 0.036)); }
  const spring = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), lod === "hi" ? 260 : 120, 0.0055, 6, false), m.spring); shock.add(spring);
  const top = mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.02, 18), m.clamp); top.position.y = sl * 0.88; shock.add(top);
  const res = mesh(new THREE.CylinderGeometry(0.017, 0.017, sl * 0.3, 14), m.lowers); res.position.set(0.0, sl * 0.62, 0.062); shock.add(res);
  const resHose = rod(V(0, sl * 0.45, 0.026), V(0, sl * 0.45, 0.062), 0.005, m.dark, 8); shock.add(resHose);
  bike.add(shock);
  // тяга подвески
  const link = beam(V(sw.x + 0.03, sw.y - 0.02, 0.0), V(Pv.x + 0.08, Pv.y - 0.1, 0), 0.02, 0.2, m.steel); bike.add(link);

  // мотор + ребра
  const mc = V(-0.1 * s, 0.245 * s, 0);
  const motor = cyl(0.092, 0.17, m.dark, 36); motor.position.copy(mc); bike.add(motor);
  for (let i = 0; i < 7; i++) { const fin = cyl(0.102, 0.006, m.battery, 36); fin.position.set(mc.x, mc.y, -0.075 + i * 0.025); bike.add(fin); }
  const mcap = cyl(0.07, 0.014, m.trim, 28); mcap.position.set(mc.x, mc.y, 0.092); bike.add(mcap);
  const mcap2 = cyl(0.03, 0.02, m.flare, 20); mcap2.position.set(mc.x, mc.y, 0.1); bike.add(mcap2);
  // цепь
  const fsp = cyl(0.036, 0.008, m.trim, 24); fsp.position.set(mc.x, mc.y, -0.09); bike.add(fsp);
  const cz = -0.066, r1 = 0.04, r2 = 0.085;
  bike.add(tube([V(mc.x, mc.y + r1, cz), V(mc.x + r1 * 0.9, mc.y, cz), V(mc.x, mc.y - r1, cz), V((mc.x + R.x) / 2, (mc.y + R.y) / 2 - 0.05, cz), V(R.x, R.y - r2, cz), V(R.x - r2, R.y, cz), V(R.x, R.y + r2, cz), V((mc.x + R.x) / 2, (mc.y + R.y) / 2 + 0.065, cz)], 0.0055, m.chain, true, 70));

  // щитки-«бак» (плитки по бокам) + верх
  const sh = new THREE.Shape();
  sh.moveTo(0.3 * s, 0.97 * s); sh.lineTo(0.08 * s, 0.97 * s); sh.quadraticCurveTo(-0.08 * s, 0.94 * s, -0.17 * s, 0.86 * s); sh.lineTo(-0.28 * s, 0.84 * s);
  sh.lineTo(-0.28 * s, 0.74 * s); sh.quadraticCurveTo(-0.1 * s, 0.7 * s, 0.1 * s, 0.7 * s); sh.quadraticCurveTo(0.26 * s, 0.7 * s, 0.31 * s, 0.82 * s); sh.lineTo(0.3 * s, 0.97 * s);
  const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 14 });
  [-1, 1].forEach((z) => {
    const pan = mesh(sg, m.plastic); pan.position.z = z > 0 ? 0.125 : -0.125 - 0.022; bike.add(pan);
    const outer = z * (0.125 + (z > 0 ? 0.034 : 0.034 - 0.022 + 0.0));
    void outer;
    const zz = z > 0 ? 0.125 + 0.022 + 0.012 + 0.0015 : -0.125 - 0.012 - 0.0015;
    const dec = new THREE.Mesh(new THREE.PlaneGeometry(0.3 * s, 0.1 * s), new THREE.MeshBasicMaterial({ map: logoTex(p.decal, variant === "base" ? "GT BASE" : variant === "sport" ? "GT SPORT" : "GT PRO"), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    dec.position.set(0.05 * s, 0.83 * s, zz); if (z < 0) dec.rotation.y = Math.PI; bike.add(dec);
    // полоса flare / золото
    if (p.stripe) {
      const cnt = variant === "sport" ? 3 : variant === "pro" ? 1 : 1;
      for (let i = 0; i < cnt; i++) {
        const st = mesh(new THREE.PlaneGeometry(variant === "base" ? 0.09 : 0.42, variant === "sport" ? 0.012 : 0.01), m.stripe, false);
        st.position.set(variant === "base" ? 0.19 * s : -0.02 * s, (variant === "base" ? 0.76 : 0.77 + i * 0.025) * s, zz); st.rotation.z = variant === "base" ? -0.6 : 0.14 + i * 0.02; if (z < 0) st.rotation.y = Math.PI; bike.add(st);
      }
    }
  });
  const tt = mesh(new RoundedBoxGeometry(0.34 * s, 0.03, 0.2, 3, 0.012), m.plastic); tt.position.set(0.06 * s, 0.97 * s, 0); tt.rotation.z = -0.1; bike.add(tt);
  // хромированные накладки
  if (p.trim) { [-1, 1].forEach((z) => { const tr = mesh(new RoundedBoxGeometry(0.28 * s, 0.01, 0.014, 1, 0.004), m.trim, false); tr.position.set(0.04 * s, 0.725 * s, z * 0.155); bike.add(tr); }); }

  // сиденье + хвост
  const st = new THREE.Shape();
  st.moveTo(0.3 * s, 0.93 * s); st.quadraticCurveTo(0.1 * s, 0.97 * s, -0.12 * s, 0.93 * s); st.lineTo(-0.58 * s, 0.9 * s); st.quadraticCurveTo(-0.66 * s, 0.9 * s, -0.66 * s, 0.84 * s);
  st.lineTo(-0.2 * s, 0.77 * s); st.lineTo(0.2 * s, 0.82 * s); st.lineTo(0.3 * s, 0.93 * s);
  const stg = new THREE.ExtrudeGeometry(st, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.028, bevelSegments: 4, curveSegments: 14 });
  const seat = mesh(stg, m.seat); seat.position.z = -0.05; seat.position.y = 0.025; bike.add(seat);
  const tail = mesh(new RoundedBoxGeometry(0.2, 0.03, 0.12, 3, 0.012), m.plastic); tail.position.set(-0.64 * s, 0.88 * s, 0); tail.rotation.z = 0.45; bike.add(tail);
  const tl = mesh(new THREE.BoxGeometry(0.012, 0.02, 0.07), m.ledR, false); tl.position.set(-0.745 * s, 0.84 * s, 0); bike.add(tl);
  const rfend = mesh(new THREE.CylinderGeometry(rr + 0.03, rr + 0.03, 0.15, 36, 1, true, Math.PI * 0.62, Math.PI * 0.34), m.plastic); rfend.rotation.x = Math.PI / 2; rfend.position.copy(R); bike.add(rfend);

  // подножки
  [-1, 1].forEach((z) => {
    const plate2 = mesh(new RoundedBoxGeometry(0.1, 0.07, 0.02, 2, 0.006), m.frame); plate2.position.set(-0.03 * s, 0.31 * s, z * 0.17); bike.add(plate2);
    const peg = mesh(new RoundedBoxGeometry(0.05, 0.016, 0.08, 1, 0.004), m.steel); peg.position.set(-0.03 * s, 0.285 * s, z * 0.2); bike.add(peg);
  });
  // ножка

  // положение на земле
  bike.position.set(-(F.x + R.x) / 2, 0, 0);
  return { group: root, wheels, rearZ: R.x };
}

/* ------------------------------------------------------------ shared renderer */
interface Shared { r: THREE.WebGLRenderer; env: THREE.Texture; w: number; h: number }
let shared: Shared | null = null;
function getShared(): Shared {
  if (shared) return shared;
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  r.setPixelRatio(1); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap; r.setClearColor(0x000000, 0);
  const pm = new THREE.PMREMGenerator(r); const env = pm.fromScene(new RoomEnvironment(), 0.03).texture; pm.dispose();
  shared = { r, env, w: 4, h: 4 };
  return shared;
}
function ensure(w: number, h: number) { const s = getShared(); if (w > s.w || h > s.h) { s.w = Math.max(s.w, w); s.h = Math.max(s.h, h); s.r.setSize(s.w, s.h, false); } return s; }

function shadowBlob() {
  const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
let blobTex: THREE.CanvasTexture | null = null;

function makeScene(variant: Variant, lod: Lod, paint?: string) {
  const sh = getShared();
  const scene = new THREE.Scene(); scene.environment = sh.env;
  const hemi = new THREE.HemisphereLight(0xffffff, 0x40454c, 0.35); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.2, 4, 2.6); key.castShadow = true;
  key.shadow.mapSize.set(lod === "hi" ? 1024 : 512, lod === "hi" ? 1024 : 512); key.shadow.radius = 6; key.shadow.bias = -0.0004;
  const sc = key.shadow.camera; sc.left = -1.4; sc.right = 1.4; sc.top = 1.4; sc.bottom = -1.4; sc.near = 0.5; sc.far = 10; scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfd2ff, 1.2); rim.position.set(-3, 2, -2.5); scene.add(rim);
  const warm = new THREE.DirectionalLight(0xff8a5c, 0.7); warm.position.set(-1, 1, 3); scene.add(warm);
  const pivot = new THREE.Group(); scene.add(pivot);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.32 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  blobTex ??= shadowBlob();
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.8 })); blob.rotation.x = -Math.PI / 2; blob.position.y = 0.001; scene.add(blob);
  const holder = new THREE.Group(); pivot.add(holder);
  return { scene, pivot, holder, key, wheels: [] as THREE.Group[], variant, lod, paint };
}

async function fillBike(S: ReturnType<typeof makeScene>, variant: Variant, paint?: string) {
  S.holder.clear();
  const glb = await loadGLB(variant);
  if (glb) { S.holder.add(normalizeGLB(paintGLB(glb, paint) as THREE.Group, variant)); S.wheels = []; return; }
  const pv = (variant === "road" || variant === "roadpro" ? "base" : variant) as "base" | "sport" | "pro";
  const b = buildBike(pv, S.lod, paint);
  S.holder.add(b.group); S.wheels = b.wheels;
}

function frame(camera: THREE.PerspectiveCamera, aspect: number, pitch: number) {
  const fov = 24; camera.fov = fov; camera.aspect = aspect; camera.near = 0.1; camera.far = 40;
  const t = Math.tan((fov * Math.PI) / 360);
  const dist = Math.max(0.8 / t, 1.02 / (t * aspect));
  camera.position.set(0, 0.5 + Math.sin(pitch) * dist, Math.cos(pitch) * dist); camera.lookAt(0, 0.47, 0); camera.updateProjectionMatrix();
}

/* ------------------------------------------------------------ live view */
export interface ViewOpts { variant: Variant; paint?: string; yaw?: number; pitch?: number; sway?: number; interactive?: boolean; lod?: Lod; fps?: number; spin?: number }
export interface BikeView {
  setYaw(v: number): void; setPitch(v: number): void; setSway(v: number): void; setVariant(v: Variant, paint?: string): void; setPaint(c?: string): void; dispose(): void; ready: Promise<void>;
}
const views = new Set<{ tick(t: number): void; visible: boolean }>();
let looping = false; let lastT = 0;
function loop(now: number) {
  let any = false;
  views.forEach((v) => { if (v.visible) { any = true; v.tick(now); } });
  lastT = now;
  if (any && !document.hidden) requestAnimationFrame(loop); else looping = false;
}
function kick() { if (!looping) { looping = true; requestAnimationFrame(loop); } }
document.addEventListener?.("visibilitychange", kick);

export function createBikeView(canvas: HTMLCanvasElement, o: ViewOpts): BikeView {
  const lod: Lod = o.lod ?? "hi";
  const dpr = Math.min(window.devicePixelRatio || 1, lod === "hi" ? 2 : 1.5);
  const ctx2d = canvas.getContext("2d")!;
  let S = makeScene(o.variant, lod, o.paint); let variant = o.variant;
  const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 40);
  const st = { yaw: o.yaw ?? -0.55, pitch: o.pitch ?? 0.14, sway: o.sway ?? 0.18, dragYaw: 0, hx: 0, hy: 0, spin: o.spin ?? 0.35 };
  let tx = 0, ty = 0; let drag = false, lx = 0; let ready = false; let dead = false; let lastDraw = 0;
  const fps = o.fps ?? (lod === "hi" ? 60 : 30);
  const ready$ = fillBike(S, variant, o.paint).then(() => { ready = true; });
  const view = {
    visible: false,
    tick(now: number) {
      if (!ready || dead) return;
      if (now - lastDraw < 1000 / fps - 2) return; const dt = Math.min(0.05, (now - lastDraw) / 1000); lastDraw = now;
      const w = Math.max(2, Math.round(canvas.clientWidth * dpr)), h = Math.max(2, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const sh = ensure(w, h); const r = sh.r;
      st.hx += (tx - st.hx) * 0.08; st.hy += (ty - st.hy) * 0.08;
      const t = now / 1000;
      S.pivot.rotation.y = st.yaw + st.dragYaw + Math.sin(t * 0.6) * st.sway + st.hx * 0.35;
      S.pivot.position.y = 0; S.holder.rotation.z = 0;
      S.wheels.forEach((wh) => { wh.rotation.z -= dt * st.spin; });
      frame(cam, w / h, st.pitch - st.hy * 0.06);
      r.setViewport(0, 0, w, h); r.setScissor(0, 0, w, h); r.setScissorTest(true); r.clear();
      r.render(S.scene, cam);
      ctx2d.clearRect(0, 0, w, h); ctx2d.drawImage(r.domElement, 0, sh.h - h, w, h, 0, 0, w, h);
    },
  };
  views.add(view);
  const io = new IntersectionObserver((e) => { view.visible = e[0].isIntersecting; if (view.visible) kick(); }, { rootMargin: "120px" });
  io.observe(canvas);
  const pm = (e: PointerEvent) => {
    const b = canvas.getBoundingClientRect(); tx = ((e.clientX - b.left) / b.width - 0.5) * 2; ty = ((e.clientY - b.top) / b.height - 0.5) * 2;
    if (drag) { st.dragYaw += (e.clientX - lx) * 0.012; lx = e.clientX; }
  };
  const pd = (e: PointerEvent) => { drag = true; lx = e.clientX; canvas.setPointerCapture?.(e.pointerId); };
  const pu = () => { drag = false; };
  const pl = () => { tx = 0; ty = 0; };
  if (o.interactive) { canvas.addEventListener("pointermove", pm); canvas.addEventListener("pointerdown", pd); canvas.addEventListener("pointerup", pu); canvas.addEventListener("pointerleave", pl); }
  return {
    ready: ready$,
    setYaw: (v) => { st.yaw = v; }, setPitch: (v) => { st.pitch = v; }, setSway: (v) => { st.sway = v; },
    setVariant(v, paint) { variant = v; ready = false; S.holder.clear(); fillBike(S, v, paint).then(() => { ready = true; kick(); }); },
    setPaint(c) { ready = false; fillBike(S, variant, c).then(() => { ready = true; kick(); }); },
    dispose() { dead = true; views.delete(view); io.disconnect(); canvas.removeEventListener("pointermove", pm); canvas.removeEventListener("pointerdown", pd); canvas.removeEventListener("pointerup", pu); canvas.removeEventListener("pointerleave", pl); S.holder.clear(); },
  };
}

/* ------------------------------------------------------------ preview PNG */
const prevCache = new Map<string, Promise<string>>();
let prevQueue: Promise<unknown> = Promise.resolve();
export function renderPreview(variant: Variant, o: { w?: number; h?: number; yaw?: number; paint?: string } = {}): Promise<string> {
  const w = o.w ?? 480, h = o.h ?? 320, yaw = o.yaw ?? -0.55;
  const key = `${variant}|${w}|${h}|${yaw}|${o.paint ?? ""}`;
  if (!prevCache.has(key)) {
    prevCache.set(key, new Promise<string>((res) => {
      prevQueue = prevQueue.then(() => new Promise<void>((done) => {
        const run = async () => {
          try {
            const S = makeScene(variant, "lo", o.paint); await fillBike(S, variant, o.paint);
            const cam = new THREE.PerspectiveCamera(24, w / h, 0.1, 40); S.pivot.rotation.y = yaw; frame(cam, w / h, 0.14);
            const sh = ensure(w, h); const r = sh.r;
            r.setViewport(0, 0, w, h); r.setScissor(0, 0, w, h); r.setScissorTest(true); r.clear(); r.render(S.scene, cam);
            const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d")!.drawImage(r.domElement, 0, sh.h - h, w, h, 0, 0, w, h);
            res(c.toDataURL("image/png"));
          } catch { res(""); }
          done();
        };
        (window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 30)))(() => { void run(); });
      }));
    }));
  }
  return prevCache.get(key)!;
}

/** Окружение (PMREM) для сторонних сцен, например 3D-тура по шоуруму. */
export function makeEnv(r: THREE.WebGLRenderer) { const pm = new THREE.PMREMGenerator(r); const t = pm.fromScene(new RoomEnvironment(), 0.03).texture; pm.dispose(); return t; }
