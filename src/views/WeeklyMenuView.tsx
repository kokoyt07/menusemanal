import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Dish } from '../types'
import { currentWeekStart, addWeeks, weekDates, isCurrentWeek, weekRangeLabel,
         dayNameShort, dayNumber, isToday, fullDayTitle } from '../utils/dateUtils'
import { hasConflict, getUsedCategoryIds } from '../utils/validationUtils'
import { getDishIdsFromDay } from '../types'

interface Props {
  onDayTap: (date: string, weekStart: string) => void
}

export default function WeeklyMenuView({ onDayTap }: Props) {
  const [weekStart, setWeekStart] = useState(currentWeekStart)

  const dates = weekDates(weekStart)

  const days = useLiveQuery(
    () => db.days.where('date').anyOf(dates).toArray(),
    [weekStart]
  )

  const allDishIds = (days ?? []).flatMap(d => getDishIdsFromDay(d))
  const dishes = useLiveQuery(
    () => allDishIds.length ? db.dishes.where('id').anyOf(allDishIds).toArray() : Promise.resolve<Dish[]>([]),
    [JSON.stringify(allDishIds)]
  )

  const dishMap = new Map<string, Dish>((dishes ?? []).map(d => [d.id, d]))

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Week navigator */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <button
          onClick={() => setWeekStart(w => addWeeks(w, -1))}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 text-blue-600 text-xl font-semibold"
        >‹</button>

        <div className="text-center">
          <p className="font-semibold text-gray-900">{weekRangeLabel(weekStart)}</p>
          {isCurrentWeek(weekStart)
            ? <p className="text-xs text-blue-500 font-medium">Esta semana</p>
            : <button onClick={() => setWeekStart(currentWeekStart())} className="text-xs text-blue-500 underline">
                Ir a hoy
              </button>
          }
        </div>

        <button
          onClick={() => setWeekStart(w => addWeeks(w, 1))}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 text-blue-600 text-xl font-semibold"
        >›</button>
      </div>

      {/* Day cards */}
      <div className="content-area px-4 py-3 space-y-2.5">
        {dates.map(date => {
          const day = (days ?? []).find(d => d.date === date)
          const conflict = day ? hasConflict(day, dishMap) : false
          const today = isToday(date)

          // Build summary lines
          const lunchNames = day?.hasLunch
            ? (day.lunchMode === 'primeroYSegundo'
                ? [day.firstLunchDishId, day.secondLunchDishId]
                : [day.singleLunchDishId])
              .filter(Boolean).map(id => dishMap.get(id!)?.name).filter(Boolean).join(' · ')
            : null

          const dinnerNames = day?.hasDinner
            ? (day.dinnerMode === 'primeroYSegundo'
                ? [day.firstDinnerDishId, day.secondDinnerDishId]
                : [day.singleDinnerDishId])
              .filter(Boolean).map(id => dishMap.get(id!)?.name).filter(Boolean).join(' · ')
            : null

          return (
            <button
              key={date}
              onClick={() => onDayTap(date, weekStart)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl shadow-sm border transition-colors active:scale-[0.99]
                ${conflict
                  ? 'bg-orange-50 border-orange-200'
                  : today
                    ? 'bg-white border-blue-200'
                    : 'bg-white border-gray-100'}`}
            >
              {/* Date column */}
              <div className={`flex-shrink-0 w-12 text-center ${today ? 'text-blue-600' : 'text-gray-700'}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
                  {dayNameShort(date)}
                </p>
                <p className="text-2xl font-bold leading-tight">{dayNumber(date)}</p>
              </div>

              <div className="w-px h-10 bg-gray-200 flex-shrink-0" />

              {/* Meals summary */}
              <div className="flex-1 min-w-0 space-y-1">
                {day ? (
                  <>
                    {day.hasLunch && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-orange-400 text-xs flex-shrink-0">☀</span>
                        <span className={`text-sm truncate ${lunchNames ? 'text-gray-800' : 'text-gray-400'}`}>
                          {lunchNames || 'Sin platos'}
                        </span>
                      </div>
                    )}
                    {day.hasDinner && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-indigo-400 text-xs flex-shrink-0">☽</span>
                        <span className={`text-sm truncate ${dinnerNames ? 'text-gray-800' : 'text-gray-400'}`}>
                          {dinnerNames || 'Sin platos'}
                        </span>
                      </div>
                    )}
                    {!day.hasLunch && !day.hasDinner && (
                      <p className="text-sm text-gray-400">Día libre</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Toca para planificar</p>
                )}
              </div>

              {conflict && <span className="text-orange-400 text-base flex-shrink-0">⚠</span>}
              <span className="text-gray-300 flex-shrink-0">›</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
