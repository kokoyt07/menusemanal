import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Dish, DishCategory, CourseType } from '../types'
import { supabase } from '../lib/supabase'

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
  { name: 'Pescado',           sortOrder: 0 },
  { name: 'Carne',             sortOrder: 1 },
  { name: 'Verdura/Ensalada',  sortOrder: 2 },
  { name: 'Legumbres',         sortOrder: 3 },
  { name: 'Pasta/Arroz',       sortOrder: 4 },
  { name: 'Huevo',             sortOrder: 5 },
]

function makeDefaultDishes(c: Record<string, string>) {
  const n = null, f = false, now = new Date().toISOString()
  return [
    { name: 'Ensalada mixta',          course: 'primero', category_ids: [c['Verdura/Ensalada']],             notes: n, is_favorite: f, created_at: now },
    { name: 'Macarrones con tomate',   course: 'primero', category_ids: [c['Pasta/Arroz']],                  notes: n, is_favorite: f, created_at: now },
    { name: 'Lentejas estofadas',      course: 'primero', category_ids: [c['Legumbres']],                    notes: n, is_favorite: f, created_at: now },
    { name: 'Sopa de fideos',          course: 'primero', category_ids: [c['Pasta/Arroz']],                  notes: n, is_favorite: f, created_at: now },
    { name: 'Garbanzos con espinacas', course: 'primero', category_ids: [c['Legumbres'],c['Verdura/Ensalada']], notes: n, is_favorite: f, created_at: now },
    { name: 'Arroz con verduras',      course: 'primero', category_ids: [c['Pasta/Arroz'],c['Verdura/Ensalada']], notes: n, is_favorite: f, created_at: now },
    { name: 'Judías blancas',          course: 'primero', category_ids: [c['Legumbres']],                    notes: n, is_favorite: f, created_at: now },
    { name: 'Espaguetis con tomate',   course: 'primero', category_ids: [c['Pasta/Arroz']],                  notes: n, is_favorite: f, created_at: now },
    { name: 'Merluza al horno',        course: 'segundo', category_ids: [c['Pescado']],                      notes: n, is_favorite: f, created_at: now },
    { name: 'Salmón a la plancha',     course: 'segundo', category_ids: [c['Pescado']],                      notes: n, is_favorite: f, created_at: now },
    { name: 'Bacalao con tomate',      course: 'segundo', category_ids: [c['Pescado']],                      notes: n, is_favorite: f, created_at: now },
    { name: 'Pollo asado',             course: 'segundo', category_ids: [c['Carne']],                        notes: n, is_favorite: f, created_at: now },
    { name: 'Filetes de ternera',      course: 'segundo', category_ids: [c['Carne']],                        notes: n, is_favorite: f, created_at: now },
    { name: 'Cerdo a la plancha',      course: 'segundo', category_ids: [c['Carne']],                        notes: n, is_favorite: f, created_at: now },
    { name: 'Tortilla española',       course: 'segundo', category_ids: [c['Huevo']],                        notes: n, is_favorite: f, created_at: now },
    { name: 'Huevos fritos',           course: 'segundo', category_ids: [c['Huevo']],                        notes: n, is_favorite: f, created_at: now },
    { name: 'Revuelto de champiñones', course: 'segundo', category_ids: [c['Huevo'],c['Verdura/Ensalada']], notes: n, is_favorite: f, created_at: now },
    { name: 'Arroz con pollo',         course: 'unico',   category_ids: [c['Pasta/Arroz'],c['Carne']],       notes: n, is_favorite: f, created_at: now },
    { name: 'Paella de verduras',      course: 'unico',   category_ids: [c['Pasta/Arroz'],c['Verdura/Ensalada']], notes: n, is_favorite: f, created_at: now },
    { name: 'Espaguetis carbonara',    course: 'unico',   category_ids: [c['Pasta/Arroz'],c['Huevo']],       notes: n, is_favorite: f, created_at: now },
    { name: 'Fabada asturiana',        course: 'unico',   category_ids: [c['Legumbres'],c['Carne']],         notes: n, is_favorite: f, created_at: now },
    { name: 'Pasta con atún',          course: 'unico',   category_ids: [c['Pasta/Arroz'],c['Pescado']],     notes: n, is_favorite: f, created_at: now },
  ]
}

/* ── Context type ────────────────────────────────────────────────────────── */
interface DataContextValue {
  dishes: Dish[] | undefined
  categories: DishCategory[] | undefined
  refreshDishes: () => void
  refreshCategories: () => void
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
  const [dishes, setDishes] = useState<Dish[] | undefined>(undefined)
  const [categories, setCategories] = useState<DishCategory[] | undefined>(undefined)

