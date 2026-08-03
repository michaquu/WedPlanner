import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../constants'
import { createPlannerData } from '../test/fixtures'
import type { PlannerData } from '../types'

const firebaseMocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  saveProjectData: vi.fn(),
  subscribeProject: vi.fn(),
}))

vi.mock('../utils/firebaseProjects', () => firebaseMocks)

import { useProjectData } from './useProjectData'

describe('useProjectData', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
    firebaseMocks.createProject.mockResolvedValue(undefined)
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
    vi.useRealTimers()
  })
})

