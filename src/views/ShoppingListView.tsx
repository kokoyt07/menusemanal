import { useState, useRef } from 'react'
import { useData } from '../contexts/DataContext'
import { useWeekMenu } from '../hooks/useWeekMenu'
import { useShoppingExtras } from '../hooks/useShoppingExtras'
import type { Dish } from '../types'
import { getDishIdsFromDay } from '../types'
import { currentWeekStart, addWeeks, weekDates, weekRangeLabel, isCurrentWeek, fullDayTitle } from '../utils/dateUtils'
import { showToast } from '../utils/toast'
import { haptic } from '../utils/haptic'
import { ChevronLeft, ChevronRight, ShoppingBag, Share, Plus, X } from '../components/Icon'

interface Props { userId: string }

export default function ShoppingListView({ userId }: Props) {
  const [weekStart, setWeekStart]     = useState(currentWeekStart)
  const [checked, setChecked]         = useState<Set<string>>(new Set())
  const [newItemText, setNewItemText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { dishes: allDishes, categories } = useData()
  const { days }                          = useWeekMenu(weekStart, userId)
  const { extras, addExtra, removeExtra } = useShoppingExtras(weekStart, userId)

  const dates   = weekDates(weekStart)
  const dishes  = allDishes ?? []
  const dishMap = new Map<string, Dish>(dishes.map(d => [d.id, d]))

  // Group dishes by category
  const grouped = new Map<string, { catName: string; items: Array<{ name: string; key: string; count: number }> }>()
  const uncategorized: Array<{ name: string; key: string; count: number }> = []

  for (const day of days) {
    const ids = getDishIdsFromDay(day)
    for (const id of ids) {
      const dish = dishMap.get(id)
      if (!dish || dish.name === 'Sobras') continue
      if (dish.categoryIds.length === 0) {
        const existing = uncategorized.find(x => x.name === dish.name)
        if (existing) existing.count++
        else uncategorized.push({ name: dish.name, key: `uncategorized:${dish.name}`, count: 1 })
      } else {
        for (const cid of dish.categoryIds) {
          if (!grouped.has(cid)) {
            const cat = (categories ?? []).find(c => c.id === cid)
            grouped.set(cid, { catName: cat?.name ?? cid, items: [] })
          }
          const g = grouped.get(cid)!
          const existing = g.items.find(x => x.name === dish.name)
          if (existing) existing.count++
          else g.items.push({ name: dish.name, key: `${cid}:${dish.name}`, count: 1 })
        }
      }
    }
  }

  const totalItems  = [...grouped.values()].reduce((s, g) => s + g.items.length, 0) + uncategorized.length
  const checkedCount = checked.size

  function toggleCheck(key: string) {
    haptic(4)
    setChecked(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function addManualItem() {
    const text = newItemText.trim()
    if (!text) return
    await addExtra(text)
    setNewItemText('')
    inputRef.current?.focus()
  }

  async function removeManualItem(id: string) {
    await removeExtra(id)
    setChecked(prev => { const n = new Set(prev); n.delete(`extra:${id}`); return n })
  }

  async function shareAsText() {
    const lines: string[] = [`Lista de la compra — ${weekRangeLabel(weekStart)}`, '']
    for (const [, { catName, items }] of grouped) {
      lines.push(catName.toUpperCase())
      for (const item of items) lines.push(`  • ${item.name}${item.count > 1 ? ` (x${item.count})` : ''}`)
      lines.push('')
    }
    if (uncategorized.length > 0) {
      lines.push('OTROS')
      for (const item of uncategorized) lines.push(`  • ${item.name}`)
      lines.push('')
    }
    if ((extras ?? []).length > 0) {
      lines.push('EXTRAS')
      for (const item of extras ?? []) lines.push(`  • ${item.text}`)
    }
    const text = lines.join('\n').trim()
    try {
      if (navigator.share) await navigator.share({ title: 'Lista de la compra', text })
      else { await navigator.clipboard.writeText(text); showToast('Copiado al portapapeles') }
    } catch { /* cancelled */ }
  }

  function changeWeek(newStart: string) {
    setWeekStart(newStart)
    setChecked(new Set())
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--cream)' }}>
      {/* Week navigator */}
      <div className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0"
        style={{ background: 'var(--surface)', borderColor: 'var(--cream-border)' }}>
        <button onClick={() => changeWeek(addWeeks(weekStart, -1))}
          className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-60 flex-shrink-0"
          style={{ color: 'var(--brand)' }}>
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1 text-center">
          <p className="font-bold text-sm" style={{ color: 'var(--brand)' }}>{weekRangeLabel(weekStart)}</p>
          {isCurrentWeek(weekStart)
            ? <p className="text-xs font-semibold" style={{ color: '#AFA59A' }}>Esta semana</p>
            : <button onClick={() => changeWeek(currentWeekStart())}
                className="text-xs font-semibold underline" style={{ color: '#AFA59A' }}>
                Ir a hoy
              </button>
          }
        </div>
        <button onClick={() => changeWeek(addWeeks(weekStart, 1))}
          className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-60 flex-shrink-0"
          style={{ color: 'var(--brand)' }}>
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Action bar */}
      <div className="px-4 py-2.5 border-b flex items-center gap-2 flex-shrink-0"
        style={{ background: 'var(--surface)', borderColor: 'var(--cream-border)' }}>
        <button onClick={shareAsText} disabled={totalItems === 0 && (extras ?? []).length === 0}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-75 disabled:opacity-40"
          style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
          <Share size={14} /><span>Compartir lista</span>
        </button>
        {checkedCount > 0 && (
          <button onClick={() => setChecked(new Set())}
            className="py-2.5 px-3 rounded-xl text-xs font-semibold active:opacity-70 anim-scale"
            style={{ background: 'var(--cream)', color: '#AFA59A', border: '1px solid var(--cream-border)' }}>
            Reiniciar ({checkedCount})
          </button>
        )}
      </div>

      {/* Content */}
      <div className="content-area px-4 py-4 space-y-3">
        {totalItems === 0 && (extras ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <ShoppingBag size={44} sw={1.25} style={{ color: '#D9D2CA', marginBottom: 12 }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>Sin menu esta semana</p>
            <p className="text-xs mt-1" style={{ color: '#AFA59A' }}>Planifica los dias para ver la lista</p>
          </div>
        ) : (
          <>
            {[...grouped.entries()].map(([cid, { catName, items }], idx) => (
              <CategorySection key={cid} title={catName} idx={idx}
                items={items.map(item => ({ ...item, checked: checked.has(item.key) }))}
                onToggle={toggleCheck} />
            ))}
            {uncategorized.length > 0 && (
              <CategorySection title="Otros" idx={grouped.size}
                items={uncategorized.map(item => ({ ...item, checked: checked.has(item.key) }))}
                onToggle={toggleCheck} />
            )}
          </>
        )}

        {/* Manual extras */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--cream-border)',
                   boxShadow: '0 1px 4px rgba(47,29,27,0.06)' }}>
          <div className="px-4 py-2.5 border-b" style={{ background: 'var(--cream)', borderColor: 'var(--cream-border)' }}>
            <p className="section-label">Extras manuales</p>
          </div>

          {(extras ?? []).map((item, i) => {
            const key = `extra:${item.id}`
            const isChecked = checked.has(key)
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid var(--cream-border)' : undefined }}>
                <button onClick={() => toggleCheck(key)}
                  className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                  style={{ background: isChecked ? 'var(--brand)' : 'transparent',
                           border: `2px solid ${isChecked ? 'var(--brand)' : '#D9D2CA'}` }}>
                  {isChecked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>}
                </button>
                <span className="flex-1 text-sm font-medium"
                  style={{ color: 'var(--brand)', textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.4 : 1 }}>
                  {item.text}
                </span>
                <button onClick={() => removeManualItem(item.id)}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full active:opacity-60">
                  <X size={13} style={{ color: '#D9D2CA' }} />
                </button>
              </div>
            )
          })}

          <div className="flex items-center gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--cream-border)' }}>
            <input ref={inputRef} type="text" placeholder="Añadir item…"
              value={newItemText} onChange={e => setNewItemText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManualItem()}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--brand)' }} />
            <button onClick={addManualItem} disabled={!newItemText.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-30 active:opacity-70"
              style={{ background: 'var(--brand)', color: 'white' }}>
              <Plus size={14} sw={2.5} />
            </button>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}

