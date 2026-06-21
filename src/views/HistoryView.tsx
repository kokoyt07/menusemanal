import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { WeeklyMenu, MenuDay, Dish } from '../types'
import { getDishIdsFromDay } from '../types'
import { weekRangeLabel, addWeeks, fullDayTitle } from '../utils/dateUtils'
import { exportAndSharePDF } from '../utils/pdfExporter'
import { showToast } from '../utils/toast'

interface Props {
  onMenuOpen: (menuId: string) => void
}

export default function HistoryView({ onMenuOpen }: Props) {
  const menus = useLiveQuery(() =>
    db.menus.orderBy('weekStartDate').reverse().toArray()
  )

  if (!menus) return <div className="flex-1 flex items-center justify-center min-h-0"><p className="text-gray-400">Cargando…</p></div>

  if (menus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-0 text-gray-400 px-8 text-center">
        <p className="text-5xl mb-4">📅</p>
        <p className="font-medium text-gray-600 mb-1">Sin historial</p>
        <p className="text-sm">Los menús que planifiques aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="content-area px-4 pt-4 space-y-3">
      {menus.map(menu => (
        <HistoryMenuCard key={menu.id} menu={menu} onOpen={() => onMenuOpen(menu.id)} />
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
    if (existing) { showToast('Ya existe un menú para esa semana', 'info'); return }

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
    showToast('Menú eliminado')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button onClick={onOpen} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{weekRangeLabel(menu.weekStartDate)}</p>
          <p className="text-sm text-gray-400 mt-0.5">{filled} día(s) planificados</p>
        </div>
        <span className="text-gray-300">›</span>
      </button>

      {confirmDelete ? (
        <div className="flex items-center justify-between px-4 py-2.5 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-700 font-medium">¿Eliminar este menú?</p>
          <div className="flex gap-2">
            <button onClick={deleteMenu} className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg">Sí</button>
            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg">No</button>
          </div>
        </div>
      ) : (
        <div className="flex border-t border-gray-100">
          <button onClick={duplicate} className="flex-1 py-2.5 text-xs text-blue-500 font-medium active:bg-gray-50">
            Duplicar semana →
          </button>
          <div className="w-px bg-gray-100" />
          <button onClick={() => setConfirmDelete(true)} className="flex-1 py-2.5 text-xs text-red-400 font-medium active:bg-gray-50">
            Eliminar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Full-screen detail ───────────────────────────────────────────────────────

interface DetailProps {
  menuId: string
  onBack: () => void
}

export function HistoryDetailView({ menuId, onBack }: DetailProps) {
  const [exporting, setExporting] = useState(false)

  const menu  = useLiveQuery(() => db.menus.get(menuId), [menuId])
  const days  = useLiveQuery(() => db.days.where('menuId').equals(menuId).toArray(), [menuId])

  const allDishIds = (days ?? []).flatMap(d => getDishIdsFromDay(d))
  const dishes = useLiveQuery(
    () => allDishIds.length ? db.dishes.where('id').anyOf(allDishIds).toArray() : Promise.resolve<Dish[]>([]),
    [JSON.stringify(allDishIds)]
  )
  const dishMap = new Map<string, Dish>((dishes ?? []).map(d => [d.id, d]))

  async function doExport() {
    if (!menu || !days) return
    setExporting(true)
    try {
      await exportAndSharePDF(menu, days, dishMap)
    } finally {
      setExporting(false)
    }
  }

  if (!menu) return null
  const sorted = [...(days ?? [])].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="screen-full">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0 pt-safe">
        <button onClick={onBack} className="flex items-center gap-1 text-blue-600 font-medium active:opacity-60">
          <span className="text-xl">‹</span>
          <span className="text-sm">Historial</span>
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-gray-900 text-sm">{weekRangeLabel(menu.weekStartDate)}</p>
        </div>
        <button
          onClick={doExport}
          disabled={exporting}
          className="text-blue-500 text-sm font-medium disabled:opacity-40"
        >
          {exporting ? '…' : 'PDF'}
        </button>
      </div>

      <div className="screen-scroll px-4 py-4 space-y-3">
        {sorted.map(day => {
          const getLunchNames = () => {
            const ids = day.lunchMode === 'primeroYSegundo'
              ? [day.firstLunchDishId, day.secondLunchDishId]
              : [day.singleLunchDishId]
            return ids.filter(Boolean).map(id => dishMap.get(id!)?.name).filter(Boolean).join(' · ') || '—'
          }
          const getDinnerNames = () => {
            const ids = day.dinnerMode === 'primeroYSegundo'
              ? [day.firstDinnerDishId, day.secondDinnerDishId]
              : [day.singleDinnerDishId]
            return ids.filter(Boolean).map(id => dishMap.get(id!)?.name).filter(Boolean).join(' · ') || '—'
          }
          return (
            <div key={day.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
              <p className="font-semibold text-gray-800 text-sm">{fullDayTitle(day.date)}</p>
              {day.hasLunch && (
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 text-xs mt-0.5 flex-shrink-0">☀</span>
                  <p className="text-sm text-gray-600">{getLunchNames()}</p>
                </div>
              )}
              {day.hasDinner && (
                <div className="flex items-start gap-2">
                  <span className="text-indigo-400 text-xs mt-0.5 flex-shrink-0">☽</span>
                  <p className="text-sm text-gray-600">{getDinnerNames()}</p>
                </div>
              )}
              {!day.hasLunch && !day.hasDinner && (
                <p className="text-sm text-gray-400">Día libre</p>
              )}
            </div>
          )
        })}
        <div className="h-4" />
      </div>
    </div>
  )
}
