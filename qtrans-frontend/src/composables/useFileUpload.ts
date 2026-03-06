import type { UploadRequestOption } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { ref } from 'vue'
import { db } from '@/mocks/db'
import { fileApi } from '@/api'
import { CHUNK_SIZE } from '@/utils/constants'

export interface UploadProgress {
  fileId: string
  fileName: string
  progress: number // 0-100
  speed: number // bytes per second
  uploadedBytes: number
  totalBytes: number
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error'
  error?: string
}

// AbortController 映射表，用于暂停/取消上传
const abortControllers = new Map<string, AbortController>()

// 上传进度映射表
const uploadProgressMap = new Map<string, UploadProgress>()

/**
 * 生成文件唯一标识
 */
export function generateFileId(file: File, applicationId: string): string {
  return `${applicationId}-${file.name}-${file.size}-${file.lastModified}`
}

/**
 * 获取已上传的分片索引集合
 */
async function getUploadedChunkIndexes(fileId: string): Promise<Set<number>> {
  const uploadedChunks = await db.fileChunks
    .where('fileId')
    .equals(fileId)
    .toArray()

  return new Set(uploadedChunks.map(chunk => chunk.chunkIndex))
}

/**
 * 上传单个分片
 */
async function uploadChunk(
  file: File,
  fileId: string,
  chunkIndex: number,
  totalChunks: number,
  signal?: AbortSignal,
): Promise<void> {
  const start = chunkIndex * CHUNK_SIZE
  const end = Math.min(start + CHUNK_SIZE, file.size)
  const chunkBlob = file.slice(start, end)

  const formData = new FormData()
  formData.append('file', chunkBlob)
  formData.append('fileId', fileId)
  formData.append('chunkIndex', String(chunkIndex))
  formData.append('totalChunks', String(totalChunks))
  formData.append('fileName', file.name)

  await fileApi.uploadChunk(formData, { signal })

  // 上传成功后记录到 IndexedDB
  await db.fileChunks.add({
    fileId,
    chunkIndex,
    chunkHash: '', // 实际应用中应计算 hash
    uploadTime: Date.now(),
    size: chunkBlob.size,
  })
}

/**
 * 合并分片
 */
async function mergeChunks(fileId: string, totalChunks: number): Promise<string> {
  const result = await fileApi.mergeChunks({
    fileId,
    totalChunks,
  })

  return result.uploadedFileId || fileId
}

/**
 * 使用文件上传 Composable
 */
