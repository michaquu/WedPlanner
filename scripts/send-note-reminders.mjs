import webpush from 'web-push'

const databaseUrl = process.env.FIREBASE_DATABASE_URL?.replace(/\/$/, '')
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:notifications@example.com'

if (!databaseUrl || !vapidPublicKey || !vapidPrivateKey) {
  throw new Error('Missing FIREBASE_DATABASE_URL, VAPID_PUBLIC_KEY, or VAPID_PRIVATE_KEY.')
}

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

const getJson = async (path) => {
  const response = await fetch(`${databaseUrl}/${path}.json`)
  if (!response.ok) throw new Error(`Firebase GET failed: ${response.status}`)
  return response.json()
}

const writeJson = async (path, value) => {
  const response = await fetch(`${databaseUrl}/${path}.json`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(value),
  })
  if (!response.ok) throw new Error(`Firebase PUT failed: ${response.status}`)
}

const deleteJson = async (path) => {
  const response = await fetch(`${databaseUrl}/${path}.json`, { method: 'DELETE' })
  if (!response.ok) throw new Error(`Firebase DELETE failed: ${response.status}`)
}

const asArray = (value) => (Array.isArray(value) ? value : Object.values(value ?? {}))
const now = Date.now()
const reminderProjects = await getJson('reminderProjects')
const subscriptions = await getJson('pushSubscriptions')
const deliveries = (await getJson('pushDeliveries')) ?? {}

for (const [projectId, indexEntry] of Object.entries(reminderProjects ?? {})) {
  if (indexEntry?.active !== true) continue
  const project = await getJson(`projects/${encodeURIComponent(projectId)}`)
  const notes = asArray(project?.data?.sections).flatMap((section) =>
    asArray(section?.items).flatMap((item) =>
      asArray(item?.notes).map((note) => ({ section, item, note })),
    ),
  )
  const projectSubscriptions = Object.entries(subscriptions?.[projectId] ?? {})
  if (!projectSubscriptions.length) continue

  for (const { section, item, note } of notes) {
    const reminderAt = Date.parse(note?.reminderAt ?? '')
    if (!Number.isFinite(reminderAt) || reminderAt > now) continue

    const deliveryId = `${projectId}:${note.id}:${note.reminderAt}`
    if (deliveries[projectId]?.[deliveryId]) continue

    const payload = JSON.stringify({
      title: `Przypomnienie: ${item.title}`,
      body: `${section.title}${note.content ? ` · ${note.content.slice(0, 100)}` : ''}`,
      tag: deliveryId,
      url: '/',
    })

    for (const [subscriptionId, subscription] of projectSubscriptions) {
      try {
        await webpush.sendNotification(subscription, payload)
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await deleteJson(`pushSubscriptions/${projectId}/${subscriptionId}`)
        } else {
          console.error(`Push failed for ${projectId}/${subscriptionId}`, error)
        }
      }
    }

    deliveries[projectId] = {
      ...(deliveries[projectId] ?? {}),
      [deliveryId]: new Date().toISOString(),
    }
    await writeJson(`pushDeliveries/${projectId}/${deliveryId}`, deliveries[projectId][deliveryId])
  }
}