import { useState, useEffect } from 'react'
import type { Tab } from './types'
import { seedIfNeeded } from './utils/seeder'
import ToastContainer from './components/ToastContainer'
import WelcomeScreen from './views/WelcomeScreen'
import WeeklyMenuView from './views/WeeklyMenuView'
import DayMenuView from './views/DayMenuView'
import DishesView from './views/DishesView'
import ShoppingListView from './views/ShoppingListView'
import HistoryView, { HistoryDetailView } from './views/HistoryView'

type Screen =
  | { type: 'welcome' }
  | { type: 'main' }
  | { type: 'dayMenu'; date: string; weekStart: string }
  | { type: 'historyDetail'; menuId: string }

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'menu',      icon: '📅', label: 'Menú' },
  { id: 'platos',    icon: '🍽',  label: 'Platos' },
  { id: 'lista',     icon: '🛒',  label: 'Lista' },
  { id: 'historial', icon: '🕐',  label: 'Historial' },
]

const TAB_TITLE: Record<Tab, string> = {
  menu:      'Menú Semanal',
  platos:    'Mis Platos',
  lista:     'Lista de la Compra',
  historial: 'Historial',
}

export default function App() {
  const [tab, setTab]       = useState<Tab>('menu')
  const [screen, setScreen] = useState<Screen>({ type: 'welcome' })

  useEffect(() => { seedIfNeeded() }, [])

  function goBack() { setScreen({ type: 'main' }) }

  if (screen.type === 'welcome') {
    return (
      <>
        <WelcomeScreen onEnter={() => setScreen({ type: 'main' })} />
        <ToastContainer />
      </>
    )
  }

  return (
    <div className="flex flex-col h-full font-sans" style={{ background: 'var(--cream)' }}>
      <ToastContainer />

      <div className={screen.type === 'main' ? 'flex flex-col h-full' : 'hidden'}>

        {/* ── Title bar ── */}
        <div className="flex items-center justify-between px-5 bg-white border-b flex-shrink-0 pt-safe"
          style={{ borderColor: 'var(--cream-border)' }}
        >
          <div className="py-3">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#AFA59A' }}>
              TuCocinaApp
            </p>
            <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--brand)' }}>
              {TAB_TITLE[tab]}
            </h1>
          </div>
          <button
            onClick={() => setScreen({ type: 'welcome' })}
            className="flex-shrink-0"
          >
            <img src="/logo.png" alt="TuCocinaApp" className="h-10 w-auto opacity-90" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {tab === 'menu'      && <WeeklyMenuView onDayTap={(date, weekStart) => setScreen({ type: 'dayMenu', date, weekStart })} />}
          {tab === 'platos'    && <DishesView />}
          {tab === 'lista'     && <ShoppingListView />}
          {tab === 'historial' && <HistoryView onMenuOpen={menuId => setScreen({ type: 'historyDetail', menuId })} />}
        </div>

        {/* ── Tab bar ── */}
        <nav className="bg-white border-t flex-shrink-0 tab-bar-height" style={{ borderColor: 'var(--cream-border)' }}>
          <div className="flex h-[62px]">
            {TABS.map(t => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity active:opacity-60"
                >
                  <span className="text-[22px] leading-none">{t.icon}</span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: active ? 'var(--brand)' : '#C8C0B5' }}
                  >
                    {t.label}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 w-8 h-0.5 rounded-full"
                      style={{ background: 'var(--brand)' }} />
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {screen.type === 'dayMenu' && (
        <DayMenuView date={screen.date} weekStart={screen.weekStart} onBack={goBack} />
      )}
      {screen.type === 'historyDetail' && (
        <HistoryDetailView menuId={screen.menuId} onBack={goBack} />
      )}
    </div>
  )
}
