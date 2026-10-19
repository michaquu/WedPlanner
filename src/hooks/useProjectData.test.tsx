import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../constants'
import { createPlannerData } from '../test/fixtures'
import type { PlannerData } from '../types'

const firebaseMocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  saveReminderProjectIndex: vi.fn(),
  saveProjectData: vi.fn(),
  subscribeProject: vi.fn(),
}))

vi.mock('../utils/firebaseProjects', () => firebaseMocks)

import { useProjectData } from './useProjectData'

describe('useProjectData', () => {
  afterEach(() => vi.useRealTimers())

  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
    firebaseMocks.createProject.mockResolvedValue(undefined)
    firebaseMocks.saveReminderProjectIndex.mockResolvedValue(undefined)
    firebaseMocks.saveProjectData.mockResolvedValue(undefined)
    firebaseMocks.subscribeProject.mockImplementation(
      (
        _projectId: string,
        callback: (payload: { exists: boolean; data?: PlannerData }) => void,
      ) => {
        callback({ exists: true, data: createPlannerData() })
        return vi.fn()
      },
    )
  })

  it('loads a selected project and stores its ID', async () => {
    const { result } = renderHook(() => useProjectData())
    await waitFor(() => expect(result.current.projectExists).toBe(true))

    act(() => {
      expect(result.current.selectProject('  shared-project  ')).toBe(true)
    })

    expect(result.current.projectId).toBe('shared-project')
    expect(window.localStorage.getItem(STORAGE_KEYS.projectId)).toBe('shared-project')
    expect(result.current.selectProject('   ')).toBe(false)
  })

  it('debounces project saves after local data changes', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useProjectData())

    await act(async () => Promise.resolve())
    act(() => {
      result.current.setData((current) => ({
        sections: current.sections.map((section) => ({
          ...section,
          title: 'Updated section',
        })),
      }))
    })
    act(() => vi.advanceTimersByTime(400))
    await act(async () => Promise.resolve())

    expect(firebaseMocks.saveProjectData).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        sections: [expect.objectContaining({ title: 'Updated section' })],
      }),
    )
  })

  it('creates a new project and persists its generated ID', async () => {
    const { result } = renderHook(() => useProjectData())
    await waitFor(() => expect(result.current.projectExists).toBe(true))
    firebaseMocks.subscribeProject.mockImplementation(() => vi.fn())

    await act(() => result.current.createNewProject())

    expect(firebaseMocks.createProject).toHaveBeenCalledWith(
      result.current.projectId,
      result.current.data,
    )
    expect(window.localStorage.getItem(STORAGE_KEYS.projectId)).toBe(result.current.projectId)
    expect(result.current.saveError).toBe(false)
  })

  it('reports a project creation error', async () => {
    firebaseMocks.createProject.mockRejectedValueOnce(new Error('offline'))
    const { result } = renderHook(() => useProjectData())
    await waitFor(() => expect(result.current.projectExists).toBe(true))
    firebaseMocks.subscribeProject.mockImplementation(() => vi.fn())

    await act(() => result.current.createNewProject())

    expect(result.current.saveError).toBe(true)
  })

  it('reports a debounced save error', async () => {
    vi.useFakeTimers()
    firebaseMocks.saveProjectData.mockRejectedValueOnce(new Error('offline'))
    const { result } = renderHook(() => useProjectData())
    await act(async () => Promise.resolve())

    act(() => {
      result.current.setData((current) => ({
        sections: current.sections.map((section) => ({ ...section, title: 'Changed' })),
      }))
    })
    await act(async () => {
      vi.advanceTimersByTime(400)
      await Promise.resolve()
    })

    expect(result.current.isSaving).toBe(false)
    expect(result.current.saveError).toBe(true)
  })
})
