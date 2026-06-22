import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { showToast } from './utils/toast'
import { initTheme } from './utils/theme'

initTheme()

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

if ('serviceWorker' in navigator) {
  // iOS critical fix: force update check whenever the app comes to the foreground.
  // iOS never checks for SW updates in the background, only on cold start.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.ready.then(reg => reg.update()).catch(() => {})
    }
  })

  // When a new SW takes control, reload so the new JS/CSS assets are used.
  // Guard flag prevents double-reload in edge cases.
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    showToast('Actualizando…', 'info')
    setTimeout(() => window.location.reload(), 800)
  })
}
