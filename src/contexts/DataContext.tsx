import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Dish, DishCategory, CourseType } from '../types'
import { supabase } from '../lib/supabase'
import { showToast } from '../utils/toast'

/* ── DB row types (snake_case from Supabase) ─────────────────────────────── */
interface DbCategory {
  id: string; user_id: string; name: string
  is_default: boolean; sort_order: number; created_at: string
}
interface DbDish {
  id: string; user_id: string; name: string; course: string
  category_ids: string[]; notes: string | null; is_favorite: boolean; created_at: string
}

/* ── Mappers ─────────────────────────────────────────────────────────────── */
function mapCategory(r: DbCategory): DishCategory {
  return { id: r.id, name: r.name, isDefault: r.is_default, sortOrder: r.sort_order }
}
function mapDish(r: DbDish): Dish {
  return {
    id: r.id, name: r.name, course: r.course as CourseType,
    categoryIds: r.category_ids ?? [],
    notes: r.notes ?? undefined,
    isFavorite: r.is_favorite ?? false,
    createdAt: r.created_at,
  }
}

/* ── Default seed data ───────────────────────────────────────────────────── */
const DEFAULT_CATS = [
  { name: 'Pescado',          sortOrder: 0 },
  { name: 'Carne',            sortOrder: 1 },
  { name: 'Verdura/Ensalada', sortOrder: 2 },
  { name: 'Legumbres',        sortOrder: 3 },
  { name: 'Pasta/Arroz',      sortOrder: 4 },
  { name: 'Huevo',            sortOrder: 5 },
]

function makeDefaultDishes(c: Record<string, string>) {
  const n = null, f = false, now = new Date().toISOString()
  return [
    { name: 'Ensalada mixta',          course: 'primero', category_ids: [c['Verdura/Ensalada']], notes: n, is_favorite: f, created_at: now },
    { name: 'Macarrones con tomate',   course: 'primero', category_ids: [c['Pasta/Arroz']], notes: n, is_favorite: f, created_at: now },
    { name: 'Lentejas estofadas',      course: 'primero', category_ids: [c['Legumbres']], notes: n, is_favorite: f, created_at: now },
    { name: 'Sopa de fideos',          course: 'primero', category_ids: [c['Pasta/Arroz']], notes: n, is_favorite: f, created_at: now },
    { name: 'Garbanzos con espinacas', course: 'primero', category_ids: [c['Legumbres'], c['Verdura/Ensalada']], notes: n, is_favorite: f, created_at: now },
    { name: 'Arroz con verduras',      course: 'primero', category_ids: [c['Pasta/Arroz'], c['Verdura/Ensalada']], notes: n, is_favorite: f, created_at: now },
    { name: 'Judías blancas',          course: 'primero', category_ids: [c['Legumbres']], notes: n, is_favorite: f, created_at: now },
    { name: 'Espaguetis con tomate',   course: 'primero', category_ids: [c['Pasta/Arroz']], notes: n, is_favorite: f, created_at: now },
    { name: 'Merluza al horno',        course: 'segundo', category_ids: [c['Pescado']], notes: n, is_favorite: f, created_at: now },
    { name: 'Salmón a la plancha',     course: 'segundo', category_ids: [c['Pescado']], notes: n, is_favorite: f, created_at: now },
    { name: 'Bacalao con tomate',      course: 'segundo', category_ids: [c['Pescado']], notes: n, is_favorite: f, created_at: now },
    { name: 'Pollo asado',             course: 'segundo', category_ids: [c['Carne']], notes: n, is_favorite: f, created_at: now },
    { name: 'Filetes de ternera',      course: 'segundo', category_ids: [c['Carne']], notes: n, is_favorite: f, created_at: now },
    { name: 'Cerdo a la plancha',      course: 'segundo', category_ids: [c['Carne']], notes: n, is_favorite: f, created_at: now },
    { name: 'Tortilla española',       course: 'segundo', category_ids: [c['Huevo']], notes: n, is_favorite: f, created_at: now },
    { name: 'Huevos fritos',           course: 'segundo', category_ids: [c['Huevo']], notes: n, is_favorite: f, created_at: now },
    { name: 'Revuelto de champiñones', course: 'segundo', category_ids: [c['Huevo'], c['Verdura/Ensalada']], notes: n, is_favorite: f, created_at: now },
    { name: 'Arroz con pollo',         course: 'unico',   category_ids: [c['Pasta/Arroz'], c['Carne']], notes: n, is_favorite: f, created_at: now },
    { name: 'Paella de verduras',      course: 'unico',   category_ids: [c['Pasta/Arroz'], c['Verdura/Ensalada']], notes: n, is_favorite: f, created_at: now },
    { name: 'Espaguetis carbonara',    course: 'unico',   category_ids: [c['Pasta/Arroz'], c['Huevo']], notes: n, is_favorite: f, created_at: now },
    { name: 'Fabada asturiana',        course: 'unico',   category_ids: [c['Legumbres'], c['Carne']], notes: n, is_favorite: f, created_at: now },
    { name: 'Pasta con atún',          course: 'unico',   category_ids: [c['Pasta/Arroz'], c['Pescado']], notes: n, is_favorite: f, created_at: now },
  ]
}

