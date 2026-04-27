/**
 * TransWebService 文件上传 Composable
 * 支持分片上传、断点续传、哈希校验、批量操作
 */
import { Message } from '@arco-design/web-vue'
import { ref, shallowRef, computed } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import {
  type FileListData,
  type UploadInitResponse,
  type UploadResponse,
  cancelUploadApi,
  cacheRefresh,
  completeUpload,
  continueUploadApi,
  refreshTransToken,
  deleteFiles,
  formatFileSize as fmtSize,
  formatSpeed as fmtSpeed,
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
import { useHashWorker, type StreamFileHasher } from '@/composables/useHashWorker'
import { useUploadPrepWorker } from '@/composables/useUploadPrepWorker'
import { classifyUploadError, UploadErrorType } from '@/types/upload-error'


import {
  createUploadRecord,
  deleteChunksByFileUUID,
  deleteUploadRecord,
  getPendingUploads,
  getUploadedChunkIndexes,
  getUploadRecord,
  saveChunk,
  updateUploadRecord,
  updateUploadStatus,
  cleanCompletedRecords,
  cleanFailedRecords,
} from '@/utils/upload-db'

/** 分片大小 */
const CHUNK_SIZE = getChunkSize()

/** 最大并发上传数 localStorage key */
const MAX_CONCURRENT_KEY = 'qtrans_max_concurrent_uploads'
/** 最大并发上传数默认值 */
const DEFAULT_MAX_CONCURRENT = 3
/** 最大并发上传数上限 */
const MAX_CONCURRENT_LIMIT = 10

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
  /** 文件名称（用于 IndexedDB 恢复后展示，因为 File 对象无法持久化） */
  fileName?: string
  /** 文件大小（用于 IndexedDB 恢复后展示） */
  fileSize?: number
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

  /** 最大并发上传数（支持用户调整并持久化到 localStorage） */
  const maxConcurrentUploads = ref(DEFAULT_MAX_CONCURRENT)
  try {
    const stored = localStorage.getItem(MAX_CONCURRENT_KEY)
    if (stored) {
      const n = Number.parseInt(stored, 10)
      if (!Number.isNaN(n) && n >= 1 && n <= MAX_CONCURRENT_LIMIT) {
        maxConcurrentUploads.value = n
      }
    }
  }
  catch {
    // localStorage 不可用则忽略
  }

  /** Task 7: Session 保活定时器上下文 */
  const sessionKeepAliveParams = ref('')
  /** Session 保活间隔（毫秒）：每 25 秒调用 act=cache 刷新服务端缓存 */
  const SESSION_KEEP_ALIVE_INTERVAL = 25_000

  /** Task 8: Trans Token 自动刷新定时器上下文 */
  const transTokenRefreshParams = ref('')
  const transTokenRefreshLang = ref('zh_CN')
  /** Token 刷新间隔（毫秒）：每 60 秒调用 /client/refreshToken，对标老代码 refreshToken() 定时器 */
  const TRANS_TOKEN_REFRESH_INTERVAL = 60_000

  const {
    calculateFileHashInWorker,
    createStreamFileHasher,
  } = useHashWorker()

  const {
    prepareUploadChunk,
    readChunkBuffer,
  } = useUploadPrepWorker()


  const {
    pause: pauseSessionKeepAliveTimer,
    resume: resumeSessionKeepAliveTimer,
  } = useIntervalFn(async () => {
    if (!sessionKeepAliveParams.value) return

    try {
      await cacheRefresh(sessionKeepAliveParams.value)
      console.log('[Session保活] act=cache 调用成功')
    }
    catch (e) {
      console.warn('[Session保活] act=cache 调用失败:', e)
    }
  }, SESSION_KEEP_ALIVE_INTERVAL, { immediate: false })

  const {
    pause: pauseTransTokenRefreshTimer,
    resume: resumeTransTokenRefreshTimer,
  } = useIntervalFn(async () => {
    if (!transTokenRefreshParams.value) return

    const result = await refreshTransToken(transTokenRefreshParams.value, transTokenRefreshLang.value)
    if (result.success) {
      console.log('[Token刷新] trans token 已更新')
    }
  }, TRANS_TOKEN_REFRESH_INTERVAL, { immediate: false })

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

      // Task 7: 启动 Session 保活定时器（对标老代码 cacheRefreshTimer）
      startSessionKeepAlive(params)

      // Task 8: 启动 Trans Token 自动刷新定时器（每 60 秒，对标老代码 refreshToken）
      startTransTokenRefresh(params, lang)

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
   * Task 7: 启动 Session 保活定时器
   * 对标老代码：定期调用 act=cache 刷新服务端缓存、保持 session 活跃
   */
  function startSessionKeepAlive(params: string) {
    sessionKeepAliveParams.value = params
    pauseSessionKeepAliveTimer()
    resumeSessionKeepAliveTimer()
    console.log(`[Session保活] 已启动定时器（间隔 ${SESSION_KEEP_ALIVE_INTERVAL / 1000}s）`)
  }

  /**
   * Task 7: 停止 Session 保活定时器
   */
  function stopSessionKeepAlive() {
    sessionKeepAliveParams.value = ''
    pauseSessionKeepAliveTimer()
    console.log('[Session保活] 定时器已停止')
  }

  /**
   * Task 8: 启动 Trans Token 自动刷新定时器
   * 对标老代码：每 60 秒调用 /client/refreshToken 获取新 token
   * 与 Session 保活定时器（25s）并行运行，互不干扰
   *
   * @param params 申请单参数
   * @param lang 语言（用于 refreshToken 接口）
   */
  function startTransTokenRefresh(params: string, lang = 'zh_CN') {
    transTokenRefreshParams.value = params
    transTokenRefreshLang.value = lang
    pauseTransTokenRefreshTimer()
    resumeTransTokenRefreshTimer()
    console.log(`[Token刷新] 已启动定时器（间隔 ${TRANS_TOKEN_REFRESH_INTERVAL / 1000}s）`)
  }

  /**
   * Task 8: 停止 Trans Token 自动刷新定时器
   */
  function stopTransTokenRefresh() {
    transTokenRefreshParams.value = ''
    pauseTransTokenRefreshTimer()
    console.log('[Token刷新] 定时器已停止')
  }


  let fileListAbortController: AbortController | null = null

  /**
   * 加载文件列表
   */
  async function loadFileList(relativeDir: string, params: string): Promise<FileListData | null> {
    fileListAbortController?.abort()
    fileListAbortController = new AbortController()
    const signal = fileListAbortController.signal
    try {
      const data = await getFileList(relativeDir, params, signal)
      fileListData.value = data
      return data
    }
    catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'canceled' || error.code === 'ERR_CANCELED') {
        console.log('[loadFileList] 请求已取消')
        return null
      }
      Message.error(`获取文件列表失败: ${error.message || '未知错误'}`)
      return null
    }
    finally {
      if (fileListAbortController?.signal === signal) {
        fileListAbortController = null
      }
    }
  }

  function abortFileListRequest() {
    fileListAbortController?.abort()
    fileListAbortController = null
  }

  /** 防抖刷新（Task 6）：避免频繁刷新请求击垮后端 */
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function debouncedLoadFileList(relativeDir: string, params: string): Promise<FileListData | null> {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    return new Promise((resolve) => {
      debounceTimer = setTimeout(async () => {
        debounceTimer = null
        const result = await loadFileList(relativeDir, params)
        resolve(result)
      }, 500)
    })
  }

  function cancelDebouncedLoadFileList() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  /**
   * 恢复未完成的上传
   * 从 IndexedDB 读取未完成任务，恢复到上传列表中（状态为 paused，需用户手动继续）
   */
  async function restorePendingUploads(params: string): Promise<void> {
    const pendingRecords = await getPendingUploads(params)

    for (const record of pendingRecords) {
      // 检查是否已有相同的文件在上传列表中
      const existing = uploadFileList.value.find((f: TransUploadFileItem) => f.id === record.fileUUID)
      if (existing) continue

      // 从 IndexedDB 查询本地已上传的分片数
      const localChunkIndexes = await getUploadedChunkIndexes(record.fileUUID)
      const localUploadedCount = localChunkIndexes.size
      const progress = record.totalChunks > 0
        ? Math.min(Math.floor((localUploadedCount / record.totalChunks) * 99), 99)
        : 0

      // 创建上传项（状态为 paused，需用户手动选择文件后继续）
      uploadFileList.value.push({
        id: record.fileUUID,
        file: null as any, // 恢复的记录没有 File 对象，需用户重新选择
        status: 'paused',
        progress,
        speed: 0,
        relativeDir: record.relativeDir,
        totalChunks: record.totalChunks,
        uploadedChunkCount: localUploadedCount,
        selected: false,
        fileName: record.fileName,
        fileSize: record.fileSize,
      })

      console.log(`[断点续传] 恢复任务: ${record.fileName}, 已传分片: ${localUploadedCount}/${record.totalChunks}`)
    }
  }

  /**
   * 查询分片状态并对比（IndexedDB + 服务端双重校验）
   * 优先使用 IndexedDB 本地记录，再与服务端记录合并，减少不必要的网络请求
   */
  async function checkChunkStatus(
    fileUUID: string,
    fileName: string,
    relativeDir: string,
    params: string,
    totalChunks: number,
  ): Promise<{ skip: number[]; reupload: number[] }> {
    // 1. 先查本地 IndexedDB 已传分片
    const localChunkIndexes = await getUploadedChunkIndexes(fileUUID)
    console.log(`[断点续传] 本地 IndexedDB 已传分片: ${localChunkIndexes.size} 个`)

    try {
      // 2. 再查服务端已传分片
      const response = await getUploadedChunks(fileUUID, fileName, relativeDir, params)

      if (!response.success || !response.data.chunks) {
        // 服务端查询失败，回退到本地记录
        const skip = Array.from(localChunkIndexes)
        const reupload = Array.from({ length: totalChunks }, (_, i) => i)
          .filter(i => !localChunkIndexes.has(i))
        console.log(`[断点续传] 服务端查询失败，使用本地记录: skip=${skip.length}`)
        return { skip, reupload }
      }

      const skip: number[] = []
      const reupload: number[] = []
      const serverIndexes = new Set<number>()

      for (const serverChunk of response.data.chunks) {
        serverIndexes.add(serverChunk.index)
        const isLastChunk = serverChunk.index === totalChunks - 1

        // 分片数据完整性校验：hash=partial 仅表示服务端哈希未算完，不代表数据不完整
        // 需通过 size 判断：非最后分片 size >= CHUNK_SIZE、最后分片 size > 0 即为数据完整
        const isDataComplete = isLastChunk
          ? serverChunk.size > 0
          : serverChunk.size >= CHUNK_SIZE

        if (!isDataComplete) {
          // 数据不完整，需要重新上传
          reupload.push(serverChunk.index)
          continue
        }

        // 数据完整，可跳过（无论 hash 是 partial 还是具体值）
        skip.push(serverChunk.index)
      }

      // 3. 合并本地记录：本地有但服务端没有的分片，以服务端为准（服务端是权威）
      // 但本地有记录的分片可以额外打印日志，帮助排查
      localChunkIndexes.forEach((localIndex) => {
        if (!serverIndexes.has(localIndex) && !skip.includes(localIndex) && !reupload.includes(localIndex)) {
          // 本地有记录但服务端没有：可能服务端已清理，保守起见重新上传
          console.warn(`[断点续传] 分片 ${localIndex} 本地有记录但服务端无，将重新上传`)
          reupload.push(localIndex)
        }
      })

      // 服务端没有记录的分片 -> 需要上传
      for (let i = 0; i < totalChunks; i++) {
        if (!serverIndexes.has(i) && !skip.includes(i) && !reupload.includes(i)) {
          reupload.push(i)
        }
      }

      console.log(`[断点续传] 最终: skip=${skip.length}, reupload=${reupload.length}`)
      return { skip, reupload }
    }
    catch (error) {
      // 查询失败，回退到本地 IndexedDB 记录
      const skip: number[] = []
      localChunkIndexes.forEach((i) => { skip.push(i) })
      const reupload: number[] = []
      for (let i = 0; i < totalChunks; i++) {
        if (!localChunkIndexes.has(i)) reupload.push(i)
      }
      console.warn(`[断点续传] 服务端查询异常，使用本地记录: skip=${skip.length}`, error)
      return { skip, reupload }
    }
  }

  /**
   * 上传单个分片（带哈希）
   * @param fileHasher 流式全文件哈希器，存在时会将分片数据同时累积到全文件 hash
   */
  async function uploadSingleChunk(
    file: File,
    fileUUID: string,
    chunkIndex: number,
    totalChunks: number,
    params: string,
    onProgress?: (percent: number) => void,
    fileHasher?: StreamFileHasher,
  ): Promise<UploadResponse> {
    const preparedChunk = await prepareUploadChunk(file, chunkIndex, CHUNK_SIZE)

    if (fileHasher) {
      await fileHasher.update(preparedChunk.chunkBuffer.slice(0), chunkIndex)
    }

    const chunkFile = new File([preparedChunk.chunkBuffer], file.name, {
      type: preparedChunk.fileType || file.type || 'application/octet-stream',
    })

    const formData = new FormData()
    formData.append('file', chunkFile)
    formData.append('qquuid', fileUUID)
    formData.append('qqpartindex', String(chunkIndex))
    formData.append('qqtotalparts', String(totalChunks))
    formData.append('qqfilename', file.name)
    formData.append('qqtotalfilesize', String(file.size))
    formData.append('qqchunksize', String(preparedChunk.size))
    formData.append('qqpartbyteoffset', String(preparedChunk.start))
    formData.append('act', 'add')
    formData.append('name', file.name)
    formData.append('qqhashcode', preparedChunk.chunkHash)

    console.log(`[上传] 分片 ${chunkIndex + 1}/${totalChunks} 数据大小: ${chunkFile.size} bytes, 哈希: ${preparedChunk.chunkHash.substring(0, 8)}...`)

    const result = await apiUploadChunk(formData, params, onProgress)

    if (!result.success) {
      console.error('[上传] 分片上传失败:', result.error)
      throw new Error(result.error || '分片上传失败')
    }

    // 0KB 文件无需保存分片记录（无实际数据分片）
    if (file.size > 0) {
      await saveChunk({
        fileUUID,
        chunkIndex,
        chunkHash: preparedChunk.chunkHash,
        chunkSize: preparedChunk.size,
        uploadedAt: new Date(),
      })
    }

    return result
  }

  /**
   * 上传文件（支持分片、断点续传、哈希校验、并发控制）
   * @param file 要上传的文件
   * @param params 上传参数
   * @param relativeDir 相对目录
   * @param onProgress 进度回调
   * @param existingItem [可选] 已有的上传项（用于 resume 场景，避免重复创建）
   * @param existingFileUUID [可选] 已有的文件 UUID（用于 resume 场景，复用 ID 保证暂停/断点续传生效）
   */
  async function uploadFile(
    file: File,
    params: string,
    relativeDir = '',
    onProgress?: (item: TransUploadFileItem) => void,
    existingItem: TransUploadFileItem | null = null,
    existingFileUUID?: string,
  ): Promise<boolean> {
    if (!initData.value) {
      Message.error('请先初始化上传页面')
      return false
    }

    // resume 场景复用已有 UUID，避免 Date.now() 导致 ID 不一致
    const fileUUID = existingFileUUID || generateFileUUID(file)
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

    // 创建或复用上传项
    let ri: TransUploadFileItem

    if (existingItem) {
      // [Bug2修复] resume 场景：复用已有列表项，不重复创建
      ri = existingItem
    } else {
      const uploadItem: TransUploadFileItem = {
        id: fileUUID,
        file,
        status: 'pending',
        progress: 0,
        speed: 0,
        relativeDir,
        totalChunks: Math.max(totalChunks, 1),
        uploadedChunkCount: 0,
        selected: false,
        startTime: Date.now(),
        retryCount: 0,
      }
      uploadFileList.value.push(uploadItem)
      ri = uploadFileList.value[uploadFileList.value.length - 1]!
    }

    // [Bug1修复] 立即触发 UI 更新，让进度条在用户选择文件后立刻出现
    onProgress?.(ri)

    // 创建 AbortController（提前创建，确保暂停操作能正确中断）
    const controller = new AbortController()
    abortControllers.set(fileUUID, controller)

    // P2-7: 对齐老代码 onUpload，小文件在上传前预计算哈希
    let preCalculatedHash = ''
    let fileHasher: StreamFileHasher | null = null
    /** 重试路径创建的流式 hasher（需与 fileHasher 一并在 finally 中 dispose） */
    let retryFileHasher: StreamFileHasher | null = null

    try {
      // [Bug1修复] 状态切换为 uploading，并异步执行准备操作
      ri.status = 'uploading'

      if (file.size <= SMALL_FILE_THRESHOLD) {
        try {
          preCalculatedHash = await calculateFileHashInWorker(file)

          console.log('[上传] 小文件预计算哈希:', preCalculatedHash.substring(0, 16) + '...')
        } catch (e) {
          console.warn('[上传] 小文件预计算哈希失败，将在上传后计算:', e)
        }
      } else {
        // 大文件：创建流式 hasher，边上传边累积全文件 hash，避免上传后二次读取
        fileHasher = await createStreamFileHasher(file.size)
        console.log('[上传] 大文件启用流式哈希累积:', file.name)
      }

      // 创建上传记录到 IndexedDB（移到此处，不阻塞进度条显示）
      await createUploadRecord({
        fileUUID,
        fileName: file.name,
        fileSize: file.size,
        totalChunks,
        uploadParams: params,
        relativeDir,
        status: 'uploading',
      })

      // 查询已上传分片（断点续传）
      const { skip, reupload } = await checkChunkStatus(fileUUID, file.name, relativeDir, params, totalChunks)

      // 断点续传场景：skip 的分片没有进入 uploadSingleChunk，需要先把它们的数据喂给 fileHasher
      // 否则最终 fileHasher.digest() 只包含 reupload 分片的 hash，导致全文件 hash 错误
      if (fileHasher && skip.length > 0) {
        // BUG4: 显示 hash 恢复状态提示
        ri.status = 'hashing'
        ri.hashState = {
          clientHash: '',
          serverHash: '',
          status: 'calculating',
          elapsedTime: ri.hashState?.elapsedTime,
          timeLeft: ri.hashState?.timeLeft,
        }
        onProgress?.(ri)

        console.log(`[断点续传] 恢复已上传 ${skip.length} 个分片的 hash 累积...`)
        for (const chunkIndex of skip.sort((a, b) => a - b)) {
          const { chunkBuffer } = await readChunkBuffer(file, chunkIndex, CHUNK_SIZE)
          await fileHasher.update(chunkBuffer, chunkIndex)
        }
        console.log(`[断点续传] 已恢复 ${skip.length} 个分片的 hash 累积`)

        // 恢复 uploading 状态继续上传
        ri.status = 'uploading'
        onProgress?.(ri)
      }

      let uploadedCount = skip.length
      ri.uploadedChunkCount = uploadedCount
      ri.progress = calcChunkProgress(uploadedCount, totalChunks)
      onProgress?.(ri)

      // 等待并发队列有空位
      while (activeUploads.value >= maxConcurrentUploads.value) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      activeUploads.value++
      uploading.value = true

      // 上传缺失的分片（0KB文件需调用一次add接口完成空文件上传）
      if (file.size === 0) {
        console.log('[上传] 0KB文件开始调用add接口')
        const result = await uploadSingleChunk(
          file,
          fileUUID,
          0,
          1,
          params,
          undefined,
          fileHasher || undefined,
        )
        console.log('[上传] 0KB文件add接口完成:', result)
        uploadedCount = 1
        ri.uploadedChunkCount = 1
        ri.progress = 99
        onProgress?.(ri)
      } else {
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
            fileHasher || undefined,
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

      // P2-7: 小文件可能已预计算过哈希，直接复用；大文件使用流式 hasher 的累积结果
      const streamedHash = fileHasher ? await fileHasher.digest() : ''
      const clientHash = preCalculatedHash || streamedHash || await calculateFileHashInWorker(file)

      ri.hashState!.clientHash = clientHash
      console.log('[哈希校验] 客户端哈希:', clientHash.substring(0, 16) + '...')

      // 上传完成后立即将客户端哈希写入后端（与老代码一致）
      try {
        await updateClientHash(file.name, relativeDir, clientHash)
      } catch (e) {
        console.warn('[哈希校验] 更新客户端哈希失败，跳过:', e)
      }

      // 保存 clientHash 到 IndexedDB，用于断点续传时校验文件一致性
      try {
        await updateUploadRecord(fileUUID, { clientHash })
        console.log('[哈希校验] clientHash 已保存到 IndexedDB')
      } catch (e) {
        console.warn('[哈希校验] 保存 clientHash 到 IndexedDB 失败:', e)
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
      // 上传完成后清理 IndexedDB 记录，避免刷新后重复恢复
      await deleteChunksByFileUUID(fileUUID)
      await deleteUploadRecord(fileUUID)
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

          // 大文件重试时需要重新创建流式 hasher（分片会重新上传）
          retryFileHasher = null
          if (file.size > SMALL_FILE_THRESHOLD && !preCalculatedHash) {
            retryFileHasher = await createStreamFileHasher(file.size)
          }

          // 重试时同样需要把 skip 的分片喂给 hasher
          if (retryFileHasher && retrySkip.length > 0) {
            console.log(`[重试] 恢复已上传 ${retrySkip.length} 个分片的 hash 累积...`)
            for (const chunkIndex of retrySkip.sort((a, b) => a - b)) {
              const { chunkBuffer } = await readChunkBuffer(file, chunkIndex, CHUNK_SIZE)
              await retryFileHasher.update(chunkBuffer, chunkIndex)
            }
            console.log(`[重试] 已恢复 ${retrySkip.length} 个分片的 hash 累积`)
          }


          for (const retryChunkIndex of retryReupload) {
            if (controller.signal.aborted) {
              ri.status = 'paused'
              return false
            }

            const retryResult = await uploadSingleChunk(
              file, fileUUID, retryChunkIndex, totalChunks, params,
              // 分片上传中不更新进度/速率
              undefined,
              retryFileHasher || undefined,
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

          // 小文件复用预计算 hash；大文件使用重试时边上传边累积的流式 hash
          const retryStreamedHash = retryFileHasher ? await retryFileHasher.digest() : ''
          const retryClientHash = preCalculatedHash || retryStreamedHash || await calculateFileHashInWorker(file)


          ri.hashState!.clientHash = retryClientHash

          // 保存 clientHash 到 IndexedDB
          try {
            await updateUploadRecord(fileUUID, { clientHash: retryClientHash })
          } catch (e) {
            console.warn('[哈希校验] 保存 clientHash 到 IndexedDB 失败:', e)
          }

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
          // 上传完成后清理 IndexedDB 记录，避免刷新后重复恢复
          await deleteChunksByFileUUID(fileUUID)
          await deleteUploadRecord(fileUUID)
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
      // 释放原始流式 hasher（如有）
      if (fileHasher) {
        await fileHasher.dispose()
      }
      // 释放重试路径创建的流式 hasher（如有）
      if (retryFileHasher) {
        await retryFileHasher.dispose()
      }

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
   * 确认上传完成（带自动重试，对齐老代码逻辑）
   */
  async function confirmUpload(params: string): Promise<boolean> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= MAX_AUTO_RETRY; attempt++) {
      try {
        const result = await completeUpload(params)
        if (result.success) {
          if (attempt > 1) {
            Message.success(`上传确认成功（重试第 ${attempt - 1} 次后）`)
          } else {
            Message.success('上传确认成功')
          }
          return true
        } else {
          lastError = new Error(result.error || '上传确认失败')
          console.warn(`[confirmUpload] 第 ${attempt} 次尝试失败:`, lastError.message)
        }
      }
      catch (error: any) {
        lastError = new Error(error.message || '未知错误')
        console.warn(`[confirmUpload] 第 ${attempt} 次尝试异常:`, lastError.message)
      }

      // 非最后一次，等待后重试
      if (attempt < MAX_AUTO_RETRY) {
        await new Promise(resolve => setTimeout(resolve, AUTO_RETRY_DELAY))
      }
    }

    Message.error(`上传确认失败（已重试 ${MAX_AUTO_RETRY} 次）: ${lastError?.message || '未知错误'}`)
    return false
  }

  /**
   * 暂停上传
   * @param silent 是否静默（不弹出提示），用于批量暂停场景
   */
  async function pauseUpload(fileId: string, params: string, silent = false): Promise<void> {
    const controller = abortControllers.get(fileId)
    if (controller) {
      controller.abort()
      abortControllers.delete(fileId)
    }

    const item = uploadFileList.value.find((f: TransUploadFileItem) => f.id === fileId)
    if (item) {
      item.status = 'paused'
      item.speed = 0

      // 断点续传恢复的任务可能 file 为 null，此时跳过后端通知
      if (item.file) {
        try {
          await apiPauseUpload(item.file.name, item.relativeDir, params)
        }
        catch (e) {
          // 忽略暂停接口错误
        }
      }

      await updateUploadStatus(fileId, 'paused')
    }

    if (!silent) Message.info('上传已暂停')
  }

  /**
   * 继续上传（复用已有上传项，不重复创建）
   * 对齐老代码 retryTask(): 先调用 act=continue 通知后端恢复上传状态
   * @param restoredFile 断点续传恢复的任务需提供 File 对象（因为 IndexedDB 无法持久化 File）
   */
  async function resumeUpload(
    fileId: string,
    params: string,
    onProgress?: (item: TransUploadFileItem) => void,
    restoredFile?: File,
  ): Promise<boolean> {
    const item = uploadFileList.value.find(f => f.id === fileId)
    if (!item) {
      Message.error('找不到上传任务')
      return false
    }

    // 断点续传恢复的任务没有 File 对象，需外部传入
    if (!item.file) {
      if (!restoredFile) {
        Message.error('请重新选择文件以继续上传')
        return false
      }

      // 校验文件大小是否一致
      if (restoredFile.size !== item.fileSize) {
        Message.error(`文件大小不一致（期望: ${fmtSize(item.fileSize || 0)}，实际: ${fmtSize(restoredFile.size)}），请重新选择正确的文件`)
        return false
      }

      // 如有保存的 clientHash，校验文件内容是否一致
      const record = await getUploadRecord(fileId)
      if (record?.clientHash) {
        // BUG4: 显示 hash 校验状态提示
        item.status = 'hashing'
        item.hashState = {
          clientHash: '',
          serverHash: '',
          status: 'calculating',
        }
        onProgress?.(item)

        console.log('[断点续传] 校验文件 hash 一致性...')
        const restoredHash = await calculateFileHashInWorker(restoredFile)

        // 恢复 paused 状态
        item.status = 'paused'
        item.hashState = undefined
        onProgress?.(item)

        if (restoredHash.toUpperCase() !== record.clientHash.toUpperCase()) {
          Message.error('文件内容已变更，无法断点续传，请删除后重新上传')
          return false
        }
        console.log('[断点续传] 文件 hash 校验通过')
      }

      item.file = restoredFile
    }

    // 对齐老代码 retryTask(): 调用 act=continue 通知后端该文件即将恢复上传
    // 后端依赖此接口恢复内部状态（如重置超时计时器、标记文件为上传中等）
    try {
      await continueUploadApi(item.file.name, item.relativeDir, params)
      console.log('[继续上传] 已通知后端恢复上传:', item.file.name)
    } catch (e) {
      console.warn('[继续上传] 通知后端 continue 失败（继续上传）:', e)
    }

    // 重置状态（保留 uploadedChunkCount，断点续传时会通过 checkChunkStatus 重新计算）
    item.status = 'pending'
    item.error = undefined
    item.startTime = Date.now()

    // [Bug2修复] 传入已有项 + 已有 UUID，uploadFile 内部不会 push 新项到列表，且复用 UUID 保证暂停/断点续传生效
    return uploadFile(item.file, params, item.relativeDir, onProgress, item, item.id)
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
   * @param silent 是否静默（批量操作时由上层统一提示）
   */
  async function cancelUpload(fileId: string, params?: string, silent = false): Promise<void> {
    // 中止上传
    const controller = abortControllers.get(fileId)
    if (controller) {
      controller.abort()
      abortControllers.delete(fileId)
    }

    // P0-2: 对齐老代码 onCancel，通知后端取消上传并清理临时分片
    const item = uploadFileList.value.find(f => f.id === fileId)
    if (item && params) {
      // 断点续传恢复的任务可能 file 为 null
      if (item.file) {
        try {
          await cancelUploadApi(item.file.name, item.relativeDir, params)
          console.log('[取消上传] 已通知后端清理临时文件:', item.file.name)
        }
        catch (e) {
          console.warn('[取消上传] 通知后端取消失败（忽略）:', e)
        }
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

    if (!silent) {
      Message.success('已取消上传')
    }
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

    // 传入已有项 + 已有 UUID，复用 ID 保证暂停/断点续传生效
    return uploadFile(item.file, params, item.relativeDir, onProgress, item, item.id)
  }

  // ============ 批量操作 ============

  /**
   * 全选/取消全选
   */
  function toggleSelectAll(selected: boolean): void {
    uploadFileList.value.forEach(item => {
      item.selected = selected
    })
  }

  /**
   * 批量暂停
   */
  async function batchPause(params: string): Promise<void> {
    const targets = uploadFileList.value.filter((f: TransUploadFileItem) => f.status === 'uploading')
    for (const item of targets) {
      await pauseUpload(item.id, params, true)
    }
    if (targets.length > 0) Message.success(`已暂停 ${targets.length} 个文件`)
  }

  /**
   * 批量继续
   * 同时触发所有目标任务的启动，由 uploadFile 内部并发控制管理实际上传并发数
   * 断点续传恢复的任务（file 为 null）需要重新选择文件，不参与批量继续
   */
  function batchResume(params: string, onProgress?: (item: TransUploadFileItem) => void): void {
    const targets = uploadFileList.value.filter(f => f.status === 'paused' || f.status === 'error')
    const resumable = targets.filter(f => f.file)
    const needRestore = targets.filter(f => !f.file)

    resumable.forEach((item) => {
      resumeUpload(item.id, params, onProgress)
    })

    if (resumable.length > 0 && needRestore.length > 0) {
      Message.success(`已继续 ${resumable.length} 个文件，${needRestore.length} 个任务需要重新选择文件才能继续上传`)
    }
    else if (resumable.length > 0) {
      Message.success(`已继续 ${resumable.length} 个文件`)
    }
    else if (needRestore.length > 0) {
      Message.warning(`选中的 ${needRestore.length} 个任务需要重新选择文件才能继续上传`)
    }
  }

  /**
   * 批量断点续传：通过拖拽/选择文件自动匹配恢复任务
   * 按 fileName + fileSize 匹配，匹配上的自动 resumeUpload，未匹配上的返回继续正常上传
   */
  async function batchResumeFromFiles(
    files: File[],
    params: string,
    onProgress?: (item: TransUploadFileItem) => void,
  ): Promise<File[]> {
    const restoreTasks = uploadFileList.value.filter(
      f => !f.file && (f.status === 'paused' || f.status === 'error'),
    )
    if (restoreTasks.length === 0) return files

    const remaining: File[] = []
    let matchedCount = 0
    let mismatchCount = 0

    for (const file of files) {
      const task = restoreTasks.find(t => t.fileName === file.name)
      if (task) {
        if (task.fileSize !== file.size) {
          mismatchCount++
          remaining.push(file)
          continue
        }
        await resumeUpload(task.id, params, onProgress, file)
        matchedCount++
      } else {
        remaining.push(file)
      }
    }

    if (matchedCount > 0) {
      Message.success(`已匹配并继续 ${matchedCount} 个断点续传任务`)
    }
    if (mismatchCount > 0) {
      Message.warning(`${mismatchCount} 个文件大小已变更，无法断点续传，已转为新上传`)
    }

    return remaining
  }

  /**
   * 批量取消
   */
  async function batchCancel(params?: string): Promise<void> {
    const targets = uploadFileList.value.filter(f => f.selected && f.status !== 'uploading')
    for (const item of targets) {
      await cancelUpload(item.id, params, true)
    }
    if (targets.length > 0) Message.success(`已取消 ${targets.length} 个文件`)
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

    const files = selected
      .filter(item => item.file != null)
      .map(item => ({
        fileName: item!.file!.name,
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
        Message.error(`存储空间不足，剩余 ${fmtSize(remainingSpace)}，需要 ${fmtSize(fileSize)}`)
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
    maxConcurrentUploads,

    // 方法
    initialize,
    loadFileList,
    debouncedLoadFileList,
    cancelDebouncedLoadFileList,
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
    startSessionKeepAlive,
    stopSessionKeepAlive,
    startTransTokenRefresh,
    stopTransTokenRefresh,
    abortFileListRequest,

    // 批量操作
    toggleSelectAll,
    batchPause,
    batchResume,
    batchResumeFromFiles,
    batchCancel,
    batchDeleteUploaded,

    // 工具函数
    formatSpeed: fmtSpeed,
    formatFileSize: fmtSize,
    generateFileUUID,
  }
}

export default useTransUpload
