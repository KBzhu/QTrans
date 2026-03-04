import { db } from '@/mocks/db'
import { request } from '@/utils/request'
import { generateFileId } from '@/utils/file'
import { useFileChunk } from './useFileChunk'

interface UploadProgressPayload {
  fileId: string
  uploadedChunks: number
  totalChunks: number
  uploadedBytes: number
  totalBytes: number
  progress: number
}

type ProgressCallback = (payload: UploadProgressPayload) => void

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function useFileUpload() {
  const isPaused = ref(false)
  const isCancelled = ref(false)
  const { calculateChunks, sliceFile, calculateChunkHash } = useFileChunk()

  function pause() {
    isPaused.value = true
  }

  function resume() {
    isPaused.value = false
  }

  async function cancel(fileId?: string) {
    isCancelled.value = true
    if (fileId)
      await clearFileRecord(fileId)
  }

  async function clearFileRecord(fileId: string) {
    await db.transaction('rw', db.fileChunks, db.fileMetas, async () => {
      await db.fileChunks.where('fileId').equals(fileId).delete()
      await db.fileMetas.where('fileId').equals(fileId).delete()
    })
  }

  async function uploadFile(file: File, applicationId: string, onProgress?: ProgressCallback): Promise<string> {
    isCancelled.value = false

    const fileId = generateFileId(file)
    const totalChunks = calculateChunks(file)
    const existedChunks = await db.fileChunks.where('fileId').equals(fileId).toArray()
    const uploadedChunkMap = new Map(existedChunks.map(chunk => [chunk.chunkIndex, chunk]))

    let uploadedBytes = existedChunks.reduce((sum, chunk) => sum + chunk.size, 0)
    let uploadedChunks = uploadedChunkMap.size

    await upsertFileMeta({
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      totalChunks,
      uploadedChunks,
      applicationId,
      status: uploadedChunks >= totalChunks ? 'completed' : 'uploading',
      updateTime: Date.now(),
    })

    onProgress?.({
      fileId,
      uploadedChunks,
      totalChunks,
      uploadedBytes,
      totalBytes: file.size,
      progress: totalChunks ? Math.round((uploadedChunks / totalChunks) * 100) : 0,
    })

    for (let index = 0; index < totalChunks; index++) {
      if (isCancelled.value) {
        await clearFileRecord(fileId)
        throw new Error('上传已取消')
      }

      while (isPaused.value) {
        await upsertFileMeta({ fileId, status: 'paused', updateTime: Date.now() })
        await sleep(120)
      }

      if (uploadedChunkMap.has(index))
        continue

      const chunk = sliceFile(file, index)
      const chunkHash = await calculateChunkHash(chunk)

      await request.post('/files/upload', {
        fileId,
        applicationId,
        fileName: file.name,
        fileSize: file.size,
        totalChunks,
        chunkIndex: index,
        chunkHash,
        size: chunk.size,
      })

      await db.fileChunks.put({
        fileId,
        chunkIndex: index,
        chunkData: chunk,
        chunkHash,
        uploadTime: Date.now(),
        size: chunk.size,
      })

      uploadedChunks += 1
      uploadedBytes += chunk.size

      await upsertFileMeta({
        fileId,
        uploadedChunks,
        status: uploadedChunks >= totalChunks ? 'completed' : 'uploading',
        updateTime: Date.now(),
      })

      onProgress?.({
        fileId,
        uploadedChunks,
        totalChunks,
        uploadedBytes,
        totalBytes: file.size,
        progress: totalChunks ? Math.round((uploadedChunks / totalChunks) * 100) : 0,
      })
    }

    await request.post('/files/merge', {
      fileId,
      applicationId,
      totalChunks,
    })

    await upsertFileMeta({
      fileId,
      uploadedChunks: totalChunks,
      status: 'completed',
      updateTime: Date.now(),
    })

    return fileId
  }

  async function upsertFileMeta(payload: Partial<import('@/mocks/db').FileMeta> & { fileId: string; updateTime: number }) {
    const existed = await db.fileMetas.where('fileId').equals(payload.fileId).first()

    if (!existed) {
      await db.fileMetas.add({
        fileId: payload.fileId,
        fileName: payload.fileName || '',
        fileSize: payload.fileSize || 0,
        fileType: payload.fileType || '',
        totalChunks: payload.totalChunks || 0,
        uploadedChunks: payload.uploadedChunks || 0,
        md5: payload.md5,
        applicationId: payload.applicationId || '',
        status: payload.status || 'pending',
        createTime: payload.updateTime,
        updateTime: payload.updateTime,
      })
      return
    }

    await db.fileMetas.update(existed.id!, {
      ...payload,
      updateTime: payload.updateTime,
    })
  }

  return {
    isPaused,
    isCancelled,
    uploadFile,
    pause,
    resume,
    cancel,
    clearFileRecord,
  }
}
