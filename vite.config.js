import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      // Entries (2026-10-01): the home chooser (index, bonia.vn/), the consumer
      // call-screening landing (retail, /retail), its install guide (huong-dan,
      // /huong-dan, linked from nowhere on the site), the partner-acquisition
      // deck (business) and the receptionist landing (reception). Separate
      // documents so each page ships only its own code: the landings never ship
      // GSAP or the deck engine, which only /business uses.
      input: {
        main: resolve(__dirname, 'index.html'),
        retail: resolve(__dirname, 'retail.html'),
        huongdan: resolve(__dirname, 'huong-dan.html'),
        business: resolve(__dirname, 'business.html'),
        reception: resolve(__dirname, 'reception.html'),
      },
    },
  },
})
