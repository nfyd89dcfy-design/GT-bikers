import { useEffect, useRef } from "react";
import { reduceMotion } from "@/lib/state";

/**
 * ParticleField (аналог shaders.com/ParticleField, написан на canvas 2D):
 * поле частиц сэмплирует изображение или текст, глубина из яркости, wobble, курсор толкает или собирает.
 * ObjectTracker (аналог shaders.com/ObjectTracker): рамки-уголки с подписью, которые следят за курсором по узлам байка.
 * BoltCursor: курсор-хромированная молния с наклоном по скорости и искрами.
 */

/* ============================================================ ParticleField */
interface PFProps {
  src?: string;
  text?: string;
  count?: number;
  cursorMode?: "push" | "pull" | "none";
  cursorStrength?: number;
  cursorRadius?: number; // доля от меньшей стороны
  wobble?: number;
  depth?: number;
  size?: number;
  box?: { x: number; y: number; w: number; h: number }; // доли canvas
  tones?: string[];
  className?: string;
  alpha?: number;
}
export function ParticleField({ src, text, count = 5000, cursorMode = "push", cursorStrength = 0.8, cursorRadius = 0.16, wobble = 0.35, depth = 0.7, size = 1.1, box = { x: 0, y: 0, w: 1, h: 1 }, tones = ["#59616b", "#8d97a2", "#b9c2cc", "#e8ecef", "#ffffff"], className, alpha = 1 }: PFProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = reduceMotion();
    let W = 0, H = 0, raf = 0, vis = true, dead = false;
    type P = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; l: number; z: number; ph: number };
    let pts: P[] = [];
    let srcCanvas: HTMLCanvasElement | null = null;
    const mouse = { x: -9999, y: -9999 };

    const sample = () => {
      if (!srcCanvas || !W) return;
      const sc = srcCanvas;
      const sctx = sc.getContext("2d")!;
      const d = sctx.getImageData(0, 0, sc.width, sc.height).data;
      const all: { x: number; y: number; l: number }[] = [];
      for (let y = 0; y < sc.height; y++) for (let x = 0; x < sc.width; x++) {
        const i = (y * sc.width + x) * 4;
        if (d[i + 3] > 90) all.push({ x: x / sc.width, y: y / sc.height, l: (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255 });
      }
      const rw = box.w * W, rh = box.h * H, ar = sc.width / sc.height;
      let dw = rw, dh = rw / ar; if (dh > rh) { dh = rh; dw = rh * ar; }
      const ox = box.x * W + (rw - dw) / 2, oy = box.y * H + (rh - dh) / 2;
      const step = Math.max(1, all.length / count);
      pts = [];
      for (let k = 0; k < all.length; k += step) {
        const a = all[Math.floor(k)];
        const hx = ox + a.x * dw, hy = oy + a.y * dh;
        pts.push({ hx, hy, x: hx + (Math.random() - 0.5) * W * 0.4, y: hy + (Math.random() - 0.5) * H * 0.4, vx: 0, vy: 0, l: a.l, z: a.l, ph: Math.random() * 6.28 });
      }
    };
    const build = (img?: HTMLImageElement) => {
      const gw = 260;
      const c = document.createElement("canvas");
      if (img) {
        const r = img.naturalHeight / img.naturalWidth;
        c.width = gw; c.height = Math.max(8, Math.round(gw * r));
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      } else if (text) {
        c.width = gw; c.height = Math.round(gw * 0.34);
        const x = c.getContext("2d")!;
        x.fillStyle = "#fff"; x.font = `800 ${c.height * 0.86}px Unbounded, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
        let fs = c.height * 0.86; x.font = `800 ${fs}px Unbounded, sans-serif`;
        const w = x.measureText(text).width; if (w > gw * 0.96) { fs *= (gw * 0.96) / w; x.font = `800 ${fs}px Unbounded, sans-serif`; }
        x.fillText(text, gw / 2, c.height / 2 + 2);
      }
      srcCanvas = c; sample();
    };
    const resize = () => {
      const r = cv.getBoundingClientRect(); const dpr = Math.min(1.5, devicePixelRatio || 1);
      W = cv.width = Math.round(r.width * dpr); H = cv.height = Math.round(r.height * dpr);
      sample();
      if (reduce) draw(0);
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const R = Math.min(W, H) * cursorRadius, R2 = R * R, s = size * (W / 900 + 0.8);
      const buckets: P[][] = tones.map(() => []);
      for (const p of pts) {
        const wob = reduce ? 0 : wobble * 3;
        const tx = p.hx + Math.sin(t * 0.0012 + p.ph) * wob * (0.4 + p.z), ty = p.hy + Math.cos(t * 0.001 + p.ph * 1.3) * wob * (0.4 + p.z);
        p.vx += (tx - p.x) * 0.05; p.vy += (ty - p.y) * 0.05;
        if (cursorMode !== "none") {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 1) { const d = Math.sqrt(d2), f = (1 - d / R) * cursorStrength * 5 * (cursorMode === "push" ? 1 : -0.5); p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
        }
        p.vx *= 0.84; p.vy *= 0.84; p.x += p.vx; p.y += p.vy;
        const b = Math.min(tones.length - 1, Math.floor((0.25 + p.l * (0.75 + depth * 0.2)) * tones.length));
        buckets[Math.max(0, b)].push(p);
      }
      ctx.globalAlpha = alpha;
      buckets.forEach((arr, i) => { ctx.fillStyle = tones[i]; for (const p of arr) { const z = s * (0.7 + p.z * depth * 0.8); ctx.fillRect(p.x, p.y, z, z); } });
      ctx.globalAlpha = 1;
    };
    const loop = (t: number) => { if (dead) return; raf = requestAnimationFrame(loop); if (vis) draw(t); };
    const start = () => { resize(); if (reduce) { pts.forEach((p) => { p.x = p.hx; p.y = p.hy; }); draw(0); } else raf = requestAnimationFrame(loop); };
    if (src) { const img = new Image(); img.onload = () => { if (!dead) { build(img); start(); } }; img.src = src; }
    else { (document.fonts?.load("800 60px Unbounded", text || "") ?? Promise.resolve()).then(() => { if (!dead) { build(); start(); } }, () => { if (!dead) { build(); start(); } }); }
    const ro = new ResizeObserver(() => { if (srcCanvas) resize(); }); ro.observe(cv);
    const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; }); io.observe(cv);
    const mv = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); const k = W / r.width; mouse.x = (e.clientX - r.left) * k; mouse.y = (e.clientY - r.top) * k; };
    if (!reduce) window.addEventListener("pointermove", mv);
    return () => { dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener("pointermove", mv); };
  }, [src, text, count, cursorMode, cursorStrength, cursorRadius, wobble, depth, size, alpha, box.x, box.y, box.w, box.h]); // eslint-disable-line
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

/* ============================================================ ObjectTracker */
interface Region { n: string; x: number; y: number; w: number; h: number }
export function ObjectTracker({ wheels = "19/18", className, stroke = "#c9a24b", accent = "#ff4a2b" }: { wheels?: string; className?: string; stroke?: string; accent?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!; const ctx = cv.getContext("2d"); if (!ctx) return;
    const reduce = reduceMotion();
    const [wf, wr] = wheels.split("/");
    const regions: Region[] = [
      { n: `переднее колесо ${wf}"`, x: 0.01, y: 0.36, w: 0.38, h: 0.64 },
      { n: "рама и АКБ", x: 0.3, y: 0.06, w: 0.42, h: 0.62 },
      { n: `заднее колесо ${wr}"`, x: 0.61, y: 0.34, w: 0.38, h: 0.66 },
    ];
    let W = 0, H = 0, raf = 0, vis = true;
    const cur = { x: 0, y: 0, w: 0, h: 0 }; let target = 1; let label = regions[1].n; let conf = 0.94;
    let px = -1, py = -1, last = 0, auto = 0;
    const resize = () => { const r = cv.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); W = cv.width = Math.round(r.width * d); H = cv.height = Math.round(r.height * d); };
    const corners = (x: number, y: number, w: number, h: number, c: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y + c); ctx.lineTo(x, y); ctx.lineTo(x + c, y);
      ctx.moveTo(x + w - c, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + c);
      ctx.moveTo(x + w, y + h - c); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - c, y + h);
      ctx.moveTo(x + c, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - c);
      ctx.stroke();
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const k = W / 900, lw = 1.6 * Math.max(1, k * 1.3);
      // объект целиком
      ctx.strokeStyle = "rgba(233,237,241,.55)"; ctx.lineWidth = lw; corners(W * 0.01, H * 0.04, W * 0.98, H * 0.94, 26 * Math.max(0.8, k));
      // выбор региона: под курсором или автоскан
      if (px >= 0) {
        let best = 1, bd = 1e9;
        regions.forEach((r, i) => { const cx = (r.x + r.w / 2) * W, cy = (r.y + r.h / 2) * H; const d = (cx - px) ** 2 + (cy - py) ** 2; if (d < bd) { bd = d; best = i; } });
        target = best;
      } else if (!reduce && t - auto > 2200) { auto = t; target = (target + 1) % regions.length; }
      const r = regions[target]; label = r.n; conf = 0.9 + ((Math.sin(t * 0.003) + 1) / 2) * 0.09;
      const tx = r.x * W, ty = r.y * H, tw = r.w * W, th = r.h * H;
      if (cur.w === 0) { cur.x = tx; cur.y = ty; cur.w = tw; cur.h = th; }
      const e = reduce ? 1 : 0.16; cur.x += (tx - cur.x) * e; cur.y += (ty - cur.y) * e; cur.w += (tw - cur.w) * e; cur.h += (th - cur.h) * e;
      ctx.fillStyle = "rgba(255,74,43,.07)"; ctx.fillRect(cur.x, cur.y, cur.w, cur.h);
      ctx.strokeStyle = accent; ctx.lineWidth = lw * 1.2; corners(cur.x, cur.y, cur.w, cur.h, 22 * Math.max(0.8, k));
      // подпись
      const fs = Math.max(10, 12 * Math.max(0.85, k)); ctx.font = `600 ${fs}px "Martian Mono Variable", monospace`;
      const txt = `${label} ${(conf * 100).toFixed(0)}%`; const tw2 = ctx.measureText(txt).width + 16, th2 = fs + 10;
      const lx = Math.min(W - tw2 - 2, cur.x), ly = Math.max(2, cur.y - th2 - 4);
      ctx.fillStyle = stroke; ctx.beginPath(); ctx.roundRect(lx, ly, tw2, th2, th2 / 2); ctx.fill();
      ctx.fillStyle = "#14110a"; ctx.textBaseline = "middle"; ctx.fillText(txt, lx + 8, ly + th2 / 2 + 1);
      // перекрестие у курсора
      if (px >= 0) { ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px - 8, py); ctx.lineTo(px + 8, py); ctx.moveTo(px, py - 8); ctx.lineTo(px, py + 8); ctx.stroke(); }
    };
    const loop = (t: number) => { raf = requestAnimationFrame(loop); if (!vis || t - last < 22) return; last = t; draw(t); };
    resize(); draw(0);
    if (!reduce) raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(() => { resize(); draw(0); }); ro.observe(cv);
    const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; }); io.observe(cv);
    const mv = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect(); const k = W / r.width;
      const x = (e.clientX - r.left) * k, y = (e.clientY - r.top) * k;
      const inside = x > -W * 0.1 && x < W * 1.1 && y > -H * 0.2 && y < H * 1.2;
      px = inside ? x : -1; py = inside ? y : -1;
    };
    if (!reduce) window.addEventListener("pointermove", mv);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener("pointermove", mv); };
  }, [wheels, stroke, accent]);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

