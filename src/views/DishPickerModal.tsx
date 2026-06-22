import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { DishSlot, Dish, CourseType } from '../types'
import { SLOT_LABEL, SLOT_COURSE, COURSE_LABEL } from '../types'
import { wouldConflict } from '../utils/validationUtils'
import { Search, X, Check, AlertTriangle, Utensils } from '../components/Icon'

interface Props {
  slot: DishSlot
  currentDishId?: string
  usedCatIds: Set<string>
  onSelect: (dish: Dish) => void
  onClear: () => void
  onClose: () => void
}

export default function DishPickerModal({ slot, currentDishId, usedCatIds, onSelect, onClear, onClose }: Props) {
  const [search, setSearch]       = useState('')
  const [showAll, setShowAll]     = useState(SLOT_COURSE[slot] === 'unico')
  const [filterCatId, setFilterCatId] = useState<string | null>(null)

  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray())
  const allDishes  = useLiveQuery(() => db.dishes.orderBy('name').toArray())

  const filtered = (allDishes ?? [])
    .filter(d => {
      const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
      const matchCourse = showAll || SLOT_COURSE[slot] === 'unico' || d.course === SLOT_COURSE[slot]
      const matchCat    = !filterCatId || d.categoryIds.includes(filterCatId)
      return matchSearch && matchCourse && matchCat
    })
    .sort((a, b) => {
      const ac = wouldConflict(a, usedCatIds)
      const bc = wouldConflict(b, usedCatIds)
      if (ac !== bc) return ac ? 1 : -1
      return a.name.localeCompare(b.name)
    })

  const currentDish = currentDishId ? (allDishes ?? []).find(d => d.id === currentDishId) : undefined

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-content" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#D9D2CA' }} />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
          <h2 className="font-bold text-base" style={{ color: 'var(--brand)' }}>{SLOT_LABEL[slot]}</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full active:opacity-60"
            style={{ background: 'var(--cream)' }}>
            <X size={16} style={{ color: 'var(--brand)' }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--cream)', border: '1.5px solid var(--cream-border)' }}>
            <Search size={15} style={{ color: '#AFA59A', flexShrink: 0 }} />
            <input type="text" placeholder="Buscar plato…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--brand)' }}
              autoFocus />
            {search && (
              <button onClick={() => setSearch('')} className="active:opacity-60">
                <X size={13} style={{ color: '#AFA59A' }} />
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex-shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-1.5 px-4 pb-2">
            <FilterChip label="Todos" active={!filterCatId} onClick={() => setFilterCatId(null)} />
            {(categories ?? []).map(cat => (
              <FilterChip key={cat.id} label={cat.name}
                active={filterCatId === cat.id}
                onClick={() => setFilterCatId(filterCatId === cat.id ? null : cat.id)} />
            ))}
          </div>
        </div>

        {/* Show-all toggle for primero/segundo */}
        {SLOT_COURSE[slot] !== 'unico' && (
          <div className="px-4 pb-3 flex-shrink-0">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setShowAll(v => !v)}
                className="relative flex-shrink-0 cursor-pointer"
                style={{ width: 36, height: 20 }}>
                <div className="absolute inset-0 rounded-full transition-colors duration-150"
                  style={{ background: showAll ? 'var(--brand)' : '#D9D2CA' }} />
                <div className="absolute top-[2px] rounded-full bg-white transition-all duration-150"
                  style={{ width: 16, height: 16, left: showAll ? 18 : 2, boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
              </div>
              <span className="text-xs font-medium" style={{ color: '#AFA59A' }}>Ver todos los tipos</span>
            </label>
          </div>
        )}

        {/* List */}
        <div className="sheet-list">
          {currentDish && (
            <div className="mx-4 mb-2 p-3.5 rounded-xl anim-scale"
              style={{ background: 'var(--brand-soft)', border: '1px solid var(--cream-border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: '#AFA59A' }}>
                    Plato actual
                  </p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>{currentDish.name}</p>
                </div>
                <button onClick={onClear}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg active:opacity-70"
                  style={{ background: 'white', color: '#C0392B' }}>
                  Quitar
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Utensils size={36} sw={1.25} style={{ color: '#D9D2CA', marginBottom: 10 }} />
              <p className="text-sm" style={{ color: '#AFA59A' }}>Sin platos</p>
            </div>
          ) : (
            <ul className="mx-4 rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--cream-border)' }}>
              {filtered.map((dish, idx) => {
                const conflicts = wouldConflict(dish, usedCatIds)
                const isCurrent = dish.id === currentDishId
                return (
                  <li key={dish.id}>
                    <button onClick={() => onSelect(dish)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left active:opacity-75"
                      style={{
                        borderTop: idx > 0 ? '1px solid var(--cream-border)' : undefined,
                        background: isCurrent ? 'var(--brand-soft)' : 'white',
                      }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate"
                          style={{ color: 'var(--brand)' }}>
                          {dish.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#AFA59A' }}>
                          {COURSE_LABEL[dish.course]}
                          {dish.categoryIds.length > 0 && ` · ${dish.categoryIds.map(id =>
                            (categories ?? []).find(c => c.id === id)?.name ?? ''
                          ).filter(Boolean).join(', ')}`}
                        </p>
                      </div>
                      {isCurrent && <Check size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />}
                      {!isCurrent && conflicts && <AlertTriangle size={14} style={{ color: '#E07050', flexShrink: 0 }} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="h-6" />
        </div>
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:opacity-75"
      style={{
        background: active ? 'var(--brand)' : 'var(--cream)',
        color: active ? 'white' : '#AFA59A',
        border: `1.5px solid ${active ? 'var(--brand)' : 'var(--cream-border)'}`,
      }}>
      {label}
    </button>
  )
}
