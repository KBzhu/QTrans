/**
 * TransWebService 文件上传 Composable
 * 支持分片上传、断点续传、哈希校验、批量操作
 */
import { Message } from '@arco-design/web-vue'
import { ref, shallowRef, computed } from 'vue'
import {
  type FileEntity,
  type FileListData,
  type UploadInitResponse,
  type ChunkStatusInfo,
  calculateSHA256,
  calculateChunkHash,
  completeUpload,
  deleteFiles,
  getChunkSize,
  getFileList,
  getServerHash,
  getUploadedChunks,
  initUpload,
  pauseUpload as apiPauseUpload,
  updateClientHash,
  uploadChunk as apiUploadChunk,
} from '@/api/transWebService'
import {
  type ChunkInfo,
  type UploadRecord,
  createUploadRecord,
  deleteChunksByFileUUID,
  deleteUploadRecord,
  getChunksByFileUUID,
  getUploadRecord,
  saveChunk,
  updateUploadStatus,
  cleanCompletedRecords,
  cleanFailedRecords,
} from '@/utils/upload-db'

/** 分片大小 */
const CHUNK_SIZE = getChunkSize()

/** 最大并发上传数 */
const MAX_CONCURRENT_UPLOADS = 3

/** 哈希校验状态 */
export interface HashVerifyState {
  clientHash: string
  serverHash: string
  status: 'pending' | 'calculating' | 'verifying' | 'matched' | 'mismatched'
  error?: string
}

/** 上传文件项 */
export interface TransUploadFileItem {
  id: string                    // 文件唯一标识 (UUID)
  file: File                    // 原始文件对象
  status: 'pending' | 'uploading' | 'hashing' | 'verifying' | 'completed' | 'error' | 'paused'
  progress: number              // 上传进度 0-100
  uploadedBytes: number         // 已上传字节数
  speed: number                 // 上传速度 (bytes/s)
  relativeDir: string           // 上传目录
  hashState?: HashVerifyState   // 哈希校验状态
  error?: string                // 错误信息
  startTime?: number            // 开始时间
  totalChunks?: number          // 总分片数
  uploadedChunks?: number[]     // 已上传分片索引
  selected?: boolean            // 是否被选中（用于批量操作）
}

/** 分片上传状态 */
interface ChunkUploadState {
  fileUUID: string
  chunkIndex: number
  chunkHash: string
  status: 'pending' | 'uploading' | 'completed' | 'failed'
}

/** AbortController 映射表 */
const abortControllers = new Map<string, AbortController>()

/** 当前活跃的上传队列 */
const activeUploads = ref(0)

/**
 * 生成文件 UUID
 */
