import db from '../db'
import type { Dish, MenuDay, MealMode } from '../types'
import { weekDates } from './dateUtils'

function pickBest(
  pool: Dish[],
  mealCats: Set<string>,
  weekCatCount: Map<string, number>,
  weekDishIds: Set<string>
): Dish | undefined {
  return pool
    .filter(d => !d.categoryIds.some(c => mealCats.has(c)))
    .map(d => {
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

function registerExisting(dishId: string | undefined, allDishes: Dish[], cats: Set<string>) {
  if (!dishId) return
  allDishes.find(d => d.id === dishId)?.categoryIds.forEach(c => cats.add(c))
}

// Probability of "sobras" per day index (0=Mon … 6=Sun)
const SOBRAS_PROB = [0.05, 0.05, 0.10, 0.10, 0.15, 0.20, 0.40]

async function getOrCreateSobrasDish(): Promise<Dish> {
  const existing = await db.dishes.filter(d => d.name === 'Sobras').first()
  if (existing) return existing
  const sobras: Dish = {
    id: crypto.randomUUID(),
    name: 'Sobras',
    course: 'unico',
    categoryIds: [],
    createdAt: new Date().toISOString(),
  }
  await db.dishes.add(sobras)
  return sobras
}

export async function autoFillWeek(weekStart: string): Promise<void> {
  const allDishes = await db.dishes.filter(d => d.name !== 'Sobras').toArray()
  if (allDishes.length === 0) throw new Error('No hay platos disponibles. Añade platos primero.')

  const sobrasDish = await getOrCreateSobrasDish()

  const primeros      = allDishes.filter(d => d.course === 'primero')
  const segundos      = allDishes.filter(d => d.course === 'segundo')
  const unicos        = allDishes.filter(d => d.course === 'unico')
  const unicoFallback = unicos.length > 0 ? unicos : segundos

  let menu = await db.menus.where('weekStartDate').equals(weekStart).first()
  if (!menu) {
    const id = crypto.randomUUID()
    await db.menus.add({ id, weekStartDate: weekStart })
    menu = { id, weekStartDate: weekStart }
  }

  const existingDays = await db.days.where('menuId').equals(menu.id).toArray()
  const daysByDate   = new Map(existingDays.map(d => [d.date, d]))

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
  const toAdd: MenuDay[]                                         = []
  const toUpdate: Array<{ id: string; changes: Partial<MenuDay> }> = []

  for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
    const date     = dates[dayIndex]
    const existing = daysByDate.get(date)

    // 70% primeroYSegundo, 30% platoUnico for both meals
    const lunchMode:  MealMode = existing?.lunchMode  ?? (Math.random() < 0.70 ? 'primeroYSegundo' : 'platoUnico')
    const dinnerMode: MealMode = existing?.dinnerMode ?? (Math.random() < 0.70 ? 'primeroYSegundo' : 'platoUnico')

    const hasLunch  = existing?.hasLunch  ?? true
    const hasDinner = existing?.hasDinner ?? true

    // "Sobras" roll — applies to one meal per day at most
    const sobrasProbDay = SOBRAS_PROB[dayIndex] ?? 0.05
    const useSobrasToday = !existing && Math.random() < sobrasProbDay
    // Sobras goes to dinner if available, otherwise lunch
    const sobrasMeal = useSobrasToday ? (hasDinner ? 'dinner' : 'lunch') : null

    const lunchCats  = new Set<string>()
    const dinnerCats = new Set<string>()

    let firstLunchDishId  = existing?.firstLunchDishId
    let secondLunchDishId = existing?.secondLunchDishId
    let singleLunchDishId = existing?.singleLunchDishId
    let firstDinnerDishId  = existing?.firstDinnerDishId
    let secondDinnerDishId = existing?.secondDinnerDishId
    let singleDinnerDishId = existing?.singleDinnerDishId

    // ── Lunch ────────────────────────────────────────────────────────────────
    if (hasLunch) {
      if (sobrasMeal === 'lunch') {
        singleLunchDishId = sobrasDish.id
        // force platoUnico mode for sobras
        const effectiveData = { lunchMode: 'platoUnico' as MealMode, singleLunchDishId }
        Object.assign({ lunchMode, singleLunchDishId }, effectiveData)
      } else if (lunchMode === 'primeroYSegundo') {
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

    // ── Dinner ───────────────────────────────────────────────────────────────
    // Effective dinner mode — sobras forces platoUnico
    const effectiveDinnerMode: MealMode = sobrasMeal === 'dinner' ? 'platoUnico' : dinnerMode

    if (hasDinner) {
      if (sobrasMeal === 'dinner') {
        singleDinnerDishId = sobrasDish.id
      } else if (effectiveDinnerMode === 'primeroYSegundo') {
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
      lunchMode: sobrasMeal === 'lunch' ? 'platoUnico' : lunchMode,
      dinnerMode: effectiveDinnerMode,
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
