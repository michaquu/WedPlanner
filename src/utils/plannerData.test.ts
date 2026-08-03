import { describe, expect, it } from 'vitest'
import type { PlannerData } from '../types'
import { createItem, createPlannerData, createSection } from '../test/fixtures'
import {
  filterSections,
  getEffectiveItemOrder,
  getEffectiveSectionOrder,
  getPlannerSummary,
  normalizePlannerData,
  orderByIds,
  orderSectionsWithItems,
} from './plannerData'

describe('planner data utilities', () => {
  it('normalizes data received from older projects', () => {
    const legacyData = {
      sections: [{ id: 'section', title: 'Legacy', items: [{ id: 'item', title: 'Task' }] }],
    } as unknown as PlannerData

    const normalized = normalizePlannerData(legacyData)

    expect(normalized.sections[0]?.items[0]).toMatchObject({
      favorite: false,
      notes: [],
    })
  })

  it('orders known IDs and keeps new entries at the end', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(orderByIds(items, ['c', 'a']).map((item) => item.id)).toEqual(['c', 'a', 'b'])
  })

  it('repairs incomplete section and item order preferences', () => {
    const sections = [
      createSection({ id: 'a', items: [createItem({ id: 'a1' }), createItem({ id: 'a2' })] }),
      createSection({ id: 'b', items: [createItem({ id: 'b1' })] }),
    ]

    expect(getEffectiveSectionOrder(sections, ['b', 'missing'])).toEqual(['b', 'a'])
    expect(getEffectiveItemOrder(sections, { a: ['a2', 'missing'] })).toEqual({
      a: ['a2', 'a1'],
      b: ['b1'],
    })
    expect(orderSectionsWithItems(sections, ['b', 'a'], { a: ['a2', 'a1'] })[1]?.items[0]?.id)
      .toBe('a2')
  })

  it('searches textual notes but ignores encoded image contents', () => {
    const data = createPlannerData([
      createSection({
        id: 'hidden',
        items: [
          createItem({
            notes: [
              {
                id: 'image',
                type: 'image',
                content: 'data:image/png;base64,SECRET_MATCH',
                createdAt: '2026-08-03T10:00:00.000Z',
                fileName: 'venue.png',
                mimeType: 'image/png',
              },
              {
                id: 'text',
                type: 'text',
                content: 'Call Anna tomorrow',
                createdAt: '2026-08-03T10:00:00.000Z',
              },
            ],
          }),
        ],
      }),
    ])

    expect(filterSections(data.sections, { hidden: true }, '', false)).toEqual([])
    expect(filterSections(data.sections, { hidden: true }, 'secret_match', false)).toEqual([])
    expect(filterSections(data.sections, { hidden: true }, 'venue.png', false)).toHaveLength(1)
    expect(filterSections(data.sections, { hidden: true }, 'anna', false)).toHaveLength(1)
  })

  it('combines favorite and text filters', () => {
    const sections = [
      createSection({
        items: [
          createItem({ id: 'favorite', title: 'Book venue', favorite: true }),
          createItem({ id: 'regular', title: 'Book photographer' }),
        ],
      }),
    ]

    expect(filterSections(sections, {}, '', true)[0]?.items.map((item) => item.id)).toEqual([
      'favorite',
    ])
    expect(filterSections(sections, {}, 'photographer', true)).toEqual([])
  })

  it('calculates task and cost totals, including zero-cost tasks', () => {
    const data = createPlannerData([
      createSection({
        items: [
          createItem({ id: 'done', checked: true, cost: 1200 }),
          createItem({ id: 'free', cost: 0 }),
          createItem({ id: 'unknown', cost: undefined }),
        ],
      }),
    ])

    expect(getPlannerSummary(data)).toEqual({ totalTasks: 3, doneTasks: 1, totalCost: 1200 })
  })
})

