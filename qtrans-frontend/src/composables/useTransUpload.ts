/**
 * TransWebService 文件上传 Composable
 * 支持分片上传、断点续传、哈希校验、批量操作
 */
import { Message } from '@arco-design/web-vue'
import { ref, shallowRef, computed } from 'vue'
import {
  type FileListData,
  type UploadInitResponse,
  type UploadResponse,
  calculateSHA256,
  calculateChunkHash,
  cancelUploadApi,
  completeUpload,
  deleteFiles,
  getChunkSize,
  getFileList,
  getServerHash,
  getStorageInfo,
  getUploadedChunks,
  initUpload,
  pauseUpload as apiPauseUpload,
  updateClientHash,
  uploadChunk as apiUploadChunk,
} from '@/api/transWebService'
import { classifyUploadError, UploadErrorType } from '@/types/upload-error'
import {
  type UploadRecord,
  createUploadRecord,
  deleteChunksByFileUUID,
  deleteUploadRecord,
  getChunksByFileUUID,
  saveChunk,
  updateUploadStatus,
  cleanCompletedRecords,
  cleanFailedRecords,
} from '@/utils/upload-db'

/** 分片大小 */
const CHUNK_SIZE = getChunkSize()

/** 最大并发上传数 */
const MAX_CONCURRENT_UPLOADS = 3

/** 自动重试最大次数（对齐老代码 FineUploader autoAttempts: 3） */
const MAX_AUTO_RETRY = 3

/** 自动重试间隔（毫秒） */
const AUTO_RETRY_DELAY = 2000

/** 小文件阈值（字节），小于此值时在上传前预计算哈希（对齐老代码 onUpload 逻辑） */
const SMALL_FILE_THRESHOLD = 4 * 1024 * 1024 // 4MB

/** 哈希校验状态 */
export interface HashVerifyState {
  clientHash: string
  serverHash: string
  status: 'pending' | 'calculating' | 'verifying' | 'matched' | 'mismatched'
  error?: string
  /** 服务端计算耗时（秒） */
  elapsedTime?: string
  /** 服务端预估剩余时间（秒） */
  timeLeft?: string
}

/** 上传文件项 */
export interface TransUploadFileItem {
  id: string                    // 文件唯一标识 (UUID)
  file: File                    // 原始文件对象
  status: 'pending' | 'uploading' | 'hashing' | 'verifying' | 'completed' | 'error' | 'paused'
  progress: number              // 上传进度 0-100
  speed: number                 // 上传速度 (bytes/s)
  relativeDir: string           // 上传目录
  hashState?: HashVerifyState   // 哈希校验状态
  error?: string                // 错误信息
  startTime?: number            // 开始时间
  totalChunks?: number          // 总分片数
  uploadedChunkCount: number    // 已上传分片数（用于进度计算）
  selected?: boolean            // 是否被选中（用于批量操作）
  retryCount?: number           // 自动重试次数（对齐老代码 retry.enableAuto）
  /** 服务端返回的最新预估剩余时间（秒），用于速率估算 */
  lastTimeLeft?: number
}

/**
 * 生成文件 UUID
 */
