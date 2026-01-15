import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { bridgePlugin } from './server/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), bridgePlugin()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
