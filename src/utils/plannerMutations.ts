import type { Item, Note, PlannerData, Section } from '../types'

type ItemUpdater = (item: Item) => Partial<Item>

export const createPlannerItem = (id: string, title: string): Item => ({
  id,
  title: title.trim(),
  checked: false,
  favorite: false,
  status: 'Do zrobienia',
  dueDate: '',
  costPaid: false,
  notes: [],
})

export const synchronizeItemCompletion = (
  changes: Partial<Item>,
): Partial<Item> => {
  if (changes.checked !== undefined) {
    return {
      ...changes,
      status: changes.checked ? 'Zrobione' : 'Do zrobienia',
    }
  }
  if (changes.status !== undefined) {
    return {
      ...changes,
      checked: changes.status === 'Zrobione',
    }
  }
  return changes
}

export const updatePlannerItem = (
  data: PlannerData,
  sectionId: string,
  itemId: string,
  updater: ItemUpdater,
): PlannerData => {
  let dataChanged = false
  const sections = data.sections.map((section) => {
    if (section.id !== sectionId) return section
    let sectionChanged = false
    const items = section.items.map((item) => {
      if (item.id !== itemId) return item
      sectionChanged = true
      dataChanged = true
      return { ...item, ...updater(item) }
    })
    return sectionChanged ? { ...section, items } : section
  })

  return dataChanged ? { ...data, sections } : data
}

export const appendPlannerItem = (
  data: PlannerData,
  sectionId: string,
  item: Item,
): PlannerData => {
  const section = data.sections.find((entry) => entry.id === sectionId)
  if (!section) return data

  return {
    ...data,
    sections: data.sections.map((entry) =>
      entry.id === sectionId ? { ...entry, items: [...entry.items, item] } : entry,
    ),
  }
}

export const appendPlannerSection = (data: PlannerData, section: Section): PlannerData => ({
  ...data,
  sections: [...data.sections, section],
})

export const removePlannerItem = (
  data: PlannerData,
  sectionId: string,
  itemId: string,
): PlannerData => {
  const section = data.sections.find((entry) => entry.id === sectionId)
  if (!section?.items.some((item) => item.id === itemId)) return data

  return {
    ...data,
    sections: data.sections.map((entry) =>
      entry.id === sectionId
        ? { ...entry, items: entry.items.filter((item) => item.id !== itemId) }
        : entry,
    ),
  }
}

export const removePlannerSection = (data: PlannerData, sectionId: string): PlannerData => {
  if (!data.sections.some((section) => section.id === sectionId)) return data
  return {
    ...data,
    sections: data.sections.filter((section) => section.id !== sectionId),
  }
}

export const prependItemNote = (item: Item, note: Note): Partial<Item> => ({
  notes: [note, ...item.notes],
})

export const removeItemNote = (item: Item, noteId: string): Partial<Item> => ({
  notes: item.notes.filter((note) => note.id !== noteId),
})
