import type { Dish, MenuDay } from '../types'
import { weekDates } from './dateUtils'

export async function autoFillWeek(
  weekStart: string,
  allDishes: Dish[],
  existingDays: MenuDay[],
  updateDay: (date: string, changes: Partial<MenuDay>) => Promise<void>,
  addDish: (dish: Omit<Dish, 'id' | 'createdAt' | 'isFavorite'>) => Promise<Dish>,
): Promise<void> {
  const dates   = weekDates(weekStart)
  const primero = allDishes.filter(d => d.course === 'primero')
  const segundo = allDishes.filter(d => d.course === 'segundo')
  const unico   = allDishes.filter(d => d.course === 'unico')

  // Track categories used per day to avoid repeats within same day
  const categoryTracker = new Map<string, Set<string>>()

  function pick(pool: Dish[], usedCatIds: Set<string>): Dish | undefined {
    const withoutConflict = pool.filter(d =>
      d.categoryIds.length === 0 || !d.categoryIds.some(c => usedCatIds.has(c))
    )
    const source = withoutConflict.length > 0 ? withoutConflict : pool
    if (source.length === 0) return undefined
    return source[Math.floor(Math.random() * source.length)]
  }

  for (const date of dates) {
    const existing = existingDays.find(d => d.date === date)

    // Skip days that already have dishes set
    const hasLunchDishes = existing?.firstLunchDishId || existing?.secondLunchDishId || existing?.singleLunchDishId
    const hasDinnerDishes = existing?.firstDinnerDishId || existing?.secondDinnerDishId || existing?.singleDinnerDishId
    if (hasLunchDishes && hasDinnerDishes) continue

    const usedCatIds = categoryTracker.get(date) ?? new Set<string>()

    function trackCats(dish: Dish | undefined) {
      if (dish) dish.categoryIds.forEach(c => usedCatIds.add(c))
    }

    const changes: Partial<MenuDay> = { hasLunch: true, hasDinner: true }

    if (!hasLunchDishes) {
      if (existing?.lunchMode === 'platoUnico' || (unico.length > 0 && primero.length === 0 && segundo.length === 0)) {
        const dish = pick(unico, usedCatIds)
        if (dish) { changes.singleLunchDishId = dish.id; changes.lunchMode = 'platoUnico'; trackCats(dish) }
      } else {
        const d1 = pick(primero, usedCatIds); trackCats(d1)
        const d2 = pick(segundo, usedCatIds); trackCats(d2)
        if (d1) changes.firstLunchDishId  = d1.id
        if (d2) changes.secondLunchDishId = d2.id
        changes.lunchMode = 'primeroYSegundo'
      }
    }

    if (!hasDinnerDishes) {
      if (existing?.dinnerMode === 'platoUnico' || (unico.length > 0 && primero.length === 0 && segundo.length === 0)) {
        const dish = pick(unico, usedCatIds)
        if (dish) { changes.singleDinnerDishId = dish.id; changes.dinnerMode = 'platoUnico'; trackCats(dish) }
      } else {
        const d1 = pick(primero, usedCatIds); trackCats(d1)
        const d2 = pick(segundo, usedCatIds); trackCats(d2)
        if (d1) changes.firstDinnerDishId  = d1.id
        if (d2) changes.secondDinnerDishId = d2.id
        changes.dinnerMode = 'primeroYSegundo'
      }
    }

    categoryTracker.set(date, usedCatIds)
    await updateDay(date, changes)
  }
}
