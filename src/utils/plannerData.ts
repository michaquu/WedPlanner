import { createSeedData } from '../data/seed'
import type { Item, PlannerData, Section } from '../types'

export type PlannerSort = 'manual' | 'dueDateAsc' | 'costAsc' | 'costDesc'

export interface PlannerSummary {
  totalTasks: number
  doneTasks: number
  totalCost: number
  paidCost: number
  remainingCost: number
}

export interface PlannerItemWithSection {
  item: Item
  sectionId: string
  sectionTitle: string
}

export const normalizePlannerData = (input?: PlannerData): PlannerData => {
  const source = input ?? createSeedData()
  return {
    sections: (Array.isArray(source.sections) ? source.sections : []).map((section) => ({
      ...section,
      items: (Array.isArray(section.items) ? section.items : []).map((item) => {
        const checked = item.checked ?? item.status === 'Zrobione'
        const status = checked
          ? 'Zrobione'
          : item.status === 'W trakcie'
            ? 'W trakcie'
            : 'Do zrobienia'
        return {
          ...item,
          checked,
          favorite: item.favorite ?? false,
          status,
          cost: item.cost ?? undefined,
          costPaid: item.costPaid ?? false,
          notes: Array.isArray(item.notes) ? item.notes : [],
        }
      }),
    })),
  }
}

export const orderByIds = <T extends { id: string }>(items: T[], order: string[]) => {
  if (!order.length) return items
  const positions = new Map<string, number>()
  order.forEach((id, index) => {
    if (!positions.has(id)) positions.set(id, index)
  })
  return [...items].sort((left, right) => {
    const leftPosition = positions.get(left.id) ?? Number.MAX_SAFE_INTEGER
    const rightPosition = positions.get(right.id) ?? Number.MAX_SAFE_INTEGER
    return leftPosition - rightPosition
  })
}

export const reconcileOrder = (ids: string[], order: string[]) => {
  const availableIds = new Set(ids)
  const includedIds = new Set<string>()
  const validOrder = order.filter((id) => {
    if (!availableIds.has(id) || includedIds.has(id)) return false
    includedIds.add(id)
    return true
  })
  ids.forEach((id) => {
    if (!includedIds.has(id)) {
      validOrder.push(id)
      includedIds.add(id)
    }
  })
  return validOrder
}

export const getEffectiveSectionOrder = (sections: Section[], order: string[]) => {
  const ids = sections.map((section) => section.id)
  return reconcileOrder(ids, order)
}

export const getEffectiveItemOrder = (
  sections: Section[],
  itemOrder: Record<string, string[]>,
) =>
  Object.fromEntries(
    sections.map((section) => {
      const ids = section.items.map((item) => item.id)
      const current = itemOrder[section.id] ?? []
      return [section.id, reconcileOrder(ids, current)]
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

export const findPlannerItem = (sections: Section[], itemId: string | null) => {
  if (!itemId) return null
  for (const section of sections) {
    const item = section.items.find((entry) => entry.id === itemId)
    if (item) return { item, sectionId: section.id }
  }
  return null
}

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
        if (item.costPaid) summary.paidCost += item.cost ?? 0
      })
      summary.remainingCost = summary.totalCost - summary.paidCost
      return summary
    },
    { totalTasks: 0, doneTasks: 0, totalCost: 0, paidCost: 0, remainingCost: 0 },
  )
