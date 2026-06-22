import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Dish } from '../types'
import { getDishIdsFromDay } from '../types'
import { currentWeekStart, addWeeks, weekDates, weekRangeLabel, isCurrentWeek, fullDayTitle } from '../utils/dateUtils'
import { showToast } from '../utils/toast'
import { ChevronLeft, ChevronRight, ShoppingBag, Share } from '../components/Icon'

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
    const lines: string[] = [`Lista de la compra — ${weekRangeLabel(weekStart)}`, '']

    for (const [, { catName, dishes: items }] of grouped) {
      lines.push(catName.toUpperCase())
      const seen = new Set<string>()
      for (const { dish } of items) {
        if (!seen.has(dish.name)) {
          seen.add(dish.name)
          const count = items.filter(i => i.dish.name === dish.name).length
          lines.push(`  • ${dish.name}${count > 1 ? ` (x${count})` : ''}`)
        }
      }
      lines.push('')
    }
    if (uncategorized.length > 0) {
      lines.push('OTROS')
      const seen = new Set<string>()
      for (const { dish } of uncategorized) {
        if (!seen.has(dish.name)) { seen.add(dish.name); lines.push(`  • ${dish.name}`) }
      }
    }

    const text = lines.join('\n').trim()
    try {
      if (navigator.share) await navigator.share({ title: 'Lista de la compra', text })
      else { await navigator.clipboard.writeText(text); showToast('Copiado al portapapeles') }
    } catch { /* cancelled */ }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--cream)' }}>
      {/* Week navigator */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b flex-shrink-0"
        style={{ borderColor: 'var(--cream-border)' }}>
        <button onClick={() => setWeekStart(w => addWeeks(w, -1))}
          className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-60 flex-shrink-0"
          style={{ color: 'var(--brand)' }}>
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1 text-center">
          <p className="font-bold text-sm" style={{ color: 'var(--brand)' }}>{weekRangeLabel(weekStart)}</p>
          {isCurrentWeek(weekStart)
            ? <p className="text-xs font-semibold" style={{ color: '#AFA59A' }}>Esta semana</p>
            : <button onClick={() => setWeekStart(currentWeekStart())}
                className="text-xs font-semibold underline" style={{ color: '#AFA59A' }}>
                Ir a hoy
              </button>
          }
        </div>
        <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
          className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-60 flex-shrink-0"
          style={{ color: 'var(--brand)' }}>
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Share bar */}
      <div className="px-4 py-2.5 bg-white border-b flex-shrink-0"
        style={{ borderColor: 'var(--cream-border)' }}>
        <button onClick={shareAsText} disabled={totalDishes === 0}
          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-75 disabled:opacity-40"
          style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
          <Share size={14} /><span>Compartir lista de la compra</span>
        </button>
      </div>

      {/* Content */}
      <div className="content-area px-4 py-4 space-y-3">
        {totalDishes === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <ShoppingBag size={44} sw={1.25} style={{ color: '#D9D2CA', marginBottom: 12 }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>Sin menu esta semana</p>
            <p className="text-xs mt-1" style={{ color: '#AFA59A' }}>Planifica los dias para ver la lista</p>
          </div>
        ) : (
          <>
            {[...grouped.entries()].map(([cid, { catName, dishes: items }], idx) => {
              const seen = new Set<string>()
              const unique = items.filter(({ dish }) => !seen.has(dish.name) && seen.add(dish.name))
              return (
                <div key={cid} className="rounded-2xl overflow-hidden list-item"
                  style={{ '--i': idx, background: 'white', border: '1px solid var(--cream-border)',
                           boxShadow: '0 1px 4px rgba(47,29,27,0.06)' } as React.CSSProperties}>
                  <div className="px-4 py-2.5 border-b" style={{ background: 'var(--cream)', borderColor: 'var(--cream-border)' }}>
                    <p className="section-label">{catName}</p>
                  </div>
                  <ul>
                    {unique.map(({ dish }, i) => {
                      const count = items.filter(x => x.dish.name === dish.name).length
                      return (
                        <li key={dish.id} className="flex items-center justify-between px-4 py-3"
                          style={{ borderTop: i > 0 ? '1px solid var(--cream-border)' : undefined }}>
                          <span className="text-sm font-medium" style={{ color: 'var(--brand)' }}>{dish.name}</span>
                          {count > 1 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                              x{count}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}

            {uncategorized.length > 0 && (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'white', border: '1px solid var(--cream-border)',
                         boxShadow: '0 1px 4px rgba(47,29,27,0.06)' }}>
                <div className="px-4 py-2.5 border-b" style={{ background: 'var(--cream)', borderColor: 'var(--cream-border)' }}>
                  <p className="section-label">Otros</p>
                </div>
                <ul>
                  {uncategorized.filter(({ dish }, i, arr) =>
                    arr.findIndex(x => x.dish.name === dish.name) === i
                  ).map(({ dish }, i) => (
                    <li key={dish.id} className="px-4 py-3 text-sm font-medium"
                      style={{ color: 'var(--brand)', borderTop: i > 0 ? '1px solid var(--cream-border)' : undefined }}>
                      {dish.name}
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
