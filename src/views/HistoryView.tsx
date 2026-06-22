import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { WeeklyMenu, MenuDay, Dish } from '../types'
import { getDishIdsFromDay } from '../types'
import { weekRangeLabel, addWeeks, fullDayTitle } from '../utils/dateUtils'
import { exportAndSharePDF } from '../utils/pdfExporter'
import { showToast } from '../utils/toast'
import { Calendar, ChevronLeft, ChevronRight, Sun, Moon, Copy, Trash, Share } from '../components/Icon'

interface Props { onMenuOpen: (menuId: string) => void }

export default function HistoryView({ onMenuOpen }: Props) {
  const menus = useLiveQuery(() =>
    db.menus.orderBy('weekStartDate').reverse().toArray()
  )

  if (!menus) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0">
        <p style={{ color: '#AFA59A' }}>Cargando…</p>
      </div>
    )
  }

  if (menus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-0 px-8 text-center">
        <Calendar size={44} sw={1.25} style={{ color: '#D9D2CA', marginBottom: 16 }} />
        <p className="font-semibold text-sm" style={{ color: 'var(--brand)' }}>Sin historial</p>
        <p className="text-sm mt-1" style={{ color: '#AFA59A' }}>Los menus que planifiques aparecerán aqui</p>
      </div>
    )
  }

  return (
    <div className="content-area px-4 pt-4 space-y-2.5">
      {menus.map((menu, idx) => (
        <div key={menu.id} className="list-item" style={{ '--i': idx } as React.CSSProperties}>
          <HistoryMenuCard menu={menu} onOpen={() => onMenuOpen(menu.id)} />
        </div>
      ))}
      <div className="h-4" />
    </div>
  )
}

