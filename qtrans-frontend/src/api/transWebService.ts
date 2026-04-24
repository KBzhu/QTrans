/**
 * TransWebService API 模块
 * 用于与后端 TransWebService 服务交互
 * 
 * 接口规范参考 task_Trans_Web.md 文档
 */
import axios, { type AxiosInstance, type AxiosProgressEvent } from 'axios'
import { createSHA256 } from 'hash-wasm'
import { useAuthStore } from '@/stores'
import { assetPath } from '@/utils/path'

// ============ 类型定义 ============

/** 文件信息 */
export interface FileEntity {
  fileName: string
  fileSize: number
  relativeDir: string
  lastModify: string
  extension: string
  filePath: string
  hashCode: string
  clientFileHashCode: string
  fileId: number
}

/** 目录信息 */
export interface DirectoryEntity {
  name: string
  relativeDir: string
  filePath: string
  lastModify: string
}

/** 文件列表响应 */
export interface FileListData {
  name: string
  directoryList: DirectoryEntity[]
  fileList: FileEntity[]
  currentRelativeDir: string
  applicationId: number | string
  totalFileSize: number
  totalFileCount: number
}

/** 上传初始化响应 */
export interface UploadInitResponse {
  token: string
  applicationId: string | number
  applicantW3Id: string
  applicationSize: number
  hashType: string
  blackList: string
  maxLength4Name: number
  maxLength4Path: number
  privatePolicyUrl?: string
  showPrivacyDialog?: boolean
  params: string
  i18n?: Record<string, string>
}

/** 下载初始化响应 */
export interface DownloadInitResponse {
  token: string
  applicationId: string | number
  applicantW3Id: string
  hashType: string
  blackList: string
  fromRegionModCode?: string
  showVendorNameCode?: string
  vendorName?: string
  params: string
  i18n?: Record<string, string>
}

/** 上传响应 */
export interface UploadResponse {
  success: boolean
  error: string
  /** 服务端计算耗时（秒） — 对齐老代码 onUploadChunkSuccess 的 elapsedTime */
  elapsedTime?: string
  /** 服务端预估剩余时间（秒） — 对齐老代码 onUploadChunkSuccess 的 timeLeft */
  timeLeft?: string
}

/** 哈希响应 */
export interface HashResponse {
  success: boolean
  error: string
}

// ============ 常量定义 ============

/** Token 存储键 */
const TRANS_TOKEN_KEY = 'trans_token'
const AUTH_TOKEN_COOKIE_KEY = 'token'

/** 分片大小: 4MB (默认值，后续可从 uploadInit 接口动态获取) */
const DEFAULT_CHUNK_SIZE = 4 * 1024 * 1024

/** 环境变量覆盖（仅开发阶段使用，生产环境由接口返回） */
const ENV_CHUNK_SIZE = Number(import.meta.env?.VITE_UPLOAD_CHUNK_SIZE)
const CHUNK_SIZE = Number.isFinite(ENV_CHUNK_SIZE) && ENV_CHUNK_SIZE > 0
  ? ENV_CHUNK_SIZE
  : DEFAULT_CHUNK_SIZE

/**
 * 获取当前分片大小
 * TODO(P3): 上传初始化后根据 UploadInitResponse 中的服务端配置动态更新
 */
