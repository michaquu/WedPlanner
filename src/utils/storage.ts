import type { PlannerData } from '../types'

const STORAGE_KEY = 'wedding-planner-v1'

export const loadPlanner = (): PlannerData | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PlannerData
  } catch {
    return null
  }
}

export const savePlanner = (data: PlannerData) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore storage errors (private mode / quota).
  }
}
