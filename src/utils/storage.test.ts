import { beforeEach, describe, expect, it } from 'vitest'
import { readStorage, readStorageText, writeStorage, writeStorageText } from './storage'

describe('storage utilities', () => {
  beforeEach(() => window.localStorage.clear())

  it('reads and writes JSON values', () => {
    writeStorage('settings', { visible: true })
    expect(readStorage('settings', { visible: false })).toEqual({ visible: true })
  })

  it('returns a fallback for missing or invalid JSON', () => {
    expect(readStorage('missing', ['fallback'])).toEqual(['fallback'])
    window.localStorage.setItem('invalid', '{')
    expect(readStorage('invalid', ['fallback'])).toEqual(['fallback'])
  })

  it('reads and writes plain text values', () => {
    writeStorageText('project', 'project-id')
    expect(readStorageText('project', 'fallback')).toBe('project-id')
    expect(readStorageText('missing', 'fallback')).toBe('fallback')
  })
})

