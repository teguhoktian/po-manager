import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { devApiPlugin } from './scripts/devApiPlugin.js'
import { markdownArticles } from './scripts/markdownPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [markdownArticles(), react(), tailwindcss(), devApiPlugin()],
})
