import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { showToast } from './utils/toast'

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

// Show toast when a new service worker takes control (app updated)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    showToast('App actualizada', 'info')
  })
}
