import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Fade out the static HTML loader once React has painted
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const loader = document.getElementById('app-loader')
    if (!loader) return
    loader.classList.add('fade-out')
    setTimeout(() => loader.remove(), 320)
  })
})
