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

export type NotifyChannel = 'email' | 'sms' | 'in_app'

export interface Application {
  id: string
  applicationNo: string
  transferType: TransferType
  department: string
  sourceArea: 'green' | 'yellow' | 'red'
  targetArea: 'green' | 'yellow' | 'red'
  sourceCountry: string
  sourceCity: string[]
  targetCountry: string
  targetCity: string[]
  downloaderAccounts: string[]
  containsCustomerData: boolean
  customerAuthFile?: string
  srNumber?: string
  minDeptSupervisor?: string
  applyReason: string
  applicantNotifyOptions: NotifyChannel[]
  downloaderNotifyOptions: NotifyChannel[]
  storageSize: number
  uploadExpireTime: string
  downloadExpireTime: string
  urgencyLevel?: UrgencyLevel
  status: ApplicationStatus
  applicantId: string
  applicantName: string
  currentApprovalLevel?: number
  createdAt: string
  updatedAt?: string
}
