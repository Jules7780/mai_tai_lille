import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Démo : les trois maquettes dans un même déploiement
// / = version 1 (src), /v2/ = version 2 (src-v2), /v3/ = version 3 (src-v3)
export default defineConfig({
  plugins: [react()],
  build: {
    // La scène 3D du cocktail (Three.js, ~590 Ko minifiés) est un morceau séparé chargé à la demande
    chunkSizeWarningLimit: 650,
    rolldownOptions: {
      input: {
        v1: 'index.html',
        v2: 'v2/index.html',
        v3: 'v3/index.html',
      },
    },
  },
})
