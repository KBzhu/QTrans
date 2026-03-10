import type { AuditLogQuery, AuditLogRecord, PageResponse } from '@/types'
import { request } from '@/utils'

export const auditLogApi = {
  getList(params: AuditLogQuery): Promise<PageResponse<AuditLogRecord>> {
    return request.get<PageResponse<AuditLogRecord>>('/audit-logs', { params })
  },
}
