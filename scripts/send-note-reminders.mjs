import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import webpush from 'web-push'

const databaseUrl = process.env.FIREBASE_DATABASE_URL?.replace(/\/$/, '')
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:notifications@example.com'
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

if (!databaseUrl || !vapidPublicKey || !vapidPrivateKey || !serviceAccountJson) {
  throw new Error(
    'Missing FIREBASE_DATABASE_URL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_JSON.',
  )
}

const serviceAccount = JSON.parse(serviceAccountJson)
const app = getApps()[0] ?? initializeApp({
  credential: cert(serviceAccount),
  databaseURL: databaseUrl,
})

const database = getDatabase(app)
webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

const asArray = (value) => (Array.isArray(value) ? value : Object.values(value ?? {}))
const now = Date.now()
const [reminderProjects, subscriptions, deliveries] = await Promise.all([
  database.ref('reminderProjects').once('value'),
  database.ref('pushSubscriptions').once('value'),
  database.ref('pushDeliveries').once('value'),
])

const projectIndex = reminderProjects.val() ?? {}
const subscriptionIndex = subscriptions.val() ?? {}
const deliveryIndex = deliveries.val() ?? {}

for (const [projectId, indexEntry] of Object.entries(projectIndex)) {
  if (indexEntry?.active !== true) continue

  const projectSnapshot = await database.ref(`projects/${projectId}`).once('value')
  const project = projectSnapshot.val()
  const notes = asArray(project?.data?.sections).flatMap((section) =>
    asArray(section?.items).flatMap((item) =>
      asArray(item?.notes).map((note) => ({ section, item, note })),
    ),
  )
  const projectSubscriptions = Object.entries(subscriptionIndex[projectId] ?? {})
  if (!projectSubscriptions.length) continue

  for (const { section, item, note } of notes) {
    const reminderAt = Date.parse(note?.reminderAt ?? '')
    if (!Number.isFinite(reminderAt) || reminderAt > now) continue

    const deliveryId = `${projectId}:${note.id}:${note.reminderAt}`
    if (deliveryIndex[projectId]?.[deliveryId]) continue

    const payload = JSON.stringify({
      title: `Przypomnienie: ${item.title}`,
      body: `${section.title}${note.content ? ` · ${note.content.slice(0, 100)}` : ''}`,
      tag: deliveryId,
      url: `/?projectId=${encodeURIComponent(projectId)}&itemId=${encodeURIComponent(item.id)}&noteId=${encodeURIComponent(note.id)}`,
    })

    for (const [subscriptionId, subscription] of projectSubscriptions) {
      try {
        await webpush.sendNotification(subscription, payload)
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await database.ref(`pushSubscriptions/${projectId}/${subscriptionId}`).remove()
        } else {
          console.error(`Push failed for ${projectId}/${subscriptionId}`, error)
        }
      }
    }

    await database.ref(`pushDeliveries/${projectId}/${deliveryId}`).set(new Date().toISOString())
  }
}
