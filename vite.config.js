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
      // Two entries. The consumer landing (index) and the partner-acquisition
      // deck (business) are separate documents so the landing never ships
      // GSAP or the deck engine, which only /business uses.
      input: {
        main: resolve(__dirname, 'index.html'),
        business: resolve(__dirname, 'business.html'),
      },
    },
  },
})
