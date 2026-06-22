import { useState, useEffect } from 'react'
import { WifiOff } from '../components/Icon'

interface Props { onRetry?: () => void }

export default function OfflinePage({ onRetry }: Props) {
  const [reconnecting, setReconnecting] = useState(false)

  // Auto-detect when back online and trigger retry
  useEffect(() => {
    function handleOnline() {
      setReconnecting(true)
      // Small delay so the user sees the "reconnecting" state briefly
      setTimeout(() => onRetry?.(), 900)
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [onRetry])

  function handleRetry() {
    if (!navigator.onLine) return
    setReconnecting(true)
    setTimeout(() => onRetry?.(), 600)
  }

  return (
    <div className="screen-full flex flex-col items-center justify-center px-8 text-center"
      style={{ background: 'var(--brand)', zIndex: 60 }}>

      {/* Icon */}
      <div className="mb-8 flex items-center justify-center w-24 h-24 rounded-3xl"
        style={{ background: 'rgba(255,255,255,0.10)' }}>
        <WifiOff size={44} style={{ color: 'rgba(255,255,255,0.70)' }} />
      </div>

      {/* Text */}
      <h1 className="text-2xl font-black text-white mb-3 tracking-tight">
        {reconnecting ? 'Reconectando…' : 'Sin conexión'}
      </h1>
      <p className="text-sm leading-relaxed max-w-xs"
        style={{ color: 'rgba(255,255,255,0.55)' }}>
        {reconnecting
          ? 'Conexión detectada. Volviendo a la app…'
          : 'Comprueba tu conexión a internet. Tu menú semanal se guardará cuando vuelvas a estar online.'}
      </p>

      {/* Retry button */}
      {!reconnecting && (
        <button
          onClick={handleRetry}
          disabled={!navigator.onLine}
          className="mt-10 px-8 py-4 rounded-2xl font-bold text-base active:opacity-80 disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white',
                   border: '1.5px solid rgba(255,255,255,0.25)' }}>
          Reintentar
        </button>
      )}

      {/* Loading dots when reconnecting */}
      {reconnecting && (
        <div className="mt-10 flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.55)',
                animation: 'ldr-dot 1.3s ease-in-out infinite',
                animationDelay: `${i * 0.18}s`,
              }} />
          ))}
        </div>
      )}

      {/* App name */}
      <p className="absolute bottom-safe mb-8 text-xs font-bold tracking-widest uppercase"
        style={{ color: 'rgba(255,255,255,0.25)', bottom: 'max(32px, env(safe-area-inset-bottom))' }}>
        TuCocinaApp
      </p>
    </div>
  )
}
