import { CHUNK_SIZE as DEFAULT_CHUNK_SIZE } from '@/utils/constants'

const ENV_CHUNK_SIZE = Number(import.meta.env.VITE_UPLOAD_CHUNK_SIZE)

export const CHUNK_SIZE = Number.isFinite(ENV_CHUNK_SIZE) && ENV_CHUNK_SIZE > 0
  ? ENV_CHUNK_SIZE
  : DEFAULT_CHUNK_SIZE

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function useFileChunk() {
  function calculateChunks(file: File): number {
    if (!file.size)
      return 0

    return Math.ceil(file.size / CHUNK_SIZE)
  }

  function sliceFile(file: File, index: number): Blob {
    const start = index * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)

    return file.slice(start, end)
  }

  async function calculateChunkHash(chunk: Blob): Promise<string> {
    const buffer = await chunk.arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-256', buffer)
    return toHex(digest)
  }

  return {
    CHUNK_SIZE,
    calculateChunks,
    sliceFile,
    calculateChunkHash,
  }
}
