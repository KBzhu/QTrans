export function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  if (index < 0)
    return ''

  return fileName.slice(index).toLowerCase()
}

export function generateFileId(file: File): string {
  const raw = `${file.name}-${file.size}-${file.lastModified}`
  let hash = 0

  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0
  }

  return `${Math.abs(hash).toString(36)}-${file.size}-${file.lastModified}`
}

export function calculateChunkCount(fileSize: number, chunkSize: number): number {
  if (fileSize <= 0 || chunkSize <= 0)
    return 0

  return Math.ceil(fileSize / chunkSize)
}
