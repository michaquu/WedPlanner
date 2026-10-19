import { arrayMove } from '@dnd-kit/sortable'
import type { PlannerData, Section } from '../types'
import { reconcileOrder } from './plannerData'

export interface ItemMove {
  itemId: string
  sourceSectionId: string
  targetSectionId: string
  targetIndex: number
}

const clampInsertionIndex = (index: number, length: number) =>
  index < 0 ? length : Math.min(index, length)

export const moveItemBetweenSections = (
  data: PlannerData,
  move: ItemMove,
): PlannerData => {
  if (move.sourceSectionId === move.targetSectionId) return data

  const source = data.sections.find((section) => section.id === move.sourceSectionId)
  const target = data.sections.find((section) => section.id === move.targetSectionId)
  const movedItem = source?.items.find((item) => item.id === move.itemId)
  if (!source || !target || !movedItem) return data

  const targetItems = target.items.filter((item) => item.id !== move.itemId)
  targetItems.splice(clampInsertionIndex(move.targetIndex, targetItems.length), 0, movedItem)

  return {
    ...data,
    sections: data.sections.map((section) => {
      if (section.id === source.id) {
        return { ...section, items: section.items.filter((item) => item.id !== move.itemId) }
      }
      if (section.id === target.id) return { ...section, items: targetItems }
      return section
    }),
  }
}

export const moveItemInOrder = (
  itemOrder: Record<string, string[]>,
  sections: Section[],
  move: ItemMove,
): Record<string, string[]> => {
  const source = sections.find((section) => section.id === move.sourceSectionId)
  const target = sections.find((section) => section.id === move.targetSectionId)
  if (!source || !target || !source.items.some((item) => item.id === move.itemId)) {
    return itemOrder
  }

  const sourceOrder = reconcileOrder(
    source.items.map((item) => item.id),
    itemOrder[source.id] ?? [],
  )

  if (source.id === target.id) {
    const sourceIndex = sourceOrder.indexOf(move.itemId)
    if (sourceIndex < 0 || move.targetIndex < 0) {
      return itemOrder
    }
    const targetIndex = Math.min(move.targetIndex, sourceOrder.length - 1)
    if (sourceIndex === targetIndex) return itemOrder
    return {
      ...itemOrder,
      [source.id]: arrayMove(sourceOrder, sourceIndex, targetIndex),
    }
  }

  const nextSourceOrder = sourceOrder.filter((id) => id !== move.itemId)
  const targetOrder = reconcileOrder(
    target.items.map((item) => item.id),
    itemOrder[target.id] ?? [],
  ).filter((id) => id !== move.itemId)
  targetOrder.splice(clampInsertionIndex(move.targetIndex, targetOrder.length), 0, move.itemId)

  return {
    ...itemOrder,
    [source.id]: nextSourceOrder,
    [target.id]: targetOrder,
  }
}
