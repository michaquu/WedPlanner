import { useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PROJECT_ID, STORAGE_KEYS } from '../constants'
import { createSeedData } from '../data/seed'
import type { PlannerData } from '../types'
import {
  createProject,
  saveProjectData,
  subscribeProject,
} from '../utils/firebaseProjects'
import { normalizePlannerData } from '../utils/plannerData'
import { readStorageText, writeStorageText } from '../utils/storage'

export const useProjectData = () => {
  const [data, setData] = useState<PlannerData>(() => createSeedData())
  const [projectId, setProjectId] = useState(() =>
    readStorageText(STORAGE_KEYS.projectId, DEFAULT_PROJECT_ID),
  )
  const [projectExists, setProjectExists] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const skipNextSave = useRef(false)

  useEffect(() => {
    if (!projectId) return
    return subscribeProject(projectId, (payload) => {
      skipNextSave.current = true
      setProjectExists(payload.exists)
      if (payload.exists) setData(normalizePlannerData(payload.data))
      setIsLoading(false)
    })
  }, [projectId])

  useEffect(() => {
    if (!projectId || projectExists !== true) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    setIsSaving(true)
    setSaveError(false)
    const timeout = window.setTimeout(() => {
      saveProjectData(projectId, data)
        .then(() => setIsSaving(false))
        .catch(() => {
          setIsSaving(false)
          setSaveError(true)
        })
    }, 400)
    return () => window.clearTimeout(timeout)
  }, [data, projectExists, projectId])

  const selectProject = (nextProjectId: string) => {
    const value = nextProjectId.trim()
    if (!value) return false
    setProjectId(value)
    setProjectExists(null)
    setIsLoading(true)
    setIsSaving(false)
    writeStorageText(STORAGE_KEYS.projectId, value)
    return true
  }

  const createNewProject = async () => {
    const nextProjectId = uuid()
    const seed = createSeedData()
    skipNextSave.current = true
    setSaveError(false)
    setIsSaving(false)
    setProjectId(nextProjectId)
    setProjectExists(true)
    setData(seed)
    setIsLoading(false)
    writeStorageText(STORAGE_KEYS.projectId, nextProjectId)
    try {
      await createProject(nextProjectId, seed)
    } catch {
      setSaveError(true)
    }
  }

  return {
    data,
    setData,
    projectId,
    projectExists,
    isLoading,
    isSaving,
    saveError,
    setSaveError,
    selectProject,
    createNewProject,
  }
}
