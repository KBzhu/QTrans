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

/** 城市列表单条记录 */
export interface CityItem {
  cityId: number
  cityName: string
  countryName: string
  regionId: number
  isHot: number
  isCommon: number
}

/** 城市列表响应 */
export interface CityListResponse {
  cityList: CityItem[]
  commonCity: null
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
    /**
   * 查询上传城市列表
   * GET /workflowService/services/frontendService/frontend/city/findUploadCity
   */
  findUploadCity(params: {
    fromRegionTypeId: number
    toRegionTypeId: number
    isInternetFtpUpload: number
    w3Account: string
  }): Promise<CityListResponse> {
    return request.rawGet<CityListResponse>(
      '/workflowService/services/frontendService/frontend/city/findUploadCity',
      { params },
    )
  },
  /**
   * 查询下载城市列表（选完上传城市后联动）
   * GET /workflowService/services/frontendService/frontend/city/findDownloadCity
   */
  findDownloadCity(params: {
    uploadRegionId: number
    fromRegionTypeId: number
    toRegionTypeId: number
    isInternetFtpUpload: number
    w3Account: string
  }): Promise<CityListResponse> {
    return request.rawGet<CityListResponse>(
      '/workflowService/services/frontendService/frontend/city/findDownloadCity',
      { params },
    )
  },

  /**
 * 查询文件最高密级列表
 * POST /workflowService/services/frontendService/frontend/securityLevel/findSecurityLevelList
 */
findSecurityLevelList(params: {
  fromRegionTypeId: number
    toRegionTypeId: number
    isUrgent: number
    isContainSourceCode: number
    procType: string
    isContainLargeModel: number
}): Promise < any[] > {
  return request.raw<any[]>(
    '/workflowService/services/frontendService/frontend/securityLevel/findSecurityLevelList',
    params
  )
},

  /**
   * 查询审批层级配置
   * GET /workflowService/services/frontendService/frontend/approvalRoute/page/{pageSize}/{pageNum}
   */
  findApprovalRoute(params: {
    procTypeId: string
    fromRegionTypeId: number
    toRegionTypeId: number
    securityLevelId: string
    isCustomerData: number
    isUrgent: number
    deptId: string
    isContainLargeModel: number
  }): Promise<ApprovalRouteResponse> {
    return request.rawGet<ApprovalRouteResponse>(
      '/workflowService/services/frontendService/frontend/approvalRoute/page/1000/1',
      { params },
    )
  },
}

/** 审批层级配置项 */
export interface ApprovalRouteItem {
  approvalRouteId: number
  procTypeId: number
  fromRegionTypeId: number
  toRegionTypeId: number
  securityLevelId: number
  isUrgent: number
  isCustomerData: number
  isContainSourceCode: number
  isContainLargeModel: number
  isMinManagerApproval: number
  isManagerApproval: number
  isManager2Approval: number
  isManager3Approval: number
  isManager4Approval: number
  isChiefApproval: number
  isInfoManagerApproval: number
  isManagerCopyApproval: number
  isGuarantorApproval: number
  isCopyInfoManagerApproval: number
}

/** 审批层级响应 */
export interface ApprovalRouteResponse {
  pageVO: RealPageVO
  result: ApprovalRouteItem[]
}


