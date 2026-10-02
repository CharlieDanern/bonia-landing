import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds into ../public/reception/app so the landing build copies it
// verbatim (Vite copies public/ into dist/), like admin/ and portal/.
// Served at bonia.vn/reception/app/.
export default defineConfig({
  plugins: [react()],
  base: "/reception/app/",
  // Inline (empty) PostCSS config: stops Vite from picking up the landing's
  // postcss.config.js + Tailwind one directory up.
  css: { postcss: {} },
  server: {
    port: Number(process.env.PORT) || 5180,
    strictPort: true,
  },
  preview: {
    port: Number(process.env.PORT) || 5180,
  },
  build: {
    outDir: "../public/reception/app",
    emptyOutDir: true,
  },
});
