import { describe, expect, it } from 'vitest'
import { formatCurrency, formatFileSize } from './formatters'

describe('formatters', () => {
  it('formats PLN values with regular spaces', () => {
    const formatted = formatCurrency(12_345.5)

    expect(formatted).toContain('12 345,50')
    expect(formatted).toContain('zł')
    expect(formatted).not.toMatch(/[\u00a0\u202f]/)
  })

  it('formats attachment sizes in readable units', () => {
    expect(formatFileSize()).toBe('')
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1_572_864)).toBe('2 MB')
  })
})
