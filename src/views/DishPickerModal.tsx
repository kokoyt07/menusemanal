import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { DishSlot, Dish, CourseType } from '../types'
import { SLOT_LABEL, SLOT_COURSE, COURSE_LABEL } from '../types'
import { wouldConflict } from '../utils/validationUtils'

interface Props {
  slot: DishSlot
  currentDishId?: string
  usedCatIds: Set<string>
  onSelect: (dish: Dish) => void
  onClear: () => void
  onClose: () => void
}

export default function DishPickerModal({ slot, currentDishId, usedCatIds, onSelect, onClear, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(SLOT_COURSE[slot] === 'unico')
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
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">{SLOT_LABEL[slot]}</h2>
          <button onClick={onClose} className="text-blue-500 font-medium text-sm">Cancelar</button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar plato…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 text-xs">✕</button>
            )}
          </div>
        </div>

        {/* Category filters */}
        <div className="flex-shrink-0 overflow-x-auto">
          <div className="flex gap-2 px-4 pb-2">
            <FilterChip label="Todos" active={!filterCatId} onClick={() => setFilterCatId(null)} />
            {(categories ?? []).map(cat => (
              <FilterChip
                key={cat.id}
                label={cat.name}
                active={filterCatId === cat.id}
                onClick={() => setFilterCatId(filterCatId === cat.id ? null : cat.id)}
              />
            ))}
          </div>
        </div>

        {/* Show all courses toggle (only for primero/segundo) */}
        {SLOT_COURSE[slot] !== 'unico' && (
          <div className="px-4 pb-2 flex-shrink-0">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showAll}
                onChange={e => setShowAll(e.target.checked)}
                className="rounded"
              />
              Ver todos los tipos de plato
            </label>
          </div>
        )}

        {/* List */}
        <div className="sheet-list">
          {/* Current dish */}
          {currentDish && (
            <div className="mx-4 mb-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-400 mb-0.5">Plato actual</p>
                  <p className="text-sm font-medium text-gray-900">{currentDish.name}</p>
                </div>
                <button
                  onClick={onClear}
                  className="text-xs text-red-500 font-medium px-2 py-1 rounded-lg active:bg-red-50"
                >
                  Quitar
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-3xl mb-2">🍽</p>
              <p className="text-sm">Sin platos</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 mx-4">
              {filtered.map(dish => {
                const conflicts = wouldConflict(dish, usedCatIds)
                const isCurrent = dish.id === currentDishId
                return (
                  <li key={dish.id}>
                    <button
                      onClick={() => onSelect(dish)}
                      className="w-full flex items-center gap-3 py-3 text-left active:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-blue-600' : 'text-gray-900'}`}>
                          {dish.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {COURSE_LABEL[dish.course]}
                          {dish.categoryIds.length > 0 && ` · ${dish.categoryIds.map(id =>
                            (categories ?? []).find(c => c.id === id)?.name ?? ''
                          ).filter(Boolean).join(', ')}`}
                        </p>
                      </div>
                      {isCurrent && <span className="text-blue-500 text-base flex-shrink-0">✓</span>}
                      {!isCurrent && conflicts && <span className="text-orange-400 text-sm flex-shrink-0">⚠</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        active ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}
