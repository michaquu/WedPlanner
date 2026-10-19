import { cert, deleteApp, getApps, initializeApp } from 'firebase-admin/app'
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

const withTimeout = (promise, label, timeoutMs = 30_000) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
      timeoutMs,
    )
    promise.then(
      (value) => {
        clearTimeout(timeout)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeout)
        reject(error)
      },
    )
  })

const asArray = (value) => (Array.isArray(value) ? value : Object.values(value ?? {}))
const toFirebaseKey = (value) =>
  Buffer.from(value, 'utf8').toString('base64url')
const now = Date.now()
const stats = { due: 0, sent: 0, failed: 0, alreadyDelivered: 0, noSubscription: 0 }
console.log('Reading reminder data from Firebase...')
const [reminderProjects, subscriptions, deliveries] = await Promise.all([
  withTimeout(database.ref('reminderProjects').once('value'), 'reminderProjects read'),
  withTimeout(database.ref('pushSubscriptions').once('value'), 'pushSubscriptions read'),
  withTimeout(database.ref('pushDeliveries').once('value'), 'pushDeliveries read'),
])

const projectIndex = reminderProjects.val() ?? {}
const subscriptionIndex = subscriptions.val() ?? {}
const deliveryIndex = deliveries.val() ?? {}
console.log(`Found ${Object.keys(projectIndex).length} reminder project(s).`)

for (const [projectId, indexEntry] of Object.entries(projectIndex)) {
  if (indexEntry?.active !== true) continue

  console.log(`Checking project ${projectId}...`)
  const projectSnapshot = await withTimeout(
    database.ref(`projects/${projectId}`).once('value'),
    `project ${projectId} read`,
  )
  const project = projectSnapshot.val()
  const notes = asArray(project?.data?.sections).flatMap((section) =>
    asArray(section?.items).flatMap((item) =>
      asArray(item?.notes).map((note) => ({ section, item, note })),
    ),
  )
  const projectSubscriptions = Object.entries(subscriptionIndex[projectId] ?? {})

  for (const { section, item, note } of notes) {
    const reminderAt = Date.parse(note?.reminderAt ?? '')
    if (!Number.isFinite(reminderAt) || reminderAt > now) continue

    const deliveryId = `${projectId}:${note.id}:${note.reminderAt}`
    const deliveryKey = toFirebaseKey(deliveryId)
    if (deliveryIndex[projectId]?.[deliveryKey]) {
      stats.alreadyDelivered += 1
      continue
    }
    stats.due += 1
    if (!projectSubscriptions.length) {
      stats.noSubscription += 1
      console.warn(`Reminder ${deliveryId} has no push subscription.`)
      continue
    }

    const payload = JSON.stringify({
      title: `Przypomnienie: ${item.title}`,
      body: `${section.title}${note.content ? ` · ${note.content.slice(0, 100)}` : ''}`,
      tag: deliveryId,
      url: `/?projectId=${encodeURIComponent(projectId)}&itemId=${encodeURIComponent(item.id)}&noteId=${encodeURIComponent(note.id)}`,
    })

    let sentForReminder = 0
    for (const [subscriptionId, subscription] of projectSubscriptions) {
      try {
        await withTimeout(
          webpush.sendNotification(subscription, payload, { timeout: 15_000 }),
          `push ${projectId}/${subscriptionId}`,
          20_000,
        )
        console.log(`Sent reminder ${deliveryId} to subscription ${subscriptionId}.`)
        stats.sent += 1
        sentForReminder += 1
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await withTimeout(
            database.ref(`pushSubscriptions/${projectId}/${subscriptionId}`).remove(),
            `remove subscription ${subscriptionId}`,
          )
        } else {
          stats.failed += 1
          console.error(`Push failed for ${projectId}/${subscriptionId}`, error)
        }
      }
    }

    if (sentForReminder > 0) {
      await withTimeout(
        database.ref(`pushDeliveries/${projectId}/${deliveryKey}`).set(new Date().toISOString()),
        `save delivery ${deliveryId}`,
      )
    }
  }
}

console.log(
  `Reminder check completed. Due: ${stats.due}; sent: ${stats.sent}; failed: ${stats.failed}; no subscription: ${stats.noSubscription}; already delivered: ${stats.alreadyDelivered}.`,
)
await deleteApp(app)
