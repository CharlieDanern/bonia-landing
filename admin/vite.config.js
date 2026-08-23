import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds into ../public/admin so the EXISTING landing build picks it up
// verbatim (Vite copies public/ into dist/). Nothing about the landing
// app's own build changes — the admin portal is a separate SPA served at
// bonia.vn/admin/. Mirrors portal/vite.config.js.
export default defineConfig({
  plugins: [react()],
  base: "/admin/",
  build: {
    outDir: "../public/admin",
    emptyOutDir: true,
  },
});
