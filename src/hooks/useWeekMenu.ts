import { useState, useEffect, useRef } from 'react'
import type { MenuDay, WeeklyMenu, MealMode } from '../types'
import { supabase } from '../lib/supabase'
import { weekDates } from '../utils/dateUtils'

/* ── DB row type ─────────────────────────────────────────────────────────── */
interface DbDay {
  id: string; menu_id: string; user_id: string; date: string
  has_lunch: boolean; has_dinner: boolean
  lunch_mode: string
  first_lunch_dish_id: string | null; second_lunch_dish_id: string | null; single_lunch_dish_id: string | null
  dinner_mode: string
  first_dinner_dish_id: string | null; second_dinner_dish_id: string | null; single_dinner_dish_id: string | null
  notes: string | null
}

function mapDay(r: DbDay): MenuDay {
  return {
    id: r.id, menuId: r.menu_id, date: r.date,
    hasLunch: r.has_lunch, hasDinner: r.has_dinner,
    lunchMode: (r.lunch_mode ?? 'primeroYSegundo') as MealMode,
    firstLunchDishId:   r.first_lunch_dish_id   ?? undefined,
    secondLunchDishId:  r.second_lunch_dish_id  ?? undefined,
    singleLunchDishId:  r.single_lunch_dish_id  ?? undefined,
    dinnerMode: (r.dinner_mode ?? 'primeroYSegundo') as MealMode,
    firstDinnerDishId:  r.first_dinner_dish_id  ?? undefined,
    secondDinnerDishId: r.second_dinner_dish_id ?? undefined,
    singleDinnerDishId: r.single_dinner_dish_id ?? undefined,
    notes: r.notes ?? undefined,
  }
}

function toDbChanges(changes: Partial<MenuDay>): Record<string, unknown> {
  const r: Record<string, unknown> = {}
  if ('hasLunch'          in changes) r.has_lunch            = changes.hasLunch
  if ('hasDinner'         in changes) r.has_dinner           = changes.hasDinner
  if ('lunchMode'         in changes) r.lunch_mode           = changes.lunchMode
  if ('dinnerMode'        in changes) r.dinner_mode          = changes.dinnerMode
  if ('firstLunchDishId'   in changes) r.first_lunch_dish_id  = changes.firstLunchDishId   ?? null
  if ('secondLunchDishId'  in changes) r.second_lunch_dish_id = changes.secondLunchDishId  ?? null
  if ('singleLunchDishId'  in changes) r.single_lunch_dish_id = changes.singleLunchDishId  ?? null
  if ('firstDinnerDishId'  in changes) r.first_dinner_dish_id = changes.firstDinnerDishId  ?? null
  if ('secondDinnerDishId' in changes) r.second_dinner_dish_id= changes.secondDinnerDishId ?? null
  if ('singleDinnerDishId' in changes) r.single_dinner_dish_id= changes.singleDinnerDishId ?? null
  if ('notes'             in changes) r.notes                = changes.notes ?? null
  return r
}

export interface UseWeekMenuResult {
  menu: WeeklyMenu | null | undefined
  days: MenuDay[]
  loading: boolean
  updateDay: (date: string, changes: Partial<MenuDay>) => Promise<void>
  clearWeek: () => Promise<void>
  refresh: () => Promise<void>
}

