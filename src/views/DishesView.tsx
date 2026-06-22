import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Dish, CourseType, DishCategory } from '../types'
import { COURSE_LABEL } from '../types'
import AddEditDishModal from './AddEditDishModal'
import { showToast } from '../utils/toast'
import { haptic } from '../utils/haptic'
import { Search, X, Plus, Trash, Utensils, Heart, Sliders, Pencil } from '../components/Icon'

export default function DishesView() {
  const [search, setSearch]               = useState('')
  const [filterCatId, setFilterCatId]     = useState<string | null>(null)
  const [filterCourse, setFilterCourse]   = useState<CourseType | 'todos'>('todos')
  const [filterFavs, setFilterFavs]       = useState(false)
  const [editingDish, setEditingDish]     = useState<Dish | null | 'new'>(null)
  const [confirmId, setConfirmId]         = useState<string | null>(null)
  const [showCatMgr, setShowCatMgr]       = useState(false)

  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray())
  const allDishes  = useLiveQuery(() => db.dishes.orderBy('name').toArray())

  const filtered = (allDishes ?? []).filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = !filterCatId || d.categoryIds.includes(filterCatId)
    const matchCourse = filterCourse === 'todos' || d.course === filterCourse
    const matchFav    = !filterFavs || d.isFavorite
    return matchSearch && matchCat && matchCourse && matchFav
  })

  async function deleteDish(dish: Dish) {
    await db.dishes.delete(dish.id)
    setConfirmId(null)
    showToast(`"${dish.name}" eliminado`)
  }

  async function toggleFavorite(dish: Dish) {
    haptic()
    await db.dishes.update(dish.id, { isFavorite: !dish.isFavorite })
  }

  const dishCount = allDishes?.length ?? 0

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--cream)' }}>
      {/* Search + filters */}
      <div className="px-4 pt-3 pb-3 bg-white border-b flex-shrink-0 space-y-2.5"
        style={{ borderColor: 'var(--cream-border)' }}>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--cream)', border: '1.5px solid var(--cream-border)' }}>
            <Search size={15} style={{ color: '#AFA59A', flexShrink: 0 }} />
            <input type="text" placeholder="Buscar plato…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--brand)' }} />
            {search && (
              <button onClick={() => setSearch('')} className="active:opacity-60">
                <X size={14} style={{ color: '#AFA59A' }} />
              </button>
            )}
          </div>
          {/* Favorites filter toggle */}
          <button onClick={() => { haptic(); setFilterFavs(v => !v) }}
            className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 active:opacity-70"
            style={{
              background: filterFavs ? 'var(--brand)' : 'var(--cream)',
              border: '1.5px solid var(--cream-border)',
            }}>
            <Heart size={16} sw={filterFavs ? 0 : 1.75}
              style={{ color: filterFavs ? 'white' : '#AFA59A',
                       fill: filterFavs ? 'white' : 'none' }} />
          </button>
        </div>

        {/* Category chips + manage button */}
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex gap-1.5 pb-0.5">
              <FilterChip label="Todos" active={!filterCatId} onClick={() => setFilterCatId(null)} />
              {(categories ?? []).map(cat => (
                <FilterChip key={cat.id} label={cat.name}
                  active={filterCatId === cat.id}
                  onClick={() => setFilterCatId(filterCatId === cat.id ? null : cat.id)} />
              ))}
            </div>
          </div>
          <button onClick={() => setShowCatMgr(true)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg active:opacity-60"
            style={{ color: '#AFA59A' }}>
            <Sliders size={16} />
          </button>
        </div>

        {/* Course filter */}
        <div className="flex rounded-xl p-0.5" style={{ background: 'var(--cream)' }}>
          {(['todos', 'primero', 'segundo', 'unico'] as const).map(c => (
            <button key={c} onClick={() => setFilterCourse(c)}
              className="flex-1 py-1.5 rounded-[10px] text-xs font-semibold transition-all"
              style={{
                background: filterCourse === c ? 'var(--surface)' : 'transparent',
                color: filterCourse === c ? 'var(--brand)' : '#AFA59A',
                boxShadow: filterCourse === c ? '0 1px 3px rgba(47,29,27,0.10)' : 'none',
              }}>
              {c === 'todos' ? 'Todos' : COURSE_LABEL[c]}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-[11px] font-semibold text-right" style={{ color: '#AFA59A' }}>
          {filtered.length !== dishCount
            ? `${filtered.length} de ${dishCount} platos`
            : `${dishCount} plato${dishCount !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* List */}
      <div className="content-area">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Utensils size={40} sw={1.25} style={{ color: '#D9D2CA', marginBottom: 12 }} />
            <p className="text-sm font-medium" style={{ color: '#AFA59A' }}>
              {search || filterCatId || filterFavs ? 'Sin resultados' : 'No hay platos todavia'}
            </p>
            {!search && !filterCatId && !filterFavs && (
              <p className="text-xs mt-1" style={{ color: '#C8C0B5' }}>Pulsa + para añadir el primero</p>
            )}
          </div>
        ) : (
          <ul className="mx-4 mt-3 rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--cream-border)',
                     boxShadow: '0 1px 4px rgba(47,29,27,0.06)' }}>
            {filtered.map((dish, idx) => (
              <li key={dish.id} className="list-item" style={{ '--i': idx } as React.CSSProperties}>
                {confirmId === dish.id ? (
                  <div className="flex items-center justify-between px-4 py-3.5 anim-scale"
                    style={{ background: '#FEF3EE',
                             borderTop: idx > 0 ? '1px solid #F5C0A4' : undefined }}>
                    <p className="text-sm font-medium" style={{ color: '#8B4513' }}>
                      Eliminar "{dish.name}"?
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => deleteDish(dish)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                        style={{ background: '#C0392B' }}>
                        Eliminar
                      </button>
                      <button onClick={() => setConfirmId(null)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'var(--cream)', color: 'var(--brand)' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3"
                    style={{ borderTop: idx > 0 ? '1px solid var(--cream-border)' : undefined }}>
                    {/* Favorite toggle */}
                    <button onClick={() => toggleFavorite(dish)}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center active:scale-90 transition-transform">
                      <Heart size={15}
                        style={{ color: dish.isFavorite ? '#C0392B' : '#D9D2CA',
                                 fill: dish.isFavorite ? '#C0392B' : 'none',
                                 transition: 'all 0.15s' }} />
                    </button>
                    <button onClick={() => setEditingDish(dish)} className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--brand)' }}>
                        {dish.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs" style={{ color: '#AFA59A' }}>{COURSE_LABEL[dish.course]}</span>
                        {dish.categoryIds.map(cid => {
                          const cat = (categories ?? []).find(c => c.id === cid)
                          return cat ? (
                            <span key={cid} className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                              {cat.name}
                            </span>
                          ) : null
                        })}
                      </div>
                    </button>
                    <button onClick={() => setConfirmId(dish.id)}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full active:bg-red-50 transition-colors">
                      <Trash size={15} style={{ color: '#D9D2CA' }} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="h-24" />
      </div>

      {/* FAB */}
      <button
        onClick={() => { haptic(); setEditingDish('new') }}
        className="fixed flex items-center justify-center rounded-full active:scale-95 transition-transform"
        style={{
          right: 20,
          bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
          width: 56, height: 56,
          background: 'var(--brand)', color: 'white',
          boxShadow: '0 4px 16px rgba(47,29,27,0.30)',
        }}>
        <Plus size={24} sw={2} />
      </button>

      {editingDish !== null && (
        <AddEditDishModal
          dish={editingDish === 'new' ? undefined : editingDish}
          onClose={() => setEditingDish(null)}
        />
      )}

      {showCatMgr && (
        <CategoryManagerSheet
          categories={categories ?? []}
          onClose={() => setShowCatMgr(false)}
        />
      )}
    </div>
  )
}

/* ── Category Manager Sheet ─────────────────────────────────────────────── */
function CategoryManagerSheet({ categories, onClose }: { categories: DishCategory[]; onClose: () => void }) {
  const [renamingId, setRenamingId]     = useState<string | null>(null)
  const [renameText, setRenameText]     = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function renameCategory(cat: DishCategory) {
    const t = renameText.trim()
    if (!t || t === cat.name) { setRenamingId(null); return }
    await db.categories.update(cat.id, { name: t })
    setRenamingId(null)
    showToast('Categoria renombrada')
  }

  async function deleteCategory(cat: DishCategory) {
    const affectedDishes = await db.dishes.where('categoryIds').equals(cat.id).toArray()
    for (const dish of affectedDishes) {
      await db.dishes.update(dish.id, { categoryIds: dish.categoryIds.filter(c => c !== cat.id) })
    }
    await db.categories.delete(cat.id)
    setConfirmDeleteId(null)
    showToast(`"${cat.name}" eliminada`)
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#D9D2CA' }} />
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--cream-border)' }}>
          <h2 className="font-bold text-base" style={{ color: 'var(--brand)' }}>Gestionar categorias</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full active:opacity-60"
            style={{ background: 'var(--cream)' }}>
            <X size={16} style={{ color: 'var(--brand)' }} />
          </button>
        </div>

        <div className="sheet-list px-4 py-3 space-y-2">
          {categories.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: '#AFA59A' }}>No hay categorias todavia</p>
          )}
          {categories.map(cat => (
            <div key={cat.id}>
              {confirmDeleteId === cat.id ? (
                <div className="flex items-center justify-between p-3 rounded-xl anim-scale"
                  style={{ background: '#FEF3EE', border: '1px solid #F5C0A4' }}>
                  <p className="text-sm font-medium" style={{ color: '#8B4513' }}>Eliminar "{cat.name}"?</p>
                  <div className="flex gap-2">
                    <button onClick={() => deleteCategory(cat)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                      style={{ background: '#C0392B' }}>
                      Eliminar
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: 'var(--cream)', color: 'var(--brand)' }}>
                      No
                    </button>
                  </div>
                </div>
              ) : renamingId === cat.id ? (
                <div className="flex gap-2">
                  <input autoFocus value={renameText}
                    onChange={e => setRenameText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') renameCategory(cat) }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--cream)', border: '1.5px solid var(--brand)', color: 'var(--brand)' }} />
                  <button onClick={() => renameCategory(cat)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: 'var(--brand)', color: 'white' }}>
                    OK
                  </button>
                  <button onClick={() => setRenamingId(null)}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--cream)', color: 'var(--brand)' }}>
                    X
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: 'var(--cream)', border: '1px solid var(--cream-border)' }}>
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--brand)' }}>{cat.name}</span>
                  <button onClick={() => { setRenamingId(cat.id); setRenameText(cat.name) }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg active:opacity-60"
                    style={{ color: '#AFA59A' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(cat.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg active:opacity-60"
                    style={{ color: '#AFA59A' }}>
                    <Trash size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          <div className="h-4" />
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
