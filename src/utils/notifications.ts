import type { PlannerData } from '../types'

export const REMINDER_DAYS = [7, 2] as const
export const REMINDER_HOUR = 11

export interface DeadlineReminder {
  id: string
  itemId: string
  title: string
  sectionTitle: string
  dueDate: string
  daysBefore: (typeof REMINDER_DAYS)[number]
  triggerAt: Date
}

const getReminderDate = (dueDate: string, daysBefore: number) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null
  const year = Number(dueDate.slice(0, 4))
  const month = Number(dueDate.slice(5, 7))
  const day = Number(dueDate.slice(8, 10))
  const triggerAt = new Date(year, month - 1, day, REMINDER_HOUR, 0, 0, 0)
  if (
    triggerAt.getFullYear() !== year ||
    triggerAt.getMonth() !== month - 1 ||
    triggerAt.getDate() !== day
  ) {
    return null
  }
  triggerAt.setDate(triggerAt.getDate() - daysBefore)
  return triggerAt
}

const getAllReminders = (data: PlannerData, projectId: string): DeadlineReminder[] =>
  data.sections.flatMap((section) =>
    section.items.flatMap((item) => {
      const dueDate = item.dueDate
      if (!dueDate || item.checked) return []
      return REMINDER_DAYS.flatMap((daysBefore) => {
        const triggerAt = getReminderDate(dueDate, daysBefore)
        if (!triggerAt) return []
        return [
          {
            id: `${projectId}:${item.id}:${dueDate}:${daysBefore}`,
            itemId: item.id,
            title: item.title,
            sectionTitle: section.title,
            dueDate,
            daysBefore,
            triggerAt,
          },
        ]
      })
    }),
  )

export const getDueReminders = (data: PlannerData, projectId: string, now = new Date()) => {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return getAllReminders(data, projectId).filter(
    (reminder) =>
      reminder.triggerAt >= startOfDay &&
      reminder.triggerAt < endOfDay &&
      reminder.triggerAt <= now,
  )
}

export const getNextReminderTime = (
  data: PlannerData,
  projectId: string,
  now = new Date(),
) =>
  getAllReminders(data, projectId)
    .map((reminder) => reminder.triggerAt)
    .filter((triggerAt) => triggerAt > now)
    .sort((left, right) => left.getTime() - right.getTime())[0]
