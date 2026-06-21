import Dexie, { type EntityTable } from 'dexie'
import type { Dish, DishCategory, WeeklyMenu, MenuDay } from './types'

const db = new Dexie('MenusSemanalesDB') as Dexie & {
  categories: EntityTable<DishCategory, 'id'>
  dishes:     EntityTable<Dish,         'id'>
  menus:      EntityTable<WeeklyMenu,   'id'>
  days:       EntityTable<MenuDay,      'id'>
}

db.version(1).stores({
  categories: 'id, sortOrder',
  dishes:     'id, name, course, *categoryIds, createdAt',
  menus:      'id, weekStartDate',
  days:       'id, menuId, date',
})

export default db
