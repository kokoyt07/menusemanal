import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Dish, CourseType } from '../types'
import { COURSE_LABEL } from '../types'
import AddEditDishModal from './AddEditDishModal'
import { showToast } from '../utils/toast'

export default function DishesView() {
  const [search, setSearch]             = useState('')
  const [filterCatId, setFilterCatId]   = useState<string | null>(null)
  const [filterCourse, setFilterCourse] = useState<CourseType | 'todos'>('todos')
  const [editingDish, setEditingDish]   = useState<Dish | null | 'new'>(null)
  const [confirmId, setConfirmId]       = useState<string | null>(null)

  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray())
  const allDishes  = useLiveQuery(() => db.dishes.orderBy('name').toArray())

  const filtered = (allDishes ?? []).filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = !filterCatId || d.categoryIds.includes(filterCatId)
    const matchCourse = filterCourse === 'todos' || d.course === filterCourse
    return matchSearch && matchCat && matchCourse
  })

  async function deleteDish(dish: Dish) {
    await db.dishes.delete(dish.id)
    setConfirmId(null)
    showToast(`"${dish.name}" eliminado`)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-100 space-y-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Buscar plato…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
          />
          {search && <button onClick={() => setSearch('')} className="text-gray-400 text-xs">✕</button>}
        </div>

        {/* Category chips */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2">
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

        {/* Course filter */}
        <div className="flex rounded-lg bg-gray-100 p-0.5 text-sm font-medium">
          {(['todos', 'primero', 'segundo', 'unico'] as const).map(c => (
            <button
              key={c}
              onClick={() => setFilterCourse(c)}
              className={`flex-1 py-1.5 rounded-md transition-all text-xs ${
                filterCourse === c ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {c === 'todos' ? 'Todos' : COURSE_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="content-area">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-4xl mb-3">🍽</p>
            <p className="text-sm">{search ? 'Sin resultados' : 'No hay platos todavía'}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 bg-white mx-4 mt-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filtered.map(dish => (
              <li key={dish.id}>
                {confirmId === dish.id ? (
                  /* Inline delete confirmation */
                  <div className="flex items-center justify-between px-4 py-3 bg-red-50">
                    <p className="text-sm text-red-700 font-medium">¿Eliminar "{dish.name}"?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteDish(dish)}
                        className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg active:bg-red-600"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg active:bg-gray-300"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 active:bg-gray-50">
                    <button onClick={() => setEditingDish(dish)} className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">{dish.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{COURSE_LABEL[dish.course]}</span>
                        {dish.categoryIds.map(cid => {
                          const cat = (categories ?? []).find(c => c.id === cid)
                          return cat ? (
                            <span key={cid} className="chip bg-blue-50 text-blue-600">{cat.name}</span>
                          ) : null
                        })}
                      </div>
                      {dish.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{dish.notes}</p>
                      )}
                    </button>
                    <button
                      onClick={() => setConfirmId(dish.id)}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-300 active:text-red-400 rounded-full"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="h-6" />
      </div>

      {/* FAB */}
      <button
        onClick={() => setEditingDish('new')}
        className="fixed right-5 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg
          flex items-center justify-center text-2xl active:bg-blue-600 transition-colors z-10"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
      >
        +
      </button>

      {editingDish !== null && (
        <AddEditDishModal
          dish={editingDish === 'new' ? undefined : editingDish}
          onClose={() => setEditingDish(null)}
        />
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        active ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {label}
    </button>
  )
}
