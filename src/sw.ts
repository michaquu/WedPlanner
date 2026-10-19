/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<unknown>
}

self.skipWaiting()
clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  if (!event.data) return
  const payload = event.data.json() as {
    title?: string
    body?: string
    tag?: string
    url?: string
    data?: {
      url?: string
    }
  }
  const notificationUrl = payload.data?.url ?? payload.url ?? '/'
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Wedding Planner', {
      body: payload.body ?? 'Masz nowe przypomnienie.',
      icon: '/icons/pwa-192.png',
      badge: '/icons/pwa-192.png',
      tag: payload.tag,
      data: { url: notificationUrl },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  const targetUrl = new URL(url, self.location.origin).href
  event.waitUntil(
    self.clients.openWindow(targetUrl),
  )
})