import { useState } from 'react'

const KEY = 'tucocinapp_cookie_ok'

export default function CookieBanner() {
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(KEY))

  if (dismissed) return null

  function accept() {
    localStorage.setItem(KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-[640px] pointer-events-auto">
        <div className="mx-3 mb-3 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-lg"
          style={{
            background: 'rgba(47,29,27,0.96)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}>
          <p className="flex-1 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Usamos <strong style={{ color: 'white' }}>cookies esenciales</strong> para mantener tu sesión. Sin rastreo ni publicidad.
          </p>
          <button
            onClick={accept}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold active:opacity-75"
            style={{ background: 'white', color: 'var(--brand)' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
