import { useState } from 'react'

interface Props {
  onEnter: () => void
}

const TUTORIAL_STEPS = [
  {
    icon: '📅',
    title: 'Vista Semanal',
    desc: 'Ve el menú completo de la semana de un vistazo. Toca cualquier día para planificar sus comidas.',
  },
  {
    icon: '🍽',
    title: 'Planifica cada día',
    desc: 'Activa comida y/o cena. Elige primero+segundo o plato único. Asigna platos a cada hueco.',
  },
  {
    icon: '📋',
    title: 'Gestiona tus Platos',
    desc: 'Añade tus recetas con categorías (pescado, carne, verdura…). La app las usa para evitar repeticiones.',
  },
  {
    icon: '⚡',
    title: 'Relleno Automático',
    desc: 'Pulsa "Rellenar semana" y la app sugiere menús variados e inteligentes, ¡incluyendo sobras!',
  },
]

type WelcomeStep = 'home' | 'install' | 'tutorial'

export default function WelcomeScreen({ onEnter }: Props) {
  const isFirstTime = !localStorage.getItem('tucocinapp_onboarded')
  const [step, setStep]           = useState<WelcomeStep>('home')
  const [tutorialIdx, setTutorialIdx] = useState(0)

  function finish() {
    localStorage.setItem('tucocinapp_onboarded', '1')
    onEnter()
  }

  // ── Tutorial ────────────────────────────────────────────────────────────────
  if (step === 'tutorial') {
    const current = TUTORIAL_STEPS[tutorialIdx]
    const isLast  = tutorialIdx === TUTORIAL_STEPS.length - 1
    return (
      <div className="screen-full bg-white flex flex-col px-6 pt-safe">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-4 pb-2 flex-shrink-0">
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === tutorialIdx ? 'w-6 bg-blue-500' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <span className="text-7xl mb-8">{current.icon}</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{current.title}</h2>
          <p className="text-gray-500 text-base leading-relaxed max-w-xs">{current.desc}</p>
        </div>

        {/* Actions */}
        <div className="pb-safe px-0 pb-8 space-y-3 flex-shrink-0">
          <button
            onClick={isLast ? finish : () => setTutorialIdx(i => i + 1)}
            className="w-full py-4 bg-blue-500 text-white font-semibold rounded-2xl text-base active:bg-blue-600"
          >
            {isLast ? 'Empezar a planificar' : 'Siguiente →'}
          </button>
          <button onClick={finish} className="w-full text-center text-gray-400 text-sm py-2">
            Saltar
          </button>
        </div>
      </div>
    )
  }

  // ── Install instructions ─────────────────────────────────────────────────────
  if (step === 'install') {
    return <InstallScreen onNext={() => setStep('tutorial')} />
  }

  // ── Home / Welcome ──────────────────────────────────────────────────────────
  return (
    <div className="screen-full flex flex-col items-center justify-between px-6 pt-safe"
      style={{ background: 'linear-gradient(160deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)' }}
    >
      {/* Branding */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Logo — replace src with actual logo path when available */}
        <div className="w-28 h-28 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 overflow-hidden">
          <img
            src="/logo.png"
            alt="TuCocinaApp"
            className="w-full h-full object-contain"
            onError={e => {
              // Fallback to emoji if logo not found
              const t = e.currentTarget
              t.style.display = 'none'
              t.parentElement!.innerHTML = '<span style="font-size:3rem">🍳</span>'
            }}
          />
        </div>

        <p className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-3">TuCocinaApp</p>
        <h1 className="text-white text-4xl font-extrabold mb-4 leading-tight">
          Menús<br />Semanales
        </h1>
        <p className="text-blue-100 text-base leading-relaxed max-w-xs">
          Planifica comidas y cenas de toda la semana. Sin estrés, sin repeticiones.
        </p>
      </div>

      {/* CTA */}
      <div className="w-full pb-safe pb-8 space-y-3 flex-shrink-0">
        {isFirstTime ? (
          <>
            <button
              onClick={() => setStep('install')}
              className="w-full py-4 bg-white text-blue-600 font-bold rounded-2xl text-base shadow active:bg-blue-50"
            >
              Instalar en mi móvil
            </button>
            <button
              onClick={() => setStep('tutorial')}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base border border-white border-opacity-40 active:bg-white active:bg-opacity-10"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              Ver cómo funciona
            </button>
            <button onClick={finish} className="w-full text-center text-blue-200 text-sm py-2">
              Saltar y entrar directamente
            </button>
          </>
        ) : (
          <>
            <button
              onClick={finish}
              className="w-full py-4 bg-white text-blue-600 font-bold rounded-2xl text-base shadow active:bg-blue-50"
            >
              Entrar
            </button>
            <button
              onClick={() => { setTutorialIdx(0); setStep('tutorial') }}
              className="w-full text-center text-blue-200 text-sm py-2"
            >
              Ver tutorial
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Install instructions screen ───────────────────────────────────────────────

function InstallScreen({ onNext }: { onNext: () => void }) {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios')

  const iosSteps = [
    { text: 'Abre esta página en Safari', sub: '(no Chrome ni otro navegador)' },
    { text: 'Pulsa el botón Compartir en la barra de Safari', sub: 'El cuadrado con la flecha ↑, en la parte inferior' },
    { text: 'Desplázate y pulsa "Añadir a pantalla de inicio"' },
    { text: 'Ponle el nombre que quieras y pulsa "Añadir"' },
  ]
  const androidSteps = [
    { text: 'Abre esta página en Chrome' },
    { text: 'Pulsa el menú de Chrome', sub: 'Los tres puntos ⋮ arriba a la derecha' },
    { text: 'Pulsa "Añadir a pantalla de inicio"' },
    { text: 'Confirma pulsando "Añadir"' },
  ]

  const steps = platform === 'ios' ? iosSteps : androidSteps
  const color  = platform === 'ios' ? 'blue' : 'green'

  return (
    <div className="screen-full bg-white flex flex-col px-6 pt-safe">
      <div className="flex-shrink-0 py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Instalar en tu móvil</h2>
        <p className="text-gray-400 text-sm">
          Añádela a inicio para usarla como app nativa, sin internet.
        </p>
      </div>

      {/* Platform toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 flex-shrink-0">
        {(['ios', 'android'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              platform === p ? 'bg-white shadow text-gray-900' : 'text-gray-400'
            }`}
          >
            {p === 'ios' ? 'iPhone (iOS)' : 'Android'}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="flex-1 space-y-5 overflow-y-auto">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
              }`}
            >
              {i + 1}
            </div>
            <div className="pt-1">
              <p className="text-gray-800 text-sm leading-snug">{s.text}</p>
              {'sub' in s && <p className="text-gray-400 text-xs mt-0.5">{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="pb-safe pb-8 pt-6 flex-shrink-0">
        <button
          onClick={onNext}
          className="w-full py-4 bg-blue-500 text-white font-bold rounded-2xl text-base active:bg-blue-600"
        >
          Ya lo tengo, ver tutorial →
        </button>
      </div>
    </div>
  )
}
