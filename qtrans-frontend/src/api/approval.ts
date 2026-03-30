import type { ApprovalRecord, RealPageVO } from '@/types'
import { request } from '@/utils'

/** 待我审批/我已审批 - 单条记录 */
export interface WaitingApprovalItem {
  applicationId: number
  procType: string
  transWay: string // 如 "黄区,绿区"
  currentHandler: string
  currentStatus: string // 如 "直接主管审批"
  applicationStatus: number | null
  toAreaId: number | null
  formAreaId: number | null
  applicantW3Account: string | null
  taskStatus: string | null
  downloadUsers: string | null
  downloadW3Account: string | null
  createdBy: string
  creationDate: string
  lastUpdateDate: string
  reason: string
  keyword: string | null
  targetName: string | null
  downloadStatus: string | null
  applicationStartTime: string | null
  applicationEndTime: string | null
  abc: boolean
  externalCode: string | null
  publishServiceWhitelist: string | null
  toAreaIdList: string[] | null
  formAreaIdList: string[] | null
  toRedAreaId: number | null
  formRedAreaId: number | null
  isCrossTransfer: number | null
  dirManagerConfirm: number
  managerW3Account: string
}

/** 待我审批/我已审批 - 响应 */
export interface WaitingApprovalResponse {
  pageVO: RealPageVO
  result: WaitingApprovalItem[]
}

/** 待我审批 - 查询参数 */
export interface WaitingApprovalQuery {
  procType?: string
  formAreaId?: number
  toAreaId?: number
  keyword?: string
}

export const approvalApi = {
  /**
   * 待我审批列表 - 真实后端接口
   * GET /workflowService/services/frontendService/frontend/waitingForApproval/page/{pageSize}/{pageNum}
   */
  getWaitingForApproval(
    pageSize: number,
    pageNum: number,
    query?: WaitingApprovalQuery,
  ): Promise<WaitingApprovalResponse> {
    return request.rawGet<WaitingApprovalResponse>(
      `/workflowService/services/frontendService/frontend/waitingForApproval/page/${pageSize}/${pageNum}`,
      { params: query },
    )
  },

  /**
   * 我已审批列表 - 真实后端接口
   * GET /workflowService/services/frontendService/frontend/myApproved/page/{pageSize}/{pageNum}
   */
  getMyApproved(
    pageSize: number,
    pageNum: number,
    query?: WaitingApprovalQuery,
  ): Promise<WaitingApprovalResponse> {
    return request.rawGet<WaitingApprovalResponse>(
      `/workflowService/services/frontendService/frontend/myApproved/page/${pageSize}/${pageNum}`,
      { params: query },
    )
  },

  getHistory(applicationId: string): Promise<ApprovalRecord[]> {
    return request.get<ApprovalRecord[]>(`/approvals/${applicationId}/history`)
  },
  approve(id: string, opinion: string): Promise<void> {
    return request.post<void>(`/approvals/${id}/approve`, { opinion })
  },
  reject(id: string, opinion: string): Promise<void> {
    return request.post<void>(`/approvals/${id}/reject`, { opinion })
  },
  skip(id: string, opinion: string): Promise<void> {
    return request.post<void>(`/approvals/${id}/skip`, { opinion })
  },
}

