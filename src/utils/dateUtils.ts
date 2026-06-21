const DAYS   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function parseDate(s: string): Date {
  const [y,m,d] = s.split('-').map(Number)
  return new Date(y, m-1, d)
}

export function addDays(dateStr: string, n: number): string {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

export function addWeeks(dateStr: string, n: number): string {
  return addDays(dateStr, n * 7)
}

export function currentWeekStart(): string {
  const now = new Date()
  const dow = now.getDay()                 // 0=Dom
  const diff = dow === 0 ? -6 : 1 - dow   // retrocede al lunes
  const mon = new Date(now)
  mon.setDate(now.getDate() + diff)
  return toDateStr(mon)
}

export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function isToday(dateStr: string): boolean {
  return dateStr === toDateStr(new Date())
}

export function isCurrentWeek(weekStart: string): boolean {
  return weekStart === currentWeekStart()
}

export function dayNameShort(dateStr: string): string {
  return DAYS[parseDate(dateStr).getDay()].slice(0, 3).toUpperCase()
}

export function dayNumber(dateStr: string): number {
  return parseDate(dateStr).getDate()
}

export function fullDayTitle(dateStr: string): string {
  const d = parseDate(dateStr)
  const name = DAYS[d.getDay()]
  return `${name[0].toUpperCase()}${name.slice(1)}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

export function weekRangeLabel(weekStart: string): string {
  const weekEnd = addDays(weekStart, 6)
  const s = parseDate(weekStart)
  const e = parseDate(weekEnd)
  return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0,3)} – ${e.getDate()} ${MONTHS[e.getMonth()].slice(0,3)}`
}
