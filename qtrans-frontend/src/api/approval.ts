import type { ApprovalRecord, RealPageVO } from '@/types'
import { request } from '@/utils'

/** 审批日志条目 */
export interface ApprovalLogItem {
  status: number
  createdBy: string
  creationDate: string
  lastUpdatedBy: string
  lastUpdateDate: string
  comments: string
  approvalNodeNames: string | null
  approval_log_id: number
  approve_type: 1 | 0 // 1=通过, 0=驳回
  approve_node_name: string
  application_id: number
  approver_w3_account: string
}

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

  /** 审批操作（通过/驳回）- 真实后端接口 */
  userApproved(params: {
    approvedType: 1 | 0
    comments: string
    appBpmWorkFlow: { applicationId: number }
  }): Promise<{ code: string }> {
    return request.raw<{ code: string }>(
      '/workflowService/services/frontendService/frontend/application/userApproved',
      { ...params, isSecurityLevelChange: '0' },
    )
  },

  /** 审批日志 - 真实后端接口 */
  getApprovalLog(applicationId: number | string): Promise<ApprovalLogItem[]> {
    return request.rawGet<ApprovalLogItem[]>(
      '/workflowService/services/frontendService/frontend/approvalLog/page/999/1',
      { params: { applicationId } },
    )
  },

  getHistory(applicationId: string): Promise<ApprovalRecord[]> {
    return request.get<ApprovalRecord[]>(`/approvals/${applicationId}/history`)
  },
}

