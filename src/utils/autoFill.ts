import db from '../db'
import type { Dish, MenuDay, MealMode } from '../types'
import { weekDates } from './dateUtils'

// Pick the best dish from a pool, avoiding category conflicts within the meal
// and preferring categories not overused this week
function pickBest(
  pool: Dish[],
  mealCats: Set<string>,
  weekCatCount: Map<string, number>,
  weekDishIds: Set<string>
): Dish | undefined {
  return pool
    .filter(d => !d.categoryIds.some(c => mealCats.has(c)))
    .map(d => {
      // Score: randomness + penalize overused categories + penalize repeated dish
      let score = Math.random() * 3
      for (const c of d.categoryIds) score -= (weekCatCount.get(c) ?? 0) * 8
      if (weekDishIds.has(d.id)) score -= 20
      return { d, score }
    })
    .sort((a, b) => b.score - a.score)[0]?.d
}

function track(dish: Dish, weekCatCount: Map<string, number>, weekDishIds: Set<string>) {
  for (const c of dish.categoryIds) weekCatCount.set(c, (weekCatCount.get(c) ?? 0) + 1)
  weekDishIds.add(dish.id)
}

function registerExisting(
  dishId: string | undefined,
  allDishes: Dish[],
  cats: Set<string>
) {
  if (!dishId) return
  allDishes.find(d => d.id === dishId)?.categoryIds.forEach(c => cats.add(c))
}

export async function autoFillWeek(weekStart: string): Promise<void> {
  const allDishes = await db.dishes.toArray()
  if (allDishes.length === 0) throw new Error('No hay platos disponibles. Añade platos primero.')

  const primeros = allDishes.filter(d => d.course === 'primero')
  const segundos = allDishes.filter(d => d.course === 'segundo')
  const unicos   = allDishes.filter(d => d.course === 'unico')
  // If no 'unico' dishes exist, fall back to 'segundo' for single-dish slots
  const unicoFallback = unicos.length > 0 ? unicos : segundos

  // Ensure menu exists
  let menu = await db.menus.where('weekStartDate').equals(weekStart).first()
  if (!menu) {
    const id = crypto.randomUUID()
    await db.menus.add({ id, weekStartDate: weekStart })
    menu = { id, weekStartDate: weekStart }
  }

  const existingDays = await db.days.where('menuId').equals(menu.id).toArray()
  const daysByDate   = new Map(existingDays.map(d => [d.date, d]))

  // Week-level tracking — seeded from already-placed dishes so we add variety
  const weekCatCount = new Map<string, number>()
  const weekDishIds  = new Set<string>()
  for (const day of existingDays) {
    const ids = [
      day.firstLunchDishId, day.secondLunchDishId, day.singleLunchDishId,
      day.firstDinnerDishId, day.secondDinnerDishId, day.singleDinnerDishId,
    ].filter((x): x is string => !!x)
    for (const id of ids) {
      const d = allDishes.find(x => x.id === id)
      if (d) track(d, weekCatCount, weekDishIds)
    }
  }

  const dates  = weekDates(weekStart)
  const toAdd: MenuDay[]                                    = []
  const toUpdate: Array<{ id: string; changes: Partial<MenuDay> }> = []

  for (const date of dates) {
    const existing = daysByDate.get(date)

    // Keep existing mode choices; defaults: lunch = primeroYSegundo, dinner = platoUnico
    const lunchMode:  MealMode = existing?.lunchMode  ?? 'primeroYSegundo'
    const dinnerMode: MealMode = existing?.dinnerMode ?? 'platoUnico'

    // Don't touch meals the user explicitly turned off
    const hasLunch  = existing?.hasLunch  ?? true
    const hasDinner = existing?.hasDinner ?? true

    // Meal-level category sets for conflict avoidance
    const lunchCats  = new Set<string>()
    const dinnerCats = new Set<string>()

    // Carry over existing dish IDs (only fill empty slots)
    let firstLunchDishId  = existing?.firstLunchDishId
    let secondLunchDishId = existing?.secondLunchDishId
    let singleLunchDishId = existing?.singleLunchDishId
    let firstDinnerDishId  = existing?.firstDinnerDishId
    let secondDinnerDishId = existing?.secondDinnerDishId
    let singleDinnerDishId = existing?.singleDinnerDishId

    // ── Fill lunch ──────────────────────────────────────────────────────────
    if (hasLunch) {
      if (lunchMode === 'primeroYSegundo') {
        // Seed lunchCats from any already-placed lunch dishes
        registerExisting(firstLunchDishId,  allDishes, lunchCats)
        registerExisting(secondLunchDishId, allDishes, lunchCats)

        if (!firstLunchDishId) {
          const d = pickBest(primeros, lunchCats, weekCatCount, weekDishIds)
          if (d) { firstLunchDishId = d.id; d.categoryIds.forEach(c => lunchCats.add(c)); track(d, weekCatCount, weekDishIds) }
        }
        if (!secondLunchDishId) {
          const d = pickBest(segundos, lunchCats, weekCatCount, weekDishIds)
          if (d) { secondLunchDishId = d.id; d.categoryIds.forEach(c => lunchCats.add(c)); track(d, weekCatCount, weekDishIds) }
        }
      } else {
        registerExisting(singleLunchDishId, allDishes, lunchCats)
        if (!singleLunchDishId) {
          const d = pickBest(unicoFallback, lunchCats, weekCatCount, weekDishIds)
          if (d) { singleLunchDishId = d.id; track(d, weekCatCount, weekDishIds) }
        }
      }
    }

    // ── Fill dinner ─────────────────────────────────────────────────────────
    if (hasDinner) {
      if (dinnerMode === 'primeroYSegundo') {
        registerExisting(firstDinnerDishId,  allDishes, dinnerCats)
        registerExisting(secondDinnerDishId, allDishes, dinnerCats)

        if (!firstDinnerDishId) {
          const d = pickBest(primeros, dinnerCats, weekCatCount, weekDishIds)
          if (d) { firstDinnerDishId = d.id; d.categoryIds.forEach(c => dinnerCats.add(c)); track(d, weekCatCount, weekDishIds) }
        }
        if (!secondDinnerDishId) {
          const d = pickBest(segundos, dinnerCats, weekCatCount, weekDishIds)
          if (d) { secondDinnerDishId = d.id; track(d, weekCatCount, weekDishIds) }
        }
      } else {
        registerExisting(singleDinnerDishId, allDishes, dinnerCats)
        if (!singleDinnerDishId) {
          const d = pickBest(unicoFallback, dinnerCats, weekCatCount, weekDishIds)
          if (d) { singleDinnerDishId = d.id; track(d, weekCatCount, weekDishIds) }
        }
      }
    }

    const dayData: Partial<MenuDay> = {
      hasLunch, hasDinner,
      lunchMode, dinnerMode,
      firstLunchDishId, secondLunchDishId, singleLunchDishId,
      firstDinnerDishId, secondDinnerDishId, singleDinnerDishId,
    }

    if (existing) {
      toUpdate.push({ id: existing.id, changes: dayData })
    } else {
      toAdd.push({ id: crypto.randomUUID(), menuId: menu.id, date, ...dayData } as MenuDay)
    }
  }

  if (toAdd.length)    await db.days.bulkAdd(toAdd)
  for (const { id, changes } of toUpdate) await db.days.update(id, changes)
}
