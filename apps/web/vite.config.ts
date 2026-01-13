import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  // Base path for GitHub Pages - update 'mission-control' to your repo name
  base: process.env.GITHUB_ACTIONS ? '/mission-control/' : '/',
  server: {
    host: '0.0.0.0',
  },
})
