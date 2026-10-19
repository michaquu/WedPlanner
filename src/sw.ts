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
  }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Wedding Planner', {
      body: payload.body ?? 'Masz nowe przypomnienie.',
      icon: '/icons/pwa-192.png',
      badge: '/icons/pwa-192.png',
      tag: payload.tag,
      data: { url: payload.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find(
        (client): client is WindowClient => 'focus' in client && 'navigate' in client,
      )
      if (existing) {
        return existing.navigate(url).then((client) => client?.focus())
      }
      return self.clients.openWindow(url)
    }),
  )
})