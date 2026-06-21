import jsPDF from 'jspdf'
import type { WeeklyMenu, MenuDay, Dish } from '../types'
import { getDishIdsFromDay } from '../types'
import { weekRangeLabel, fullDayTitle } from './dateUtils'

function getDishNames(day: MenuDay, dishMap: Map<string, Dish>): { lunch: string; dinner: string } {
  const lunchIds: (string | undefined)[] = []
  const dinnerIds: (string | undefined)[] = []

  if (day.hasLunch) {
    if (day.lunchMode === 'primeroYSegundo') {
      lunchIds.push(day.firstLunchDishId, day.secondLunchDishId)
    } else {
      lunchIds.push(day.singleLunchDishId)
    }
  }
  if (day.hasDinner) {
    if (day.dinnerMode === 'primeroYSegundo') {
      dinnerIds.push(day.firstDinnerDishId, day.secondDinnerDishId)
    } else {
      dinnerIds.push(day.singleDinnerDishId)
    }
  }

  const names = (ids: (string | undefined)[]) =>
    ids.filter(Boolean).map(id => dishMap.get(id!)?.name ?? '').filter(Boolean).join('\n') || '—'

  return { lunch: names(lunchIds), dinner: names(dinnerIds) }
}

export async function exportAndSharePDF(
  menu: WeeklyMenu,
  days: MenuDay[],
  dishMap: Map<string, Dish>
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))

  const margin = 14
  const pageW  = 210
  const colDay  = 28
  const colMeal = (pageW - 2 * margin - colDay) / 2
  const rowH    = 20
  const headerH = 10

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(`Menú Semanal: ${weekRangeLabel(menu.weekStartDate)}`, margin, margin + 6)

  let y = margin + 14

  // Table header
  doc.setFillColor(59, 130, 246)
  doc.rect(margin, y, pageW - 2 * margin, headerH, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text('Día',    margin + 2,             y + 7)
  doc.text('Comida', margin + colDay + 2,    y + 7)
  doc.text('Cena',   margin + colDay + colMeal + 2, y + 7)
  y += headerH

  doc.setTextColor(30, 30, 30)

  sorted.forEach((day, i) => {
    const { lunch, dinner } = getDishNames(day, dishMap)
    const lunchLines  = lunch.split('\n')
    const dinnerLines = dinner.split('\n')
    const lines = Math.max(lunchLines.length, dinnerLines.length, 1)
    const height = Math.max(rowH, lines * 5 + 6)

    // Alternating background
    if (i % 2 === 1) {
      doc.setFillColor(245, 247, 250)
      doc.rect(margin, y, pageW - 2 * margin, height, 'F')
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(fullDayTitle(day.date).split(',')[0], margin + 2, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(lunch,  margin + colDay + 2,            y + 6, { maxWidth: colMeal - 4 })
    doc.text(dinner, margin + colDay + colMeal + 2,  y + 6, { maxWidth: colMeal - 4 })

    // Row border + column dividers
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.rect(margin, y, pageW - 2 * margin, height)
    doc.line(margin + colDay,           y, margin + colDay,           y + height)
    doc.line(margin + colDay + colMeal, y, margin + colDay + colMeal, y + height)

    y += height
  })

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text('Generado con Menús Semanales', margin, y + 8)

  const blob = doc.output('blob')
  const file = new File([blob], `menu_${menu.weekStartDate}.pdf`, { type: 'application/pdf' })

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: 'Menú Semanal', files: [file] })
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
}
