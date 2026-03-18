import type { Application, ApplicationStatus, PageRequest, PageResponse, TransferType } from '@/types'
import { request } from '@/utils'

export interface ApplicationQuery extends Partial<PageRequest> {
  status?: ApplicationStatus
  transferType?: TransferType
}

/** 真实后端 - 待我下载列表单条记录 */
export interface WaitingDownloadItem {
  applicationId: string
  applicantW3Account: string
  creationDate: string
  downloadEndDate: string
  currentStatus: string
  applicationStatus: number
  downloadStatus: string
  reason: string
  regionTypeName: string | null
  transWay: string
  regionTypeId: string | null
  downloadUrl: string
  externalCode: string | null
  publishServiceWhitelist: string | null
  downloadMode: number
  ftpAddress: string | null
  ftpUserName: string | null
  ftpPassword: string | null
  crossDownloadWhite: string | null
  isDisplayDetail: number
  abc: boolean
}

/** 真实后端 - 分页信息 */
export interface RealPageVO {
  totalRows: number
  curPage: number
  pageSize: number
  totalPages: number
  startIndex: number
  endIndex: number
}

/** 真实后端 - 待我下载列表响应 */
export interface WaitingDownloadResponse {
  pageVO: RealPageVO
  result: WaitingDownloadItem[]
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
  /**
   * 创建申请单 - 真实后端接口
   * POST /workflowService/services/frontendService/frontend/application/create
   */
  createReal(payload: Record<string, any>): Promise<any> {
    return request.raw<any>(
      '/workflowService/services/frontendService/frontend/application/create',
      payload
    )
  },
  /**
   * 待我下载列表 - 真实后端接口
   * GET /workflowService/services/frontendService/frontend/waitingForDownload/page/{pageSize}/{pageNum}
   */
  getWaitingDownloadList(pageSize: number, pageNum: number): Promise<WaitingDownloadResponse> {
    return request.rawGet<WaitingDownloadResponse>(
      `/workflowService/services/frontendService/frontend/waitingForDownload/page/${pageSize}/${pageNum}`
    )
  },
}
