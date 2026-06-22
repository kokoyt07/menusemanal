import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Dish, CourseType } from '../types'
import { COURSE_LABEL } from '../types'
import { X, Plus, Check } from '../components/Icon'

interface Props { dish?: Dish; onClose: () => void }

export default function AddEditDishModal({ dish, onClose }: Props) {
  const [name, setName]             = useState(dish?.name ?? '')
  const [course, setCourse]         = useState<CourseType>(dish?.course ?? 'primero')
  const [selCatIds, setSelCatIds]   = useState<Set<string>>(new Set(dish?.categoryIds ?? []))
  const [notes, setNotes]           = useState(dish?.notes ?? '')
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
          <div className="w-10 h-1 rounded-full" style={{ background: '#D9D2CA' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--cream-border)' }}>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full active:opacity-60"
            style={{ background: 'var(--cream)' }}>
            <X size={16} style={{ color: 'var(--brand)' }} />
          </button>
          <h2 className="font-bold text-base" style={{ color: 'var(--brand)' }}>
            {dish ? 'Editar plato' : 'Nuevo plato'}
          </h2>
          <button onClick={save} disabled={!name.trim()}
            className="px-4 py-1.5 rounded-xl text-sm font-bold active:opacity-70 disabled:opacity-30"
            style={{ background: 'var(--brand)', color: 'white' }}>
            Guardar
          </button>
        </div>

        <div className="sheet-list px-4 py-4 space-y-5">
          {/* Name */}
          <div>
            <label className="section-label block mb-1.5">Nombre</label>
            <input type="text" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre del plato"
              className="w-full px-3.5 py-3 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: 'var(--cream)',
                border: '1.5px solid var(--cream-border)',
                color: 'var(--brand)',
              }}
              autoFocus />
          </div>

          {/* Course type */}
          <div>
            <label className="section-label block mb-1.5">Tipo</label>
            <div className="flex rounded-xl p-0.5" style={{ background: 'var(--cream)' }}>
              {(['primero', 'segundo', 'unico'] as CourseType[]).map(c => (
                <button key={c} onClick={() => setCourse(c)}
                  className="flex-1 py-2 rounded-[10px] text-xs font-semibold transition-all"
                  style={{
                    background: course === c ? 'white' : 'transparent',
                    color: course === c ? 'var(--brand)' : '#AFA59A',
                    boxShadow: course === c ? '0 1px 4px rgba(47,29,27,0.10)' : 'none',
                  }}>
                  {COURSE_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="section-label block mb-1.5">Categorias</label>
            <div className="space-y-1.5">
              {(categories ?? []).map(cat => {
                const selected = selCatIds.has(cat.id)
                return (
                  <button key={cat.id} onClick={() => toggleCat(cat.id)}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors active:opacity-70"
                    style={{
                      background: selected ? 'var(--brand-soft)' : 'var(--cream)',
                      border: `1.5px solid ${selected ? 'rgba(47,29,27,0.18)' : 'var(--cream-border)'}`,
                      color: 'var(--brand)',
                    }}>
                    <span>{cat.name}</span>
                    {selected && <Check size={15} style={{ color: 'var(--brand)' }} />}
                  </button>
                )
              })}

              {showNewCat ? (
                <div className="flex gap-2 mt-1">
                  <input type="text" value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Nombre de categoria"
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--cream)', border: '1.5px solid var(--cream-border)', color: 'var(--brand)' }}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && addCategory()} />
                  <button onClick={addCategory}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: 'var(--brand)', color: 'white' }}>
                    OK
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowNewCat(true)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-medium active:opacity-70"
                  style={{ border: '1.5px dashed var(--cream-border)', color: '#AFA59A' }}>
                  <Plus size={15} style={{ color: '#AFA59A' }} />
                  <span>Nueva categoria</span>
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="section-label block mb-1.5">
              Notas / Ingredientes <span className="normal-case font-normal" style={{ color: '#C8C0B5' }}>(opcional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Un ingrediente por linea…"
              rows={3}
              className="w-full px-3.5 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--cream)', border: '1.5px solid var(--cream-border)', color: 'var(--brand)' }} />
          </div>

          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}
