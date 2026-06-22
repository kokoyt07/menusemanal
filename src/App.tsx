import { useState } from 'react'
import type { Tab } from './types'
import { useAuth } from './hooks/useAuth'
import { DataProvider } from './contexts/DataContext'
import { supabase } from './lib/supabase'
import ToastContainer from './components/ToastContainer'
import { Calendar, Utensils, ShoppingBag, Clock, Settings } from './components/Icon'
import AuthScreen from './views/AuthScreen'
import WelcomeScreen from './views/WelcomeScreen'
import WeeklyMenuView from './views/WeeklyMenuView'
import DayMenuView from './views/DayMenuView'
import DishesView from './views/DishesView'
import ShoppingListView from './views/ShoppingListView'
import HistoryView from './views/HistoryView'
import SettingsView from './views/SettingsView'

type Screen =
  | { type: 'welcome'; step?: 'tutorial' | 'install' }
  | { type: 'main' }
  | { type: 'dayMenu'; date: string; weekStart: string }

type IconFC = React.FC<{ size?: number; style?: React.CSSProperties; sw?: number }>
const TABS: { id: Tab; Icon: IconFC; label: string }[] = [
  { id: 'menu',      Icon: Calendar,    label: 'Menú' },
  { id: 'platos',    Icon: Utensils,    label: 'Platos' },
  { id: 'lista',     Icon: ShoppingBag, label: 'Lista' },
  { id: 'historial', Icon: Clock,       label: 'Historial' },
  { id: 'ajustes',   Icon: Settings,    label: 'Ajustes' },
]
const TAB_TITLE: Record<Tab, string> = {
  menu:      'Menú Semanal',
  platos:    'Mis Platos',
  lista:     'Lista de la Compra',
  historial: 'Historial',
  ajustes:   'Ajustes',
}

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab]       = useState<Tab>('menu')
  const [screen, setScreen] = useState<Screen>({ type: 'welcome' })

  if (authLoading) {
    return (
      <div className="h-full font-sans flex justify-center" style={{ background: 'var(--cream-border)' }}>
        <div className="app-column flex items-center justify-center" style={{ background: 'var(--brand)' }}>
          <img src="/logo.png" alt="" className="w-16 h-16 opacity-70"
            style={{ filter: 'brightness(0) invert(1)', animation: 'pulse-soft 1.4s ease infinite' }} />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-full font-sans flex justify-center" style={{ background: 'var(--cream-border)' }}>
        <div className="app-column">
          <AuthScreen />
          <ToastContainer />
        </div>
      </div>
    )
  }

  function goBack() { setScreen({ type: 'main' }) }

  if (screen.type === 'welcome') {
    return (
      <DataProvider userId={user.id}>
        <div className="h-full font-sans flex justify-center" style={{ background: 'var(--cream-border)' }}>
        <div className="app-column">
          <WelcomeScreen
            onEnter={() => setScreen({ type: 'main' })}
            defaultStep={screen.step}
          />
          <ToastContainer />
        </div>
        </div>
      </DataProvider>
    )
  }

  return (
    <DataProvider userId={user.id}>
      {/* Outer div: full viewport, shows gutter color on tablet */}
      <div className="h-full font-sans flex justify-center" style={{ background: 'var(--cream-border)' }}>
      {/* Inner column: max 640px on tablet, full width on mobile */}
      <div className="app-column">
        <ToastContainer />

        <div className={screen.type === 'main' ? 'flex flex-col h-full' : 'hidden'}>
          {/* ── Title bar ── */}
          <div className="flex items-center justify-between px-5 border-b flex-shrink-0 pt-safe"
            style={{ background: 'var(--surface)', borderColor: 'var(--cream-border)' }}>
            <div className="py-3">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#AFA59A' }}>
                TuCocinaApp
              </p>
              <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--brand)' }}>
                {TAB_TITLE[tab]}
              </h1>
            </div>
            <button onClick={() => setScreen({ type: 'welcome' })} className="flex-shrink-0 active:opacity-70">
              <img src="/logo.png" alt="TuCocinaApp" className="h-10 w-auto opacity-90" />
            </button>
          </div>

          {/* ── Content ── */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {tab === 'menu'      && <WeeklyMenuView userId={user.id} onDayTap={(date, weekStart) => setScreen({ type: 'dayMenu', date, weekStart })} />}
            {tab === 'platos'    && <DishesView />}
            {tab === 'lista'     && <ShoppingListView userId={user.id} />}
            {tab === 'historial' && <HistoryView userId={user.id} />}
            {tab === 'ajustes'   && (
              <SettingsView
                userId={user.id}
                onLogout={() => supabase.auth.signOut()}
              />
            )}
          </div>

          {/* ── Tab bar ── */}
          <nav className="border-t flex-shrink-0 tab-bar-height"
            style={{ background: 'var(--surface)', borderColor: 'var(--cream-border)' }}>
            <div className="flex h-[62px]">
              {TABS.map(t => {
                const active = tab === t.id
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex-1 relative flex flex-col items-center justify-center gap-1 transition-opacity active:opacity-60">
                    <t.Icon size={22} style={{ color: active ? 'var(--brand)' : '#C8C0B5', transition: 'color 0.15s' }} />
                    <span className="text-[10px] font-semibold"
                      style={{ color: active ? 'var(--brand)' : '#C8C0B5', transition: 'color 0.15s' }}>
                      {t.label}
                    </span>
                    {active && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                        style={{ background: 'var(--brand)' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </nav>
        </div>

        {screen.type === 'dayMenu' && (
          <DayMenuView userId={user.id} date={screen.date} weekStart={screen.weekStart} onBack={goBack} />
        )}
      </div>{/* end app-column */}
      </div>{/* end outer centering div */}
    </DataProvider>
  )
}
