import { useState } from 'react'
import { Share, ChevronRight } from '../components/Icon'

interface Props {
  onContinue: () => void
}

type Platform = 'ios' | 'android' | 'desktop'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua))          return 'android'
  return 'desktop'
}

interface Step { text: string; sub?: string; Icon?: React.FC<{ size?: number; style?: React.CSSProperties }> }

const IOS_STEPS: Step[] = [
  { text: 'Abre esta página en Safari', sub: 'No funciona desde Chrome ni otros navegadores' },
  { text: 'Pulsa el botón Compartir', sub: 'El ícono de cuadrado con flecha ↑ en la barra inferior', Icon: Share },
  { text: 'Toca "Añadir a pantalla de inicio"' },
  { text: 'Pulsa "Añadir" — ¡ya está!' },
]

const ANDROID_STEPS: Step[] = [
  { text: 'Abre esta página en Chrome' },
  { text: 'Pulsa los tres puntos arriba a la derecha' },
  { text: 'Selecciona "Añadir a pantalla de inicio"' },
  { text: 'Confirma — ¡ya está!' },
]

const DESKTOP_STEPS: Step[] = [
  { text: 'Esta app está pensada para móvil', sub: 'Funciona mejor instalada en tu iPhone o Android' },
  { text: 'Ábrela en el navegador de tu móvil', sub: 'Safari en iPhone, Chrome en Android' },
  { text: 'Sigue los pasos de instalación' },
]

export default function InstallPromptScreen({ onContinue }: Props) {
  const detected   = detectPlatform()
  const [platform, setPlatform] = useState<Platform>(detected)

  const steps = platform === 'ios' ? IOS_STEPS
    : platform === 'android'       ? ANDROID_STEPS
    : DESKTOP_STEPS

  return (
    <div className="screen-full flex flex-col" style={{ background: 'var(--brand)' }}>

      {/* ── Header ── */}
      <div className="flex flex-col items-center pt-safe px-6 pt-10 pb-6 flex-shrink-0">
        <img
          src="/logo.png" alt="TuCocinaApp"
          className="w-16 h-16 mb-4 rounded-2xl"
          style={{ filter: 'brightness(0) invert(1)', opacity: 0.92 }}
        />
        <h1 className="text-2xl font-black text-white tracking-tight mb-1">
          Instala TuCocinaApp
        </h1>
        <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Funciona como una app nativa, sin barra del navegador
        </p>
      </div>

      {/* ── Card ── */}
      <div className="flex-1 rounded-t-3xl flex flex-col overflow-hidden"
        style={{ background: 'var(--surface)' }}>

        {/* Platform tabs — solo si el navegador es móvil */}
        {detected !== 'desktop' && (
          <div className="flex mx-4 mt-4 rounded-xl p-1 flex-shrink-0"
            style={{ background: 'var(--cream)' }}>
            {(['ios', 'android'] as const).map(p => (
              <button key={p} onClick={() => setPlatform(p)}
                className="flex-1 py-2 rounded-[10px] text-sm font-bold transition-all"
                style={{
                  background: platform === p ? 'var(--brand)' : 'transparent',
                  color:      platform === p ? 'white' : '#AFA59A',
                  boxShadow:  platform === p ? '0 2px 8px rgba(47,29,27,0.25)' : 'none',
                }}>
                {p === 'ios' ? 'iPhone / iPad' : 'Android'}
              </button>
            ))}
          </div>
        )}

        {/* Steps */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {steps.map((step, i) => (
            <div key={i}
              className="flex gap-4 items-start p-3.5 rounded-2xl list-item"
              style={{
                '--i': i,
                background: 'var(--cream)',
                border: '1px solid var(--cream-border)',
              } as React.CSSProperties}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                style={{ background: 'var(--brand)', minWidth: 32 }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--brand)' }}>
                    {step.text}
                  </p>
                  {step.Icon && (
                    <step.Icon size={15} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  )}
                </div>
                {step.sub && (
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: '#AFA59A' }}>
                    {step.sub}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 px-4 pb-safe space-y-2"
          style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:opacity-80"
            style={{ background: 'var(--brand)', color: 'white' }}>
            Ya la tengo instalada
            <ChevronRight size={18} />
          </button>
          <button
            onClick={onContinue}
            className="w-full py-3 rounded-2xl text-sm font-semibold active:opacity-60"
            style={{ color: '#AFA59A' }}>
            Continuar sin instalar
          </button>
        </div>
      </div>
    </div>
  )
}