  const refreshCategories = useCallback(async () => {
    const { data } = await supabase.from('dish_categories').select('*').order('sort_order')
    if (data) setCategories((data as DbCategory[]).map(mapCategory))
  }, [])

  const refreshDishes = useCallback(async () => {
    const { data } = await supabase.from('dishes').select('*').order('name')
    if (data) setDishes((data as DbDish[]).map(mapDish))
  }, [])

  // Initial fetch
  useEffect(() => {
    refreshCategories()
    refreshDishes()
  }, [refreshCategories, refreshDishes, userId])

  // Seed default categories + dishes for new users
  useEffect(() => {
    if (categories === undefined || categories.length > 0) return
    ;(async () => {
      const catRows = DEFAULT_CATS.map(c => ({
        id: crypto.randomUUID(), user_id: userId, name: c.name,
        is_default: true, sort_order: c.sortOrder,
      }))
      const { data: insertedCats } = await supabase.from('dish_categories').insert(catRows).select('*')
      if (!insertedCats) return
      const catIds: Record<string, string> = {}
      ;(insertedCats as DbCategory[]).forEach(c => { catIds[c.name] = c.id })
      setCategories((insertedCats as DbCategory[]).map(mapCategory))

      const dishRows = makeDefaultDishes(catIds).map(d => ({ ...d, id: crypto.randomUUID(), user_id: userId }))
      const { data: insertedDishes } = await supabase.from('dishes').insert(dishRows).select('*')
      if (insertedDishes) setDishes((insertedDishes as DbDish[]).map(mapDish))
    })()
  }, [categories, userId])

  /* ── Category CRUD ─────────────────────────────────────────────────────── */
  async function addCategory(name: string): Promise<DishCategory> {
    const id = crypto.randomUUID()
    const sortOrder = categories?.length ?? 0
    const cat: DishCategory = { id, name, isDefault: false, sortOrder }
    setCategories(prev => [...(prev ?? []), cat])
    await supabase.from('dish_categories').insert({ id, user_id: userId, name, is_default: false, sort_order: sortOrder })
    return cat
  }

  async function renameCategory(id: string, name: string): Promise<void> {
    setCategories(prev => prev?.map(c => c.id === id ? { ...c, name } : c))
    await supabase.from('dish_categories').update({ name }).eq('id', id)
  }

  async function deleteCategory(id: string): Promise<void> {
    setCategories(prev => prev?.filter(c => c.id !== id))
    setDishes(prev => prev?.map(d => ({ ...d, categoryIds: d.categoryIds.filter(cid => cid !== id) })))
    await supabase.from('dish_categories').delete().eq('id', id)
    // Update dishes in DB that reference this category
    const { data: affected } = await supabase.from('dishes').select('id, category_ids').contains('category_ids', [id])
    if (affected?.length) {
      await Promise.all((affected as { id: string; category_ids: string[] }[]).map(d =>
        supabase.from('dishes').update({ category_ids: d.category_ids.filter((c: string) => c !== id) }).eq('id', d.id)
      ))
    }
  }

  /* ── Dish CRUD ──────────────────────────────────────────────────────────── */
  async function addDish(dish: Omit<Dish, 'id' | 'createdAt'>): Promise<Dish> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const newDish: Dish = { ...dish, id, createdAt: now }
    setDishes(prev => [...(prev ?? []), newDish].sort((a, b) => a.name.localeCompare(b.name)))
    await supabase.from('dishes').insert({
      id, user_id: userId, name: dish.name, course: dish.course,
      category_ids: dish.categoryIds, notes: dish.notes ?? null,
      is_favorite: dish.isFavorite ?? false, created_at: now,
    })
    return newDish
  }

  async function updateDish(id: string, changes: Partial<Omit<Dish, 'id' | 'createdAt'>>): Promise<void> {
    setDishes(prev => prev?.map(d => d.id === id ? { ...d, ...changes } : d))
    const db: Record<string, unknown> = {}
    if ('name' in changes)        db.name          = changes.name
    if ('course' in changes)      db.course        = changes.course
    if ('categoryIds' in changes) db.category_ids  = changes.categoryIds
    if ('notes' in changes)       db.notes         = changes.notes ?? null
    if ('isFavorite' in changes)  db.is_favorite   = changes.isFavorite
    await supabase.from('dishes').update(db).eq('id', id)
  }

  async function deleteDish(id: string): Promise<void> {
    setDishes(prev => prev?.filter(d => d.id !== id))
    await supabase.from('dishes').delete().eq('id', id)
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