/* ── Context type ────────────────────────────────────────────────────────── */
interface DataContextValue {
  dishes: Dish[] | undefined
  categories: DishCategory[] | undefined
  refreshDishes: () => Promise<void>
  refreshCategories: () => Promise<void>
  addDish: (dish: Omit<Dish, 'id' | 'createdAt'>) => Promise<Dish>
  updateDish: (id: string, changes: Partial<Omit<Dish, 'id' | 'createdAt'>>) => Promise<void>
  deleteDish: (id: string) => Promise<void>
  addCategory: (name: string) => Promise<DishCategory>
  renameCategory: (id: string, name: string) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

export function DataProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [dishes, setDishes]         = useState<Dish[] | undefined>(undefined)
  const [categories, setCategories] = useState<DishCategory[] | undefined>(undefined)

  /* ── Fetch ─────────────────────────────────────────────────────────────── */
  const refreshCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('dish_categories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order')
    if (error) {
      console.error('[DataContext] fetchCategories:', error)
      setCategories(prev => prev ?? [])   // fallback to [] so seeding can run
      return
    }
    setCategories((data as DbCategory[]).map(mapCategory))
  }, [userId])

  const refreshDishes = useCallback(async () => {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('user_id', userId)
      .order('name')
    if (error) {
      console.error('[DataContext] fetchDishes:', error)
      setDishes(prev => prev ?? [])
      return
    }
    setDishes((data as DbDish[]).map(mapDish))
  }, [userId])

  useEffect(() => {
    setCategories(undefined)
    setDishes(undefined)
    refreshCategories()
    refreshDishes()
  }, [refreshCategories, refreshDishes])

  /* ── Seed for new users ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (categories === undefined || categories.length > 0) return
    ;(async () => {
      const catRows = DEFAULT_CATS.map(c => ({
        id: crypto.randomUUID(), user_id: userId,
        name: c.name, is_default: true, sort_order: c.sortOrder,
      }))
      const { data: insertedCats, error: catErr } = await supabase
        .from('dish_categories').insert(catRows).select('*')
      if (catErr || !insertedCats) {
        console.error('[DataContext] seed categories:', catErr)
        showToast('Error al inicializar categorías', 'error')
        return
      }
      const catIds: Record<string, string> = {}
      ;(insertedCats as DbCategory[]).forEach(c => { catIds[c.name] = c.id })
      setCategories((insertedCats as DbCategory[]).map(mapCategory))

      const dishRows = makeDefaultDishes(catIds).map(d => ({
        ...d, id: crypto.randomUUID(), user_id: userId,
      }))
      const { data: insertedDishes, error: dishErr } = await supabase
        .from('dishes').insert(dishRows).select('*')
      if (dishErr || !insertedDishes) {
        console.error('[DataContext] seed dishes:', dishErr)
        return
      }
      setDishes((insertedDishes as DbDish[]).map(mapDish))
    })()
  }, [categories, userId])

  /* ── Category CRUD ─────────────────────────────────────────────────────── */
  async function addCategory(name: string): Promise<DishCategory> {
    const id = crypto.randomUUID()
    const sortOrder = categories?.length ?? 0
    const cat: DishCategory = { id, name, isDefault: false, sortOrder }
    setCategories(prev => [...(prev ?? []), cat])
    const { error } = await supabase
      .from('dish_categories')
      .insert({ id, user_id: userId, name, is_default: false, sort_order: sortOrder })
    if (error) {
      console.error('[DataContext] addCategory:', error)
      setCategories(prev => prev?.filter(c => c.id !== id))
      showToast('Error al guardar la categoría', 'error')
    }
    return cat
  }

  async function renameCategory(id: string, name: string): Promise<void> {
    const prev = categories?.find(c => c.id === id)
    setCategories(cats => cats?.map(c => c.id === id ? { ...c, name } : c))
    const { error } = await supabase.from('dish_categories').update({ name }).eq('id', id)
    if (error) {
      console.error('[DataContext] renameCategory:', error)
      if (prev) setCategories(cats => cats?.map(c => c.id === id ? prev : c))
      showToast('Error al renombrar la categoría', 'error')
    }
  }

  async function deleteCategory(id: string): Promise<void> {
    setCategories(prev => prev?.filter(c => c.id !== id))
    setDishes(prev => prev?.map(d => ({ ...d, categoryIds: d.categoryIds.filter(cid => cid !== id) })))
    const { error } = await supabase.from('dish_categories').delete().eq('id', id)
    if (error) {
      console.error('[DataContext] deleteCategory:', error)
      showToast('Error al eliminar la categoría', 'error')
      refreshCategories()
      return
    }
    // Update dishes in DB that reference this category
    const { data: affected } = await supabase
      .from('dishes').select('id, category_ids').contains('category_ids', [id])
    if (affected?.length) {
      await Promise.all((affected as { id: string; category_ids: string[] }[]).map(d =>
        supabase.from('dishes')
          .update({ category_ids: d.category_ids.filter((c: string) => c !== id) })
          .eq('id', d.id)
      ))
    }
  }

  /* ── Dish CRUD ──────────────────────────────────────────────────────────── */
  async function addDish(dish: Omit<Dish, 'id' | 'createdAt'>): Promise<Dish> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const newDish: Dish = { ...dish, id, isFavorite: dish.isFavorite ?? false, createdAt: now }
    setDishes(prev => [...(prev ?? []), newDish].sort((a, b) => a.name.localeCompare(b.name)))
    const { error } = await supabase.from('dishes').insert({
      id, user_id: userId, name: dish.name, course: dish.course,
      category_ids: dish.categoryIds ?? [],
      notes: dish.notes ?? null,
      is_favorite: dish.isFavorite ?? false,
      created_at: now,
    })
    if (error) {
      console.error('[DataContext] addDish:', error)
      setDishes(prev => prev?.filter(d => d.id !== id))
      showToast('Error al guardar el plato', 'error')
    }
    return newDish
  }

  async function updateDish(id: string, changes: Partial<Omit<Dish, 'id' | 'createdAt'>>): Promise<void> {
    const prev = dishes?.find(d => d.id === id)
    setDishes(ds => ds?.map(d => d.id === id ? { ...d, ...changes } : d))
    const db: Record<string, unknown> = {}
    if ('name'        in changes) db.name         = changes.name
    if ('course'      in changes) db.course       = changes.course
    if ('categoryIds' in changes) db.category_ids = changes.categoryIds
    if ('notes'       in changes) db.notes        = changes.notes ?? null
    if ('isFavorite'  in changes) db.is_favorite  = changes.isFavorite
    const { error } = await supabase.from('dishes').update(db).eq('id', id)
    if (error) {
      console.error('[DataContext] updateDish:', error)
      if (prev) setDishes(ds => ds?.map(d => d.id === id ? prev : d))
      showToast('Error al actualizar el plato', 'error')
    }
  }

  async function deleteDish(id: string): Promise<void> {
    const prev = dishes?.find(d => d.id === id)
    setDishes(ds => ds?.filter(d => d.id !== id))
    const { error } = await supabase.from('dishes').delete().eq('id', id)
    if (error) {
      console.error('[DataContext] deleteDish:', error)
      if (prev) setDishes(ds => [...(ds ?? []), prev].sort((a, b) => a.name.localeCompare(b.name)))
      showToast('Error al eliminar el plato', 'error')
    }
  }

  return (
    <DataContext.Provider value={{
      dishes, categories, refreshDishes, refreshCategories,
      addDish, updateDish, deleteDish,
      addCategory, renameCategory, deleteCategory,
    }}>
      {children}
    </DataContext.Provider>
  )
}
