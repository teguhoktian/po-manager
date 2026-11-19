import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Public pages arrive prerendered (scripts/prerender.mjs): attach to the existing markup instead of replacing it.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
