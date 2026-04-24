import { createSHA256 } from 'hash-wasm'

export interface ChunkBounds {
  start: number
  end: number
  size: number
}

export function toHex(buffer: ArrayBufferLike): string {
  return Array.from(new Uint8Array(buffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function getChunkBounds(fileSize: number, chunkIndex: number, chunkSize: number): ChunkBounds {
  const start = chunkIndex * chunkSize
  const end = Math.min(start + chunkSize, fileSize)

  return {
    start,
    end,
    size: Math.max(end - start, 0),
  }
}

export async function digestArrayBufferSHA256(arrayBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  return toHex(hashBuffer)
}

export async function digestBlobSHA256(blob: Blob): Promise<string> {
  const hasher = await createSHA256()
  const reader = blob.stream().getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break

    hasher.update(value)
  }

  return hasher.digest()
}

export async function digestFileSHA256(file: File): Promise<string> {
  return digestBlobSHA256(file)
}
