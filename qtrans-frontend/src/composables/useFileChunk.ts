import { getChunkSize } from '@/api/transWebService'
import { useHashWorker } from '@/composables/useHashWorker'
import { digestArrayBufferSHA256, getChunkBounds } from '@/workers/shared/hash-utils'

export const CHUNK_SIZE = getChunkSize()

export function useFileChunk() {
  const { calculateChunkHashInWorker } = useHashWorker()

  function calculateChunks(file: File): number {
    if (!file.size)
      return 0

    return Math.ceil(file.size / CHUNK_SIZE)
  }

  function sliceFile(file: File, index: number): Blob {
    const { start, end } = getChunkBounds(file.size, index, CHUNK_SIZE)
    return file.slice(start, end)
  }

  async function calculateChunkHash(chunk: Blob, useWorker = true): Promise<string> {
    const buffer = await chunk.arrayBuffer()

    if (!useWorker)
      return digestArrayBufferSHA256(buffer)

    return calculateChunkHashInWorker(buffer)
  }

  return {
    CHUNK_SIZE,
    calculateChunks,
    sliceFile,
    calculateChunkHash,
  }
}
