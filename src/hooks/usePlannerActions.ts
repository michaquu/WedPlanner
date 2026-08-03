import type { Dispatch, SetStateAction } from 'react'
import { v4 as uuid } from 'uuid'
import type { Item, Note, PlannerData } from '../types'

type ItemUpdater = (item: Item) => Partial<Item>

export const usePlannerActions = (setData: Dispatch<SetStateAction<PlannerData>>) => {
  const mutateItem = (sectionId: string, itemId: string, updater: ItemUpdater) => {
    setData((current) => ({
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, ...updater(item) } : item,
              ),
            }
          : section,
      ),
    }))
  }

  const updateItem = (sectionId: string, itemId: string, changes: Partial<Item>) =>
    mutateItem(sectionId, itemId, () => changes)

  const toggleItem = (sectionId: string, itemId: string) =>
    mutateItem(sectionId, itemId, (item) => ({ checked: !item.checked }))

  const toggleFavorite = (sectionId: string, itemId: string) =>
    mutateItem(sectionId, itemId, (item) => ({ favorite: !item.favorite }))

  const addNote = (sectionId: string, itemId: string, note: Note) =>
    mutateItem(sectionId, itemId, (item) => ({ notes: [note, ...item.notes] }))

  const removeNote = (sectionId: string, itemId: string, noteId: string) =>
    mutateItem(sectionId, itemId, (item) => ({
      notes: item.notes.filter((note) => note.id !== noteId),
    }))

  const addItem = (sectionId: string, title: string) => {
    const value = title.trim()
    if (!value) return
    setData((current) => ({
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...section.items,
                {
                  id: uuid(),
                  title: value,
                  checked: false,
                  favorite: false,
                  status: 'Do zrobienia',
                  dueDate: '',
                  notes: [],
                },
              ],
            }
          : section,
      ),
    }))
  }

  const deleteItem = (sectionId: string, itemId: string) => {
    setData((current) => ({
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
          : section,
      ),
    }))
  }

  const deleteSection = (sectionId: string) => {
    setData((current) => ({
      sections: current.sections.filter((section) => section.id !== sectionId),
    }))
  }

  return {
    updateItem,
    toggleItem,
    toggleFavorite,
    addNote,
    removeNote,
    addItem,
    deleteItem,
    deleteSection,
  }
}

