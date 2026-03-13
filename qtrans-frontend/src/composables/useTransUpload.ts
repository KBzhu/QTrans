/**
 * TransWebService 文件上传 Composable
 * 按照文档规范实现分片上传、哈希校验等功能
 */
import { Message } from '@arco-design/web-vue'
import { ref, shallowRef } from 'vue'
import {
  type FileEntity,
  type FileListData,
  type UploadInitResponse,
  type UploadProgress,
  calculateSHA256,
  completeUpload,
  deleteFiles,
  getChunkSize,
  getFileList,
  getServerHash,
  initUpload,
  updateClientHash,
  uploadChunk as apiUploadChunk,
} from '@/api/transWebService'

/** 分片大小 */
const CHUNK_SIZE = getChunkSize()

/** 哈希校验状态 */
export interface HashVerifyState {
  clientHash: string
  serverHash: string
  status: 'pending' | 'calculating' | 'verifying' | 'matched' | 'mismatched'
  error?: string
}

/** 上传文件项 */
export interface TransUploadFileItem {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'hashing' | 'verifying' | 'completed' | 'error' | 'paused'
  progress: number
  uploadedBytes: number
  speed: number
  relativeDir: string
  hashState?: HashVerifyState
  error?: string
  startTime?: number
}

/** AbortController 映射表 */
const abortControllers = new Map<string, AbortController>()

/**
 * 生成文件唯一标识
 */
function generateFileId(file: File, applicationId: string | number): string {
  return `${applicationId}-${file.name}-${file.size}-${file.lastModified}`
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
 * TransWebService 上传 Composable
 */
export function useTransUpload() {
  const uploading = ref(false)
  const initLoading = ref(false)
  const initData = shallowRef<UploadInitResponse | null>(null)
  const fileListData = shallowRef<FileListData | null>(null)
  const uploadFileList = ref<TransUploadFileItem[]>([])

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
   * 上传单个分片
   */
  async function uploadSingleChunk(
    file: File,
    fileId: string,
    chunkIndex: number,
    totalChunks: number,
    params: string,
    onProgress?: (percent: number) => void,
  ): Promise<void> {
    const start = chunkIndex * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunkBlob = file.slice(start, end)

    const formData = new FormData()
    formData.append('file', chunkBlob)
    formData.append('qquuid', fileId)
    formData.append('qqpartindex', String(chunkIndex))
    formData.append('qqtotalparts', String(totalChunks))
    formData.append('qqfilename', file.name)
    formData.append('qqtotalfilesize', String(file.size))

    await apiUploadChunk(formData, params, onProgress)
  }

  /**
   * 上传文件（支持分片、断点续传、哈希校验）
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

    const fileId = generateFileId(file, initData.value.applicationId)
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

    // 创建上传项
    const uploadItem: TransUploadFileItem = {
      id: fileId,
      file,
      status: 'uploading',
      progress: 0,
      uploadedBytes: 0,
      speed: 0,
      relativeDir,
      startTime: Date.now(),
    }
    uploadFileList.value.push(uploadItem)

    // 创建 AbortController
    const controller = new AbortController()
    abortControllers.set(fileId, controller)

    uploading.value = true

    try {
      // 第一阶段：分片上传
      for (let i = 0; i < totalChunks; i++) {
        if (controller.signal.aborted) {
          uploadItem.status = 'paused'
          uploadItem.speed = 0
          onProgress?.(uploadItem)
          return false
        }

        await uploadSingleChunk(file, fileId, i, totalChunks, params)

        const progress = ((i + 1) / totalChunks) * 100
        const elapsed = (Date.now() - (uploadItem.startTime || Date.now())) / 1000
        uploadItem.progress = Math.floor(progress)
        uploadItem.uploadedBytes = (i + 1) * CHUNK_SIZE
        uploadItem.speed = elapsed > 0 ? uploadItem.uploadedBytes / elapsed : 0

        onProgress?.(uploadItem)
      }

      // 第二阶段：客户端哈希计算（Mock）
      uploadItem.status = 'hashing'
      uploadItem.hashState = {
        clientHash: '',
        serverHash: '',
        status: 'calculating',
      }
      onProgress?.(uploadItem)

      // 使用 Web Crypto API 计算 SHA-256
      const clientHash = await calculateSHA256(file)
      uploadItem.hashState!.clientHash = clientHash
      uploadItem.hashState!.status = 'verifying'

      // 更新客户端哈希到服务端
      await updateClientHash(file.name, relativeDir, clientHash)

      // 第三阶段：获取服务端哈希并校验（轮询）
      uploadItem.status = 'verifying'
      onProgress?.(uploadItem)

      let verifyAttempts = 0
      const maxAttempts = 30 // 最多轮询30次，每次3秒，共90秒

      while (verifyAttempts < maxAttempts) {
        if (controller.signal.aborted) {
          uploadItem.status = 'paused'
          return false
        }

        const relativeFileName = relativeDir ? `${relativeDir}/${file.name}` : file.name
        const hashResult = await getServerHash(relativeFileName, params)

        if (hashResult.success && hashResult.error) {
          // error 字段格式为 "fileId,HASH_VALUE"
          const parts = hashResult.error.split(',')
          if (parts.length >= 2) {
            const serverHash = parts[1]
            uploadItem.hashState!.serverHash = serverHash

            if (serverHash === clientHash) {
              uploadItem.hashState!.status = 'matched'
              break
            }
            else {
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

      // 第四阶段：完成上传
      uploadItem.status = 'completed'
      uploadItem.progress = 100
      uploadItem.speed = 0
      onProgress?.(uploadItem)

      return true
    }
    catch (error: any) {
      uploadItem.status = 'error'
      uploadItem.error = error.message || '上传失败'
      onProgress?.(uploadItem)
      return false
    }
    finally {
      uploading.value = false
      abortControllers.delete(fileId)
    }
  }

  /**
   * 批量上传文件
   */
  async function uploadFiles(
    files: File[],
    params: string,
    relativeDir = '',
    onProgress?: (item: TransUploadFileItem) => void,
  ): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const file of files) {
      const result = await uploadFile(file, params, relativeDir, onProgress)
      if (result) {
        success++
      }
      else {
        failed++
      }
    }

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
      }
      else {
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
      }
      else {
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
   * 暂停上传
   */
  function pauseUpload(fileId: string): void {
    const controller = abortControllers.get(fileId)
    if (controller) {
      controller.abort()
      abortControllers.delete(fileId)

      const item = uploadFileList.value.find(f => f.id === fileId)
      if (item) {
        item.status = 'paused'
        item.speed = 0
      }

      Message.info('上传已暂停')
    }
  }

  /**
   * 取消上传
   */
  function cancelUpload(fileId: string): void {
    pauseUpload(fileId)

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

    return uploadFile(item.file, params, item.relativeDir, onProgress)
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

  return {
    // 状态
    uploading,
    initLoading,
    initData,
    fileListData,
    uploadFileList,

    // 方法
    initialize,
    loadFileList,
    uploadFile,
    uploadFiles,
    confirmUpload,
    removeFiles,
    pauseUpload,
    cancelUpload,
    retryUpload,
    clearCompleted,

    // 工具函数
    formatSpeed,
    generateFileId,
  }
}

export default useTransUpload
