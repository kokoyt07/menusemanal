import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useMenuHistory } from '../hooks/useMenuHistory'
import type { MenuWithDays } from '../hooks/useMenuHistory'
import type { MenuDay, Dish } from '../types'
import { weekRangeLabel, fullDayTitle } from '../utils/dateUtils'
import { showToast } from '../utils/toast'
import { History, ChevronRight, Trash, Copy, Sun, Moon, ChevronLeft } from '../components/Icon'

interface Props { userId: string }

export default function HistoryView({ userId }: Props) {
  const [detail, setDetail] = useState<MenuWithDays | null>(null)

  const { menus, deleteMenu, duplicateMenu } = useMenuHistory(userId)
  const loading = menus === undefined

  if (detail) {
    return (
      <HistoryDetailView
        menu={detail}
        userId={userId}
        onBack={() => setDetail(null)}
      />
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--cream)' }}>
      <div className="content-area px-4 pt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
          </div>
        ) : (menus ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <History size={44} sw={1.25} style={{ color: '#D9D2CA', marginBottom: 12 }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>Sin historial todavia</p>
            <p className="text-xs mt-1" style={{ color: '#AFA59A' }}>Los menus guardados apareceran aqui</p>
          </div>
        ) : (
          (menus ?? []).map((menu, idx) => (
            <HistoryMenuCard
              key={menu.id}
              menu={menu}
              idx={idx}
              onOpen={() => setDetail(menu)}
              onDelete={async () => { await deleteMenu(menu.id); showToast('Menu eliminado') }}
              onDuplicate={async () => { await duplicateMenu(menu); showToast('Menu duplicado') }}
            />
          ))
        )}
        <div className="h-8" />
      </div>
    </div>
  )
}

function HistoryMenuCard({ menu, idx, onOpen, onDelete, onDuplicate }: {
  menu: MenuWithDays; idx: number
  onOpen: () => void; onDelete: () => void; onDuplicate: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const filled = menu.days.filter(d =>
    d.firstLunchDishId || d.secondLunchDishId || d.singleLunchDishId ||
    d.firstDinnerDishId || d.secondDinnerDishId || d.singleDinnerDishId
  ).length

  return (
    <div className="rounded-2xl overflow-hidden list-item"
      style={{ '--i': idx, background: 'var(--surface)', border: '1px solid var(--cream-border)',
               boxShadow: '0 1px 4px rgba(47,29,27,0.06)' } as React.CSSProperties}>
      <button onClick={onOpen}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left active:opacity-75">
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--brand)' }}>{weekRangeLabel(menu.weekStartDate)}</p>
          <p className="text-xs mt-0.5" style={{ color: '#AFA59A' }}>{filled} dia{filled !== 1 ? 's' : ''} planificado{filled !== 1 ? 's' : ''}</p>
        </div>
        <ChevronRight size={16} style={{ color: '#AFA59A' }} />
      </button>

      <div className="flex gap-2 px-4 pb-3">
        <button onClick={onDuplicate}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold active:opacity-70"
          style={{ background: 'var(--cream)', color: 'var(--brand)', border: '1px solid var(--cream-border)' }}>
          <Copy size={12} /><span>Duplicar semana</span>
        </button>

        {confirming ? (
          <div className="flex gap-1.5">
            <button onClick={onDelete}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: '#C0392B' }}>
              Eliminar
            </button>
            <button onClick={() => setConfirming(false)}
              className="px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'var(--cream)', color: 'var(--brand)' }}>
              No
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl active:opacity-70"
            style={{ background: 'var(--cream)', border: '1px solid var(--cream-border)' }}>
            <Trash size={14} style={{ color: '#D9D2CA' }} />
          </button>
        )}
      </div>
    </div>
  )
}

function HistoryDetailView({ menu, userId, onBack }: { menu: MenuWithDays; userId: string; onBack: () => void }) {
  const { dishes: allDishes, categories } = useData()
  const dishMap = new Map<string, Dish>((allDishes ?? []).map(d => [d.id, d]))

  function dishName(id?: string | null): string {
    if (!id) return ''
    return dishMap.get(id)?.name ?? ''
  }

  const daysWithContent = menu.days.filter(d =>
    d.hasLunch || d.hasDinner || d.notes
  )

  return (
    <div className="screen-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 pt-safe"
        style={{ background: 'var(--surface)', borderColor: 'var(--cream-border)' }}>
        <button onClick={onBack}
          className="flex items-center gap-1 font-semibold text-sm active:opacity-60"
          style={{ color: 'var(--brand)' }}>
          <ChevronLeft size={20} /><span>Historial</span>
        </button>
        <div className="flex-1 text-center">
          <p className="font-bold text-sm" style={{ color: 'var(--brand)' }}>{weekRangeLabel(menu.weekStartDate)}</p>
        </div>
        <div className="w-16" />
      </div>

      <div className="screen-scroll px-4 py-4 space-y-3">
        {daysWithContent.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: '#AFA59A' }}>Sin platos registrados</p>
          </div>
        )}

        {menu.days.map((day, idx) => {
          const hasAnything = day.hasLunch || day.hasDinner || day.notes
          if (!hasAnything) return null
          return (
            <div key={day.id} className="card list-item" style={{ '--i': idx } as React.CSSProperties}>
              <div className="px-4 py-2.5 border-b" style={{ background: 'var(--cream)', borderColor: 'var(--cream-border)' }}>
                <p className="font-bold text-sm" style={{ color: 'var(--brand)' }}>{fullDayTitle(day.date)}</p>
              </div>

              {day.hasLunch && (
                <MealSummary
                  icon={<Sun size={13} style={{ color: '#D4A017' }} />}
                  label="Comida"
                  mode={day.lunchMode ?? 'primeroYSegundo'}
                  first={dishName(day.firstLunchDishId)}
                  second={dishName(day.secondLunchDishId)}
                  single={dishName(day.singleLunchDishId)}
                />
              )}

              {day.hasDinner && (
                <MealSummary
                  icon={<Moon size={13} style={{ color: '#7C6FA0' }} />}
                  label="Cena"
                  mode={day.dinnerMode ?? 'primeroYSegundo'}
                  first={dishName(day.firstDinnerDishId)}
                  second={dishName(day.secondDinnerDishId)}
                  single={dishName(day.singleDinnerDishId)}
                  borderTop
                />
              )}

              {day.notes && (
                <div className="px-4 py-3 border-t text-xs italic"
                  style={{ borderColor: 'var(--cream-border)', color: '#AFA59A' }}>
                  {day.notes}
                </div>
              )}
            </div>
          )
        })}
        <div className="h-4" />
      </div>
    </div>
  )
}

function MealSummary({ icon, label, mode, first, second, single, borderTop }: {
  icon: React.ReactNode; label: string; mode: string
  first?: string; second?: string; single?: string; borderTop?: boolean
}) {
  return (
    <div className="px-4 py-3" style={{ borderTop: borderTop ? '1px solid var(--cream-border)' : undefined }}>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#AFA59A' }}>{label}</span>
      </div>
      {mode === 'platoUnico' ? (
        <p className="text-sm font-medium" style={{ color: single ? 'var(--brand)' : '#C8C0B5' }}>
          {single || 'Sin plato'}
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-sm font-medium" style={{ color: first ? 'var(--brand)' : '#C8C0B5' }}>
            1º {first || '—'}
          </p>
          <p className="text-sm font-medium" style={{ color: second ? 'var(--brand)' : '#C8C0B5' }}>
            2º {second || '—'}
          </p>
        </div>
      )}
    </div>
  )
}
