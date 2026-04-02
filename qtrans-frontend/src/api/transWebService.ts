/**
 * TransWebService API 模块
 * 用于与后端 TransWebService 服务交互
 * 
 * 接口规范参考 task_Trans_Web.md 文档
 */
import axios, { type AxiosInstance, type AxiosProgressEvent } from 'axios'
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
  elapsedTime?: string
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

/** 分片大小: 4MB */
const CHUNK_SIZE = 4 * 1024 * 1024

// ============ 创建请求实例 ============

const createTransClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: assetPath('/transWeb'),
    timeout: 60000,
  })

  // 请求拦截器：自动携带 auth token 和 trans token
  client.interceptors.request.use((config) => {
    // auth token（与 rawClient/request.ts 保持一致）
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.token = authStore.token
    }
    // trans token
    const transToken = sessionStorage.getItem(TRANS_TOKEN_KEY)
    if (transToken) {
      config.headers.Authorization = transToken
    }
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
        sessionStorage.removeItem(TRANS_TOKEN_KEY)
        window.dispatchEvent(new CustomEvent('trans-token-expired'))
      }
      return response
    },
    (error) => Promise.reject(error),
  )

  return client
}

const transClient = createTransClient()

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
  if (data?.token) {
    sessionStorage.setItem(TRANS_TOKEN_KEY, data.token)
  }

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
  if (data?.token) {
    sessionStorage.setItem(TRANS_TOKEN_KEY, data.token)
  }

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
export async function getServerHash(
  relativeFileName: string,
  params: string,
): Promise<HashResponse> {
  const response = await transClient.post('/Handler/UploadHandler', null, {
    params: {
      act: 'HASH',
      RelativeFileName: encodeURIComponent(relativeFileName),
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
 * 文件下载（fetch方式，支持进度）
 * GET /api/file/download
 */
export async function downloadFile(
  fileName: string,
  relativeDir: string,
  params: string,
  onProgress?: (percent: number, loaded: number, total: number) => void,
): Promise<Blob> {
  const transToken = sessionStorage.getItem(TRANS_TOKEN_KEY)
  const authStore = useAuthStore()
  const authToken = authStore.token
  const url = assetPath(`/transWeb/api/file/download?fileName=${encodeURIComponent(fileName)}&relativeDir=${encodeURIComponent(relativeDir)}&params=${params}`)

  const headers: Record<string, string> = {
    Authorization: transToken || '',
  }
  if (authToken) {
    headers.token = authToken
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(`下载失败: ${response.statusText}`)
  }

  const contentLength = response.headers.get('content-length')
  const total = contentLength ? parseInt(contentLength, 10) : 0

  if (!response.body) {
    throw new Error('响应体为空')
  }

  // 使用 ReadableStream 读取数据并计算进度
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    chunks.push(value)
    loaded += value.length

    if (onProgress && total > 0) {
      const percent = Math.round((loaded / total) * 100)
      onProgress(percent, loaded, total)
    }
  }

  // 合并所有 chunks
  const blob = new Blob(chunks)
  return blob
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

// ============ 哈希计算工具（前端Mock实现）============

/**
 * 计算 SHA-256 哈希值（Mock实现）
 * 实际项目中可以使用 crypto-js 或 Web Crypto API
 */
export async function calculateSHA256(file: File): Promise<string> {
  // 使用 Web Crypto API 计算 SHA-256
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * 计算文件分片哈希
 */
export async function calculateChunkHash(
  chunk: Blob,
): Promise<string> {
  const arrayBuffer = await chunk.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
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
 * 获取分片大小
 */
export function getChunkSize(): number {
  return CHUNK_SIZE
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

  // 下载相关
  downloadFile,
  downloadAndSave,
  checkPackageStatus,

  // 哈希计算
  calculateSHA256,
  calculateChunkHash,

  // 辅助函数
  formatFileSize,
  getChunkSize,
  getTransToken,
  clearTransToken,
}

export default transApi
