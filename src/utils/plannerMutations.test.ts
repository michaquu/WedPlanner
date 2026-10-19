import { describe, expect, it } from 'vitest'
import { createItem, createPlannerData, createSection } from '../test/fixtures'
import {
  appendPlannerItem,
  appendPlannerSection,
  createPlannerItem,
  removePlannerItem,
  removePlannerSection,
  synchronizeItemCompletion,
  updatePlannerItem,
} from './plannerMutations'

describe('planner mutations', () => {
  it('creates a trimmed item with complete defaults', () => {
    expect(createPlannerItem('new-id', '  New task  ')).toEqual({
      id: 'new-id',
      title: 'New task',
      checked: false,
      favorite: false,
      status: 'Do zrobienia',
      dueDate: '',
      costPaid: false,
      notes: [],
    })
  })

  it('keeps status and completion synchronized', () => {
    expect(synchronizeItemCompletion({ checked: true, status: 'W trakcie' })).toMatchObject({
      checked: true,
      status: 'Zrobione',
    })
    expect(synchronizeItemCompletion({ status: 'W trakcie' })).toMatchObject({
      checked: false,
      status: 'W trakcie',
    })
  })

  it('updates only the requested item without mutating the input', () => {
    const firstSection = createSection({
      id: 'first-section',
      items: [createItem({ id: 'first-item' })],
    })
    const secondSection = createSection({
      id: 'second-section',
      items: [createItem({ id: 'second-item' })],
    })
    const data = createPlannerData([firstSection, secondSection])

    const updated = updatePlannerItem(data, 'first-section', 'first-item', () => ({
      title: 'Updated',
    }))

    expect(updated).not.toBe(data)
    expect(updated.sections[0]?.items[0]?.title).toBe('Updated')
    expect(updated.sections[1]).toBe(secondSection)
    expect(data.sections[0]?.items[0]?.title).toBe('Book photographer')
  })

  it('returns the original data when the target does not exist', () => {
    const data = createPlannerData()
    const item = createPlannerItem('new-id', 'New')

    expect(updatePlannerItem(data, 'missing', 'item-1', () => ({ title: 'Changed' }))).toBe(
      data,
    )
    expect(appendPlannerItem(data, 'missing', item)).toBe(data)
    expect(removePlannerItem(data, 'section-1', 'missing')).toBe(data)
    expect(removePlannerSection(data, 'missing')).toBe(data)
  })

  it('adds and removes items and sections immutably', () => {
    const data = createPlannerData()
    const added = appendPlannerItem(data, 'section-1', createPlannerItem('new-id', 'New'))
    const withoutItem = removePlannerItem(added, 'section-1', 'item-1')
    const withSection = appendPlannerSection(
      withoutItem,
      createSection({ id: 'new-section', items: [] }),
    )
    const withoutSection = removePlannerSection(withSection, 'section-1')

    expect(added.sections[0]?.items.map((item) => item.id)).toEqual(['item-1', 'new-id'])
    expect(withoutItem.sections[0]?.items.map((item) => item.id)).toEqual(['new-id'])
    expect(withoutSection.sections.map((section) => section.id)).toEqual(['new-section'])
    expect(data.sections[0]?.items.map((item) => item.id)).toEqual(['item-1'])
  })
})
