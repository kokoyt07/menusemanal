import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { DishSlot, MealMode, Dish, MenuDay } from '../types'
import { SLOT_FIELD, getDishIdsFromDay } from '../types'
import { fullDayTitle, weekDates } from '../utils/dateUtils'
import { hasConflict, getUsedCategoryIds } from '../utils/validationUtils'
import DishPickerModal from './DishPickerModal'
import { showToast } from '../utils/toast'

interface Props {
  date: string
  weekStart: string
  onBack: () => void
}

export default function DayMenuView({ date, weekStart, onBack }: Props) {
  const [pickerSlot, setPickerSlot] = useState<DishSlot | null>(null)

  const menu = useLiveQuery(() =>
    db.menus.where('weekStartDate').equals(weekStart).first()
  , [weekStart])

  const day = useLiveQuery(() =>
    db.days.where('date').equals(date).first()
  , [date])

  const allDishIds = day ? getDishIdsFromDay(day) : []
  const dishes = useLiveQuery(
    () => allDishIds.length ? db.dishes.where('id').anyOf(allDishIds).toArray() : Promise.resolve<Dish[]>([]),
    [JSON.stringify(allDishIds)]
  )
  const dishMap = new Map<string, Dish>((dishes ?? []).map(d => [d.id, d]))

  const conflict = day ? hasConflict(day, dishMap) : false
  const usedCatIds = day ? getUsedCategoryIds(day, dishMap) : new Set<string>()

  async function ensureDay() {
    if (day) return day
    let menuId: string
    if (menu) {
      menuId = menu.id
    } else {
      menuId = crypto.randomUUID()
      await db.menus.add({ id: menuId, weekStartDate: weekStart })
      const dayObjs = weekDates(weekStart).map(d => ({
        id: crypto.randomUUID(), menuId, date: d,
        hasLunch: true, hasDinner: true,
        lunchMode: 'primeroYSegundo' as MealMode,
        dinnerMode: 'primeroYSegundo' as MealMode,
      }))
      await db.days.bulkAdd(dayObjs)
      return dayObjs.find(d => d.date === date)!
    }
    const newDay = {
      id: crypto.randomUUID(), menuId, date,
      hasLunch: true, hasDinner: true,
      lunchMode: 'primeroYSegundo' as MealMode,
      dinnerMode: 'primeroYSegundo' as MealMode,
    }
    await db.days.add(newDay)
    return newDay
  }

  async function updateDay(changes: Partial<MenuDay>) {
    const d = await ensureDay()
    await db.days.update(d.id, changes)
  }

  async function setDish(slot: DishSlot, dishId: string | undefined) {
    const d = await ensureDay()
    await db.days.update(d.id, { [SLOT_FIELD[slot]]: dishId })
  }

  function getDish(slot: DishSlot): Dish | undefined {
    const field = SLOT_FIELD[slot]
    const id = day?.[field] as string | undefined
    return id ? dishMap.get(id) : undefined
  }

  return (
    <div className="screen-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0 pt-safe">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-blue-600 font-medium active:opacity-60"
        >
          <span className="text-xl">‹</span>
          <span className="text-sm">Menú</span>
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-gray-900 text-sm">{fullDayTitle(date)}</p>
        </div>
        <div className="w-16" />
      </div>

      <div className="screen-scroll px-4 py-4 space-y-4">
        {/* Conflict warning */}
        {conflict && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <span className="text-orange-400">⚠</span>
            <p className="text-sm text-orange-700 font-medium">Categoría repetida en este día</p>
          </div>
        )}

        {/* Comida */}
        <MealCard
          title="Comida" icon="☀" iconColor="text-orange-400"
          hasMeal={day?.hasLunch ?? true}
          mode={day?.lunchMode ?? 'primeroYSegundo'}
          firstDish={getDish('firstLunch')}
          secondDish={getDish('secondLunch')}
          singleDish={getDish('singleLunch')}
          usedCatIds={usedCatIds}
          dishMap={dishMap}
          onToggle={v => updateDay({ hasLunch: v })}
          onModeChange={m => updateDay({ lunchMode: m })}
          onPickFirst={() => setPickerSlot('firstLunch')}
          onPickSecond={() => setPickerSlot('secondLunch')}
          onPickSingle={() => setPickerSlot('singleLunch')}
        />

        {/* Cena */}
        <MealCard
          title="Cena" icon="☽" iconColor="text-indigo-400"
          hasMeal={day?.hasDinner ?? true}
          mode={day?.dinnerMode ?? 'primeroYSegundo'}
          firstDish={getDish('firstDinner')}
          secondDish={getDish('secondDinner')}
          singleDish={getDish('singleDinner')}
          usedCatIds={usedCatIds}
          dishMap={dishMap}
          onToggle={v => updateDay({ hasDinner: v })}
          onModeChange={m => updateDay({ dinnerMode: m })}
          onPickFirst={() => setPickerSlot('firstDinner')}
          onPickSecond={() => setPickerSlot('secondDinner')}
          onPickSingle={() => setPickerSlot('singleDinner')}
        />

        {/* Notas del día */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <span className="text-base">📝</span>
            <span className="font-semibold text-gray-900 text-sm">Notas del día</span>
          </div>
          <textarea
            value={day?.notes ?? ''}
            onChange={async e => {
              const d = await ensureDay()
              await db.days.update(d.id, { notes: e.target.value })
            }}
            onBlur={() => showToast('Notas guardadas')}
            placeholder="Cenar fuera, cumpleaños, comprar pan…"
            rows={3}
            className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-300 resize-none outline-none"
          />
        </div>

        <div className="h-4" />
      </div>

      {pickerSlot && (
        <DishPickerModal
          slot={pickerSlot}
          currentDishId={day?.[SLOT_FIELD[pickerSlot]] as string | undefined}
          usedCatIds={usedCatIds}
          onSelect={async dish => { await setDish(pickerSlot, dish.id); setPickerSlot(null) }}
          onClear={async () => { await setDish(pickerSlot, undefined); setPickerSlot(null) }}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </div>
  )
}

// ─── MealCard ────────────────────────────────────────────────────────────────

interface MealCardProps {
  title: string; icon: string; iconColor: string
  hasMeal: boolean; mode: MealMode
  firstDish?: Dish; secondDish?: Dish; singleDish?: Dish
  usedCatIds: Set<string>; dishMap: Map<string, Dish>
  onToggle: (v: boolean) => void
  onModeChange: (m: MealMode) => void
  onPickFirst: () => void; onPickSecond: () => void; onPickSingle: () => void
}

function MealCard({ title, icon, iconColor, hasMeal, mode, firstDish, secondDish, singleDish,
                    onToggle, onModeChange, onPickFirst, onPickSecond, onPickSingle }: MealCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className={`${iconColor} text-base`}>{icon}</span>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={hasMeal} onChange={e => onToggle(e.target.checked)} />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500
            after:content-[''] after:absolute after:top-0.5 after:left-[2px]
            after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
            peer-checked:after:translate-x-5" />
        </label>
      </div>

      {hasMeal && (
        <div className="p-4 space-y-3">
          {/* Mode toggle */}
          <div className="flex rounded-lg bg-gray-100 p-0.5 text-sm font-medium">
            {(['primeroYSegundo', 'platoUnico'] as MealMode[]).map(m => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={`flex-1 py-1.5 rounded-md transition-all ${
                  mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {m === 'primeroYSegundo' ? '1º y 2º' : 'Plato único'}
              </button>
            ))}
          </div>

          {/* Dish slots */}
          {mode === 'primeroYSegundo' ? (
            <>
              <SlotButton label="Primer plato" dish={firstDish} onClick={onPickFirst} />
              <SlotButton label="Segundo plato" dish={secondDish} onClick={onPickSecond} />
            </>
          ) : (
            <SlotButton label="Plato único" dish={singleDish} onClick={onPickSingle} />
          )}
        </div>
      )}
    </div>
  )
}

function SlotButton({ label, dish, onClick }: { label: string; dish?: Dish; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl active:bg-gray-100 text-left"
    >
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm font-medium ${dish ? 'text-gray-900' : 'text-gray-400'}`}>
          {dish?.name ?? 'Seleccionar plato…'}
        </p>
      </div>
      <span className="text-blue-400 text-lg ml-2">{dish ? '›' : '+'}</span>
    </button>
  )
}