function generateFileUUID(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`
}

/**
 * 格式化速度
 */
function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s'
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
  return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

/**
 * TransWebService 上传 Composable
 */
export function useTransUpload() {
  const uploading = ref(false)
  const initLoading = ref(false)
  const initData = shallowRef<UploadInitResponse | null>(null)
  const fileListData = shallowRef<FileListData | null>(null)
  const uploadFileList = ref<TransUploadFileItem[]>([])
  
  // 计算属性：选中的文件
  const selectedFiles = computed(() => 
    uploadFileList.value.filter(f => f.selected)
  )
  
  // 计算属性：是否有选中的文件
  const hasSelection = computed(() => selectedFiles.value.length > 0)

  /**
   * 初始化上传页面
   */
  async function initialize(params: string, lang = 'zh_CN'): Promise<UploadInitResponse | null> {
    initLoading.value = true
    try {
      const data = await initUpload(params, lang)
      initData.value = data

      // 加载已有文件列表
      await loadFileList('', params)

      // 尝试恢复未完成的上传
      await restorePendingUploads(params)

      return data
    }
    catch (error: any) {
      Message.error(`初始化失败: ${error.message || '未知错误'}`)
      return null
    }
    finally {
      initLoading.value = false
    }
  }

  /**
   * 加载文件列表
   */
  async function loadFileList(relativeDir: string, params: string): Promise<FileListData | null> {
    try {
      const data = await getFileList(relativeDir, params)
      fileListData.value = data
      return data
    }
    catch (error: any) {
      Message.error(`获取文件列表失败: ${error.message || '未知错误'}`)
      return null
    }
  }

  /**
   * 恢复未完成的上传
   */
  async function restorePendingUploads(params: string): Promise<void> {
    // 从 IndexedDB 获取未完成的上传记录
    const pendingRecords = await getPendingUploadRecords(params)
    
    for (const record of pendingRecords) {
      // 检查是否已有相同的文件在上传列表中
      const existing = uploadFileList.value.find(f => f.id === record.fileUUID)
      if (existing) continue
      
      // 创建上传项（但不自动开始上传）
      uploadFileList.value.push({
        id: record.fileUUID,
        file: null as any, // 恢复的记录没有 File 对象
        status: 'paused',
        progress: 0,
        uploadedBytes: 0,
        speed: 0,
        relativeDir: record.relativeDir,
        totalChunks: record.totalChunks,
        uploadedChunks: [],
        selected: false,
      })
    }
  }

  /**
   * 获取待恢复的上传记录（简化版，从 IndexedDB 获取）
   */
  async function getPendingUploadRecords(params: string): Promise<UploadRecord[]> {
    // 这里返回空数组，实际应该从 IndexedDB 查询
    return []
  }

  /**
   * 查询服务端分片状态并对比
   */
  async function checkChunkStatus(
    fileUUID: string,
    relativeDir: string,
    params: string,
    totalChunks: number,
  ): Promise<{ skip: number[]; reupload: number[] }> {
    try {
      const response = await getUploadedChunks(fileUUID, relativeDir, params)
      
      if (!response.success || !response.data.chunks) {
        return { skip: [], reupload: Array.from({ length: totalChunks }, (_, i) => i) }
      }

      // 从 IndexedDB 获取本地分片信息
      const localChunks = await getChunksByFileUUID(fileUUID)
      const localChunkMap = new Map(localChunks.map(c => [c.chunkIndex, c]))

      const skip: number[] = []
      const reupload: number[] = []

      for (const serverChunk of response.data.chunks) {
        const localChunk = localChunkMap.get(serverChunk.index)

        // 分片不完整（大小校验）
        if (serverChunk.hash === 'partial' || 
            (serverChunk.index < totalChunks - 1 && serverChunk.size < CHUNK_SIZE)) {
          reupload.push(serverChunk.index)
          continue
        }

        // 本地没有记录，但服务端有完整分片 -> 跳过
        if (!localChunk) {
          skip.push(serverChunk.index)
          continue
        }

        // 哈希匹配 -> 跳过
        if (serverChunk.hash === localChunk.chunkHash) {
          skip.push(serverChunk.index)
        } else {
          // 哈希不匹配 -> 重新上传
          reupload.push(serverChunk.index)
        }
      }

      // 服务端没有记录的分片 -> 需要上传
      const serverIndexes = new Set(response.data.chunks.map(c => c.index))
      for (let i = 0; i < totalChunks; i++) {
        if (!serverIndexes.has(i) && !skip.includes(i) && !reupload.includes(i)) {
          reupload.push(i)
        }
      }

      return { skip, reupload }
    }
    catch (error) {
      // 查询失败，需要重新上传所有分片
      return { skip: [], reupload: Array.from({ length: totalChunks }, (_, i) => i) }
    }
  }

  /**
   * 上传单个分片（带哈希）
   */
  async function uploadSingleChunk(
    file: File,
    fileUUID: string,
    chunkIndex: number,
    totalChunks: number,
    params: string,
    onProgress?: (percent: number) => void,
  ): Promise<void> {
    const start = chunkIndex * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunkBlob = file.slice(start, end)

    // 计算分片哈希
    const chunkHash = await calculateChunkHash(chunkBlob)

    const formData = new FormData()
    formData.append('file', chunkBlob)
    formData.append('qquuid', fileUUID)
    formData.append('qqpartindex', String(chunkIndex))
    formData.append('qqtotalparts', String(totalChunks))
    formData.append('qqfilename', file.name)
    formData.append('qqtotalfilesize', String(file.size))

    await apiUploadChunk(formData, params, onProgress)

    // 保存分片信息到 IndexedDB
    await saveChunk({
      fileUUID,
      chunkIndex,
      chunkHash,
      chunkSize: chunkBlob.size,
    })
  }

  /**
   * 上传文件（支持分片、断点续传、哈希校验、并发控制）
   */
  async function uploadFile(
    file: File,
    params: string,
    relativeDir = '',
    onProgress?: (item: TransUploadFileItem) => void,
  ): Promise<boolean> {
    if (!initData.value) {
      Message.error('请先初始化上传页面')
      return false
    }

    const fileUUID = generateFileUUID(file)
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

    // 创建上传项
    const uploadItem: TransUploadFileItem = {
      id: fileUUID,
      file,
      status: 'uploading',
      progress: 0,
      uploadedBytes: 0,
      speed: 0,
      relativeDir,
      totalChunks,
      uploadedChunks: [],
      selected: false,
      startTime: Date.now(),
    }
    uploadFileList.value.push(uploadItem)

    // 创建上传记录到 IndexedDB
    await createUploadRecord({
      fileUUID,
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      uploadParams: params,
      relativeDir,
      status: 'uploading',
    })

    // 创建 AbortController
    const controller = new AbortController()
    abortControllers.set(fileUUID, controller)

    try {
      // 查询已上传分片（断点续传）
      const { skip, reupload } = await checkChunkStatus(fileUUID, relativeDir, params, totalChunks)
      uploadItem.uploadedChunks = skip

      let uploadedCount = skip.length
      uploadItem.progress = Math.floor((uploadedCount / totalChunks) * 100)
      uploadItem.uploadedBytes = uploadedCount * CHUNK_SIZE
      onProgress?.(uploadItem)

      // 等待并发队列有空位
      while (activeUploads.value >= MAX_CONCURRENT_UPLOADS) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      activeUploads.value++
      uploading.value = true

      // 上传缺失的分片
      for (const chunkIndex of reupload) {
        if (controller.signal.aborted) {
          uploadItem.status = 'paused'
          uploadItem.speed = 0
          await updateUploadStatus(fileUUID, 'paused')
          onProgress?.(uploadItem)
          return false
        }

        await uploadSingleChunk(file, fileUUID, chunkIndex, totalChunks, params)

        uploadedCount++
        const elapsed = (Date.now() - (uploadItem.startTime || Date.now())) / 1000
        uploadItem.progress = Math.floor((uploadedCount / totalChunks) * 100)
        uploadItem.uploadedBytes = Math.min(uploadedCount * CHUNK_SIZE, file.size)
        uploadItem.speed = elapsed > 0 ? uploadItem.uploadedBytes / elapsed : 0
        uploadItem.uploadedChunks!.push(chunkIndex)

        onProgress?.(uploadItem)
      }

      // 客户端哈希计算
      uploadItem.status = 'hashing'
      uploadItem.hashState = {
        clientHash: '',
        serverHash: '',
        status: 'calculating',
      }
      onProgress?.(uploadItem)

      const clientHash = await calculateSHA256(file)
      uploadItem.hashState!.clientHash = clientHash
      uploadItem.hashState!.status = 'verifying'

      // 更新客户端哈希到服务端
      await updateClientHash(file.name, relativeDir, clientHash)

      // 获取服务端哈希并校验（轮询）
      uploadItem.status = 'verifying'
      onProgress?.(uploadItem)

      let verifyAttempts = 0
      const maxAttempts = 30

      while (verifyAttempts < maxAttempts) {
        if (controller.signal.aborted) {
          uploadItem.status = 'paused'
          return false
        }

        const relativeFileName = relativeDir ? `${relativeDir}/${file.name}` : file.name
        const hashResult = await getServerHash(relativeFileName, params)

        if (hashResult.success && hashResult.error) {
          const parts = hashResult.error.split(',')
          if (parts.length >= 2) {
            const serverHash = parts[1]
            uploadItem.hashState!.serverHash = serverHash

            if (serverHash === clientHash) {
              uploadItem.hashState!.status = 'matched'
              break
            } else {
              uploadItem.hashState!.status = 'mismatched'
              uploadItem.status = 'error'
              uploadItem.error = '文件哈希校验失败，文件可能已损坏'
              return false
            }
          }
        }

        verifyAttempts++
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      if (verifyAttempts >= maxAttempts) {
        uploadItem.hashState!.status = 'mismatched'
        uploadItem.status = 'error'
        uploadItem.error = '哈希校验超时'
        return false
      }

      // 完成
      uploadItem.status = 'completed'
      uploadItem.progress = 100
      uploadItem.speed = 0
      await updateUploadStatus(fileUUID, 'completed', { completedAt: new Date() })
      onProgress?.(uploadItem)

      return true
    }
    catch (error: any) {
      uploadItem.status = 'error'
      uploadItem.error = error.message || '上传失败'
      await updateUploadStatus(fileUUID, 'failed')
      onProgress?.(uploadItem)
      return false
    }
    finally {
      activeUploads.value = Math.max(0, activeUploads.value - 1)
      uploading.value = activeUploads.value > 0
      abortControllers.delete(fileUUID)
    }
  }

  /**
   * 批量上传文件（并发控制）
   */
  async function uploadFiles(
    files: File[],
    params: string,
    relativeDir = '',
    onProgress?: (item: TransUploadFileItem) => void,
  ): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    // 并发上传（使用 Promise.all + 并发限制）
    const uploadPromises = files.map(file => 
      uploadFile(file, params, relativeDir, onProgress)
        .then(result => {
          if (result) success++
          else failed++
        })
    )

    await Promise.all(uploadPromises)

    return { success, failed }
  }

  /**
   * 确认上传完成
   */
  async function confirmUpload(params: string): Promise<boolean> {
    try {
      const result = await completeUpload(params)
      if (result.success) {
        Message.success('上传确认成功')
        return true
      } else {
        Message.error(result.error || '上传确认失败')
        return false
      }
    }
    catch (error: any) {
      Message.error(`上传确认失败: ${error.message || '未知错误'}`)
      return false
    }
  }

  /**
   * 暂停上传
   */
  async function pauseUpload(fileId: string, params: string): Promise<void> {
    const controller = abortControllers.get(fileId)
    if (controller) {
      controller.abort()
      abortControllers.delete(fileId)
    }

    const item = uploadFileList.value.find(f => f.id === fileId)
    if (item) {
      item.status = 'paused'
      item.speed = 0
      
      // 调用后端暂停接口
      try {
        await apiPauseUpload(item.file.name, item.relativeDir, params)
      } catch (e) {
        // 忽略暂停接口错误
      }

      await updateUploadStatus(fileId, 'paused')
    }

    Message.info('上传已暂停')
  }

  /**
   * 继续上传
   */
  async function resumeUpload(
    fileId: string,
    params: string,
    onProgress?: (item: TransUploadFileItem) => void,
  ): Promise<boolean> {
    const item = uploadFileList.value.find(f => f.id === fileId)
    if (!item || !item.file) {
      Message.error('找不到上传文件')
      return false
    }

    // 重置状态
    item.status = 'pending'
    item.error = undefined
    item.startTime = Date.now()

    return uploadFile(item.file, params, item.relativeDir, onProgress)
  }

  /**
   * 删除文件
   */
  async function removeFiles(
    files: Array<{ fileName: string; relativeDir: string }>,
    params: string,
  ): Promise<boolean> {
    try {
      const result = await deleteFiles(files, params)
      if (result.success) {
        Message.success('文件删除成功')
        // 刷新文件列表
        if (initData.value) {
          await loadFileList('', params)
        }
        return true
      } else {
        Message.error(result.error || '文件删除失败')
        return false
      }
    }
    catch (error: any) {
      Message.error(`文件删除失败: ${error.message || '未知错误'}`)
      return false
    }
  }

  /**
   * 取消上传（删除文件和记录）
   */
  async function cancelUpload(fileId: string): Promise<void> {
    // 中止上传
    const controller = abortControllers.get(fileId)
    if (controller) {
      controller.abort()
      abortControllers.delete(fileId)
    }

    // 清理 IndexedDB 数据
    await deleteChunksByFileUUID(fileId)
    await deleteUploadRecord(fileId)

    // 从列表中移除
    const index = uploadFileList.value.findIndex(f => f.id === fileId)
    if (index >= 0) {
      uploadFileList.value.splice(index, 1)
    }

    Message.success('已取消上传')
  }

  /**
   * 重试上传
   */
  async function retryUpload(
    fileId: string,
    params: string,
    onProgress?: (item: TransUploadFileItem) => void,
  ): Promise<boolean> {
    const item = uploadFileList.value.find(f => f.id === fileId)
    if (!item || !item.file) {
      return false
    }

    // 重置状态
    item.status = 'pending'
    item.progress = 0
    item.uploadedBytes = 0
    item.speed = 0
    item.error = undefined
    item.hashState = undefined
    item.startTime = Date.now()

    // 清理旧的分片记录
    await deleteChunksByFileUUID(fileId)

    return uploadFile(item.file, params, item.relativeDir, onProgress)
  }

  // ============ 批量操作 ============

  /**
   * 全选/取消全选
   */
  function toggleSelectAll(selected: boolean): void {
    uploadFileList.value.forEach(item => {
      // 只选择可以操作的文件（非上传中）
      if (item.status !== 'uploading') {
        item.selected = selected
      }
    })
  }

  /**
   * 批量暂停
   */
  async function batchPause(params: string): Promise<void> {
    const selected = uploadFileList.value.filter(f => f.selected && f.status === 'uploading')
    for (const item of selected) {
      await pauseUpload(item.id, params)
    }
    Message.success(`已暂停 ${selected.length} 个文件`)
  }

  /**
   * 批量继续
   */
  async function batchResume(params: string, onProgress?: (item: TransUploadFileItem) => void): Promise<void> {
    const selected = uploadFileList.value.filter(f => f.selected && f.status === 'paused')
    for (const item of selected) {
      await resumeUpload(item.id, params, onProgress)
    }
  }

  /**
   * 批量取消
   */
  async function batchCancel(): Promise<void> {
    const selected = uploadFileList.value.filter(f => f.selected && f.status !== 'uploading')
    for (const item of selected) {
      await cancelUpload(item.id)
    }
    Message.success(`已取消 ${selected.length} 个文件`)
  }

  /**
   * 批量删除已上传文件
   */
  async function batchDeleteUploaded(params: string): Promise<void> {
    const selected = uploadFileList.value.filter(f => f.selected && f.status === 'completed')
    if (selected.length === 0) {
      Message.warning('请选择已完成的文件')
      return
    }

    const files = selected.map(item => ({
      fileName: item.file.name,
      relativeDir: item.relativeDir,
    }))

    const success = await removeFiles(files, params)
    if (success) {
      // 从列表中移除
      uploadFileList.value = uploadFileList.value.filter(f => !f.selected || f.status !== 'completed')
    }
  }

  /**
   * 清空已完成
   */
  function clearCompleted(): void {
    const count = uploadFileList.value.filter(f => f.status === 'completed').length
    uploadFileList.value = uploadFileList.value.filter(f => f.status !== 'completed')
    if (count > 0) {
      Message.success(`已清空 ${count} 个已完成文件`)
    }
  }

  /**
   * 清理过期数据
   */
  async function cleanupExpiredData(): Promise<void> {
    const completed = await cleanCompletedRecords(7)
    const failed = await cleanFailedRecords(30)
    if (completed > 0 || failed > 0) {
      console.log(`清理完成: ${completed} 个已完成记录, ${failed} 个失败记录`)
    }
  }

  return {
    // 状态
    uploading,
    initLoading,
    initData,
    fileListData,
    uploadFileList,
    selectedFiles,
    hasSelection,

    // 方法
    initialize,
    loadFileList,
    uploadFile,
    uploadFiles,
    confirmUpload,
    pauseUpload,
    resumeUpload,
    removeFiles,
    cancelUpload,
    retryUpload,
    clearCompleted,
    cleanupExpiredData,

    // 批量操作
    toggleSelectAll,
    batchPause,
    batchResume,
    batchCancel,
    batchDeleteUploaded,

    // 工具函数
    formatSpeed,
    formatFileSize,
    generateFileUUID,
  }
}

export default useTransUpload