/* ============================================================ Bolt cursor */
export function BoltCursor() {
  const bolt = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const coarse = matchMedia("(hover: none), (pointer: coarse)").matches;
    if (coarse || reduceMotion()) return;
    const el = bolt.current!, c = cv.current!, ctx = c.getContext("2d")!;
    document.documentElement.classList.add("has-bolt");
    let x = -100, y = -100, tx = -100, ty = -100, rot = 0, sc = 1, tsc = 1, raf = 0, W = 0, H = 0;
    type S = { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string };
    const sparks: S[] = [];
    const cols = ["#ffffff", "#ffe2a0", "#ff4a2b", "#c9a24b", "#b9c2cc"];
    const rs = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
    rs();
    const mv = (e: PointerEvent) => {
      const dx = e.clientX - tx, dy = e.clientY - ty, d = Math.hypot(dx, dy);
      tx = e.clientX; ty = e.clientY; el.classList.add("on");
      if (d > 4) for (let i = 0; i < Math.min(3, 1 + Math.floor(d / 14)); i++) sparks.push({ x: x + 2, y: y + 2, vx: -dx * 0.05 + (Math.random() - 0.5) * 2.2, vy: -dy * 0.05 + (Math.random() - 0.3) * 2.2 + 0.3, life: 0, max: 24 + Math.random() * 26, col: cols[Math.floor(Math.random() * cols.length)] });
      if (sparks.length > 160) sparks.splice(0, sparks.length - 160);
    };
    const over = (e: PointerEvent) => { const t = (e.target as HTMLElement).closest?.("a,button,[role=button],input,select,textarea,summary,[data-cursor],label"); tsc = t ? 1.28 : 1; };
    const leave = () => el.classList.remove("on");
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const px = x; x += (tx - x) * 0.32; y += (ty - y) * 0.32;
      const vx = x - px; rot += (Math.max(-28, Math.min(28, vx * 2.2)) - rot) * 0.18; sc += (tsc - sc) * 0.2;
      el.style.transform = `translate(${x - 3}px,${y - 1}px) rotate(${rot}deg) scale(${sc})`;
      ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]; s.life++; if (s.life > s.max) { sparks.splice(i, 1); continue; }
        s.vy += 0.06; s.x += s.vx; s.y += s.vy; const a = 1 - s.life / s.max;
        ctx.strokeStyle = s.col; ctx.globalAlpha = a; ctx.lineWidth = 1.6 * a + 0.4;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 2.4, s.y - s.vy * 2.4); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    };
    window.addEventListener("pointermove", mv); document.addEventListener("pointerover", over); document.documentElement.addEventListener("pointerleave", leave); window.addEventListener("resize", rs);
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); document.documentElement.classList.remove("has-bolt"); window.removeEventListener("pointermove", mv); document.removeEventListener("pointerover", over); document.documentElement.removeEventListener("pointerleave", leave); window.removeEventListener("resize", rs); };
  }, []);
  return (
    <>
      <canvas ref={cv} className="sparks" aria-hidden="true" />
      <div ref={bolt} className="bolt" aria-hidden="true">
        <svg viewBox="0 0 34 44" width="34" height="44" style={{ filter: "drop-shadow(0 3px 3px rgba(0,0,0,.55)) drop-shadow(0 0 6px rgba(255,255,255,.25))", overflow: "visible" }}>
          <defs>
            <linearGradient id="bolt-chrome" x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0" stopColor="#ffffff" /><stop offset=".22" stopColor="#d9dee4" /><stop offset=".45" stopColor="#6d7681" />
              <stop offset=".5" stopColor="#f6f8fa" /><stop offset=".72" stopColor="#9aa3ad" /><stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <path d="M3 1 L22 1 L14 15 L26 15 L6 43 L12.5 23.5 L2 23.5 Z" fill="url(#bolt-chrome)" stroke="#1b1f24" strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M5.4 3 L19 3 L11.5 16.6" fill="none" stroke="#fff" strokeOpacity=".95" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M20 17.2 L13.5 29" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".9" strokeLinecap="round" />
          <circle cx="4.6" cy="2.6" r="1.1" fill="#fff" />
        </svg>
      </div>
    </>
  );
}
