import { describe, expect, it } from 'vitest'
import { digestArrayBufferSHA256, digestBlobSHA256, getChunkBounds } from '@/workers/shared/hash-utils'

describe('hash-utils', () => {
  it('should calculate chunk bounds correctly', () => {
    expect(getChunkBounds(10, 0, 4)).toEqual({ start: 0, end: 4, size: 4 })
    expect(getChunkBounds(10, 1, 4)).toEqual({ start: 4, end: 8, size: 4 })
    expect(getChunkBounds(10, 2, 4)).toEqual({ start: 8, end: 10, size: 2 })
  })

  it('should digest array buffer with sha256', async () => {
    const encoder = new TextEncoder()
    const buffer = encoder.encode('qtrans-worker-test').buffer as ArrayBuffer

    await expect(digestArrayBufferSHA256(buffer)).resolves.toBe('2523fe2faeea21bf7df19172bedd33e14b4dd3541d1847079d2589f697767ff2')

  })

  it('should digest blob with sha256', async () => {
    const blob = new Blob(['qtrans-worker-test'])

    await expect(digestBlobSHA256(blob)).resolves.toBe('2523fe2faeea21bf7df19172bedd33e14b4dd3541d1847079d2589f697767ff2')

  })
})
