import { describe, expect, it } from 'vitest'

import { formatDateTime, formatDuration, formatFileSize, formatTransferSpeed } from '@/utils/format'

describe('format utils', () => {
  it('formats file size correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB')
  })

  it('formats duration correctly', () => {
    expect(formatDuration(59)).toBe('59秒')
    expect(formatDuration(61)).toBe('1分钟1秒')
    expect(formatDuration(3661)).toBe('1小时1分钟1秒')
  })

  it('formats transfer speed correctly', () => {
    expect(formatTransferSpeed(0)).toBe('0 B/s')
    expect(formatTransferSpeed(1024 * 1024)).toBe('1 MB/s')
  })

  it('formats datetime correctly', () => {
    expect(formatDateTime('2026-03-04T01:02:03Z')).toMatch(/^2026-03-04\s\d{2}:\d{2}:\d{2}$/)
  })
})