export function getChunkSize(): number {
  return CHUNK_SIZE
}

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined')
    return

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/`
}

function clearCookie(name: string) {
  if (typeof document === 'undefined')
    return

  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

function syncAuthTokenCookie(token?: string | null) {
  if (!token) {
    clearCookie(AUTH_TOKEN_COOKIE_KEY)
    return
  }

  setCookie(AUTH_TOKEN_COOKIE_KEY, token)
}

function setTransToken(token: string) {
  sessionStorage.setItem(TRANS_TOKEN_KEY, token)
}


// ============ 创建请求实例 ============

const createTransClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: assetPath('/transWeb'),
    timeout: 60000,
  })

  // 请求拦截器：自动携带 auth token 和 trans token
  client.interceptors.request.use((config) => {
    const authStore = useAuthStore()
    const authToken = authStore.token
    const transToken = sessionStorage.getItem(TRANS_TOKEN_KEY)

    syncAuthTokenCookie(authToken)

    if (authToken)
      config.headers.token = authToken

    if (transToken)
      config.headers.Authorization = transToken

    return config
  })


  // 响应拦截器：处理登录过期
  client.interceptors.response.use(
    (response) => {
      const { data } = response
      if (
        data.success === false &&
        (data.error?.includes('当前登录信息已过期') ||
          data.error?.includes('The current login information has expired'))
      ) {
        clearTransToken()
        window.dispatchEvent(new CustomEvent('trans-token-expired'))
      }

      return response
    },
    (error) => Promise.reject(error),
  )

  return client
}

const transClient = createTransClient()

/**
 * 根据后端返回的 uploadUrl 更新 transClient 的 baseURL，实现直连文件传输服务器
 *
 * 解析 uploadUrl（如 http://canpxjqtra00003-wb.qtrans.qiyunfang.com:10110/transWeb/valid?params=...）
 * 提取 origin 部分（协议+域名+端口）作为 baseURL，使 transClient 所有请求直连传输服务器
 * 跳过 nginx 代理，避免大文件传输时 nginx 成为性能瓶颈
 *
 * 协议说明：直接使用后端返回的 uploadUrl 协议，不做前端升级/降级
 * - 测试环境：后端返回 http:// → 请求走 HTTP（页面也必须用 HTTP 访问，否则 Mixed Content 被拦截）
 * - 生产环境：后端返回 https:// → 请求走 HTTPS
 * 如遇浏览器自动 HTTP→HTTPS 升级，需清除 HSTS 缓存或关闭 HTTPS 优先模式
 */
export function updateTransClientBaseURL(uploadUrl: string) {
  if (!uploadUrl) return

  try {
    const urlObj = new URL(uploadUrl)
    // 直接使用 uploadUrl 的协议和 host，拼接 /transWeb 作为 baseURL
    transClient.defaults.baseURL = `${urlObj.protocol}//${urlObj.host}/transWeb`
  }
  catch {
    console.warn('[transWebService] updateTransClientBaseURL: 无法解析 uploadUrl:', uploadUrl)
  }
}

// ============ 初始化相关 API ============

/**
 * 上传页面初始化
 * GET /api/upload/init?params=xxx&lang=zh_CN
 */
export async function initUpload(
  params: string,
  lang = 'zh_CN',
): Promise<UploadInitResponse> {
  const response = await transClient.get('/api/upload/init', {
    params: { params, lang },
  })

  const { data } = response.data
  if (data?.token)
    setTransToken(data.token)

  return data
}


/**
 * 下载页面初始化
 * GET /api/download/init?params=xxx&lang=zh_CN
 */
export async function initDownload(
  params: string,
  lang = 'zh_CN',
): Promise<DownloadInitResponse> {
  const response = await transClient.get('/api/download/init', {
    params: { params, lang },
  })

  const { data } = response.data
  if (data?.token)
    setTransToken(data.token)

  return data
}


// ============ 文件列表 API ============

/**
 * 获取文件列表
 * POST /Handler/FileListHandler
 */
export async function getFileList(
  relativeDir: string,
  params: string,
): Promise<FileListData> {
  const response = await transClient.post('/Handler/FileListHandler', null, {
    params: {
      RelativeDir: encodeURIComponent(relativeDir),
      params: params,
    },
  })

  if (response.data.ret === 'success') {
    // data 是 JSON 字符串，需要解析
    return typeof response.data.data === 'string'
      ? JSON.parse(response.data.data)
      : response.data.data
  }
  throw new Error(response.data.message || '获取文件列表失败')
}

// ============ 上传相关 API ============

/**
 * 分片上传文件
 * POST /Handler/UploadHandler?act=add
 */
