import db from '../db'
import type { DishCategory, Dish } from '../types'

export async function seedIfNeeded() {
  const count = await db.categories.count()
  if (count > 0) return

  const cats: DishCategory[] = [
    { id: crypto.randomUUID(), name: 'Pescado',         isDefault: true, sortOrder: 0 },
    { id: crypto.randomUUID(), name: 'Carne',           isDefault: true, sortOrder: 1 },
    { id: crypto.randomUUID(), name: 'Verdura/Ensalada',isDefault: true, sortOrder: 2 },
    { id: crypto.randomUUID(), name: 'Legumbres',       isDefault: true, sortOrder: 3 },
    { id: crypto.randomUUID(), name: 'Pasta/Arroz',     isDefault: true, sortOrder: 4 },
    { id: crypto.randomUUID(), name: 'Huevo',           isDefault: true, sortOrder: 5 },
  ]
  await db.categories.bulkAdd(cats)

  const c = Object.fromEntries(cats.map(x => [x.name, x.id]))
  const now = new Date().toISOString()

  const dishes: Dish[] = [
    // Primeros
    { id: crypto.randomUUID(), name: 'Ensalada mixta',         course: 'primero', categoryIds: [c['Verdura/Ensalada']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Macarrones con tomate',  course: 'primero', categoryIds: [c['Pasta/Arroz']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Lentejas estofadas',     course: 'primero', categoryIds: [c['Legumbres']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Sopa de fideos',         course: 'primero', categoryIds: [c['Pasta/Arroz']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Garbanzos con espinacas',course: 'primero', categoryIds: [c['Legumbres'], c['Verdura/Ensalada']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Arroz con verduras',     course: 'primero', categoryIds: [c['Pasta/Arroz'], c['Verdura/Ensalada']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Judías blancas',         course: 'primero', categoryIds: [c['Legumbres']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Espaguetis con tomate',  course: 'primero', categoryIds: [c['Pasta/Arroz']], createdAt: now },
    // Segundos
    { id: crypto.randomUUID(), name: 'Merluza al horno',       course: 'segundo', categoryIds: [c['Pescado']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Salmón a la plancha',    course: 'segundo', categoryIds: [c['Pescado']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Bacalao con tomate',     course: 'segundo', categoryIds: [c['Pescado']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Pollo asado',            course: 'segundo', categoryIds: [c['Carne']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Filetes de ternera',     course: 'segundo', categoryIds: [c['Carne']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Cerdo a la plancha',     course: 'segundo', categoryIds: [c['Carne']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Tortilla española',      course: 'segundo', categoryIds: [c['Huevo']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Huevos fritos',          course: 'segundo', categoryIds: [c['Huevo']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Revuelto de champiñones',course: 'segundo', categoryIds: [c['Huevo'], c['Verdura/Ensalada']], createdAt: now },
    // Platos únicos
    { id: crypto.randomUUID(), name: 'Arroz con pollo',        course: 'unico', categoryIds: [c['Pasta/Arroz'], c['Carne']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Paella de verduras',     course: 'unico', categoryIds: [c['Pasta/Arroz'], c['Verdura/Ensalada']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Espaguetis carbonara',   course: 'unico', categoryIds: [c['Pasta/Arroz'], c['Huevo']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Fabada asturiana',       course: 'unico', categoryIds: [c['Legumbres'], c['Carne']], createdAt: now },
    { id: crypto.randomUUID(), name: 'Pasta con atún',         course: 'unico', categoryIds: [c['Pasta/Arroz'], c['Pescado']], createdAt: now },
  ]
  await db.dishes.bulkAdd(dishes)
}
