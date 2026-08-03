import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createItem, createPlannerData, createSection } from '../test/fixtures'
import { createPlannerReportCsv, getDashboardMetrics } from './dashboard'

describe('dashboard utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-03T12:00:00+02:00'))
  })

  afterEach(() => vi.useRealTimers())

  it('calculates costs, completion, overdue tasks, and upcoming deadlines', () => {
    const data = createPlannerData([
      createSection({
        id: 'first',
        items: [
          createItem({ id: 'done', checked: true, cost: 1000, dueDate: '2026-08-01' }),
          createItem({ id: 'overdue', cost: 500, dueDate: '2026-08-02' }),
          createItem({ id: 'upcoming', dueDate: '2026-08-04' }),
        ],
      }),
    ])

    const metrics = getDashboardMetrics(data)

    expect(metrics.totalCost).toBe(1500)
    expect(metrics.completedItems).toBe(1)
    expect(metrics.completion).toBe(33)
    expect(metrics.overdueItems).toBe(1)
    expect(metrics.upcomingItems.map((item) => item.id)).toEqual(['upcoming'])
    expect(metrics.maxSectionCost).toBe(1500)
  })

  it('creates an Excel-friendly report and protects formula-like values', () => {
    const data = createPlannerData([
      createSection({
        title: '=Unsafe section',
        items: [
          createItem({
            title: '+Unsafe task',
            favorite: true,
            dueDate: '2026-08-03',
            cost: 5900,
          }),
        ],
      }),
    ])

    const csv = createPlannerReportCsv(data)

    expect(csv).toContain('"\'=Unsafe section"')
    expect(csv).toContain('"\'+Unsafe task"')
    expect(csv).toContain('"\'03.08.2026"')
    expect(csv).toContain('"5900"')
  })
})

