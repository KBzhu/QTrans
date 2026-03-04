import { describe, expect, it } from 'vitest'

import { calculateChunkCount, generateFileId, getFileExtension } from '@/utils/file'

describe('file utils', () => {
  it('gets extension', () => {
    expect(getFileExtension('a.TXT')).toBe('.txt')
    expect(getFileExtension('no-ext')).toBe('')
  })

  it('generates stable file id', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain', lastModified: 123456 })
    expect(generateFileId(file)).toBe(generateFileId(file))
  })

  it('calculates chunk count', () => {
    expect(calculateChunkCount(10, 3)).toBe(4)
    expect(calculateChunkCount(0, 3)).toBe(0)
  })
})
