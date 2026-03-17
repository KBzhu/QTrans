export type TransferType =
  | 'green-to-green'
  | 'green-to-yellow'
  | 'green-to-red'
  | 'yellow-to-yellow'
  | 'yellow-to-red'
  | 'red-to-red'
  | 'cross-country'

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


export interface Application {
  id: string
  applicationNo: string
  transferType: TransferType
  department: string
  departmentId?: string  // 新增：部门ID
  sourceArea: 'green' | 'yellow' | 'red'
  targetArea: 'green' | 'yellow' | 'red'
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
