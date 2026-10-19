import { useCallback, useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../constants'
import type { PlannerData } from '../types'
import { getDueReminders, getNextReminderTime, type DeadlineReminder } from '../utils/notifications'
import { readStorage, writeStorage } from '../utils/storage'
import { savePushSubscription } from '../utils/firebaseProjects'

export type DeadlineNotificationStatus = NotificationPermission | 'unsupported'

const pendingReminders = new Set<string>()

const urlBase64ToUint8Array = (value: string) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)))
}

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
    if (permission === 'granted' && 'serviceWorker' in navigator && projectId) {
      const registration = await navigator.serviceWorker.ready
      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (publicKey && 'pushManager' in registration) {
        const existing = await registration.pushManager.getSubscription()
        const subscription = existing ?? await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
        await savePushSubscription(projectId, subscription.toJSON())
      }
    }
    return permission
  }, [projectId])

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
