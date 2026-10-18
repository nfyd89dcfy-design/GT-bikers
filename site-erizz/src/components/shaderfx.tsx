/* Живые шейдеры (shaders.com, MIT). Только WebGPU: при отказе вызываем onFail и остается CSS-фон. */
import { Shader, ChromaFlow, MeshGradient, FilmGrain, LensFlare, WorleyNoise, LiquidMetal, Chrome, Voxels, Watercolor } from "shaders/react";
import type { Theme } from "@/lib/state";

type Fail = { onFail: (r?: unknown) => void };
const C = { flare: "#ff4a2b", ember: "#ff8a3d", sky: "#9cc9ff", cobalt: "#2a5bd7", ink: "#0e1013", deep: "#07080a", frost: "#eef1f4", sleet: "#d9dee3", aqua: "#b9c2cc" };
const fill = { position: "absolute", inset: 0, width: "100%", height: "100%" } as const;

/** Шлейф курсора: в ночи поверх через screen (черный = прозрачно), днем через multiply (белый = прозрачно). */
export function CursorFlow({ theme, onFail }: { theme: Theme } & Fail) {
  const night = theme === "night";
  return (
    <Shader disableTelemetry colorSpace="srgb" toneMapping="linear" style={fill} onUnavailable={onFail}>
      <ChromaFlow
        baseColor={night ? "#000000" : "#ffffff"}
        upColor={night ? C.flare : "#ffb3a3"}
        downColor={night ? C.cobalt : "#b8cdf5"}
        leftColor={night ? C.sky : "#d6e8ff"}
        rightColor={night ? C.ember : "#ffd0b0"}
        intensity={0.9} radius={2.4} momentum={26}
      />
    </Shader>
  );
}

/** Первый экран: днем серый шелк, ночью темно-синий горизонт с бликом объектива. Плюс чистое зерно. */
export function HeroSky({ theme, onFail }: { theme: Theme } & Fail) {
  const night = theme === "night";
  return (
    <Shader disableTelemetry style={{ ...fill, opacity: 0.92 }} onUnavailable={onFail}>
      {night ? (
        <MeshGradient stops={[{ color: C.deep, position: 0 }, { color: "#0a1226", position: 0.45 }, { color: "#14295c", position: 0.75 }, { color: C.cobalt, position: 1 }]} count={5} smoothness={0.9} swirl={0.25} drift={0.2} speed={0.25} />
      ) : (
        <MeshGradient stops={[{ color: "#f7f8fa", position: 0 }, { color: C.frost, position: 0.35 }, { color: C.sleet, position: 0.7 }, { color: "#c6ced7", position: 1 }]} count={5} smoothness={0.95} swirl={0.3} drift={0.18} speed={0.2} />
      )}
      {night && <LensFlare lightPosition={{ x: 0.82, y: 0.16 }} intensity={0.55} ghostIntensity={0.35} haloIntensity={0.25} starburstIntensity={0.3} streakIntensity={0.45} glareIntensity={0.35} speed={0.2} />}
      <FilmGrain strength={night ? 0.16 : 0.1} animated />
    </Shader>
  );
}

/** Ячеистая текстура (WorleyNoise) с зерном для темных блоков. */
export function CellsBg({ tone, theme, onFail }: { tone: "steel" | "flare"; theme: Theme } & Fail) {
  const day = theme === "day";
  const [a, b] = day ? (tone === "flare" ? ["#ffffff", "#ffe1d6"] : ["#ffffff", "#eceef1"]) : (tone === "flare" ? ["#000000", "#3a1209"] : ["#000000", "#17191d"]);
  return (
    <Shader disableTelemetry style={{ ...fill, opacity: day ? 0.7 : 0.6 }} onUnavailable={onFail}>
      <WorleyNoise colorA={a} colorB={b} scale={3.2} speed={0.12} contrast={0.6} />
      <FilmGrain strength={day ? 0.06 : 0.14} animated />
    </Shader>
  );
}

/** Фигуры: жидкий металл (метаболы), хромированный тор, вокселы. */
export function MetalShape({ kind, onFail }: { kind: "liquid" | "chrome" | "voxels" } & Fail) {
  return (
    <Shader disableTelemetry style={fill} onUnavailable={onFail}>
      {kind === "liquid" && <LiquidMetal shape={{ type: "metaballs3D", balls: 4, ballRadius: 0.17, spread: 0.2, blend: 0.14, speed: 0.6 }} lightColor={C.frost} darkColor={C.ink} turbulence={0.35} ripple={0.3} warp={0.3} speed={0.6} />}
      {kind === "chrome" && <Chrome shape={{ type: "torus3D", radius: 0.3, tube: 0.12, rotX: 62, rotY: 0, rotZ: 18 }} tint={C.frost} warmColor={C.flare} coolColor={C.sky} speed={0.5} />}
      {kind === "voxels" && <Voxels shape={{ type: "metaballs3D", balls: 3, ballRadius: 0.2, spread: 0.18, blend: 0.12, speed: 0.5 }} colorA={C.flare} colorB={C.ink} lightColor={C.frost} />}
    </Shader>
  );
}

/** Стартовый экран: акварельный градиент в цветах GT. */
export function PaintBg({ onFail }: Fail) {
  return (
    <Shader disableTelemetry style={fill} onUnavailable={onFail}>
      <MeshGradient stops={[{ color: C.deep, position: 0 }, { color: "#10204a", position: 0.5 }, { color: C.cobalt, position: 0.8 }, { color: C.flare, position: 1 }]} count={4} smoothness={0.85} swirl={0.4} drift={0.25} speed={0.3} />
      <Watercolor strength={0.6} bleed={0.5} paper={0.35} />
      <FilmGrain strength={0.12} animated />
    </Shader>
  );
}
