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

type DragType = 'section' | 'item'

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
    setActiveType((event.active.data.current?.type as DragType | undefined) ?? null)
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
    const sourceSectionId = active.data.current?.sectionId as string
    const overType = over.data.current?.type
    let targetSectionId = sourceSectionId
    let targetIndex = -1

    if (overType === 'item') {
      const targetSection = orderedSections.find((section) =>
        section.items.some((item) => item.id === over.id),
      )
      targetSectionId = targetSection?.id ?? sourceSectionId
      targetIndex = targetSection?.items.findIndex((item) => item.id === over.id) ?? -1
    } else if (overType === 'section-drop') {
      targetSectionId = over.data.current?.sectionId as string
    }

    const sourceSection = orderedSections.find((section) => section.id === sourceSectionId)
    const sourceItems = sourceSection?.items ?? []
    const sourceIndex = sourceItems.findIndex((item) => item.id === active.id)
    if (sourceIndex < 0) return

    if (sourceSectionId === targetSectionId) {
      if (targetIndex >= 0) {
        setItemOrder((current) => ({
          ...current,
          [sourceSectionId]: arrayMove(
            sourceItems.map((item) => item.id),
            sourceIndex,
            targetIndex,
          ),
        }))
      }
      return
    }

    setData((current) => {
      const sections = current.sections.map((section) => ({
        ...section,
        items: [...section.items],
      }))
      const source = sections.find((section) => section.id === sourceSectionId)
      const target = sections.find((section) => section.id === targetSectionId)
      if (!source || !target) return current
      const currentSourceIndex = source.items.findIndex((item) => item.id === active.id)
      if (currentSourceIndex < 0) return current
      const [moved] = source.items.splice(currentSourceIndex, 1)
      target.items.splice(targetIndex >= 0 ? targetIndex : target.items.length, 0, moved)
      return { sections }
    })

    setItemOrder((current) => {
      const sourceOrder = (current[sourceSectionId] ?? sourceItems.map((item) => item.id)).filter(
        (id) => id !== active.id,
      )
      const targetItems =
        orderedSections.find((section) => section.id === targetSectionId)?.items ?? []
      const targetOrder = [...(current[targetSectionId] ?? targetItems.map((item) => item.id))]
      targetOrder.splice(targetIndex >= 0 ? targetIndex : targetOrder.length, 0, String(active.id))
      return { ...current, [sourceSectionId]: sourceOrder, [targetSectionId]: targetOrder }
    })
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

