import { createSeedData } from '../data/seed'
import type { Item, PlannerData, Section } from '../types'

export type PlannerSort = 'manual' | 'dueDateAsc' | 'costAsc' | 'costDesc'

export interface PlannerSummary {
  totalTasks: number
  doneTasks: number
  totalCost: number
}

export interface PlannerItemWithSection {
  item: Item
  sectionId: string
  sectionTitle: string
}

export const normalizePlannerData = (input?: PlannerData): PlannerData => {
  const source = input ?? createSeedData()
  return {
    sections: (source.sections ?? []).map((section) => ({
      ...section,
      items: (section.items ?? []).map((item) => ({
        ...item,
        favorite: item.favorite ?? false,
        cost: item.cost ?? undefined,
        notes: item.notes ?? [],
      })),
    })),
  }
}

export const orderByIds = <T extends { id: string }>(items: T[], order: string[]) => {
  if (!order.length) return items
  const positions = new Map(order.map((id, index) => [id, index]))
  return [...items].sort((left, right) => {
    const leftPosition = positions.get(left.id) ?? Number.MAX_SAFE_INTEGER
    const rightPosition = positions.get(right.id) ?? Number.MAX_SAFE_INTEGER
    return leftPosition - rightPosition
  })
}

export const getEffectiveSectionOrder = (sections: Section[], order: string[]) => {
  const ids = sections.map((section) => section.id)
  return [...order.filter((id) => ids.includes(id)), ...ids.filter((id) => !order.includes(id))]
}

export const getEffectiveItemOrder = (
  sections: Section[],
  itemOrder: Record<string, string[]>,
) =>
  Object.fromEntries(
    sections.map((section) => {
      const ids = section.items.map((item) => item.id)
      const current = itemOrder[section.id] ?? []
      return [
        section.id,
        [...current.filter((id) => ids.includes(id)), ...ids.filter((id) => !current.includes(id))],
      ]
    }),
  )

export const orderSectionsWithItems = (
  sections: Section[],
  sectionOrder: string[],
  itemOrder: Record<string, string[]>,
) =>
  orderByIds(sections, sectionOrder).map((section) => ({
    ...section,
    items: orderByIds(section.items, itemOrder[section.id] ?? []),
  }))

const compareOptionalValues = <T>(
  left: T | undefined,
  right: T | undefined,
  compare: (leftValue: T, rightValue: T) => number,
) => {
  if (left === undefined && right === undefined) return 0
  if (left === undefined) return 1
  if (right === undefined) return -1
  return compare(left, right)
}

const compareItems = (left: Item, right: Item, sort: Exclude<PlannerSort, 'manual'>) => {
  if (sort === 'dueDateAsc') {
    const leftDueDate = left.dueDate?.trim() || undefined
    const rightDueDate = right.dueDate?.trim() || undefined
    return compareOptionalValues(leftDueDate, rightDueDate, (a, b) => a.localeCompare(b))
  }

  const direction = sort === 'costDesc' ? -1 : 1
  return compareOptionalValues(left.cost, right.cost, (a, b) => (a - b) * direction)
}

export const sortPlannerItems = (sections: Section[], sort: PlannerSort) => {
  const items = sections.flatMap<PlannerItemWithSection>((section) =>
    section.items.map((item) => ({
      item,
      sectionId: section.id,
      sectionTitle: section.title,
    })),
  )

  if (sort === 'manual') return items
  return items.sort((left, right) => compareItems(left.item, right.item, sort))
}

const normalizeSearchValue = (value: unknown) =>
  String(value ?? '')
    .toLocaleLowerCase('pl-PL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const itemMatchesQuery = (item: Item, query: string) =>
  [
    item.title,
    item.status,
    item.dueDate,
    item.cost,
    item.checked ? 'ukonczone zrobione' : 'nieukonczone do zrobienia',
    ...item.notes.flatMap((note) => [
      note.type,
      note.type === 'text' || note.type === 'link' ? note.content : undefined,
      note.fileName,
      note.mimeType,
    ]),
  ].some((value) => normalizeSearchValue(value).includes(query))

export const filterSections = (
  sections: Section[],
  hiddenSections: Record<string, boolean>,
  searchQuery: string,
  favoriteOnly: boolean,
) => {
  const query = normalizeSearchValue(searchQuery.trim())
  if (!query && !favoriteOnly) {
    return sections.filter((section) => !hiddenSections[section.id])
  }

  return sections.flatMap((section) => {
    const sectionMatches = normalizeSearchValue(section.title).includes(query)
    const items = section.items.filter((item) => {
      if (favoriteOnly && !item.favorite) return false
      return !query || sectionMatches || itemMatchesQuery(item, query)
    })
    return items.length ? [{ ...section, items }] : []
  })
}

export const getPlannerSummary = (data: PlannerData): PlannerSummary =>
  data.sections.reduce(
    (summary, section) => {
      section.items.forEach((item) => {
        summary.totalTasks += 1
        if (item.checked) summary.doneTasks += 1
        summary.totalCost += item.cost ?? 0
      })
      return summary
    },
    { totalTasks: 0, doneTasks: 0, totalCost: 0 },
  )
