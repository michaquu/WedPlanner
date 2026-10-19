import { describe, expect, it } from 'vitest'
import { createItem, createPlannerData, createSection } from '../test/fixtures'
import { moveItemBetweenSections, moveItemInOrder, type ItemMove } from './plannerDnd'

const sections = [
  createSection({
    id: 'source',
    items: [createItem({ id: 'first' }), createItem({ id: 'moved' })],
  }),
  createSection({
    id: 'target',
    items: [createItem({ id: 'target-first' }), createItem({ id: 'target-last' })],
  }),
]

describe('planner drag-and-drop utilities', () => {
  it('reorders items inside a section without changing planner data', () => {
    const data = createPlannerData(sections)
    const move: ItemMove = {
      itemId: 'first',
      sourceSectionId: 'source',
      targetSectionId: 'source',
      targetIndex: 1,
    }

    expect(moveItemBetweenSections(data, move)).toBe(data)
    expect(moveItemInOrder({}, sections, move)).toEqual({ source: ['moved', 'first'] })
  })

  it('moves an item and its order between sections', () => {
    const data = createPlannerData(sections)
    const move: ItemMove = {
      itemId: 'moved',
      sourceSectionId: 'source',
      targetSectionId: 'target',
      targetIndex: 1,
    }

    const movedData = moveItemBetweenSections(data, move)
    const movedOrder = moveItemInOrder(
      { source: ['moved', 'first'], target: ['target-last', 'target-first'] },
      sections,
      move,
    )

    expect(movedData.sections[0]?.items.map((item) => item.id)).toEqual(['first'])
    expect(movedData.sections[1]?.items.map((item) => item.id)).toEqual([
      'target-first',
      'moved',
      'target-last',
    ])
    expect(movedOrder).toEqual({
      source: ['first'],
      target: ['target-last', 'moved', 'target-first'],
    })
    expect(data.sections[0]?.items.map((item) => item.id)).toEqual(['first', 'moved'])
  })

  it('appends an item when it is dropped on an empty section area', () => {
    const move: ItemMove = {
      itemId: 'moved',
      sourceSectionId: 'source',
      targetSectionId: 'target',
      targetIndex: -1,
    }

    expect(
      moveItemBetweenSections(createPlannerData(sections), move).sections[1]?.items.map(
        (item) => item.id,
      ),
    ).toEqual(['target-first', 'target-last', 'moved'])
    expect(moveItemInOrder({}, sections, move).target).toEqual([
      'target-first',
      'target-last',
      'moved',
    ])
  })

  it('returns the original values for an invalid move', () => {
    const data = createPlannerData(sections)
    const order = { source: ['first', 'moved'] }
    const move: ItemMove = {
      itemId: 'missing',
      sourceSectionId: 'source',
      targetSectionId: 'target',
      targetIndex: 0,
    }

    expect(moveItemBetweenSections(data, move)).toBe(data)
    expect(moveItemInOrder(order, sections, move)).toBe(order)
  })
})
