export const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024
// NOTE: CHUNK_SIZE 已迁移到 transWebService.getChunkSize()，支持环境变量覆盖及后续接口动态获取
export const MAX_CONCURRENT_UPLOADS = 3
export const MAX_FILES_PER_APPLICATION = 100

export const APPLICATION_STATUS = {
  DRAFT: 'draft',
  PENDING_UPLOAD: 'pending_upload',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  TRANSFERRING: 'transferring',
  COMPLETED: 'completed',
} as const

export const FORBIDDEN_FILE_TYPES = ['.exe', '.bat', '.cmd', '.sh', '.ps1'] as const

export const ROUTE_NAMES = {
  LOGIN: 'Login',
  DASHBOARD: 'Dashboard',
  APPLICATION_LIST: 'ApplicationList',
  APPLICATION_CREATE: 'ApplicationCreate',
  APPROVAL_LIST: 'ApprovalList',
  TRANSFER_LIST: 'TransferList',
  PROFILE: 'Profile',
  NOT_FOUND: 'NotFound',
  FORBIDDEN: 'Forbidden',
} as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'qtrans:auth:token',
  USER_INFO: 'qtrans:auth:user',
  DRAFTS: 'qtrans:application:drafts',
  APPLICATIONS: 'qtrans:application:list',
  FILE_METAS: 'qtrans:file:metas',
  DOWNLOAD_RECORDS: 'qtrans:download:records',
  NOTIFICATIONS: 'qtrans:notification:list',
} as const
