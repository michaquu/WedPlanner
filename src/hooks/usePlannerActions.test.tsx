import { useState } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createPlannerData } from '../test/fixtures'
import type { PlannerData } from '../types'
import { usePlannerActions } from './usePlannerActions'

const useHarness = (initialData: PlannerData) => {
  const [data, setData] = useState(initialData)
  return { data, actions: usePlannerActions(setData) }
}

describe('usePlannerActions', () => {
  it('toggles completion and favorite state', () => {
    const { result } = renderHook(() => useHarness(createPlannerData()))

    act(() => result.current.actions.toggleItem('section-1', 'item-1'))
    act(() => result.current.actions.toggleFavorite('section-1', 'item-1'))

    expect(result.current.data.sections[0]?.items[0]).toMatchObject({
      checked: true,
      favorite: true,
      status: 'Zrobione',
    })

    act(() => result.current.actions.toggleItem('section-1', 'item-1'))
    expect(result.current.data.sections[0]?.items[0]).toMatchObject({
      checked: false,
      status: 'Do zrobienia',
    })
  })

  it('keeps completion synchronized when status is changed directly', () => {
    const { result } = renderHook(() => useHarness(createPlannerData()))

    act(() => result.current.actions.updateItem('section-1', 'item-1', { status: 'Zrobione' }))
    expect(result.current.data.sections[0]?.items[0]?.checked).toBe(true)

    act(() => result.current.actions.updateItem('section-1', 'item-1', { status: 'W trakcie' }))
    expect(result.current.data.sections[0]?.items[0]?.checked).toBe(false)
  })

  it('adds and removes tasks without affecting other sections', () => {
    const { result } = renderHook(() => useHarness(createPlannerData()))

    act(() => result.current.actions.addItem('section-1', '  New task  '))
    expect(result.current.data.sections[0]?.items).toHaveLength(2)
    expect(result.current.data.sections[0]?.items[1]?.title).toBe('New task')

    act(() => result.current.actions.deleteItem('section-1', 'item-1'))
    expect(result.current.data.sections[0]?.items.map((item) => item.title)).toEqual(['New task'])
  })

  it('adds and removes notes using the latest item state', () => {
    const { result } = renderHook(() => useHarness(createPlannerData()))
    const firstNote = {
      id: 'note-1',
      type: 'text' as const,
      content: 'First',
      createdAt: '2026-08-03T10:00:00.000Z',
    }
    const secondNote = { ...firstNote, id: 'note-2', content: 'Second' }

    act(() => {
      result.current.actions.addNote('section-1', 'item-1', firstNote)
      result.current.actions.addNote('section-1', 'item-1', secondNote)
    })
    expect(result.current.data.sections[0]?.items[0]?.notes.map((note) => note.id)).toEqual([
      'note-2',
      'note-1',
    ])

    act(() => result.current.actions.removeNote('section-1', 'item-1', 'note-1'))
    expect(result.current.data.sections[0]?.items[0]?.notes.map((note) => note.id)).toEqual([
      'note-2',
    ])
  })
})
