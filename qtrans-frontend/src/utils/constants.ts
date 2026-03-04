export const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024
export const CHUNK_SIZE = 5 * 1024 * 1024
export const MAX_CONCURRENT_UPLOADS = 3
export const MAX_FILES_PER_APPLICATION = 100

export const TRANSFER_TYPES = {
  GREEN_TO_GREEN: 'green-to-green',
  GREEN_TO_YELLOW: 'green-to-yellow',
  GREEN_TO_RED: 'green-to-red',
  YELLOW_TO_YELLOW: 'yellow-to-yellow',
  YELLOW_TO_RED: 'yellow-to-red',
  RED_TO_RED: 'red-to-red',
  CROSS_COUNTRY: 'cross-country',
} as const

export const APPLICATION_STATUS = {
  DRAFT: 'draft',
  PENDING_UPLOAD: 'pending_upload',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  TRANSFERRING: 'transferring',
  COMPLETED: 'completed',
} as const

export const APPROVAL_LEVEL_MAP = {
  [TRANSFER_TYPES.GREEN_TO_GREEN]: 0,
  [TRANSFER_TYPES.GREEN_TO_YELLOW]: 1,
  [TRANSFER_TYPES.GREEN_TO_RED]: 2,
  [TRANSFER_TYPES.YELLOW_TO_YELLOW]: 1,
  [TRANSFER_TYPES.YELLOW_TO_RED]: 2,
  [TRANSFER_TYPES.RED_TO_RED]: 2,
  [TRANSFER_TYPES.CROSS_COUNTRY]: 3,
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
  NOTIFICATIONS: 'qtrans:notification:list',
} as const
