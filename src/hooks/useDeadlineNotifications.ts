import { useCallback, useEffect, useState } from 'react'
import { savePushSubscription } from '../utils/firebaseProjects'

export type DeadlineNotificationStatus = NotificationPermission | 'unsupported'

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

export const useDeadlineNotifications = (projectId: string) => {
  const [status, setStatus] = useState<DeadlineNotificationStatus>(getStatus)

  const ensurePushSubscription = useCallback(async (permission = status) => {
    if (permission !== 'granted' || !('serviceWorker' in navigator) || !projectId) return
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!publicKey) {
      console.error('Brak VITE_VAPID_PUBLIC_KEY w buildzie aplikacji.')
      return
    }
    const registration = await navigator.serviceWorker.ready
    if (!('pushManager' in registration)) return
    const existing = await registration.pushManager.getSubscription()
    const subscription = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
    await savePushSubscription(projectId, subscription.toJSON())
  }, [projectId, status])

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported' as const
    const permission = await Notification.requestPermission()
    setStatus(permission)
    if (permission === 'granted') {
      await ensurePushSubscription(permission)
    }
    return permission
  }, [ensurePushSubscription])

  useEffect(() => {
    void ensurePushSubscription().catch((error) => {
      console.error('Nie udalo sie zapisac subskrypcji push.', error)
    })
  }, [ensurePushSubscription])

  useEffect(() => {
    const refreshStatus = () => setStatus(getStatus())
    window.addEventListener('focus', refreshStatus)
    return () => window.removeEventListener('focus', refreshStatus)
  }, [])

  return { status, requestPermission }
}