export function useWeekMenu(weekStart: string, userId: string): UseWeekMenuResult {
  const [menu, setMenu]       = useState<WeeklyMenu | null | undefined>(undefined)
  const [days, setDays]       = useState<MenuDay[]>([])
  const [loading, setLoading] = useState(true)

  // Mutable refs so async operations always see current values
  const menuIdRef   = useRef<string | null>(null)
  const daysRef     = useRef<MenuDay[]>([])
  const creatingRef = useRef<Promise<string> | null>(null)

  function syncDays(d: MenuDay[]) { daysRef.current = d; setDays(d) }

  async function fetchWeek() {
    setLoading(true)
    const { data: menuData } = await supabase
      .from('weekly_menus')
      .select('*')
      .eq('week_start_date', weekStart)
      .eq('user_id', userId)
      .maybeSingle()

    if (!menuData) {
      setMenu(null)
      menuIdRef.current = null
      syncDays([])
      setLoading(false)
      return
    }

    setMenu({ id: menuData.id, weekStartDate: menuData.week_start_date })
    menuIdRef.current = menuData.id

    const { data: daysData } = await supabase
      .from('menu_days')
      .select('*')
      .eq('menu_id', menuData.id)

    syncDays((daysData ?? []).map(mapDay))
    setLoading(false)
  }

  useEffect(() => {
    menuIdRef.current = null
    creatingRef.current = null
    syncDays([])
    fetchWeek()
  }, [weekStart, userId])

  async function ensureMenuId(): Promise<string> {
    if (menuIdRef.current) return menuIdRef.current
    if (creatingRef.current) return creatingRef.current

    creatingRef.current = (async () => {
      const id = crypto.randomUUID()
      await supabase.from('weekly_menus').insert({ id, user_id: userId, week_start_date: weekStart })

      const dayRows = weekDates(weekStart).map(date => ({
        id: crypto.randomUUID(), menu_id: id, user_id: userId, date,
        has_lunch: true, has_dinner: true,
        lunch_mode: 'primeroYSegundo', dinner_mode: 'primeroYSegundo',
      }))
      await supabase.from('menu_days').insert(dayRows)

      const newDays: MenuDay[] = dayRows.map(d => ({
        id: d.id, menuId: id, date: d.date,
        hasLunch: true, hasDinner: true,
        lunchMode: 'primeroYSegundo' as MealMode,
        dinnerMode: 'primeroYSegundo' as MealMode,
      }))

      setMenu({ id, weekStartDate: weekStart })
      menuIdRef.current = id
      syncDays(newDays)
      creatingRef.current = null
      return id
    })()

    return creatingRef.current
  }

  async function updateDay(date: string, changes: Partial<MenuDay>): Promise<void> {
    const mId = await ensureMenuId()
    const existing = daysRef.current.find(d => d.date === date)
    const dbChanges = toDbChanges(changes)

    if (existing) {
      syncDays(daysRef.current.map(d => d.date === date ? { ...d, ...changes } : d))
      await supabase.from('menu_days').update(dbChanges).eq('id', existing.id)
    } else {
      const newDay: MenuDay = {
        id: crypto.randomUUID(), menuId: mId, date,
        hasLunch: true, hasDinner: true,
        lunchMode: 'primeroYSegundo', dinnerMode: 'primeroYSegundo',
        ...changes,
      }
      syncDays([...daysRef.current, newDay])
      await supabase.from('menu_days').insert({
        id: newDay.id, menu_id: mId, user_id: userId, date,
        has_lunch: newDay.hasLunch, has_dinner: newDay.hasDinner,
        lunch_mode: newDay.lunchMode, dinner_mode: newDay.dinnerMode,
        ...dbChanges,
      })
    }
  }

  async function clearWeek(): Promise<void> {
    if (!menuIdRef.current) return
    const empty = toDbChanges({
      firstLunchDishId: undefined, secondLunchDishId: undefined, singleLunchDishId: undefined,
      firstDinnerDishId: undefined, secondDinnerDishId: undefined, singleDinnerDishId: undefined,
    })
    syncDays(daysRef.current.map(d => ({
      ...d,
      firstLunchDishId: undefined, secondLunchDishId: undefined, singleLunchDishId: undefined,
      firstDinnerDishId: undefined, secondDinnerDishId: undefined, singleDinnerDishId: undefined,
    })))
    await supabase.from('menu_days').update(empty).eq('menu_id', menuIdRef.current)
  }

  return { menu, days, loading, updateDay, clearWeek, refresh: fetchWeek }
}
