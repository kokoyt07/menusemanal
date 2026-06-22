import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Dish } from '../types'
import { currentWeekStart, addWeeks, weekDates, isCurrentWeek, weekRangeLabel,
         dayNameShort, dayNumber, isToday, fullDayTitle } from '../utils/dateUtils'
import { hasConflict } from '../utils/validationUtils'
import { getDishIdsFromDay } from '../types'
import { autoFillWeek } from '../utils/autoFill'
import { showToast } from '../utils/toast'

interface Props {
  onDayTap: (date: string, weekStart: string) => void
}

export default function WeeklyMenuView({ onDayTap }: Props) {
  const [weekStart, setWeekStart] = useState(currentWeekStart)
  const [filling, setFilling]     = useState(false)

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

  async function handleAutoFill() {
    setFilling(true)
    try {
      await autoFillWeek(weekStart)
      showToast('Semana rellenada')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al rellenar', 'error')
    } finally {
      setFilling(false)
    }
  }

  async function handleShare() {
    const dayList = days ?? []
    const lines: string[] = [`📅 ${weekRangeLabel(weekStart)}`, '']
    for (const date of dates) {
      const day = dayList.find(d => d.date === date)
      if (!day) continue
      lines.push(fullDayTitle(date).toUpperCase())
      if (day.hasLunch) {
        const ids   = day.lunchMode === 'primeroYSegundo' ? [day.firstLunchDishId, day.secondLunchDishId] : [day.singleLunchDishId]
        const names = ids.filter(Boolean).map(id => dishMap.get(id!)?.name).filter(Boolean).join(' · ') || '—'
        lines.push(`☀ Comida: ${names}`)
      }
      if (day.hasDinner) {
        const ids   = day.dinnerMode === 'primeroYSegundo' ? [day.firstDinnerDishId, day.secondDinnerDishId] : [day.singleDinnerDishId]
        const names = ids.filter(Boolean).map(id => dishMap.get(id!)?.name).filter(Boolean).join(' · ') || '—'
        lines.push(`☽ Cena: ${names}`)
      }
      if (day.notes) lines.push(`📝 ${day.notes}`)
      lines.push('')
    }
    const text = lines.join('\n').trim()
    try {
      if (navigator.share) await navigator.share({ title: 'Menú semanal', text })
      else { await navigator.clipboard.writeText(text); showToast('Copiado al portapapeles') }
    } catch { /* cancelled */ }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--cream)' }}>

      {/* Week navigator */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b flex-shrink-0"
        style={{ borderColor: 'var(--cream-border)' }}>
        <button onClick={() => setWeekStart(w => addWeeks(w, -1))}
          className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-60 text-xl font-bold flex-shrink-0"
          style={{ color: 'var(--brand)' }}>‹</button>

        <div className="flex-1 text-center">
          <p className="font-bold text-sm" style={{ color: 'var(--brand)' }}>{weekRangeLabel(weekStart)}</p>
          {isCurrentWeek(weekStart)
            ? <p className="text-xs font-semibold" style={{ color: '#AFA59A' }}>Esta semana</p>
            : <button onClick={() => setWeekStart(currentWeekStart())}
                className="text-xs font-semibold underline" style={{ color: '#AFA59A' }}>
                Ir a hoy
              </button>
          }
        </div>

        <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
          className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-60 text-xl font-bold flex-shrink-0"
          style={{ color: 'var(--brand)' }}>›</button>
      </div>

      {/* Action bar */}
      <div className="px-4 py-2.5 bg-white border-b flex gap-2 flex-shrink-0"
        style={{ borderColor: 'var(--cream-border)' }}>
        <button onClick={handleAutoFill} disabled={filling}
          className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 active:opacity-75 disabled:opacity-40"
          style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
          {filling ? <span className="animate-pulse">Rellenando…</span> : <><span>⚡</span><span>Rellenar semana</span></>}
        </button>
        <button onClick={handleShare}
          className="py-2 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 active:opacity-75"
          style={{ background: 'var(--cream)', color: 'var(--brand)' }}>
          <span>↑</span><span>Compartir</span>
        </button>
      </div>

      {/* Day cards */}
      <div className="content-area px-4 py-3 space-y-2">
        {dates.map(date => {
          const day      = (days ?? []).find(d => d.date === date)
          const conflict = day ? hasConflict(day, dishMap) : false
          const today    = isToday(date)

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
              className="w-full text-left flex items-center gap-3 p-3.5 rounded-2xl active:scale-[0.99] transition-transform"
              style={{
                background: 'white',
                border: `1.5px solid ${conflict ? '#F5C0A4' : today ? 'var(--brand)' : 'var(--cream-border)'}`,
                boxShadow: today
                  ? '0 2px 8px rgba(47,29,27,0.12)'
                  : '0 1px 3px rgba(47,29,27,0.06)',
              }}
            >
              {/* Date badge */}
              <div className="flex-shrink-0 w-12 text-center rounded-xl py-1.5"
                style={{ background: today ? 'var(--brand)' : 'var(--cream)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: today ? 'rgba(255,255,255,0.7)' : '#AFA59A' }}>
                  {dayNameShort(date)}
                </p>
                <p className="text-2xl font-extrabold leading-none mt-0.5"
                  style={{ color: today ? 'white' : 'var(--brand)' }}>
                  {dayNumber(date)}
                </p>
              </div>

              <div className="w-px h-10 flex-shrink-0" style={{ background: 'var(--cream-border)' }} />

              {/* Meal summary */}
              <div className="flex-1 min-w-0 space-y-1">
                {day ? (
                  <>
                    {day.hasLunch && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] flex-shrink-0" style={{ color: '#D4A017' }}>☀</span>
                        <span className="text-[13px] truncate font-medium"
                          style={{ color: lunchNames ? 'var(--brand)' : '#C8C0B5' }}>
                          {lunchNames || 'Sin platos'}
                        </span>
                      </div>
                    )}
                    {day.hasDinner && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] flex-shrink-0" style={{ color: '#7C6FA0' }}>☽</span>
                        <span className="text-[13px] truncate font-medium"
                          style={{ color: dinnerNames ? 'var(--brand)' : '#C8C0B5' }}>
                          {dinnerNames || 'Sin platos'}
                        </span>
                      </div>
                    )}
                    {day.notes && (
                      <p className="text-[11px] truncate" style={{ color: '#AFA59A' }}>📝 {day.notes}</p>
                    )}
                    {!day.hasLunch && !day.hasDinner && (
                      <p className="text-[13px]" style={{ color: '#C8C0B5' }}>Día libre</p>
                    )}
                  </>
                ) : (
                  <p className="text-[13px]" style={{ color: '#C8C0B5' }}>Toca para planificar</p>
                )}
              </div>

              {conflict && <span className="text-sm flex-shrink-0" style={{ color: '#E07050' }}>⚠</span>}
              <span className="text-lg flex-shrink-0" style={{ color: '#D9D2CA' }}>›</span>
            </button>
          )
        })}
        <div className="h-4" />
      </div>
    </div>
  )
}
