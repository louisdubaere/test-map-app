import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/geopunt': {
        target: 'https://geo.api.vlaanderen.be',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/geopunt/, '')
      },
      '/api/geoservices': {
        target: 'https://geoservices.informatievlaanderen.be',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/geoservices/, '')
      }
    }
  }
})
