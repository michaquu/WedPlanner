import type { Item, PlannerData, Section } from '../types'

export const createItem = (overrides: Partial<Item> = {}): Item => ({
  id: 'item-1',
  title: 'Book photographer',
  checked: false,
  favorite: false,
  status: 'Do zrobienia',
  dueDate: '',
  costPaid: false,
  notes: [],
  ...overrides,
})

export const createSection = (overrides: Partial<Section> = {}): Section => ({
  id: 'section-1',
  title: 'Photography',
  items: [createItem()],
  ...overrides,
})

export const createPlannerData = (sections: Section[] = [createSection()]): PlannerData => ({
  sections,
})
