import { useState, type Dispatch, type SetStateAction } from 'react'
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { PlannerData, Section } from '../types'
import { moveItemBetweenSections, moveItemInOrder, type ItemMove } from '../utils/plannerDnd'

type DragType = 'section' | 'item'

const isDragType = (value: unknown): value is DragType => value === 'section' || value === 'item'

interface UsePlannerDndOptions {
  data: PlannerData
  orderedSections: Section[]
  sectionOrder: string[]
  setData: Dispatch<SetStateAction<PlannerData>>
  setSectionOrder: Dispatch<SetStateAction<string[]>>
  setItemOrder: Dispatch<SetStateAction<Record<string, string[]>>>
}

export const usePlannerDnd = ({
  data,
  orderedSections,
  sectionOrder,
  setData,
  setSectionOrder,
  setItemOrder,
}: UsePlannerDndOptions) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<DragType | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  )

  const clearActive = () => {
    setActiveId(null)
    setActiveType(null)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type
    setActiveType(isDragType(type) ? type : null)
    setActiveId(String(event.active.id))
  }

  const moveSection = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const order = sectionOrder.length
      ? sectionOrder
      : data.sections.map((section) => section.id)
    const oldIndex = order.indexOf(String(active.id))
    const newIndex = order.indexOf(String(over.id))
    if (oldIndex >= 0 && newIndex >= 0) setSectionOrder(arrayMove(order, oldIndex, newIndex))
  }

  const moveItem = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    const sourceSectionId = active.data.current?.sectionId
    if (typeof sourceSectionId !== 'string') return
    const overType = over.data.current?.type
    let targetSectionId = sourceSectionId
    let targetIndex = -1

    if (overType === 'item') {
      const targetSection = orderedSections.find((section) =>
        section.items.some((item) => item.id === overId),
      )
      targetSectionId = targetSection?.id ?? sourceSectionId
      targetIndex = targetSection?.items.findIndex((item) => item.id === overId) ?? -1
    } else if (overType === 'section-drop') {
      const sectionId = over.data.current?.sectionId
      if (typeof sectionId === 'string') targetSectionId = sectionId
    }

    const sourceSection = orderedSections.find((section) => section.id === sourceSectionId)
    if (!sourceSection?.items.some((item) => item.id === activeId)) return

    const move: ItemMove = {
      itemId: activeId,
      sourceSectionId,
      targetSectionId,
      targetIndex,
    }
    setItemOrder((current) => moveItemInOrder(current, orderedSections, move))
    if (sourceSectionId !== targetSectionId) {
      setData((current) => moveItemBetweenSections(current, move))
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const type = event.active.data.current?.type
    clearActive()
    if (type === 'section') moveSection(event)
    if (type === 'item') moveItem(event)
  }

  return {
    sensors,
    activeId,
    activeType,
    handleDragStart,
    handleDragEnd,
    handleDragCancel: clearActive,
  }
}
