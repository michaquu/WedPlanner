import type { Item, PlannerData } from '../types'

export interface DashboardItem extends Item {
  sectionTitle: string
}

export interface DashboardSection {
  id: string
  title: string
  cost: number
  paidCost: number
  completed: number
  total: number
}

export interface DashboardMetrics {
  items: DashboardItem[]
  completedItems: number
  totalCost: number
  paidCost: number
  remainingCost: number
  pricedItems: number
  completion: number
  overdueItems: number
  upcomingItems: DashboardItem[]
  sections: DashboardSection[]
  maxSectionCost: number
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/[\u00a0\u202f]/g, ' ')

const getLocalDate = () => new Intl.DateTimeFormat('sv-SE').format(new Date())

export const getDashboardMetrics = (data: PlannerData): DashboardMetrics => {
  const items = data.sections.flatMap((section) =>
    section.items.map((item) => ({ ...item, sectionTitle: section.title })),
  )
  const completedItems = items.filter((item) => item.checked).length
  const totalCost = items.reduce((sum, item) => sum + (item.cost ?? 0), 0)
  const paidCost = items.reduce(
    (sum, item) => sum + (item.costPaid ? (item.cost ?? 0) : 0),
    0,
  )
  const today = getLocalDate()
  const sections = data.sections
    .map((section) => ({
      id: section.id,
      title: section.title,
      cost: section.items.reduce((sum, item) => sum + (item.cost ?? 0), 0),
      paidCost: section.items.reduce(
        (sum, item) => sum + (item.costPaid ? (item.cost ?? 0) : 0),
        0,
      ),
      completed: section.items.filter((item) => item.checked).length,
      total: section.items.length,
    }))
    .sort((left, right) => right.cost - left.cost)

  return {
    items,
    completedItems,
    totalCost,
    paidCost,
    remainingCost: totalCost - paidCost,
    pricedItems: items.filter((item) => item.cost !== undefined).length,
    completion: items.length ? Math.round((completedItems / items.length) * 100) : 0,
    overdueItems: items.filter((item) => item.dueDate && item.dueDate < today && !item.checked)
      .length,
    upcomingItems: items
      .filter((item) => item.dueDate && item.dueDate >= today && !item.checked)
      .sort((left, right) => (left.dueDate ?? '').localeCompare(right.dueDate ?? ''))
      .slice(0, 6),
    sections,
    maxSectionCost: Math.max(...sections.map((section) => section.cost), 1),
  }
}

const escapeCsv = (value: string | number | boolean | undefined) => {
  const text = String(value ?? '')
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safeText.replaceAll('"', '""')}"`
}

const formatReportDate = (value?: string) => {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return year && month && day ? `'${day}.${month}.${year}` : value
}

export const createPlannerReportCsv = (data: PlannerData) => {
  const rows = data.sections.flatMap((section) =>
    section.items.map((item) => [
      section.title,
      item.title,
      item.status,
      item.checked ? 'Tak' : 'Nie',
      item.favorite ? 'Tak' : 'Nie',
      formatReportDate(item.dueDate),
      item.cost,
      item.costPaid ? 'Tak' : 'Nie',
      item.notes.length,
    ]),
  )
  const header = [
    'Sekcja',
    'Zadanie',
    'Status',
    'Ukonczone',
    'Polubione',
    'Termin',
    'Koszt PLN',
    'Koszt opłacony',
    'Liczba notatek',
  ]
  return [header, ...rows]
    .map((row) => row.map((value) => escapeCsv(value)).join(';'))
    .join('\r\n')
}

export const downloadPlannerReport = (data: PlannerData) => {
  const csv = createPlannerReportCsv(data)
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `raport-planera-${getLocalDate()}.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
