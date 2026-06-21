export type CourseType = 'primero' | 'segundo' | 'unico'
export type MealMode  = 'primeroYSegundo' | 'platoUnico'
export type Tab       = 'menu' | 'platos' | 'historial'

export interface DishCategory {
  id: string
  name: string
  isDefault: boolean
  sortOrder: number
}

export interface Dish {
  id: string
  name: string
  course: CourseType
  categoryIds: string[]
  notes?: string
  createdAt: string
}

export interface WeeklyMenu {
  id: string
  weekStartDate: string // 'YYYY-MM-DD' — siempre lunes
}

export interface MenuDay {
  id: string
  menuId: string
  date: string // 'YYYY-MM-DD'
  hasLunch: boolean
  hasDinner: boolean
  lunchMode: MealMode
  firstLunchDishId?:  string
  secondLunchDishId?: string
  singleLunchDishId?: string
  dinnerMode: MealMode
  firstDinnerDishId?:  string
  secondDinnerDishId?: string
  singleDinnerDishId?: string
}

export type DishSlot =
  | 'firstLunch'  | 'secondLunch'  | 'singleLunch'
  | 'firstDinner' | 'secondDinner' | 'singleDinner'

export const SLOT_LABEL: Record<DishSlot, string> = {
  firstLunch:   'Primer plato',
  secondLunch:  'Segundo plato',
  singleLunch:  'Plato único',
  firstDinner:  'Primer plato',
  secondDinner: 'Segundo plato',
  singleDinner: 'Plato único',
}

export const SLOT_COURSE: Record<DishSlot, CourseType> = {
  firstLunch:   'primero',
  secondLunch:  'segundo',
  singleLunch:  'unico',
  firstDinner:  'primero',
  secondDinner: 'segundo',
  singleDinner: 'unico',
}

export const SLOT_FIELD: Record<DishSlot, keyof MenuDay> = {
  firstLunch:   'firstLunchDishId',
  secondLunch:  'secondLunchDishId',
  singleLunch:  'singleLunchDishId',
  firstDinner:  'firstDinnerDishId',
  secondDinner: 'secondDinnerDishId',
  singleDinner: 'singleDinnerDishId',
}

export const COURSE_LABEL: Record<CourseType, string> = {
  primero: 'Primero',
  segundo: 'Segundo',
  unico:   'Plato Único',
}

export function getDishIdsFromDay(day: MenuDay): string[] {
  const ids: (string | undefined)[] = []
  if (day.hasLunch) {
    if (day.lunchMode === 'primeroYSegundo') {
      ids.push(day.firstLunchDishId, day.secondLunchDishId)
    } else {
      ids.push(day.singleLunchDishId)
    }
  }
  if (day.hasDinner) {
    if (day.dinnerMode === 'primeroYSegundo') {
      ids.push(day.firstDinnerDishId, day.secondDinnerDishId)
    } else {
      ids.push(day.singleDinnerDishId)
    }
  }
  return ids.filter(Boolean) as string[]
}