export async function uploadChunk(
  formData: FormData,
  params: string,
  onProgress?: (percent: number) => void,
): Promise<UploadResponse> {
  const response = await transClient.post(
    `/Handler/UploadHandler?params=${encodeURIComponent(params)}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100,
          )
          onProgress(percent)
        }
      },
    },
  )
  return response.data
}

/**
 * 删除文件
 * POST /Handler/UploadHandler?act=delete
 */
export async function deleteFiles(
  files: Array<{ fileName: string; relativeDir: string }>,
  params: string,
): Promise<UploadResponse> {
  const response = await transClient.post('/Handler/UploadHandler', null, {
    params: {
      act: 'delete',
      files: encodeURIComponent(JSON.stringify(files)),
      params: params,
    },
  })
  return response.data
}

/**
 * 确认上传完成
 * POST /Handler/UploadHandler?act=complete
 */
export async function completeUpload(
  params: string,
): Promise<UploadResponse> {
  const response = await transClient.post('/Handler/UploadHandler', null, {
    params: {
      act: 'complete',
      params: params,
    },
  })
  return response.data
}

/**
 * 获取服务端哈希值
 * POST /Handler/UploadHandler?act=HASH
 */
/**
 * 模拟 JS 原生 escape() 的行为，将非 ASCII 字符编码为 %uXXXX 格式
 * 后端 HASH 接口依赖此格式解析文件名（对齐老代码 getServerHash）
 */
function escapeUnicode(str: string): string {
  return str.replace(/[^\w@*+\/.-]/g, (ch) => {
    const code = ch.charCodeAt(0)
    if (code > 255) return `%u${code.toString(16).toUpperCase().padStart(4, '0')}`
    // 0x00-0xFF 范围沿用 encodeURIComponent 的 %XX 格式（与原生 escape 一致）
    return encodeURIComponent(ch)
  })
}

export async function getServerHash(
  relativeFileName: string,
  params: string,
): Promise<HashResponse> {
  const response = await transClient.post('/Handler/UploadHandler', null, {
    params: {
      act: 'HASH',
      RelativeFileName: escapeUnicode(relativeFileName),
      params: params,
    },
  })
  return response.data
}

/**
 * 更新客户端哈希值
 * PUT /client/fileInfo/updateClientFileHashCode
 */
export async function updateClientHash(
  fileName: string,
  relativeDir: string,
  hashCode: string,
): Promise<{ status: boolean }> {
  const response = await transClient.put(
    '/client/fileInfo/updateClientFileHashCode',
    {
      fileName: encodeURIComponent(fileName),
      relativeDir: relativeDir,
      clientFileHashCode: hashCode,
    },
  )
  return response.data
}

// ============ 下载相关 API ============

/**
 * 检测 Blob 是否为 HTML 响应（通常因请求被重定向到 SPA 首页导致）
 * 当下载接口返回 HTML 而非真实文件时抛出明确错误
 */
async function validateDownloadBlob(blob: Blob): Promise<void> {
  // 小于 1KB 的 blob 大概率不是真实文件，也可能是 HTML
  // 但真正关键的检测是 content-type 或内容
  if (blob.type && blob.type.includes('text/html')) {
    throw new Error('下载失败：服务端返回了 HTML 页面，可能是认证已过期或请求路径错误')
  }

  // 对于 type 为空或 application/octet-stream 但内容实际为 HTML 的情况，
  // 读取前 100 字节检查是否包含 <!doctype 或 <html
  if (blob.size < 2048) {
    const text = await blob.slice(0, 200).text()
    if (/<!doctype\s+html|<html/i.test(text)) {
      throw new Error('下载失败：服务端返回了 HTML 页面，可能是认证已过期或请求路径错误')
    }
  }
}

/**
 * 文件下载（fetch方式，支持进度）
 * GET /api/file/download
 */
export async function downloadFile(
  fileName: string,
  relativeDir: string,
  params: string,
  onProgress?: (percent: number, loaded: number, total: number) => void,
): Promise<Blob> {
  try {
    const response = await transClient.get('/api/file/download', {
      params: {
        fileName,
        relativeDir,
        params,
      },
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        const loaded = progressEvent.loaded ?? 0
        const total = progressEvent.total ?? 0
        const percent = total > 0 ? Math.round((loaded / total) * 100) : 0

        onProgress?.(percent, loaded, total)
      },
    })

    const blob: Blob = response.data
    await validateDownloadBlob(blob)
    return blob
  }
  catch (error: any) {
    throw new Error(error?.response?.statusText || error?.message || '下载失败')
  }
}

/**
 * 下载文件并保存
 */
export async function downloadAndSave(
  fileName: string,
  relativeDir: string,
  params: string,
  onProgress?: (percent: number, loaded: number, total: number) => void,
): Promise<void> {
  const blob = await downloadFile(fileName, relativeDir, params, onProgress)

  // 创建下载链接
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  // 延迟 300ms 让浏览器有时间处理下载对话框
  // 避免"下载成功"提示先于浏览器下载弹窗出现
  await new Promise(resolve => setTimeout(resolve, 300))
}

/**
 * 检查文件夹是否正在打包
 * GET /HJWeb/isPackage
 */
export async function checkPackageStatus(
  relativeDir: string,
  params: string,
): Promise<{ status: boolean; result: boolean; message: string }> {
  const response = await transClient.get('/HJWeb/isPackage', {
    params: {
      relativeDir: relativeDir,
      params: params,
    },
  })
  return response.data
}

// ============ 断点续传相关 API ============

/** 分片状态信息 */
export interface ChunkStatusInfo {
  index: number        // 分片索引
  hash: string         // 分片哈希，"partial" 表示不完整
  size: number         // 服务端实际接收的字节数
}

/** 已上传分片查询响应 */
export interface UploadedChunksResponse {
  success: boolean
  data: {
    totalChunks: number
    fileSize: number
    chunkSize: number
    chunks: ChunkStatusInfo[]
  }
  error?: string
}

/**
 * 查询文件已上传分片状态
 * GET /Handler/UploadHandler?act=chunks
 *
 * 用于断点续传，查询服务端已接收的分片信息
 */
export async function getUploadedChunks(
  fileUUID: string,
  fileName: string,
  relativeDir: string,
  params: string,
): Promise<UploadedChunksResponse> {
  const response = await transClient.get('/Handler/UploadHandler', {
    params: {
      act: 'chunks',
      qquuid: fileUUID,
      name: fileName,
      qqpath: encodeURIComponent(relativeDir),
      params: params,
    },
  })
  return response.data
}

/**
 * 继续上传（通知后端恢复上传状态）
 * POST /Handler/UploadHandler?act=continue
 *
 * 对齐老代码 retryTask(): 调用 act=continue 通知后端该文件即将恢复上传
 * 后端依赖此接口恢复内部状态（如重置超时计时器、标记文件为上传中等）
 */
export async function continueUploadApi(
  fileName: string,
  qqpath: string,
  params: string,
): Promise<UploadResponse> {
  const response = await transClient.post('/Handler/UploadHandler', null, {
    params: {
      act: 'continue',
      name: fileName,
      qqpath: qqpath,
      params: params,
    },
  })
  return response.data
}

/**
 * 缓存刷新 / Session 保活
 * POST /Handler/UploadHandler?act=cache
 *
 * 对齐老代码定时器逻辑：定期调用此接口刷新服务端缓存、保持 session 活跃
 * 后端收到此请求后会重置文件上传相关的超时计时器
 */
export async function cacheRefresh(
  params: string,
): Promise<UploadResponse> {
  const response = await transClient.post('/Handler/UploadHandler', null, {
    params: {
      act: 'cache',
      params: params,
    },
  })
  return response.data
}

/**
 * 暂停上传
 * POST /Handler/UploadHandler?act=pause
 */
export async function pauseUpload(
  fileName: string,
  qqpath: string,
  params: string,
): Promise<UploadResponse> {
  const response = await transClient.post('/Handler/UploadHandler', null, {
    params: {
      act: 'pause',
      name: fileName,
      qqpath: qqpath,
      params: params,
    },
  })
  return response.data
}

/**
 * 取消上传（通知后端清理临时文件）
 * POST /Handler/UploadHandler?act=cancel
 *
 * 对齐老代码 onCancel: 调用 UploadHandler?act=cancel 通知后端
 * 否则后端会残留临时分片文件
 */
export async function cancelUploadApi(
  fileName: string,
  qqpath: string,
  params: string,
): Promise<UploadResponse> {
  const response = await transClient.post('/Handler/UploadHandler', null, {
    params: {
      act: 'cancel',
      name: fileName,
      qqpath: qqpath,
      params: params,
    },
  })
  return response.data
}

/**
 * 获取存储空间信息
 * POST /Handler/UploadHandler?act=storage
 *
 * 对齐老代码 onValidate: 检查总空间是否超限
 */
export async function getStorageInfo(
  params: string,
): Promise<{ success: boolean; usedSize: number; totalSize: number; error?: string }> {
  const response = await transClient.get('/Handler/UploadHandler', {
    params: {
      act: 'storage',
      params: params,
    },
  })
  return response.data
}

// ============ 哈希计算工具 ============

/**
 * 计算 SHA-256 哈希值（流式实现，支持大文件）
 * 使用 hash-wasm 分片读取，避免一次性加载全文件到内存
 * @deprecated 上传主流程请优先使用 `useHashWorker()`，该函数仅作为 Worker 降级路径保留。
 */
export async function calculateSHA256(file: File): Promise<string> {

  const hasher = await createSHA256()
  const stream = file.stream()
  const reader = stream.getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    hasher.update(value)
  }

  return hasher.digest()
}

/**
 * 计算文件分片哈希（基于 ArrayBuffer）
 */
export async function calculateChunkHashFromBuffer(
  arrayBuffer: ArrayBuffer,
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * 计算文件分片哈希（基于 Blob）
 */
export async function calculateChunkHash(
  chunk: Blob,
): Promise<string> {
  const arrayBuffer = await chunk.arrayBuffer()
  return calculateChunkHashFromBuffer(arrayBuffer)
}

// ============ 辅助函数 ============

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

/**
 * 格式化传输速度
 */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s'
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
  return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`
}


/**
 * 获取 Token
 */
export function getTransToken(): string | null {
  return sessionStorage.getItem(TRANS_TOKEN_KEY)
}

/**
 * 清除 Token
 */
export function clearTransToken(): void {
  sessionStorage.removeItem(TRANS_TOKEN_KEY)
}

/**
 * 刷新 Trans Token（Task 8）
 * GET /client/refreshToken
 *
 * 对齐老代码 refreshToken():
 * - 通过 transClient 请求，自动携带当前 Authorization (trans token)
 * - 成功后将返回的新 token 写回 sessionStorage
 * - 失败仅 console.warn，不中断上传流程
 *
 * @param params 申请单参数
 * @param lang 语言
 * @returns { success, newToken? }
 */
export async function refreshTransToken(
  params: string,
  lang = 'zh_CN',
): Promise<{ success: boolean; newToken?: string }> {
  try {
    const response = await transClient.get('/client/refreshToken', {
      params: { params, lang },
    })

    // 老代码响应格式: { status: boolean, result: string(新token), message?: string }
    // transClient 响应拦截器已解包一层 axios data，这里取 response.data
    const resultVO = response.data

    if (resultVO?.status === true && resultVO?.result) {
      setTransToken(resultVO.result)
      return { success: true, newToken: resultVO.result }
    }

    console.warn('[refreshTransToken] 服务端返回异常:', resultVO?.message || '未知原因')
    return { success: false }
  } catch (error: any) {
    // 对标老代码 error 回调：只打日志不中断
    console.warn('[refreshTransToken] 请求失败:', error?.message || error)
    return { success: false }
  }
}

// ============ 导出所有方法和常量 ============

export const transApi = {
  // 初始化
  initUpload,
  initDownload,

  // 文件列表
  getFileList,

  // 上传相关
  uploadChunk,
  deleteFiles,
  completeUpload,
  getServerHash,
  updateClientHash,
  pauseUpload,
  
  // 断点续传
  getUploadedChunks,

  // 继续上传
  continueUploadApi,

  // 缓存刷新 / Session 保活
  cacheRefresh,

  // Trans Token 刷新（Task 8）
  refreshTransToken,

  // 取消上传
  cancelUploadApi,

  // 存储空间
  getStorageInfo,

  // 下载相关
  downloadFile,
  downloadAndSave,
  checkPackageStatus,

  // 哈希计算
  calculateSHA256,
  calculateChunkHash,
  calculateChunkHashFromBuffer,

  // 辅助函数
  formatFileSize,
  formatSpeed,
  getChunkSize,
  getTransToken,
  clearTransToken,
}

export default transApi
