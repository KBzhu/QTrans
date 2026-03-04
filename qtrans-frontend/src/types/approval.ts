export type ApprovalAction = 'approve' | 'reject' | 'exempt'

export type ApprovalLevel = 1 | 2 | 3

export interface ApprovalRecord {
  id: string
  applicationId: string
  level: ApprovalLevel
  approverId: string
  approverName: string
  action: ApprovalAction
  opinion: string
  createdAt: string
}
