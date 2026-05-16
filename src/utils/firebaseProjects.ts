import { onValue, ref, set } from 'firebase/database'
import type { PlannerData } from '../types'
import { db } from '../firebase'

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
  return set(projectRef(projectId), payload)
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