function generateFileUUID(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`
}

/**
 * 解析服务端返回的时间字符串为秒数
 * 服务端格式为 "HH:MM:SS"，如 "00:00:08" 表示 8 秒
 * @returns 秒数，解析失败返回 undefined
 */
function parseServerTime(timeStr: string | undefined): number | undefined {
  if (!timeStr) return undefined
  const parts = timeStr.split(':')
  if (parts.length !== 3) {
    // 尝试直接作为数字解析（兼容纯数字格式）
    const num = parseFloat(timeStr)
    return isNaN(num) ? undefined : num
  }
  const hours = parseInt(parts[0]!, 10)
  const minutes = parseInt(parts[1]!, 10)
  const seconds = parseFloat(parts[2]!)
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return undefined
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * 基于分片计数计算上传进度百分比
 * progress = uploadedChunkCount / totalChunks * 99
 * 上传阶段上限 99%，校验完成后设 100%
 */
function calcChunkProgress(uploadedChunkCount: number, totalChunks: number): number {
  if (totalChunks <= 0) return 0
  return Math.min(Math.floor((uploadedChunkCount / totalChunks) * 99), 99)
}

/**
 * 基于 timeLeft 估算上传速率
 * speed = 剩余字节数 / timeLeft(秒)
 */
function estimateSpeedFromFile(fileSize: number, uploadedChunkCount: number, chunkSize: number, timeLeftSec: number | undefined): number {
  if (!timeLeftSec || timeLeftSec <= 0) return 0
  const uploadedBytes = uploadedChunkCount * chunkSize
  const remainingBytes = fileSize - uploadedBytes
  if (remainingBytes <= 0) return 0
  return remainingBytes / timeLeftSec
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

  /** AbortController 映射表（实例级，避免多组件共享冲突） */
  const abortControllers = new Map<string, AbortController>()

  /** 当前活跃的上传队列 */
  const activeUploads = ref(0)
  
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
        speed: 0,
        relativeDir: record.relativeDir,
        totalChunks: record.totalChunks,
        uploadedChunkCount: 0,
        selected: false,
      })
    }
  }

  /**
   * 获取待恢复的上传记录（简化版，从 IndexedDB 获取）
   */
  async function getPendingUploadRecords(_params: string): Promise<UploadRecord[]> {
    // 这里返回空数组，实际应该从 IndexedDB 查询
    return []
  }

  /**
   * 查询服务端分片状态并对比
   */
  async function checkChunkStatus(
    fileUUID: string,
    fileName: string,
    relativeDir: string,
    params: string,
    totalChunks: number,
  ): Promise<{ skip: number[]; reupload: number[] }> {
    try {
      const response = await getUploadedChunks(fileUUID, fileName, relativeDir, params)
      
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
  ): Promise<UploadResponse> {
    const start = chunkIndex * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunkBlob = file.slice(start, end)

    // 计算分片哈希
    const chunkHash = await calculateChunkHash(chunkBlob)

    // 将 Blob 转换为 File，确保后端能正确识别文件名
    const chunkFile = new File([chunkBlob], file.name, { type: file.type || 'application/octet-stream' })

    const formData = new FormData()
    formData.append('file', chunkFile)
    formData.append('qquuid', fileUUID)
    formData.append('qqpartindex', String(chunkIndex))
    formData.append('qqtotalparts', String(totalChunks))
    formData.append('qqfilename', file.name)
    formData.append('qqtotalfilesize', String(file.size))
    formData.append('qqchunksize', String(chunkBlob.size))       // ✅ 分片实际大小
    formData.append('qqpartbyteoffset', String(start))           // ✅ 分片偏移量
    formData.append('act', 'add')                                 // ✅ 操作类型（必须！）
    formData.append('name', file.name)
    // P1-4: 对齐老代码 onUploadChunk，将分片哈希附到请求参数
    formData.append('qqhashcode', chunkHash)

    console.log(`[上传] 分片 ${chunkIndex + 1}/${totalChunks} 数据大小: ${chunkFile.size} bytes, 哈希: ${chunkHash.substring(0, 8)}...`)

    const result = await apiUploadChunk(formData, params, onProgress)

    // 检查上传结果
    if (!result.success) {
      console.error('[上传] 分片上传失败:', result.error)
      throw new Error(result.error || '分片上传失败')
    }

    // 保存分片信息到 IndexedDB
    await saveChunk({
      fileUUID,
      chunkIndex,
      chunkHash,
      chunkSize: chunkBlob.size,
      uploadedAt: new Date(),
    })

    return result
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
      speed: 0,
      relativeDir,
      totalChunks,
      uploadedChunkCount: 0,
      selected: false,
      startTime: Date.now(),
      retryCount: 0,
    }
    uploadFileList.value.push(uploadItem)
    // 获取 Vue Proxy 响应式引用，后续所有属性修改通过此引用进行
    // 这样可以直接触发 Proxy setter，确保 UI 响应式更新
    const ri = uploadFileList.value[uploadFileList.value.length - 1]!

    // P2-7: 对齐老代码 onUpload，小文件在上传前预计算哈希
    // 老代码逻辑：小文件先算 hash 附到请求参数，上传完成后不需要再等后端算哈希
    let preCalculatedHash = ''
    if (file.size <= SMALL_FILE_THRESHOLD) {
      try {
        preCalculatedHash = await calculateSHA256(file)
        console.log('[上传] 小文件预计算哈希:', preCalculatedHash.substring(0, 16) + '...')
      } catch (e) {
        console.warn('[上传] 小文件预计算哈希失败，将在上传后计算:', e)
      }
    }

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
      const { skip, reupload } = await checkChunkStatus(fileUUID, file.name, relativeDir, params, totalChunks)

      let uploadedCount = skip.length
      ri.uploadedChunkCount = uploadedCount
      ri.progress = calcChunkProgress(uploadedCount, totalChunks)
      onProgress?.(ri)

      // 等待并发队列有空位
      while (activeUploads.value >= MAX_CONCURRENT_UPLOADS) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      activeUploads.value++
      uploading.value = true

      // 上传缺失的分片
      for (const chunkIndex of reupload) {
        if (controller.signal.aborted) {
          ri.status = 'paused'
          ri.speed = 0
          await updateUploadStatus(fileUUID, 'paused')
          onProgress?.(ri)
          return false
        }

        console.log(`[上传] 分片 ${chunkIndex + 1}/${totalChunks} 开始上传`)

        const result = await uploadSingleChunk(
          file,
          fileUUID,
          chunkIndex,
          totalChunks,
          params,
          // 分片上传中不更新进度/速率（等分片完成后统一更新）
          undefined,
        )
        console.log(`[上传] 分片 ${chunkIndex + 1}/${totalChunks} 完成:`, result)

        // P2-9: 从响应获取 timeLeft（用于速率估算）
        if (result.timeLeft) {
          ri.lastTimeLeft = parseServerTime(result.timeLeft)
        }

        uploadedCount++
        ri.uploadedChunkCount = uploadedCount
        ri.progress = calcChunkProgress(uploadedCount, totalChunks)
        ri.speed = estimateSpeedFromFile(file.size, uploadedCount, CHUNK_SIZE, ri.lastTimeLeft)
        // DEBUG: 打印进度更新详情
        console.log(`[进度] 分片 ${chunkIndex + 1}/${totalChunks} 完成 → uploadedCount=${uploadedCount}, totalChunks=${totalChunks}, progress=${ri.progress}%, speed=${ri.speed.toFixed(0)} B/s, timeLeft=${ri.lastTimeLeft}s, fileSize=${file.size}`)

        // 保存到 hashState 供 UI 展示
        if (result.elapsedTime || result.timeLeft) {
          if (!ri.hashState) {
            ri.hashState = {
              clientHash: '',
              serverHash: '',
              status: 'pending',
              elapsedTime: result.elapsedTime,
              timeLeft: result.timeLeft,
            }
          } else {
            ri.hashState.elapsedTime = result.elapsedTime
            ri.hashState.timeLeft = result.timeLeft
          }
        }

        onProgress?.(ri)
      }

      console.log('[上传] 所有分片上传完成，开始哈希校验')

      // 客户端哈希计算
      ri.status = 'hashing'
      ri.hashState = {
        clientHash: '',
        serverHash: '',
        status: 'calculating',
        // 保留服务端耗时/剩余时间（分片上传阶段已获取）
        elapsedTime: ri.hashState?.elapsedTime,
        timeLeft: ri.hashState?.timeLeft,
      }
      onProgress?.(ri)

      // P2-7: 小文件可能已预计算过哈希，直接复用
      const clientHash = preCalculatedHash || await calculateSHA256(file)
      ri.hashState!.clientHash = clientHash
      console.log('[哈希校验] 客户端哈希:', clientHash.substring(0, 16) + '...')

      // 上传完成后立即将客户端哈希写入后端（与老代码一致）
      try {
        await updateClientHash(file.name, relativeDir, clientHash)
      } catch (e) {
        console.warn('[哈希校验] 更新客户端哈希失败，跳过:', e)
      }

      // 轮询获取服务端哈希并做前端比对校验（对齐老代码 validHashTimer + getServerHashTimer 逻辑）
      // 老代码逻辑：无限轮询，直到 clientFileHashCode 和 serverFileHashCode 都有值再比对
      ri.status = 'verifying'
      ri.hashState!.status = 'verifying'
      onProgress?.(ri)

      const relativeFileName = relativeDir ? `${relativeDir}/${file.name}` : file.name
      let serverHashValue = ''

      // 对齐老代码：无限轮询直到拿到服务端哈希（服务端大文件算哈希可能很慢）
      while (true) {
        if (controller.signal.aborted) {
          ri.status = 'paused'
          return false
        }

        console.log('[哈希校验] 查询服务端哈希...')

        try {
          const hashResult = await getServerHash(relativeFileName, params)

          if (hashResult.success && hashResult.error) {
            // 解析服务端哈希：error 格式为 "文件名%2C服务端哈希"
            const parts = hashResult.error.split('%2C')
            const parsedHash = parts.length > 1 ? parts[1] : hashResult.error

            // 对齐老代码：serverFileHashCode.length === 64 才视为有效
            if (parsedHash && parsedHash.length === 64) {
              serverHashValue = parsedHash.toUpperCase()
              ri.hashState!.serverHash = serverHashValue
              console.log('[哈希校验] 服务端哈希获取成功:', serverHashValue.substring(0, 16) + '...')
              break
            }
          }

          // 哈希还在计算中，继续等待
          console.log('[哈希校验] 服务端哈希计算中，3秒后重试...')
        } catch (e) {
          console.warn('[哈希校验] 查询服务端哈希失败:', e)
        }

        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      // 对齐老代码 validHashTimer：双端哈希都有值后进行比对
      if (serverHashValue === clientHash.toUpperCase()) {
        console.log('[哈希校验] 哈希校验通过，上传完成')
        ri.hashState!.status = 'matched'
      } else {
        console.warn('[哈希校验] 哈希不一致！客户端:', clientHash.toUpperCase(), '服务端:', serverHashValue)
        ri.hashState!.status = 'mismatched'
      }

      // 完成（无论 matched 还是 mismatched，都标记 completed，mismatched 会在 UI 展示警示）
      ri.status = 'completed'
      ri.progress = 100
      ri.speed = 0
      await updateUploadStatus(fileUUID, 'completed', { completedAt: new Date() })
      onProgress?.(ri)

      return true
    }
    catch (error: any) {
      // P0-1: 对齐老代码 onError，分类处理上传错误
      const errorInfo = classifyUploadError(error)

      ri.status = 'error'
      ri.error = errorInfo.message

      // 登录过期：触发全局事件
      if (errorInfo.type === UploadErrorType.AUTH_EXPIRED) {
        window.dispatchEvent(new CustomEvent('trans-token-expired'))
      }

      // P1-6: 对齐老代码 retry.enableAuto，可重试错误自动重试
      if (errorInfo.retryable && (ri.retryCount ?? 0) < MAX_AUTO_RETRY) {
        ri.retryCount = (ri.retryCount ?? 0) + 1
        console.log(`[上传] 自动重试 ${ri.retryCount}/${MAX_AUTO_RETRY}: ${file.name}`)

        // 重置上传状态，延迟后重试当前分片
        ri.status = 'uploading'
        ri.error = undefined
        await updateUploadStatus(fileUUID, 'uploading')

        // 延迟后重新走断点续传逻辑（会自动跳过已上传分片）
        await new Promise(resolve => setTimeout(resolve, AUTO_RETRY_DELAY))
        onProgress?.(ri)

        // 重新查询断点并继续上传缺失分片
        try {
          const { skip: retrySkip, reupload: retryReupload } = await checkChunkStatus(
            fileUUID, file.name, relativeDir, params, totalChunks,
          )
          ri.uploadedChunkCount = retrySkip.length

          for (const retryChunkIndex of retryReupload) {
            if (controller.signal.aborted) {
              ri.status = 'paused'
              return false
            }

            const retryResult = await uploadSingleChunk(
              file, fileUUID, retryChunkIndex, totalChunks, params,
              // 分片上传中不更新进度/速率
              undefined,
            )

            ri.uploadedChunkCount++
            ri.progress = calcChunkProgress(ri.uploadedChunkCount, totalChunks)

            if (retryResult.timeLeft) {
              ri.lastTimeLeft = parseServerTime(retryResult.timeLeft)
            }
            ri.speed = estimateSpeedFromFile(file.size, ri.uploadedChunkCount, CHUNK_SIZE, ri.lastTimeLeft)

            if (retryResult.elapsedTime || retryResult.timeLeft) {
              if (!ri.hashState) {
                ri.hashState = { clientHash: '', serverHash: '', status: 'pending', elapsedTime: retryResult.elapsedTime, timeLeft: retryResult.timeLeft }
              } else {
                ri.hashState.elapsedTime = retryResult.elapsedTime
                ri.hashState.timeLeft = retryResult.timeLeft
              }
            }
            onProgress?.(ri)
          }

          // 重试成功，继续哈希校验流程
          console.log('[上传] 重试上传完成，继续哈希校验')
          // 重新走哈希校验流程（直接跳到 hashing 阶段）
          ri.status = 'hashing'
          ri.hashState = {
            clientHash: '',
            serverHash: '',
            status: 'calculating',
            elapsedTime: ri.hashState?.elapsedTime,
            timeLeft: ri.hashState?.timeLeft,
          }
          onProgress?.(ri)

          const retryClientHash = preCalculatedHash || await calculateSHA256(file)
          ri.hashState!.clientHash = retryClientHash

          try {
            await updateClientHash(file.name, relativeDir, retryClientHash)
          } catch (e) {
            console.warn('[哈希校验] 更新客户端哈希失败:', e)
          }

          ri.status = 'verifying'
          ri.hashState!.status = 'verifying'
          onProgress?.(ri)

          const retryRelativeFileName = relativeDir ? `${relativeDir}/${file.name}` : file.name
          let retryServerHash = ''

          while (true) {
            if (controller.signal.aborted) {
              ri.status = 'paused'
              return false
            }
            try {
              const hashResult = await getServerHash(retryRelativeFileName, params)
              if (hashResult.success && hashResult.error) {
                const parts = hashResult.error.split('%2C')
                const parsedHash = parts.length > 1 ? parts[1] : hashResult.error
                if (parsedHash && parsedHash.length === 64) {
                  retryServerHash = parsedHash.toUpperCase()
                  ri.hashState!.serverHash = retryServerHash
                  break
                }
              }
            } catch (e) {
              console.warn('[哈希校验] 查询服务端哈希失败:', e)
            }
            await new Promise(resolve => setTimeout(resolve, 3000))
          }

          if (retryServerHash === retryClientHash.toUpperCase()) {
            ri.hashState!.status = 'matched'
          } else {
            ri.hashState!.status = 'mismatched'
          }

          ri.status = 'completed'
          ri.progress = 100
          ri.speed = 0
          await updateUploadStatus(fileUUID, 'completed', { completedAt: new Date() })
          onProgress?.(ri)
          return true
        } catch (retryError: any) {
          // 重试仍然失败
          ri.status = 'error'
          ri.error = retryError.message || '重试上传失败'
          await updateUploadStatus(fileUUID, 'failed')
          onProgress?.(ri)
          return false
        }
      }

      await updateUploadStatus(fileUUID, 'failed')
      onProgress?.(ri)
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
   * P0-2: 对齐老代码 onCancel，通知后端清理临时文件
   */
  async function cancelUpload(fileId: string, params?: string): Promise<void> {
    // 中止上传
    const controller = abortControllers.get(fileId)
    if (controller) {
      controller.abort()
      abortControllers.delete(fileId)
    }

    // P0-2: 对齐老代码 onCancel，通知后端取消上传并清理临时分片
    const item = uploadFileList.value.find(f => f.id === fileId)
    if (item && params) {
      try {
        await cancelUploadApi(item.file.name, item.relativeDir, params)
        console.log('[取消上传] 已通知后端清理临时文件:', item.file.name)
      } catch (e) {
        console.warn('[取消上传] 通知后端取消失败（忽略）:', e)
      }
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
    item.uploadedChunkCount = 0
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
  async function batchCancel(params?: string): Promise<void> {
    const selected = uploadFileList.value.filter(f => f.selected && f.status !== 'uploading')
    for (const item of selected) {
      await cancelUpload(item.id, params)
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

  /**
   * P1-5: 检查存储空间是否充足
   * 对齐老代码 onValidate: 检查总空间是否超限
   */
  async function checkStorageSpace(params: string, fileSize: number): Promise<boolean> {
    try {
      const storageInfo = await getStorageInfo(params)
      if (!storageInfo.success) return true // 查询失败不阻止上传

      const remainingSpace = storageInfo.totalSize - storageInfo.usedSize
      if (remainingSpace < fileSize) {
        Message.error(`存储空间不足，剩余 ${formatFileSize(remainingSpace)}，需要 ${formatFileSize(fileSize)}`)
        return false
      }
      return true
    } catch (e) {
      console.warn('[存储空间] 查询失败，跳过校验:', e)
      return true
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
    checkStorageSpace,

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