export function useFileUpload() {
  const uploading = ref(false)

  /**
   * 上传文件（支持断点续传）
   */
  async function uploadFile(
    file: File,
    applicationId: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<string> {
    const fileId = generateFileId(file, applicationId)
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

    // 查询已上传的分片（断点续传）
    const uploadedIndexes = await getUploadedChunkIndexes(fileId)
    let uploadedCount = uploadedIndexes.size

    // 初始化上传进度
    const progress: UploadProgress = {
      fileId,
      fileName: file.name,
      progress: (uploadedCount / totalChunks) * 100,
      speed: 0,
      uploadedBytes: uploadedCount * CHUNK_SIZE,
      totalBytes: file.size,
      status: 'uploading',
    }
    uploadProgressMap.set(fileId, progress)

    // 写入文件 Meta
    await db.fileMetas.put({
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      applicationId,
      totalChunks,
      uploadedChunks: uploadedCount,
      status: 'uploading',
      createTime: Date.now(),
      updateTime: Date.now(),
    })

    // 创建 AbortController
    const controller = new AbortController()
    abortControllers.set(fileId, controller)

    uploading.value = true
    const startTime = Date.now()

    try {
      // 逐分片上传
      for (let i = 0; i < totalChunks; i++) {
        // 跳过已上传的分片
        if (uploadedIndexes.has(i))
          continue

        // 检查是否被暂停/取消
        if (controller.signal.aborted) {
          progress.status = 'paused'
          uploadProgressMap.set(fileId, progress)
          throw new Error('Upload paused or cancelled')
        }

        await uploadChunk(file, fileId, i, totalChunks, controller.signal)

        uploadedCount++
        const elapsed = (Date.now() - startTime) / 1000
        progress.progress = (uploadedCount / totalChunks) * 100
        progress.uploadedBytes = uploadedCount * CHUNK_SIZE
        progress.speed = elapsed > 0 ? progress.uploadedBytes / elapsed : 0

        uploadProgressMap.set(fileId, progress)
        onProgress?.(progress)
      }

      // 合并分片
      const uploadedFileId = await mergeChunks(fileId, totalChunks)

      // 更新状态为完成
      progress.status = 'completed'
      progress.progress = 100
      progress.uploadedBytes = file.size
      progress.speed = 0
      uploadProgressMap.set(fileId, progress)
      onProgress?.(progress)

      // 更新 Meta 状态
      const meta = await db.fileMetas.where('fileId').equals(fileId).first()
      if (meta?.id) {
        await db.fileMetas.update(meta.id, {
          status: 'completed',
          uploadedChunks: totalChunks,
          updateTime: Date.now(),
        })
      }

      return uploadedFileId
    }
    catch (error: any) {
      progress.status = 'error'
      progress.error = error.message || '上传失败'
      uploadProgressMap.set(fileId, progress)
      onProgress?.(progress)

      // 更新 Meta 状态
      const meta = await db.fileMetas.where('fileId').equals(fileId).first()
      if (meta?.id) {
        await db.fileMetas.update(meta.id, {
          status: 'failed',
          updateTime: Date.now(),
        })
      }

      throw error
    }
    finally {
      uploading.value = false
      abortControllers.delete(fileId)
    }
  }

  /**
   * 暂停上传
   */
  function pauseUpload(fileId: string): void {
    const controller = abortControllers.get(fileId)
    if (controller) {
      controller.abort()
      abortControllers.delete(fileId)

      const progress = uploadProgressMap.get(fileId)
      if (progress) {
        progress.status = 'paused'
        progress.speed = 0
        uploadProgressMap.set(fileId, progress)
      }

      Message.info('上传已暂停')
    }
  }

  /**
   * 继续上传（实际上是重新启动上传流程，会自动跳过已上传分片）
   */
  async function resumeUpload(
    file: File,
    applicationId: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<string> {
    const fileId = generateFileId(file, applicationId)
    const progress = uploadProgressMap.get(fileId)

    if (progress) {
      progress.status = 'uploading'
      uploadProgressMap.set(fileId, progress)
    }

    return uploadFile(file, applicationId, onProgress)
  }

  /**
   * 取消上传并清理数据
   */
  async function cancelUpload(fileId: string): Promise<void> {
    // 中止上传
    const controller = abortControllers.get(fileId)
    if (controller) {
      controller.abort()
      abortControllers.delete(fileId)
    }

    // 清理 IndexedDB 数据
    await db.fileChunks.where('fileId').equals(fileId).delete()
    const meta = await db.fileMetas.where('fileId').equals(fileId).first()
    if (meta?.id) {
      await db.fileMetas.delete(meta.id)
    }

    // 清理进度记录
    uploadProgressMap.delete(fileId)

    Message.success('已取消上传')
  }

  /**
   * 获取上传进度
   */
  function getUploadProgress(fileId: string): UploadProgress | undefined {
    return uploadProgressMap.get(fileId)
  }

  /**
   * 自定义上传请求（用于 ArcoDesign Upload 组件）
   */
  async function customRequest(
    option: UploadRequestOption,
    applicationId: string,
  ): Promise<void> {
    const { fileItem, onProgress, onSuccess, onError } = option

    if (!fileItem.file)
      return

    try {
      const uploadedFileId = await uploadFile(
        fileItem.file,
        applicationId,
        (progress) => {
          onProgress(progress.progress, new Event('progress'))
        },
      )

      onSuccess({
        fileId: uploadedFileId,
        fileName: fileItem.file.name,
      })
    }
    catch (error: any) {
      onError(error)
    }
  }

  return {
    uploading,
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    getUploadProgress,
    customRequest,
  }
}