function CategorySection({
  title, idx, items, onToggle,
}: {
  title: string; idx: number
  items: Array<{ name: string; key: string; count: number; checked: boolean }>
  onToggle: (key: string) => void
}) {
  return (
    <div className="rounded-2xl overflow-hidden list-item"
      style={{ '--i': idx, background: 'var(--surface)', border: '1px solid var(--cream-border)',
               boxShadow: '0 1px 4px rgba(47,29,27,0.06)' } as React.CSSProperties}>
      <div className="px-4 py-2.5 border-b" style={{ background: 'var(--cream)', borderColor: 'var(--cream-border)' }}>
        <p className="section-label">{title}</p>
      </div>
      <ul>
        {items.map((item, i) => (
          <li key={item.key}>
            <button onClick={() => onToggle(item.key)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left active:opacity-75"
              style={{ borderTop: i > 0 ? '1px solid var(--cream-border)' : undefined }}>
              <div className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                style={{ background: item.checked ? 'var(--brand)' : 'transparent',
                         border: `2px solid ${item.checked ? 'var(--brand)' : '#D9D2CA'}` }}>
                {item.checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>}
              </div>
              <span className="flex-1 text-sm font-medium"
                style={{ color: 'var(--brand)', textDecoration: item.checked ? 'line-through' : 'none',
                         opacity: item.checked ? 0.4 : 1, transition: 'opacity 0.15s' }}>
                {item.name}
              </span>
              {item.count > 1 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                  x{item.count}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
