import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react'
import { v4 as uuid } from 'uuid'
import type { Item, Note, PlannerData } from '../types'
import {
  appendPlannerItem,
  createPlannerItem,
  prependItemNote,
  removeItemNote,
  removePlannerItem,
  removePlannerSection,
  synchronizeItemCompletion,
  updatePlannerItem,
} from '../utils/plannerMutations'

export const usePlannerActions = (setData: Dispatch<SetStateAction<PlannerData>>) => {
  const mutateItem = useCallback(
    (sectionId: string, itemId: string, updater: (item: Item) => Partial<Item>) => {
      setData((current) => updatePlannerItem(current, sectionId, itemId, updater))
    },
    [setData],
  )

  const updateItem = useCallback(
    (sectionId: string, itemId: string, changes: Partial<Item>) =>
      mutateItem(sectionId, itemId, () => synchronizeItemCompletion(changes)),
    [mutateItem],
  )

  const toggleItem = useCallback(
    (sectionId: string, itemId: string) =>
      mutateItem(sectionId, itemId, (item) => {
        const checked = !item.checked
        return {
          checked,
          status: checked ? 'Zrobione' : 'Do zrobienia',
        }
      }),
    [mutateItem],
  )

  const toggleFavorite = useCallback(
    (sectionId: string, itemId: string) =>
      mutateItem(sectionId, itemId, (item) => ({ favorite: !item.favorite })),
    [mutateItem],
  )

  const addNote = useCallback(
    (sectionId: string, itemId: string, note: Note) =>
      mutateItem(sectionId, itemId, (item) => prependItemNote(item, note)),
    [mutateItem],
  )

  const removeNote = useCallback(
    (sectionId: string, itemId: string, noteId: string) =>
      mutateItem(sectionId, itemId, (item) => removeItemNote(item, noteId)),
    [mutateItem],
  )

  const addItem = useCallback(
    (sectionId: string, title: string) => {
      const value = title.trim()
      if (!value) return
      setData((current) =>
        appendPlannerItem(current, sectionId, createPlannerItem(uuid(), value)),
      )
    },
    [setData],
  )

  const deleteItem = useCallback(
    (sectionId: string, itemId: string) => {
      setData((current) => removePlannerItem(current, sectionId, itemId))
    },
    [setData],
  )

  const deleteSection = useCallback(
    (sectionId: string) => {
      setData((current) => removePlannerSection(current, sectionId))
    },
    [setData],
  )

  return useMemo(
    () => ({
      updateItem,
      toggleItem,
      toggleFavorite,
      addNote,
      removeNote,
      addItem,
      deleteItem,
      deleteSection,
    }),
    [
      addItem,
      addNote,
      deleteItem,
      deleteSection,
      removeNote,
      toggleFavorite,
      toggleItem,
      updateItem,
    ],
  )
}
