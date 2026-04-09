/**
 * 上传错误分类类型定义
 * 对齐老代码 onError 中的错误分类处理逻辑
 */

/** 上传错误类型枚举 */
export enum UploadErrorType {
  /** 登录过期 */
  AUTH_EXPIRED = 'auth_expired',
  /** 文件已存在 */
  FILE_EXISTS = 'file_exists',
  /** 文件正在上传中 */
  FILE_UPLOADING = 'file_uploading',
  /** 文件名超长 */
  FILENAME_TOO_LONG = 'filename_too_long',
  /** 路径超长 */
  PATH_TOO_LONG = 'path_too_long',
  /** 拒绝访问 */
  ACCESS_DENIED = 'access_denied',
  /** 网络错误 */
  NETWORK_ERROR = 'network_error',
  /** 服务端错误 */
  SERVER_ERROR = 'server_error',
  /** 存储空间不足 */
  STORAGE_FULL = 'storage_full',
  /** 文件名校验不通过 */
  INVALID_FILENAME = 'invalid_filename',
  /** 未知错误 */
  UNKNOWN = 'unknown',
}

/** 上传错误信息 */
export interface UploadErrorInfo {
  type: UploadErrorType
  message: string
  originalError?: string
  /** 是否应自动取消该文件的上传 */
  shouldCancel: boolean
  /** 是否可重试 */
  retryable: boolean
}

/** 老代码 onError 中的错误关键词映射 */
const ERROR_KEYWORD_MAP: Record<string, { type: UploadErrorType; message: string; shouldCancel: boolean; retryable: boolean }> = {
  '登录信息已过期': {
    type: UploadErrorType.AUTH_EXPIRED,
    message: '登录信息已过期，请重新登录',
    shouldCancel: true,
    retryable: false,
  },
  'login information has expired': {
    type: UploadErrorType.AUTH_EXPIRED,
    message: '登录信息已过期，请重新登录',
    shouldCancel: true,
    retryable: false,
  },
  '文件已存在': {
    type: UploadErrorType.FILE_EXISTS,
    message: '文件在服务器上已存在',
    shouldCancel: true,
    retryable: false,
  },
  'file already exists': {
    type: UploadErrorType.FILE_EXISTS,
    message: '文件在服务器上已存在',
    shouldCancel: true,
    retryable: false,
  },
  '正在上传': {
    type: UploadErrorType.FILE_UPLOADING,
    message: '该文件正在上传中，请勿重复操作',
    shouldCancel: true,
    retryable: false,
  },
  'uploading': {
    type: UploadErrorType.FILE_UPLOADING,
    message: '该文件正在上传中，请勿重复操作',
    shouldCancel: true,
    retryable: false,
  },
  '文件名过长': {
    type: UploadErrorType.FILENAME_TOO_LONG,
    message: '文件名过长，请缩短后重试',
    shouldCancel: true,
    retryable: false,
  },
  '路径过长': {
    type: UploadErrorType.PATH_TOO_LONG,
    message: '文件路径过长，请缩短后重试',
    shouldCancel: true,
    retryable: false,
  },
  '拒绝访问': {
    type: UploadErrorType.ACCESS_DENIED,
    message: '没有上传权限，请联系管理员',
    shouldCancel: true,
    retryable: false,
  },
  'access denied': {
    type: UploadErrorType.ACCESS_DENIED,
    message: '没有上传权限，请联系管理员',
    shouldCancel: true,
    retryable: false,
  },
  '空间不足': {
    type: UploadErrorType.STORAGE_FULL,
    message: '存储空间不足，无法上传',
    shouldCancel: true,
    retryable: false,
  },
}

/**
 * 解析上传错误，返回分类后的错误信息
 * 对齐老代码 FineUploader onError 中的错误分类逻辑
 */
export function classifyUploadError(error: string | Error): UploadErrorInfo {
  const errorMsg = error instanceof Error ? error.message : String(error)
  const lowerMsg = errorMsg.toLowerCase()

  // 按关键词匹配分类
  for (const [keyword, info] of Object.entries(ERROR_KEYWORD_MAP)) {
    if (lowerMsg.includes(keyword.toLowerCase())) {
      return {
        ...info,
        originalError: errorMsg,
      }
    }
  }

  // 网络错误
  if (lowerMsg.includes('network') || lowerMsg.includes('timeout') || lowerMsg.includes('abort') || lowerMsg.includes('err_network')) {
    return {
      type: UploadErrorType.NETWORK_ERROR,
      message: '网络异常，请检查网络后重试',
      originalError: errorMsg,
      shouldCancel: false,
      retryable: true,
    }
  }

  // 服务端 5xx 错误
  if (lowerMsg.includes('500') || lowerMsg.includes('502') || lowerMsg.includes('503') || lowerMsg.includes('server')) {
    return {
      type: UploadErrorType.SERVER_ERROR,
      message: '服务端异常，请稍后重试',
      originalError: errorMsg,
      shouldCancel: false,
      retryable: true,
    }
  }

  // 默认未知错误
  return {
    type: UploadErrorType.UNKNOWN,
    message: errorMsg || '上传失败',
    originalError: errorMsg,
    shouldCancel: false,
    retryable: true,
  }
}
