import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Dish, CourseType } from '../types'
import { COURSE_LABEL } from '../types'

interface Props {
  dish?: Dish
  onClose: () => void
}

export default function AddEditDishModal({ dish, onClose }: Props) {
  const [name, setName]           = useState(dish?.name ?? '')
  const [course, setCourse]       = useState<CourseType>(dish?.course ?? 'primero')
  const [selCatIds, setSelCatIds] = useState<Set<string>>(new Set(dish?.categoryIds ?? []))
  const [notes, setNotes]         = useState(dish?.notes ?? '')
  const [newCatName, setNewCatName] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)

  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray())

  function toggleCat(id: string) {
    setSelCatIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function addCategory() {
    const trimmed = newCatName.trim()
    if (!trimmed) return
    const id = crypto.randomUUID()
    await db.categories.add({ id, name: trimmed, isDefault: false, sortOrder: (categories?.length ?? 0) })
    setSelCatIds(prev => new Set([...prev, id]))
    setNewCatName('')
    setShowNewCat(false)
  }

  async function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    const catIds = [...selCatIds]

    if (dish) {
      await db.dishes.update(dish.id, {
        name: trimmed, course, categoryIds: catIds, notes: notes.trim() || undefined,
      })
    } else {
      await db.dishes.add({
        id: crypto.randomUUID(), name: trimmed, course,
        categoryIds: catIds, notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      })
    }
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-content" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0 border-b border-gray-100">
          <button onClick={onClose} className="text-gray-500 text-sm">Cancelar</button>
          <h2 className="font-semibold text-gray-900">{dish ? 'Editar plato' : 'Nuevo plato'}</h2>
          <button
            onClick={save}
            disabled={!name.trim()}
            className="text-blue-500 font-semibold text-sm disabled:opacity-30"
          >
            Guardar
          </button>
        </div>

        <div className="sheet-list px-4 py-4 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre del plato"
              className="mt-1.5 w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
              autoFocus
            />
          </div>

          {/* Course type */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</label>
            <div className="mt-1.5 flex rounded-xl bg-gray-100 p-0.5">
              {(['primero', 'segundo', 'unico'] as CourseType[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCourse(c)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    course === c ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {COURSE_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Categorías</label>
            <div className="mt-1.5 space-y-1">
              {(categories ?? []).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCat(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    selCatIds.has(cat.id)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <span>{cat.name}</span>
                  {selCatIds.has(cat.id) && <span className="text-blue-500">✓</span>}
                </button>
              ))}

              {showNewCat ? (
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Nombre de categoría"
                    className="flex-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                  />
                  <button onClick={addCategory} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium">
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewCat(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500"
                >
                  <span className="text-blue-400">+</span> Nueva categoría
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Notas / Ingredientes <span className="normal-case text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Un ingrediente por línea…"
              rows={3}
              className="mt-1.5 w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}
