import type { Application, ApprovalRecord } from '@/types'
import { request } from '@/utils'

export const approvalApi = {
  getPending(): Promise<Application[]> {
    return request.get<Application[]>('/approvals/pending')
  },
  getProcessed(): Promise<Application[]> {
    return request.get<Application[]>('/approvals/processed')
  },
  getAll(): Promise<Application[]> {
    return request.get<Application[]>('/approvals/all')
  },

  getHistory(applicationId: string): Promise<ApprovalRecord[]> {
    return request.get<ApprovalRecord[]>(`/approvals/${applicationId}/history`)
  },
  approve(id: string, opinion: string): Promise<Application> {
    return request.post<Application>(`/approvals/${id}/approve`, { opinion })
  },
  reject(id: string, opinion: string): Promise<Application> {
    return request.post<Application>(`/approvals/${id}/reject`, { opinion })
  },
  skip(id: string, opinion: string): Promise<Application> {
    return request.post<Application>(`/approvals/${id}/skip`, { opinion })
  },
}

