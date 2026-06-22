import { useState } from 'react'
import type { SVGProps } from 'react'
import { Calendar, Utensils, Tag, Zap, Share, ChevronRight } from '../components/Icon'

type Step = 'home' | 'install' | 'tutorial'

interface Props { onEnter: () => void; defaultStep?: 'tutorial' | 'install' }

type IconFC = React.FC<SVGProps<SVGSVGElement> & { size?: number; sw?: number }>

const TUTORIAL_STEPS: { Icon: IconFC; title: string; desc: string }[] = [
  { Icon: Calendar, title: 'Vista Semanal',      desc: 'Ve el menú completo de la semana de un vistazo. Toca cualquier día para planificar sus comidas.' },
  { Icon: Utensils, title: 'Planifica cada día', desc: 'Activa comida y/o cena. Elige primero+segundo o plato único. Asigna platos a cada hueco.' },
  { Icon: Tag,      title: 'Gestiona tus Platos', desc: 'Añade tus recetas con categorías (pescado, carne, verdura…). La app las usa para evitar repeticiones.' },
  { Icon: Zap,      title: 'Relleno Automático',  desc: 'Pulsa "Rellenar semana" y la app sugiere menús variados e inteligentes, ¡incluyendo sobras!' },
]

export default function WelcomeScreen({ onEnter, defaultStep }: Props) {
  const isFirstTime = !localStorage.getItem('tucocinapp_onboarded')
  const [step, setStep]     = useState<Step>(defaultStep ?? 'home')
  const [tutIdx, setTutIdx] = useState(0)

  function finish() {
    localStorage.setItem('tucocinapp_onboarded', '1')
    onEnter()
  }

  /* ── Tutorial ── */
  if (step === 'tutorial') {
    const cur    = TUTORIAL_STEPS[tutIdx]
    const isLast = tutIdx === TUTORIAL_STEPS.length - 1
    return (
      <div key={tutIdx} className="screen-full anim-fade flex flex-col px-6 pt-safe" style={{ background: 'var(--surface)' }}>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-5 pb-2 flex-shrink-0">
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === tutIdx ? 28 : 6, background: i === tutIdx ? 'var(--brand)' : '#D9D2CA' }} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
            style={{ background: 'var(--brand-soft)' }}>
            <cur.Icon size={44} style={{ color: 'var(--brand)' }} sw={1.5} />
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--brand)' }}>{cur.title}</h2>
          <p className="text-base leading-relaxed max-w-xs" style={{ color: '#8E5D57' }}>{cur.desc}</p>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 pb-safe pb-8 space-y-3">
          <button onClick={isLast ? finish : () => setTutIdx(i => i + 1)} className="btn-primary">
            <span>{isLast ? 'Empezar a planificar' : 'Siguiente'}</span>
            {!isLast && <ChevronRight size={18} />}
          </button>
          <button onClick={finish} className="w-full text-center py-2 text-sm" style={{ color: '#C8C0B5' }}>
            Saltar
          </button>
        </div>
      </div>
    )
  }

  /* ── Install instructions ── */
  if (step === 'install') {
    return <InstallScreen onNext={() => setStep('tutorial')} />
  }

  /* ── Home ── */
  return (
    <div className="screen-full anim-fade flex flex-col items-center justify-between px-6 pt-safe"
      style={{ background: 'linear-gradient(165deg, #2F1D1B 0%, #4E302D 55%, #6B4440 100%)' }}>
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <img src="/logo.png" alt="TuCocinaApp" className="w-36 mb-6 drop-shadow-xl"
          style={{ filter: 'brightness(0) invert(1)' }} />
        <h1 className="text-white text-4xl font-extrabold mb-2 leading-tight tracking-tight">
          TuCocinaApp
        </h1>
        <p className="text-base font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Menús Semanales
        </p>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>
          Planifica comidas y cenas de toda la semana. Sin estrés, sin repeticiones.
        </p>
      </div>

      {/* CTAs */}
      <div className="w-full flex-shrink-0 pb-safe pb-8 space-y-3">
        {isFirstTime ? (
          <>
            <button onClick={() => setStep('install')}
              className="w-full py-4 rounded-2xl font-bold text-base active:opacity-80 flex items-center justify-center gap-2"
              style={{ background: 'white', color: 'var(--brand)' }}>
              Instalar en mi móvil
            </button>
            <button onClick={() => setStep('tutorial')}
              className="w-full py-4 rounded-2xl font-semibold text-base active:opacity-80"
              style={{ background: 'rgba(255,255,255,0.14)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
              Ver cómo funciona
            </button>
            <button onClick={finish} className="w-full text-center py-2 text-sm"
              style={{ color: 'rgba(255,255,255,0.45)' }}>
              Saltar y entrar directamente
            </button>
          </>
        ) : (
          <>
            <button onClick={finish}
              className="w-full py-4 rounded-2xl font-bold text-base active:opacity-80"
              style={{ background: 'white', color: 'var(--brand)' }}>
              Entrar
            </button>
            <button onClick={() => { setTutIdx(0); setStep('tutorial') }}
              className="w-full text-center py-2 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Ver tutorial
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Install screen ─────────────────────────────────────────────────────── */
function InstallScreen({ onNext }: { onNext: () => void }) {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios')

  type InstallStep = { text: string; sub?: string; Icon?: IconFC }

  const iosSteps: InstallStep[] = [
    { text: 'Abre esta página en Safari', sub: 'No Chrome ni otro navegador' },
    { text: 'Pulsa el botón Compartir', sub: 'El cuadrado con flecha en la barra inferior', Icon: Share },
    { text: 'Pulsa "Añadir a pantalla de inicio"' },
    { text: 'Ponle un nombre y pulsa "Añadir"' },
  ]
  const androidSteps: InstallStep[] = [
    { text: 'Abre esta página en Chrome' },
    { text: 'Pulsa el menú de opciones', sub: 'Tres puntos arriba a la derecha' },
    { text: 'Pulsa "Añadir a pantalla de inicio"' },
    { text: 'Confirma pulsando "Añadir"' },
  ]
  const steps = platform === 'ios' ? iosSteps : androidSteps

  return (
    <div className="screen-full anim-up flex flex-col px-6 pt-safe" style={{ background: 'var(--surface)' }}>
      <div className="flex-shrink-0 py-5">
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--brand)' }}>Instalar en tu móvil</h2>
        <p className="text-sm" style={{ color: '#AFA59A' }}>
          Añádela al inicio para usarla como app nativa, sin internet.
        </p>
      </div>

      <div className="flex rounded-xl p-1 mb-6 flex-shrink-0" style={{ background: 'var(--cream)' }}>
        {(['ios', 'android'] as const).map(p => (
          <button key={p} onClick={() => setPlatform(p)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: platform === p ? 'var(--surface)' : 'transparent',
              color: platform === p ? 'var(--brand)' : '#AFA59A',
              boxShadow: platform === p ? '0 1px 4px rgba(47,29,27,0.10)' : 'none',
            }}>
            {p === 'ios' ? 'iPhone (iOS)' : 'Android'}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-4 items-start list-item" style={{ '--i': i } as React.CSSProperties}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
              {i + 1}
            </div>
            <div className="pt-1.5 flex items-start gap-2">
              <div>
                <p className="text-sm font-medium leading-snug" style={{ color: 'var(--brand)' }}>{s.text}</p>
                {'sub' in s && <p className="text-xs mt-0.5" style={{ color: '#AFA59A' }}>{s.sub}</p>}
              </div>
              {'Icon' in s && s.Icon && (
                <s.Icon size={16} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 2 }} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 pt-6 pb-safe pb-8">
        <button onClick={onNext} className="btn-primary">
          Ya lo tengo — ver tutorial
        </button>
      </div>
    </div>
  )
}