function HistoryMenuCard({ menu, onOpen }: { menu: WeeklyMenu; onOpen: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const days   = useLiveQuery(() => db.days.where('menuId').equals(menu.id).toArray(), [menu.id])
  const filled = (days ?? []).filter(d => d.hasLunch || d.hasDinner).length

  async function duplicate() {
    const nextStart = addWeeks(menu.weekStartDate, 1)
    const existing = await db.menus.where('weekStartDate').equals(nextStart).first()
    if (existing) { showToast('Ya existe un menu para esa semana', 'info'); return }

    const newMenuId = crypto.randomUUID()
    await db.menus.add({ id: newMenuId, weekStartDate: nextStart })
    const newDays: MenuDay[] = (days ?? []).map(d => ({
      ...d,
      id: crypto.randomUUID(),
      menuId: newMenuId,
      date: addWeeks(d.date, 1),
    }))
    await db.days.bulkAdd(newDays)
    showToast('Semana duplicada')
  }

  async function deleteMenu() {
    await db.days.bulkDelete((days ?? []).map(d => d.id))
    await db.menus.delete(menu.id)
    showToast('Menu eliminado')
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'white', border: '1px solid var(--cream-border)',
               boxShadow: '0 1px 4px rgba(47,29,27,0.06)' }}>
      <button onClick={onOpen} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-75">
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: 'var(--brand)' }}>{weekRangeLabel(menu.weekStartDate)}</p>
          <p className="text-xs mt-0.5" style={{ color: '#AFA59A' }}>{filled} dia(s) planificados</p>
        </div>
        <ChevronRight size={16} style={{ color: '#D9D2CA' }} />
      </button>

      {confirmDelete ? (
        <div className="flex items-center justify-between px-4 py-2.5 border-t anim-scale"
          style={{ background: '#FEF3EE', borderColor: '#F5C0A4' }}>
          <p className="text-xs font-medium" style={{ color: '#8B4513' }}>Eliminar este menu?</p>
          <div className="flex gap-2">
            <button onClick={deleteMenu}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#C0392B' }}>
              Eliminar
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="px-3 py-1 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--cream)', color: 'var(--brand)' }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex border-t" style={{ borderColor: 'var(--cream-border)' }}>
          <button onClick={duplicate}
            className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold active:opacity-60"
            style={{ color: 'var(--brand)' }}>
            <Copy size={13} /><span>Duplicar semana</span>
          </button>
          <div className="w-px" style={{ background: 'var(--cream-border)' }} />
          <button onClick={() => setConfirmDelete(true)}
            className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold active:opacity-60"
            style={{ color: '#C0392B' }}>
            <Trash size={13} /><span>Eliminar</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Full-screen detail ───────────────────────────────────────────────────── */
interface DetailProps { menuId: string; onBack: () => void }

export function HistoryDetailView({ menuId, onBack }: DetailProps) {
  const [exporting, setExporting] = useState(false)

  const menu = useLiveQuery(() => db.menus.get(menuId), [menuId])
  const days = useLiveQuery(() => db.days.where('menuId').equals(menuId).toArray(), [menuId])

  const allDishIds = (days ?? []).flatMap(d => getDishIdsFromDay(d))
  const dishes = useLiveQuery(
    () => allDishIds.length ? db.dishes.where('id').anyOf(allDishIds).toArray() : Promise.resolve<Dish[]>([]),
    [JSON.stringify(allDishIds)]
  )
  const dishMap = new Map<string, Dish>((dishes ?? []).map(d => [d.id, d]))

  async function doExport() {
    if (!menu || !days) return
    setExporting(true)
    try { await exportAndSharePDF(menu, days, dishMap) }
    finally { setExporting(false) }
  }

  if (!menu) return null
  const sorted = [...(days ?? [])].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="screen-full">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b flex-shrink-0 pt-safe"
        style={{ borderColor: 'var(--cream-border)' }}>
        <button onClick={onBack}
          className="flex items-center gap-1 font-semibold text-sm active:opacity-60"
          style={{ color: 'var(--brand)' }}>
          <ChevronLeft size={20} /><span>Historial</span>
        </button>
        <div className="flex-1 text-center">
          <p className="font-bold text-sm" style={{ color: 'var(--brand)' }}>{weekRangeLabel(menu.weekStartDate)}</p>
        </div>
        <button onClick={doExport} disabled={exporting}
          className="flex items-center gap-1.5 text-sm font-semibold active:opacity-60 disabled:opacity-40"
          style={{ color: 'var(--brand)' }}>
          <Share size={14} /><span>{exporting ? '…' : 'PDF'}</span>
        </button>
      </div>

      <div className="screen-scroll px-4 py-4 space-y-2.5">
        {sorted.map((day, idx) => {
          const lunchNames = (() => {
            const ids = day.lunchMode === 'primeroYSegundo'
              ? [day.firstLunchDishId, day.secondLunchDishId] : [day.singleLunchDishId]
            return ids.filter(Boolean).map(id => dishMap.get(id!)?.name).filter(Boolean).join(' · ') || '—'
          })()
          const dinnerNames = (() => {
            const ids = day.dinnerMode === 'primeroYSegundo'
              ? [day.firstDinnerDishId, day.secondDinnerDishId] : [day.singleDinnerDishId]
            return ids.filter(Boolean).map(id => dishMap.get(id!)?.name).filter(Boolean).join(' · ') || '—'
          })()

          return (
            <div key={day.id} className="card p-4 list-item" style={{ '--i': idx } as React.CSSProperties}>
              <p className="font-bold text-sm mb-2.5" style={{ color: 'var(--brand)' }}>{fullDayTitle(day.date)}</p>
              {day.hasLunch && (
                <div className="flex items-start gap-2 mb-1.5">
                  <Sun size={13} style={{ color: '#D4A017', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-sm" style={{ color: 'var(--brand)' }}>{lunchNames}</p>
                </div>
              )}
              {day.hasDinner && (
                <div className="flex items-start gap-2">
                  <Moon size={13} style={{ color: '#7C6FA0', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-sm" style={{ color: 'var(--brand)' }}>{dinnerNames}</p>
                </div>
              )}
              {!day.hasLunch && !day.hasDinner && (
                <p className="text-sm" style={{ color: '#C8C0B5' }}>Dia libre</p>
              )}
              {day.notes && (
                <p className="text-xs mt-2 pt-2 border-t" style={{ color: '#AFA59A', borderColor: 'var(--cream-border)' }}>
                  {day.notes}
                </p>
              )}
            </div>
          )
        })}
        <div className="h-4" />
      </div>
    </div>
  )
}
