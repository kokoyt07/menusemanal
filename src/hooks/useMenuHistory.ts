import { useState, useEffect } from 'react'
import type { WeeklyMenu, MenuDay, MealMode } from '../types'
import { supabase } from '../lib/supabase'
import { addWeeks } from '../utils/dateUtils'
import { showToast } from '../utils/toast'

export interface MenuWithDays extends WeeklyMenu {
  days: MenuDay[]
}

function mapDay(r: Record<string, unknown>): MenuDay {
  return {
    id:      r.id      as string,
    menuId:  r.menu_id as string,
    date:    r.date    as string,
    hasLunch:  r.has_lunch  as boolean,
    hasDinner: r.has_dinner as boolean,
    lunchMode:  ((r.lunch_mode  as string) ?? 'primeroYSegundo') as MealMode,
    dinnerMode: ((r.dinner_mode as string) ?? 'primeroYSegundo') as MealMode,
    firstLunchDishId:   (r.first_lunch_dish_id   as string | null) ?? undefined,
    secondLunchDishId:  (r.second_lunch_dish_id  as string | null) ?? undefined,
    singleLunchDishId:  (r.single_lunch_dish_id  as string | null) ?? undefined,
    firstDinnerDishId:  (r.first_dinner_dish_id  as string | null) ?? undefined,
    secondDinnerDishId: (r.second_dinner_dish_id as string | null) ?? undefined,
    singleDinnerDishId: (r.single_dinner_dish_id as string | null) ?? undefined,
    notes: (r.notes as string | null) ?? undefined,
  }
}

export function useMenuHistory(userId: string) {
  const [menus, setMenus] = useState<MenuWithDays[] | undefined>(undefined)

  async function fetchAll() {
    const { data: menuData } = await supabase
      .from('weekly_menus')
      .select('*')
      .eq('user_id', userId)
      .order('week_start_date', { ascending: false })

    if (!menuData) { setMenus([]); return }

    const menuIds = menuData.map((m: Record<string, unknown>) => m.id as string)
    const { data: daysData } = menuIds.length
      ? await supabase.from('menu_days').select('*').in('menu_id', menuIds)
      : { data: [] }

    const daysById = new Map<string, MenuDay[]>()
    ;(daysData ?? []).forEach((d: Record<string, unknown>) => {
      const day = mapDay(d)
      const arr = daysById.get(d.menu_id as string) ?? []
      arr.push(day)
      daysById.set(d.menu_id as string, arr)
    })

    setMenus(menuData.map((m: Record<string, unknown>) => ({
      id:            m.id            as string,
      weekStartDate: m.week_start_date as string,
      days:          daysById.get(m.id as string) ?? [],
    })))
  }

  useEffect(() => { fetchAll() }, [userId])

  async function deleteMenu(menuId: string): Promise<void> {
    setMenus(prev => prev?.filter(m => m.id !== menuId))
    const { error } = await supabase.from('weekly_menus').delete().eq('id', menuId)
    if (error) {
      console.error('[useMenuHistory] deleteMenu:', error)
      showToast('Error al eliminar el menú', 'error')
      fetchAll()
    }
  }

  async function duplicateMenu(menu: MenuWithDays): Promise<void> {
    const nextStart = addWeeks(menu.weekStartDate, 1)
    if (menus?.some(m => m.weekStartDate === nextStart)) {
      showToast('Ya existe un menú para esa semana', 'info')
      return
    }

    const newMenuId = crypto.randomUUID()
    const { error: menuErr } = await supabase
      .from('weekly_menus')
      .insert({ id: newMenuId, user_id: userId, week_start_date: nextStart })
    if (menuErr) {
      console.error('[useMenuHistory] duplicateMenu:', menuErr)
      showToast('Error al duplicar el menú', 'error')
      return
    }

    const newDayRows = menu.days.map(d => ({
      id: crypto.randomUUID(), menu_id: newMenuId, user_id: userId,
      date: addWeeks(d.date, 1),
      has_lunch: d.hasLunch, has_dinner: d.hasDinner,
      lunch_mode: d.lunchMode, dinner_mode: d.dinnerMode,
      first_lunch_dish_id:   d.firstLunchDishId   ?? null,
      second_lunch_dish_id:  d.secondLunchDishId  ?? null,
      single_lunch_dish_id:  d.singleLunchDishId  ?? null,
      first_dinner_dish_id:  d.firstDinnerDishId  ?? null,
      second_dinner_dish_id: d.secondDinnerDishId ?? null,
      single_dinner_dish_id: d.singleDinnerDishId ?? null,
      notes: d.notes ?? null,
    }))

    if (newDayRows.length) await supabase.from('menu_days').insert(newDayRows)

    const newEntry: MenuWithDays = {
      id: newMenuId, weekStartDate: nextStart,
      days: newDayRows.map(d => ({
        id: d.id, menuId: newMenuId, date: d.date,
        hasLunch: d.has_lunch, hasDinner: d.has_dinner,
        lunchMode: d.lunch_mode as MealMode, dinnerMode: d.dinner_mode as MealMode,
        firstLunchDishId:   d.first_lunch_dish_id   ?? undefined,
        secondLunchDishId:  d.second_lunch_dish_id  ?? undefined,
        singleLunchDishId:  d.single_lunch_dish_id  ?? undefined,
        firstDinnerDishId:  d.first_dinner_dish_id  ?? undefined,
        secondDinnerDishId: d.second_dinner_dish_id ?? undefined,
        singleDinnerDishId: d.single_dinner_dish_id ?? undefined,
        notes: d.notes ?? undefined,
      })),
    }

    setMenus(prev => [newEntry, ...(prev ?? [])].sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate)))
    showToast('Semana duplicada')
  }

  return { menus, deleteMenu, duplicateMenu, refresh: fetchAll }
}
