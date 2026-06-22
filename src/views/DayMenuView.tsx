import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { DishSlot, MealMode, Dish, MenuDay } from '../types'
import { SLOT_FIELD, getDishIdsFromDay } from '../types'
import { fullDayTitle, weekDates } from '../utils/dateUtils'
import { hasConflict, getUsedCategoryIds } from '../utils/validationUtils'
import DishPickerModal from './DishPickerModal'
import { showToast } from '../utils/toast'
import { ChevronLeft, ChevronRight, Plus, Sun, Moon, FileText, AlertTriangle } from '../components/Icon'

interface Props { date: string; weekStart: string; onBack: () => void }

export default function DayMenuView({ date, weekStart, onBack }: Props) {
  const [pickerSlot, setPickerSlot] = useState<DishSlot | null>(null)

  const menu = useLiveQuery(() => db.menus.where('weekStartDate').equals(weekStart).first(), [weekStart])
  const day  = useLiveQuery(() => db.days.where('date').equals(date).first(), [date])

  const allDishIds = day ? getDishIdsFromDay(day) : []
  const dishes = useLiveQuery(
    () => allDishIds.length ? db.dishes.where('id').anyOf(allDishIds).toArray() : Promise.resolve<Dish[]>([]),
    [JSON.stringify(allDishIds)]
  )
  const dishMap    = new Map<string, Dish>((dishes ?? []).map(d => [d.id, d]))
  const conflict   = day ? hasConflict(day, dishMap) : false
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
    const id = day?.[SLOT_FIELD[slot]] as string | undefined
    return id ? dishMap.get(id) : undefined
  }

  return (
    <div className="screen-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b flex-shrink-0 pt-safe"
        style={{ borderColor: 'var(--cream-border)' }}>
        <button onClick={onBack}
          className="flex items-center gap-1 font-semibold text-sm active:opacity-60"
          style={{ color: 'var(--brand)' }}>
          <ChevronLeft size={20} /><span>Menú</span>
        </button>
        <div className="flex-1 text-center">
          <p className="font-bold text-sm" style={{ color: 'var(--brand)' }}>{fullDayTitle(date)}</p>
        </div>
        <div className="w-16" />
      </div>

      <div className="screen-scroll px-4 py-4 space-y-3">
        {/* Conflict warning */}
        {conflict && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl anim-scale"
            style={{ background: '#FEF3EE', border: '1px solid #F5C0A4' }}>
            <AlertTriangle size={16} style={{ color: '#E07050', flexShrink: 0 }} />
            <p className="text-sm font-medium" style={{ color: '#8B4513' }}>Categoria repetida en este dia</p>
          </div>
        )}

        <MealCard
          title="Comida" MealIcon={Sun} iconColor="#D4A017"
          hasMeal={day?.hasLunch ?? true} mode={day?.lunchMode ?? 'primeroYSegundo'}
          firstDish={getDish('firstLunch')} secondDish={getDish('secondLunch')} singleDish={getDish('singleLunch')}
          onToggle={v => updateDay({ hasLunch: v })}
          onModeChange={m => updateDay({ lunchMode: m })}
          onPickFirst={() => setPickerSlot('firstLunch')}
          onPickSecond={() => setPickerSlot('secondLunch')}
          onPickSingle={() => setPickerSlot('singleLunch')}
        />

        <MealCard
          title="Cena" MealIcon={Moon} iconColor="#7C6FA0"
          hasMeal={day?.hasDinner ?? true} mode={day?.dinnerMode ?? 'primeroYSegundo'}
          firstDish={getDish('firstDinner')} secondDish={getDish('secondDinner')} singleDish={getDish('singleDinner')}
          onToggle={v => updateDay({ hasDinner: v })}
          onModeChange={m => updateDay({ dinnerMode: m })}
          onPickFirst={() => setPickerSlot('firstDinner')}
          onPickSecond={() => setPickerSlot('secondDinner')}
          onPickSingle={() => setPickerSlot('singleDinner')}
        />

        {/* Notes */}
        <div className="card">
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--cream-border)' }}>
            <FileText size={14} style={{ color: '#AFA59A' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--brand)' }}>Notas del dia</span>
          </div>
          <textarea
            value={day?.notes ?? ''}
            onChange={async e => {
              const d = await ensureDay()
              await db.days.update(d.id, { notes: e.target.value })
            }}
            onBlur={() => day?.notes && showToast('Notas guardadas')}
            placeholder="Cenar fuera, cumpleanos, comprar pan…"
            rows={3}
            className="w-full px-4 py-3 text-sm resize-none outline-none"
            style={{ color: 'var(--brand)', background: 'transparent' }}
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

/* ── MealCard ────────────────────────────────────────────────────────────── */
interface MealCardProps {
  title: string
  MealIcon: React.FC<{ size?: number; style?: React.CSSProperties; sw?: number }>
  iconColor: string
  hasMeal: boolean; mode: MealMode
  firstDish?: Dish; secondDish?: Dish; singleDish?: Dish
  onToggle: (v: boolean) => void; onModeChange: (m: MealMode) => void
  onPickFirst: () => void; onPickSecond: () => void; onPickSingle: () => void
}

function MealCard({ title, MealIcon, iconColor, hasMeal, mode,
                    firstDish, secondDish, singleDish,
                    onToggle, onModeChange, onPickFirst, onPickSecond, onPickSingle }: MealCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between px-4 py-3.5 border-b"
        style={{ borderColor: 'var(--cream-border)' }}>
        <div className="flex items-center gap-2">
          <MealIcon size={15} style={{ color: iconColor }} />
          <span className="font-bold text-sm" style={{ color: 'var(--brand)' }}>{title}</span>
        </div>
        <button onClick={() => onToggle(!hasMeal)} className="relative flex-shrink-0" style={{ width: 44, height: 24 }}>
          <div className="absolute inset-0 rounded-full transition-colors duration-200"
            style={{ background: hasMeal ? 'var(--brand)' : '#D9D2CA' }} />
          <div className="absolute top-[2px] rounded-full bg-white transition-all duration-200"
            style={{ width: 20, height: 20, left: hasMeal ? 22 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.20)' }} />
        </button>
      </div>

      {hasMeal && (
        <div className="p-4 space-y-3">
          <div className="flex rounded-xl p-0.5" style={{ background: 'var(--cream)' }}>
            {(['primeroYSegundo', 'platoUnico'] as MealMode[]).map(m => (
              <button key={m} onClick={() => onModeChange(m)}
                className="flex-1 py-2 rounded-[10px] text-xs font-semibold transition-all"
                style={{
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? 'var(--brand)' : '#AFA59A',
                  boxShadow: mode === m ? '0 1px 4px rgba(47,29,27,0.10)' : 'none',
                }}>
                {m === 'primeroYSegundo' ? '1º y 2º plato' : 'Plato único'}
              </button>
            ))}
          </div>

          {mode === 'primeroYSegundo' ? (
            <>
              <SlotButton label="Primer plato"  dish={firstDish}  onClick={onPickFirst} />
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
    <button onClick={onClick}
      className="w-full flex items-center justify-between p-3.5 rounded-xl active:opacity-70 text-left"
      style={{ background: 'var(--cream)', border: dish ? '1.5px solid var(--cream-border)' : '1.5px dashed #D9D2CA' }}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: '#AFA59A' }}>{label}</p>
        <p className="text-sm font-semibold" style={{ color: dish ? 'var(--brand)' : '#C8C0B5' }}>
          {dish?.name ?? 'Seleccionar…'}
        </p>
      </div>
      {dish
        ? <ChevronRight size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />
        : <Plus size={16} style={{ color: '#D9D2CA', flexShrink: 0 }} />
      }
    </button>
  )
}
