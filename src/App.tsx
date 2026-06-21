import { useState, useEffect } from 'react'
import type { Tab } from './types'
import { seedIfNeeded } from './utils/seeder'
import WelcomeScreen from './views/WelcomeScreen'
import WeeklyMenuView from './views/WeeklyMenuView'
import DayMenuView from './views/DayMenuView'
import DishesView from './views/DishesView'
import HistoryView, { HistoryDetailView } from './views/HistoryView'

type Screen =
  | { type: 'welcome' }
  | { type: 'main' }
  | { type: 'dayMenu'; date: string; weekStart: string }
  | { type: 'historyDetail'; menuId: string }

export default function App() {
  const [tab, setTab]       = useState<Tab>('menu')
  const [screen, setScreen] = useState<Screen>({ type: 'welcome' })

  useEffect(() => { seedIfNeeded() }, [])

  function goBack() { setScreen({ type: 'main' }) }

  if (screen.type === 'welcome') {
    return <WelcomeScreen onEnter={() => setScreen({ type: 'main' })} />
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans">
      {/* ── Main tab view ── */}
      <div className={screen.type === 'main' ? 'flex flex-col h-full' : 'hidden'}>
        {/* Title bar */}
        <div className="bg-white border-b border-gray-100 px-4 pt-safe flex-shrink-0 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 py-3">
            {tab === 'menu'      && 'Menú Semanal'}
            {tab === 'platos'    && 'Mis Platos'}
            {tab === 'historial' && 'Historial'}
          </h1>
          {/* TuCocinaApp mini branding */}
          <button
            onClick={() => setScreen({ type: 'welcome' })}
            className="text-xs text-gray-300 font-semibold tracking-wide active:text-gray-400"
          >
            TUCOCINAPP
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {tab === 'menu' && (
            <WeeklyMenuView
              onDayTap={(date, weekStart) => setScreen({ type: 'dayMenu', date, weekStart })}
            />
          )}
          {tab === 'platos'    && <DishesView />}
          {tab === 'historial' && (
            <HistoryView onMenuOpen={menuId => setScreen({ type: 'historyDetail', menuId })} />
          )}
        </div>

        {/* Tab bar */}
        <nav className="bg-white border-t border-gray-200 flex-shrink-0 tab-bar-height">
          <div className="flex h-16">
            {([
              { id: 'menu',      icon: '📅', label: 'Menú' },
              { id: 'platos',    icon: '🍽',  label: 'Platos' },
              { id: 'historial', icon: '🕐',  label: 'Historial' },
            ] as { id: Tab; icon: string; label: string }[]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:bg-gray-50 ${
                  tab === t.id ? 'text-blue-500' : 'text-gray-400'
                }`}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                <span className={`text-[10px] font-medium ${tab === t.id ? 'text-blue-500' : 'text-gray-400'}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* ── Day menu screen ── */}
      {screen.type === 'dayMenu' && (
        <DayMenuView date={screen.date} weekStart={screen.weekStart} onBack={goBack} />
      )}

      {/* ── History detail screen ── */}
      {screen.type === 'historyDetail' && (
        <HistoryDetailView menuId={screen.menuId} onBack={goBack} />
      )}
    </div>
  )
}
