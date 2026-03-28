/** 传输类型 - 从 constants 导入以保持单一来源 */
import type { TransferType } from '@/constants'
export type { TransferType }

export type ApplicationStatus =
  | 'draft'
  | 'pending_upload'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'transferring'
  | 'completed'

export type UrgencyLevel = 'low' | 'normal' | 'high' | 'urgent'

export type NotifyChannel = 'email' | 'sms' | 'in_app' | 'w3_todo' | 'download_email'

/** 安全区域类型 - 从 constants 导入以保持单一来源 */
import type { SecurityArea } from '@/constants'
export type { SecurityArea }

export interface Application {
  id: string
  applicationNo: string
  transferType: TransferType
  department: string
  departmentId?: string  // 新增：部门ID
  sourceArea: SecurityArea
  targetArea: SecurityArea
  sourceCountry: string
  sourceCity: string[]
  sourceCityId?: number  // 新增：源城市ID
  targetCountry: string
  targetCity: string[]
  targetCityId?: number  // 新增：目标城市ID
  downloaderAccounts: string[]
  ccAccounts?: string[]
  containsCustomerData: boolean

  srNumber?: string
  minDeptSupervisor?: string
  applyReason: string
  applicantNotifyOptions: NotifyChannel[]
  downloaderNotifyOptions: NotifyChannel[]
  // 移除废弃字段: storageSize, uploadExpireTime, downloadExpireTime, customerAuthFile
  urgencyLevel?: UrgencyLevel
  status: ApplicationStatus
  applicantId: string
  applicantName: string
  currentApprovalLevel?: number
  createdAt: string
  updatedAt?: string
}
