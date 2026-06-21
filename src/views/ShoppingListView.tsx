import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Dish } from '../types'
import { getDishIdsFromDay } from '../types'
import { currentWeekStart, addWeeks, weekDates, weekRangeLabel, isCurrentWeek, fullDayTitle } from '../utils/dateUtils'
import { showToast } from '../utils/toast'

export default function ShoppingListView() {
  const [weekStart, setWeekStart] = useState(currentWeekStart)

  const dates = weekDates(weekStart)

  const days = useLiveQuery(
    () => db.days.where('date').anyOf(dates).toArray(),
    [weekStart]
  )

  const allDishIds = (days ?? []).flatMap(d => getDishIdsFromDay(d))
  const dishes = useLiveQuery(
    () => allDishIds.length ? db.dishes.where('id').anyOf(allDishIds).toArray() : Promise.resolve<Dish[]>([]),
    [JSON.stringify(allDishIds)]
  )
  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray())

  const dishMap = new Map<string, Dish>((dishes ?? []).map(d => [d.id, d]))

  // Group dishes by category
  const grouped = new Map<string, { catName: string; dishes: Array<{ dish: Dish; dayLabel: string }> }>()
  const uncategorized: Array<{ dish: Dish; dayLabel: string }> = []

  for (const day of (days ?? [])) {
    const dayLabel = fullDayTitle(day.date)
    const ids = getDishIdsFromDay(day)
    for (const id of ids) {
      const dish = dishMap.get(id)
      if (!dish || dish.name === 'Sobras') continue
      const entry = { dish, dayLabel }
      if (dish.categoryIds.length === 0) {
        uncategorized.push(entry)
      } else {
        for (const cid of dish.categoryIds) {
          if (!grouped.has(cid)) {
            const cat = (categories ?? []).find(c => c.id === cid)
            grouped.set(cid, { catName: cat?.name ?? cid, dishes: [] })
          }
          grouped.get(cid)!.dishes.push(entry)
        }
      }
    }
  }

  const totalDishes = allDishIds.filter(id => {
    const d = dishMap.get(id)
    return d && d.name !== 'Sobras'
  }).length

  async function shareAsText() {
    const lines: string[] = [`🛒 Lista de la compra — ${weekRangeLabel(weekStart)}`, '']

    for (const [, { catName, dishes: items }] of grouped) {
      lines.push(`📌 ${catName.toUpperCase()}`)
      // Deduplicate dish names
      const seen = new Set<string>()
      for (const { dish } of items) {
        if (!seen.has(dish.name)) {
          seen.add(dish.name)
          const count = items.filter(i => i.dish.name === dish.name).length
          lines.push(`• ${dish.name}${count > 1 ? ` (×${count})` : ''}`)
        }
      }
      lines.push('')
    }
    if (uncategorized.length > 0) {
      lines.push('📌 OTROS')
      const seen = new Set<string>()
      for (const { dish } of uncategorized) {
        if (!seen.has(dish.name)) { seen.add(dish.name); lines.push(`• ${dish.name}`) }
      }
    }

    const text = lines.join('\n').trim()
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Lista de la compra', text })
      } else {
        await navigator.clipboard.writeText(text)
        showToast('Copiado al portapapeles')
      }
    } catch {
      showToast('No se pudo compartir', 'error')
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
      {/* Week navigator */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => setWeekStart(w => addWeeks(w, -1))}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 text-blue-600 text-xl font-semibold"
        >‹</button>
        <div className="text-center">
          <p className="font-semibold text-gray-900">{weekRangeLabel(weekStart)}</p>
          {isCurrentWeek(weekStart)
            ? <p className="text-xs text-blue-500 font-medium">Esta semana</p>
            : <button onClick={() => setWeekStart(currentWeekStart())} className="text-xs text-blue-500 underline">Ir a hoy</button>
          }
        </div>
        <button
          onClick={() => setWeekStart(w => addWeeks(w, 1))}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 text-blue-600 text-xl font-semibold"
        >›</button>
      </div>

      {/* Share bar */}
      <div className="px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0">
        <button
          onClick={shareAsText}
          disabled={totalDishes === 0}
          className="w-full py-2 rounded-xl bg-green-50 text-green-600 text-sm font-medium active:bg-green-100 disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          <span>↑</span><span>Compartir lista de la compra</span>
        </button>
      </div>

      {/* Content */}
      <div className="content-area px-4 py-4 space-y-4">
        {totalDishes === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center">
            <p className="text-4xl mb-3">🛒</p>
            <p className="text-sm font-medium text-gray-500">Sin menú esta semana</p>
            <p className="text-xs mt-1">Planifica los días para ver la lista</p>
          </div>
        ) : (
          <>
            {[...grouped.entries()].map(([cid, { catName, dishes: items }]) => {
              const seen = new Set<string>()
              const unique = items.filter(({ dish }) => !seen.has(dish.name) && seen.add(dish.name))
              return (
                <div key={cid} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{catName}</p>
                  </div>
                  <ul className="divide-y divide-gray-50">
                    {unique.map(({ dish }) => {
                      const count = items.filter(i => i.dish.name === dish.name).length
                      return (
                        <li key={dish.id} className="flex items-center justify-between px-4 py-3">
                          <span className="text-sm text-gray-800">{dish.name}</span>
                          {count > 1 && (
                            <span className="text-xs bg-blue-50 text-blue-500 font-medium px-2 py-0.5 rounded-full">×{count}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
            {uncategorized.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Otros</p>
                </div>
                <ul className="divide-y divide-gray-50">
                  {uncategorized.filter(({ dish }, i, arr) =>
                    arr.findIndex(x => x.dish.name === dish.name) === i
                  ).map(({ dish }) => (
                    <li key={dish.id} className="px-4 py-3">
                      <span className="text-sm text-gray-800">{dish.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="h-4" />
          </>
        )}
      </div>
    </div>
  )
}
