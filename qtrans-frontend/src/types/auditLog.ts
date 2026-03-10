import type { PageRequest } from './common'

export type AuditActionType = 'login' | 'application' | 'file' | 'approval' | 'transfer' | 'system'
export type AuditResult = 'success' | 'failed'

export interface AuditLogRecord {
  id: string
  operationTime: string
  actionType: AuditActionType
  operator: string
  ip: string
  detail: string
  resource: string
  result: AuditResult
}

export interface AuditLogQuery extends Partial<PageRequest> {
  actionType?: AuditActionType | 'all'
  operator?: string
  ip?: string
  startDate?: string
  endDate?: string
}
