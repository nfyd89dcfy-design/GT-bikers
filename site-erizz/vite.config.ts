import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

const glbs = (() => { try { return fs.readdirSync(path.resolve(__dirname, "public/models")).filter((f) => f.endsWith(".glb")); } catch { return []; } })();

export default defineConfig({
  base: "./",
  define: { __GLB_LIST__: JSON.stringify(glbs) },
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: { outDir: "dist", chunkSizeWarningLimit: 2500 },
});
