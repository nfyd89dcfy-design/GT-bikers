import { useEffect, useRef, useState, type CSSProperties } from "react";
import { reduceMotion } from "@/lib/state";

/**
 * Собственные WebGL-шейдеры (Marble, Grid, Chrome) и canvas-Boids.
 * Пакет shaders.com работает только на WebGPU, поэтому здесь эквиваленты на WebGL1
 * с теми же параметрами. Без WebGL или при prefers-reduced-motion: статичный кадр / CSS-фон.
 */

const VERT = `attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;

const NOISE = `
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(7.1,3.7);a*=.5;}return v;}
`;

export const MARBLE = `precision mediump float;varying vec2 uv;uniform float t;uniform vec2 res;uniform vec3 cA,cB,cC;uniform float scale,turb;
${NOISE}
void main(){
  vec2 p=(uv-.5)*vec2(res.x/res.y,1.)*scale;
  vec2 q=vec2(fbm(p+t*.6),fbm(p+vec2(5.2,1.3)-t*.5));
  float w=fbm(p+turb*.12*q);
  float v=abs(sin((p.x*.9+p.y*.5+w*turb*.35)*3.1));
  float vein=smoothstep(.0,.18,v);
  vec3 col=mix(cA,cB,smoothstep(.15,.85,w));
  col=mix(cC,col,vein*.9+.1);
  col+=cB*.12*pow(1.-v,6.);
  gl_FragColor=vec4(col,1.);
}`;

export const GRID = `precision mediump float;varying vec2 uv;uniform float t;uniform vec2 res,mouse;uniform vec3 cA,cB;
void main(){
  vec2 p=(uv-.5)*vec2(res.x/res.y,1.);
  float hz=.12;float y=p.y-hz;
  vec3 col=cA;
  float g=0.;
  if(y<0.){
    float d=1./(-y+.02);
    vec2 gp=vec2(p.x*d*1.3,d+t*.35);
    vec2 f=abs(fract(gp)-.5);
    float l=min(f.x,f.y);
    g=smoothstep(.045*d*.5+.01,0.,l)*smoothstep(0.,.5,-y+.04)*clamp(1.2/d+.15,0.,1.);
  }else{
    vec2 gp=p*14.;vec2 f=abs(fract(gp)-.5);
    g=smoothstep(.02,0.,min(f.x,f.y))*.18*(1.-clamp(y*1.6,0.,1.));
  }
  float md=distance(uv*res/res.y,mouse*res/res.y);
  col=mix(col,cB,g*(.55+.9*smoothstep(.45,0.,md)));
  col+=cB*.10*exp(-abs(y)*9.);
  gl_FragColor=vec4(col,1.);
}`;

export const CHROME = `precision mediump float;varying vec2 uv;uniform sampler2D tex;uniform float t;uniform vec2 px;uniform float k;uniform vec3 warm,cool;
float a(vec2 o){return texture2D(tex,uv+o*px).a;}
void main(){
  float m=a(vec2(0.));
  if(m<.01){gl_FragColor=vec4(0.);return;}
  float hx=0.,hy=0.;
  for(int i=1;i<=6;i++){float r=float(i)*2.2*k;
    hx+=a(vec2(r,0.))-a(vec2(-r,0.));hy+=a(vec2(0.,r))-a(vec2(0.,-r));}
  vec2 nn=vec2(-hx,-hy)/6.;
  float e=nn.y*1.7+nn.x*.6+uv.y*1.2+sin(uv.x*5.+t*.7)*.18;
  float band=.5+.5*sin(e*7.+1.2);
  float band2=smoothstep(.25,.8,.5+.5*sin(e*13.-t*.5));
  vec3 dark=vec3(.03,.10,.12);
  vec3 col=mix(dark,cool,band);
  col=mix(col,vec3(1.),band2*.65);
  col=mix(col,warm,smoothstep(.55,1.,.5+.5*sin(e*5.+2.6+t*.4))*.55);
  col+=vec3(.9)*pow(clamp(length(nn)*1.2,0.,1.),3.)*.4;
  gl_FragColor=vec4(col*m,m);
}`;

type U = Record<string, number | number[]>;
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
export const col3 = hex;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
  return s;
}
export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch { return false; }
}

interface ShaderCanvasProps {
  frag: string;
  uniforms?: () => U;
  className?: string;
  style?: CSSProperties;
  fallback?: string; // CSS background for no-WebGL
  fps?: number;
  dpr?: number;
  pointer?: boolean;
  label?: string;
}
export function ShaderCanvas({ frag, uniforms, className, style, fallback, fps = 40, dpr = 1, pointer, label }: ShaderCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ok, setOk] = useState(true);
  const uref = useRef(uniforms);
  uref.current = uniforms;

  useEffect(() => {
    const cv = ref.current!;
    const gl = (cv.getContext("webgl", { antialias: false, alpha: false }) as WebGLRenderingContext | null);
    if (!gl) { setOk(false); return; }
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog);
      gl.useProgram(prog);
    } catch { setOk(false); return; }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const reduce = reduceMotion();
    let vis = true, raf = 0, last = 0;
    const mouse = [0.5, 0.5], tgt = [0.5, 0.5];
    const resize = () => {
      const r = cv.getBoundingClientRect();
      const d = Math.min(dpr, window.devicePixelRatio || 1);
      cv.width = Math.max(2, Math.round(r.width * d));
      cv.height = Math.max(2, Math.round(r.height * d));
      gl.viewport(0, 0, cv.width, cv.height);
    };
    const draw = (time: number) => {
      const u: U = { t: reduce ? 4.2 : time / 1000, res: [cv.width, cv.height], mouse, ...(uref.current ? uref.current() : {}) };
      for (const k in u) {
        const l = gl.getUniformLocation(prog, k);
        if (!l) continue;
        const v = u[k];
        if (typeof v === "number") gl.uniform1f(l, v);
        else if (v.length === 2) gl.uniform2fv(l, v);
        else gl.uniform3fv(l, v);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (!vis || time - last < 1000 / fps) return;
      last = time;
      mouse[0] += (tgt[0] - mouse[0]) * 0.12; mouse[1] += (tgt[1] - mouse[1]) * 0.12;
      draw(time);
    };
    resize();
    draw(0);
    const ro = new ResizeObserver(() => { resize(); draw(performance.now()); });
    ro.observe(cv);
    const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; });
    io.observe(cv);
    const mv = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      tgt[0] = (e.clientX - r.left) / r.width; tgt[1] = 1 - (e.clientY - r.top) / r.height;
    };
    if (pointer && !reduce) window.addEventListener("pointermove", mv);
    if (!reduce) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener("pointermove", mv);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [frag, fps, dpr, pointer]);

  if (!ok) return <div className={className} style={{ ...style, background: fallback }} role="presentation" />;
  return <canvas ref={ref} className={className} style={style} aria-hidden={label ? undefined : true} aria-label={label} />;
}

/* ---------- Marble ---------- */
export function Marble({ a = "#d9dee3", b = "#b9c2cc", c = "#0e1013", scale = 2, turb = 6, className, style }: { a?: string; b?: string; c?: string; scale?: number; turb?: number; className?: string; style?: CSSProperties }) {
  return (
    <ShaderCanvas frag={MARBLE} className={className} style={style} fps={30} dpr={0.7}
      fallback={`radial-gradient(120% 90% at 30% 20%, ${b}55, transparent 60%), linear-gradient(135deg, ${a}, ${c}22)`}
      uniforms={() => ({ cA: col3(a), cB: col3(b), cC: col3(c), scale, turb })} />
  );
}

/* ---------- Grid ---------- */
export function GridBg({ a = "#0e1013", b = "#b9c2cc", className, style }: { a?: string; b?: string; className?: string; style?: CSSProperties }) {
  return (
    <ShaderCanvas frag={GRID} className={className} style={style} fps={30} dpr={0.8} pointer
      fallback={`linear-gradient(${b}22 1px, transparent 1px) 0 0/48px 48px, linear-gradient(90deg, ${b}22 1px, transparent 1px) 0 0/48px 48px, ${a}`}
      uniforms={() => ({ cA: col3(a), cB: col3(b) })} />
  );
}

/* ---------- Chrome (текст-логотип) ---------- */
export function ChromeText({ text, className, style }: { text: string; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const cv = ref.current!;
    const gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true }) as WebGLRenderingContext | null;
    if (!gl) { setOk(false); return; }
    let raf = 0, vis = true, dead = false;
    const reduce = reduceMotion();
    const tx = document.createElement("canvas");
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, CHROME));
      gl.linkProgram(prog); gl.useProgram(prog);
    } catch { setOk(false); return; }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    const setup = () => {
      const r = cv.getBoundingClientRect();
      const d = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(2, Math.round(r.width * d)); cv.height = Math.max(2, Math.round(r.height * d));
      tx.width = cv.width; tx.height = cv.height;
      const c = tx.getContext("2d")!;
      c.clearRect(0, 0, tx.width, tx.height);
      let fs = tx.height * 0.78;
      c.font = `800 ${fs}px Unbounded, sans-serif`;
      const w = c.measureText(text).width;
      if (w > tx.width * 0.96) { fs *= (tx.width * 0.96) / w; c.font = `800 ${fs}px Unbounded, sans-serif`; }
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#fff";
      c.fillText(text, tx.width / 2, tx.height * 0.54);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    const draw = (time: number) => {
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(gl.getUniformLocation(prog, "t"), reduce ? 2 : time / 1000);
      gl.uniform2f(gl.getUniformLocation(prog, "px"), 1 / cv.width, 1 / cv.height);
      gl.uniform1f(gl.getUniformLocation(prog, "k"), Math.max(0.3, cv.height / 300));
      gl.uniform3fv(gl.getUniformLocation(prog, "warm"), col3("#ff7a45"));
      gl.uniform3fv(gl.getUniformLocation(prog, "cool"), col3("#b9c2cc"));
      gl.uniform1i(gl.getUniformLocation(prog, "tex"), 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const loop = (time: number) => { if (dead) return; raf = requestAnimationFrame(loop); if (vis) draw(time); };
    const start = () => { if (dead) return; setup(); draw(0); if (!reduce) raf = requestAnimationFrame(loop); };
    (document.fonts?.load(`800 100px Unbounded`, text) ?? Promise.resolve()).then(start, start);
    const ro = new ResizeObserver(() => { if (!dead && cv.width > 2) { setup(); draw(performance.now()); } });
    ro.observe(cv);
    const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; }); io.observe(cv);
    return () => { dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); gl.getExtension("WEBGL_lose_context")?.loseContext(); };
  }, [text]);

  if (!ok)
    return (
      <span className={className} style={{ ...style, fontFamily: "Unbounded", fontWeight: 800, display: "block", textAlign: "center", lineHeight: 1, backgroundImage: "linear-gradient(180deg,#eef1f4,#b9c2cc 45%,#1c2026 55%,#ff7a45)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
        {text}
      </span>
    );
  return <canvas ref={ref} className={className} style={style} role="img" aria-label={text} />;
}

/* ---------- Boids (canvas 2D) ---------- */
export function Boids({ count = 160, a = "#b9c2cc", b = "#ff4a2b", className }: { count?: number; a?: string; b?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = reduceMotion();
    let W = 0, H = 0, raf = 0, vis = true;
    const m = { x: -999, y: -999 };
    const ag = Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random(), vx: Math.random() - 0.5, vy: Math.random() - 0.5, hot: 0 }));
    const resize = () => {
      const r = cv.getBoundingClientRect(); const d = Math.min(1.5, window.devicePixelRatio || 1);
      W = cv.width = Math.round(r.width * d); H = cv.height = Math.round(r.height * d);
      ag.forEach((g) => { if (g.x <= 1) { g.x *= W; g.y *= H; } });
    };
    const step = () => {
      const per = Math.min(W, H) * 0.14, per2 = per * per;
      for (const g of ag) {
        let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, c = 0;
        for (const o of ag) {
          if (o === g) continue;
          const dx = o.x - g.x, dy = o.y - g.y, d2 = dx * dx + dy * dy;
          if (d2 < per2) { c++; ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; if (d2 < per2 * 0.2) { sx -= dx; sy -= dy; } }
        }
        if (c) { g.vx += (ax / c - g.vx) * 0.05 + ((cx / c - g.x) * 0.0009) + sx * 0.0016; g.vy += (ay / c - g.vy) * 0.05 + ((cy / c - g.y) * 0.0009) + sy * 0.0016; }
        const mx = g.x - m.x, my = g.y - m.y, md = mx * mx + my * my;
        g.hot *= 0.94;
        if (md < per2 * 2.2) { const f = 2.4 / (Math.sqrt(md) + 30); g.vx += mx * f * 0.35; g.vy += my * f * 0.35; g.hot = 1; }
        const sp = Math.hypot(g.vx, g.vy) || 1, tg = 2.1; g.vx = (g.vx / sp) * (sp * 0.9 + tg * 0.1); g.vy = (g.vy / sp) * (sp * 0.9 + tg * 0.1);
        g.x += g.vx; g.y += g.vy;
        if (g.x < 0) g.x += W; if (g.x > W) g.x -= W; if (g.y < 0) g.y += H; if (g.y > H) g.y -= H;
      }
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const s = Math.max(5, W / 190);
      for (const g of ag) {
        const ang = Math.atan2(g.vy, g.vx);
        ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(ang);
        ctx.fillStyle = g.hot > 0.3 ? b : a; ctx.globalAlpha = 0.55 + 0.45 * g.hot;
        ctx.beginPath(); ctx.moveTo(s * 1.4, 0); ctx.lineTo(-s, s * 0.6); ctx.lineTo(-s * 0.5, 0); ctx.lineTo(-s, -s * 0.6); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    };
    const loop = () => { raf = requestAnimationFrame(loop); if (!vis) return; step(); draw(); };
    resize();
    if (reduce) { for (let i = 0; i < 40; i++) step(); draw(); } else raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(); }); ro.observe(cv);
    const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; }); io.observe(cv);
    const mv = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); const d = W / r.width; m.x = (e.clientX - r.left) * d; m.y = (e.clientY - r.top) * d; };
    window.addEventListener("pointermove", mv);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener("pointermove", mv); };
  }, [count, a, b]);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
