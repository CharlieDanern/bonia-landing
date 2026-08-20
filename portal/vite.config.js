import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds into ../public/app so the EXISTING landing build picks it up
// verbatim (Vite copies public/ into dist/). Nothing about the landing
// app's own build changes — the portal is a separate SPA served at
// bonia.vn/app/.
export default defineConfig({
  plugins: [react()],
  base: "/app/",
  build: {
    outDir: "../public/app",
    emptyOutDir: true,
  },
});
