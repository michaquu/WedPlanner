import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createItem, createPlannerData, createSection } from '../test/fixtures'
import { getDueReminders, getNextReminderTime } from './notifications'

describe('deadline notifications', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 6, 11, 0))
  })

  afterEach(() => vi.useRealTimers())

  it('returns reminders only 7 and 2 days before a deadline after 11:00', () => {
    const data = createPlannerData([
      createSection({
        items: [
          createItem({ id: 'week', title: 'Week', dueDate: '2026-08-13' }),
          createItem({ id: 'two-days', title: 'Two days', dueDate: '2026-08-08' }),
          createItem({ id: 'later', title: 'Later', dueDate: '2026-08-20' }),
          createItem({ id: 'done', title: 'Done', dueDate: '2026-08-13', checked: true }),
        ],
      }),
    ])

    expect(getDueReminders(data, 'project').map((reminder) => reminder.itemId)).toEqual([
      'week',
      'two-days',
    ])
    expect(getDueReminders(data, 'project', new Date(2026, 7, 6, 10, 59))).toEqual([])
  })

  it('finds the nearest future reminder time', () => {
    const data = createPlannerData([
      createSection({ items: [createItem({ dueDate: '2026-08-14' })] }),
    ])

    expect(getNextReminderTime(data, 'project')?.getTime()).toBe(
      new Date(2026, 7, 7, 11, 0).getTime(),
    )
  })
})
