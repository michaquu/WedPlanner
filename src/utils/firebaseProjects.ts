import { onValue, ref, set, update } from 'firebase/database'
import type { PlannerData } from '../types'
import { db } from '../firebase'

export interface PushSubscriptionRecord {
  endpoint: string
  expirationTime: number | null
  keys: {
    p256dh: string
    auth: string
  }
  projectId: string
  updatedAt: string
}

interface ProjectSnapshot {
  data?: PlannerData
  createdAt?: string
  updatedAt?: string
}

interface ProjectPayload {
  exists: boolean
  data?: PlannerData
}

const projectRef = (projectId: string) => ref(db, `projects/${projectId}`)

const pushSubscriptionRef = (projectId: string, subscriptionId: string) =>
  ref(db, `pushSubscriptions/${projectId}/${subscriptionId}`)

const reminderProjectRef = (projectId: string) =>
  ref(db, `reminderProjects/${projectId}`)

const sanitizeForFirebase = (value: unknown): unknown => {
  if (value === undefined) return null
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeForFirebase(entry))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        sanitizeForFirebase(entry),
      ]),
    )
  }
  return value
}

export const createProject = (projectId: string, data: PlannerData) => {
  const now = new Date().toISOString()
  const payload = sanitizeForFirebase({
    data,
    createdAt: now,
    updatedAt: now,
  })
  return set(projectRef(projectId), payload)
}

export const saveProjectData = (projectId: string, data: PlannerData) => {
  const now = new Date().toISOString()
  const payload = sanitizeForFirebase({
    data,
    updatedAt: now,
  })
  return update(projectRef(projectId), payload as Record<string, unknown>)
}

export const subscribeProject = (
  projectId: string,
  callback: (payload: ProjectPayload) => void,
) => {
  return onValue(projectRef(projectId), (snapshot) => {
    if (!snapshot.exists()) {
      callback({ exists: false })
      return
    }
    const value = snapshot.val() as ProjectSnapshot
    callback({ exists: true, data: value.data })
  })
}

export const savePushSubscription = (
  projectId: string,
  subscription: PushSubscriptionJSON,
) => {
  const endpoint = subscription.endpoint
  if (!endpoint || !subscription.keys?.p256dh || !subscription.keys.auth) {
    return Promise.reject(new Error('Nieprawidlowa subskrypcja push.'))
  }
  const subscriptionId = btoa(endpoint).replace(/[^a-zA-Z0-9_-]/g, '_')
  const payload: PushSubscriptionRecord = {
    endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    projectId,
    updatedAt: new Date().toISOString(),
  }
  return set(pushSubscriptionRef(projectId, subscriptionId), payload)
}

export const saveReminderProjectIndex = (projectId: string) =>
  set(reminderProjectRef(projectId), {
    active: true,
    updatedAt: new Date().toISOString(),
  })

