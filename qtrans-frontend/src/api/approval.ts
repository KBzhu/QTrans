import type { Application } from '@/types'
import { request } from '@/utils'

export const approvalApi = {
  getPending(): Promise<Application[]> {
    return request.get<Application[]>('/approvals/pending')
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
