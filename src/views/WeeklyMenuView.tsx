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
import { haptic } from '../utils/haptic'
import { ChevronLeft, ChevronRight, Sun, Moon, FileText, AlertTriangle, Zap, Share, Trash } from '../components/Icon'

interface Props {
  onDayTap: (date: string, weekStart: string) => void
}

export default function WeeklyMenuView({ onDayTap }: Props) {
  const [weekStart, setWeekStart]       = useState(currentWeekStart)
  const [filling, setFilling]           = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

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
    haptic()
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

  async function handleClearWeek() {
    haptic(12)
    const empty = {
      firstLunchDishId: undefined, secondLunchDishId: undefined, singleLunchDishId: undefined,
      firstDinnerDishId: undefined, secondDinnerDishId: undefined, singleDinnerDishId: undefined,
    }
    for (const day of (days ?? [])) {
      await db.days.update(day.id, empty)
    }
    setConfirmClear(false)
    showToast('Semana vaciada')
  }

  async function handleShare() {
    const dayList = days ?? []
    const lines: string[] = [`Semana ${weekRangeLabel(weekStart)}`, '']
    for (const date of dates) {
      const day = dayList.find(d => d.date === date)
      if (!day) continue
      lines.push(fullDayTitle(date).toUpperCase())
      if (day.hasLunch) {
        const ids   = day.lunchMode === 'primeroYSegundo' ? [day.firstLunchDishId, day.secondLunchDishId] : [day.singleLunchDishId]
        const names = ids.filter(Boolean).map(id => dishMap.get(id!)?.name).filter(Boolean).join(' + ') || '—'
        lines.push(`  Comida: ${names}`)
      }
      if (day.hasDinner) {
        const ids   = day.dinnerMode === 'primeroYSegundo' ? [day.firstDinnerDishId, day.secondDinnerDishId] : [day.singleDinnerDishId]
        const names = ids.filter(Boolean).map(id => dishMap.get(id!)?.name).filter(Boolean).join(' + ') || '—'
        lines.push(`  Cena: ${names}`)
      }
      if (day.notes) lines.push(`  Nota: ${day.notes}`)
      lines.push('')
    }
    const text = lines.join('\n').trim()
    try {
      if (navigator.share) await navigator.share({ title: 'Menu semanal', text })
      else { await navigator.clipboard.writeText(text); showToast('Copiado al portapapeles') }
    } catch { /* cancelled */ }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--cream)' }}>

      {/* Week navigator */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b flex-shrink-0"
        style={{ borderColor: 'var(--cream-border)' }}>
        <button onClick={() => setWeekStart(w => addWeeks(w, -1))}
          className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-60 flex-shrink-0"
          style={{ color: 'var(--brand)' }}>
          <ChevronLeft size={22} />
        </button>
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
          className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-60 flex-shrink-0"
          style={{ color: 'var(--brand)' }}>
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Action bar */}
      {confirmClear ? (
        <div className="px-4 py-2.5 bg-white border-b flex items-center justify-between gap-2 flex-shrink-0 anim-scale"
          style={{ borderColor: 'var(--cream-border)', background: '#FEF3EE' }}>
          <p className="text-sm font-medium" style={{ color: '#8B4513' }}>Vaciar todos los platos de la semana?</p>
          <div className="flex gap-2">
            <button onClick={handleClearWeek}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: '#C0392B' }}>
              Vaciar
            </button>
            <button onClick={() => setConfirmClear(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--cream)', color: 'var(--brand)' }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-2.5 bg-white border-b flex gap-2 flex-shrink-0"
          style={{ borderColor: 'var(--cream-border)' }}>
          <button onClick={handleAutoFill} disabled={filling}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-75 disabled:opacity-40"
            style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
            {filling
              ? <span style={{ animation: 'pulse-soft 1.2s ease infinite' }}>Rellenando…</span>
              : <><Zap size={14} /><span>Rellenar semana</span></>
            }
          </button>
          <button onClick={handleShare}
            className="py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 text-sm font-semibold active:opacity-75"
            style={{ background: 'var(--cream)', color: 'var(--brand)', border: '1px solid var(--cream-border)' }}>
            <Share size={14} />
          </button>
          <button onClick={() => setConfirmClear(true)}
            className="py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 text-sm font-semibold active:opacity-75"
            style={{ background: 'var(--cream)', color: '#C0392B', border: '1px solid var(--cream-border)' }}>
            <Trash size={14} />
          </button>
        </div>
      )}

      {/* Day cards */}
      <div className="content-area px-4 py-3 space-y-2">
        {dates.map((date, idx) => {
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
              onClick={() => { haptic(); onDayTap(date, weekStart) }}
              className="list-item w-full text-left flex items-center gap-3 p-3.5 rounded-2xl active:scale-[0.99] transition-transform"
              style={{
                '--i': idx,
                background: 'white',
                border: `1.5px solid ${conflict ? '#F5C0A4' : today ? 'var(--brand)' : 'var(--cream-border)'}`,
                boxShadow: today ? '0 2px 10px rgba(47,29,27,0.14)' : '0 1px 3px rgba(47,29,27,0.06)',
              } as React.CSSProperties}
            >
              <div className="flex-shrink-0 w-12 text-center rounded-xl py-1.5"
                style={{ background: today ? 'var(--brand)' : 'var(--cream)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: today ? 'rgba(255,255,255,0.65)' : '#AFA59A' }}>
                  {dayNameShort(date)}
                </p>
                <p className="text-2xl font-extrabold leading-none mt-0.5"
                  style={{ color: today ? 'white' : 'var(--brand)' }}>
                  {dayNumber(date)}
                </p>
              </div>

              <div className="w-px h-10 flex-shrink-0" style={{ background: 'var(--cream-border)' }} />

              <div className="flex-1 min-w-0 space-y-1">
                {day ? (
                  <>
                    {day.hasLunch && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Sun size={11} style={{ color: '#D4A017', flexShrink: 0 }} />
                        <span className="text-[13px] truncate font-medium"
                          style={{ color: lunchNames ? 'var(--brand)' : '#C8C0B5' }}>
                          {lunchNames || 'Sin platos'}
                        </span>
                      </div>
                    )}
                    {day.hasDinner && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Moon size={11} style={{ color: '#7C6FA0', flexShrink: 0 }} />
                        <span className="text-[13px] truncate font-medium"
                          style={{ color: dinnerNames ? 'var(--brand)' : '#C8C0B5' }}>
                          {dinnerNames || 'Sin platos'}
                        </span>
                      </div>
                    )}
                    {day.notes && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText size={10} style={{ color: '#AFA59A', flexShrink: 0 }} />
                        <p className="text-[11px] truncate" style={{ color: '#AFA59A' }}>{day.notes}</p>
                      </div>
                    )}
                    {!day.hasLunch && !day.hasDinner && (
                      <p className="text-[13px]" style={{ color: '#C8C0B5' }}>Dia libre</p>
                    )}
                  </>
                ) : (
                  <p className="text-[13px]" style={{ color: '#C8C0B5' }}>Toca para planificar</p>
                )}
              </div>

              {conflict && <AlertTriangle size={14} style={{ color: '#E07050', flexShrink: 0 }} />}
              <ChevronRight size={16} style={{ color: '#D9D2CA', flexShrink: 0 }} />
            </button>
          )
        })}
        <div className="h-4" />
      </div>
    </div>
  )
}
