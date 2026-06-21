import type { MenuDay, Dish } from '../types'
import { getDishIdsFromDay } from '../types'

export function getUsedCategoryIds(day: MenuDay, dishMap: Map<string, Dish>): Set<string> {
  const ids = new Set<string>()
  for (const dishId of getDishIdsFromDay(day)) {
    const dish = dishMap.get(dishId)
    if (dish) dish.categoryIds.forEach(c => ids.add(c))
  }
  return ids
}

export function hasConflict(day: MenuDay, dishMap: Map<string, Dish>): boolean {
  const counts = new Map<string, number>()
  for (const dishId of getDishIdsFromDay(day)) {
    const dish = dishMap.get(dishId)
    if (dish) {
      for (const catId of dish.categoryIds) {
        counts.set(catId, (counts.get(catId) ?? 0) + 1)
      }
    }
  }
  return [...counts.values()].some(v => v > 1)
}

export function wouldConflict(dish: Dish, usedCatIds: Set<string>): boolean {
  return dish.categoryIds.some(id => usedCatIds.has(id))
}
