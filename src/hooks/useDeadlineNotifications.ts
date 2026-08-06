import { useCallback, useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../constants'
import type { PlannerData } from '../types'
import { getDueReminders, getNextReminderTime, type DeadlineReminder } from '../utils/notifications'
import { readStorage, writeStorage } from '../utils/storage'

export type DeadlineNotificationStatus = NotificationPermission | 'unsupported'

const pendingReminders = new Set<string>()

const getStatus = (): DeadlineNotificationStatus =>
  typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'unsupported'

const showReminder = async (reminder: DeadlineReminder) => {
  const title = `Termin za ${reminder.daysBefore} dni`
  const options: NotificationOptions = {
    body: `${reminder.title} · ${reminder.sectionTitle}`,
    icon: '/icons/pwa-192.png',
    badge: '/icons/pwa-192.png',
    tag: reminder.id,
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.showNotification(title, options)
      return
    }
  }
  new Notification(title, options)
}

export const useDeadlineNotifications = (data: PlannerData, projectId: string) => {
  const [status, setStatus] = useState<DeadlineNotificationStatus>(getStatus)
  const [scheduleVersion, setScheduleVersion] = useState(0)

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported' as const
    const permission = await Notification.requestPermission()
    setStatus(permission)
    return permission
  }, [])

  useEffect(() => {
    const refreshStatus = () => setStatus(getStatus())
    window.addEventListener('focus', refreshStatus)
    return () => window.removeEventListener('focus', refreshStatus)
  }, [])

  useEffect(() => {
    if (status !== 'granted' || !projectId) return

    const now = new Date()
    const delivered = readStorage<Record<string, string>>(
      STORAGE_KEYS.deliveredReminders,
      {},
    )
    const due = getDueReminders(data, projectId, now).filter(
      (reminder) => !delivered[reminder.id] && !pendingReminders.has(reminder.id),
    )

    due.forEach((reminder) => {
      pendingReminders.add(reminder.id)
      showReminder(reminder)
        .then(() => {
          delivered[reminder.id] = new Date().toISOString()
          const recentEntries = Object.entries(delivered).slice(-200)
          writeStorage(STORAGE_KEYS.deliveredReminders, Object.fromEntries(recentEntries))
        })
        .catch(() => undefined)
        .finally(() => pendingReminders.delete(reminder.id))
    })

    const nextReminder = getNextReminderTime(data, projectId, now)
    if (!nextReminder) return
    const delay = Math.min(nextReminder.getTime() - now.getTime(), 2_147_000_000)
    const timeout = window.setTimeout(() => setScheduleVersion((value) => value + 1), delay)
    return () => window.clearTimeout(timeout)
  }, [data, projectId, scheduleVersion, status])

  return { status, requestPermission }
}
