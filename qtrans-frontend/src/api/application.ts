import type { Application, ApplicationStatus, PageRequest, PageResponse, TransferType } from '@/types'
import { request } from '@/utils'

export interface ApplicationQuery extends Partial<PageRequest> {
  status?: ApplicationStatus
  transferType?: TransferType
}

export const applicationApi = {
  getList(params: ApplicationQuery): Promise<PageResponse<Application>> {
    return request.get<PageResponse<Application>>('/applications', { params })
  },
  getDetail(id: string): Promise<Application> {
    return request.get<Application>(`/applications/${id}`)
  },
  create(payload: Partial<Application>): Promise<Application> {
    return request.post<Application>('/applications', payload)
  },
  update(id: string, payload: Partial<Application>): Promise<Application> {
    return request.put<Application>(`/applications/${id}`, payload)
  },
  remove(id: string): Promise<null> {
    return request.delete<null>(`/applications/${id}`)
  },
  saveDraft(id: string, payload: Partial<Application>): Promise<Application> {
    return request.post<Application>(`/applications/${id}/save-draft`, payload)
  },
  getDrafts(): Promise<Application[]> {
    return request.get<Application[]>('/applications/drafts')
  },
}
