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
  /**
   * 查询当前部门所属所有层级审批人
   * POST /workflowService/services/frontendService/frontend/approvalInfo/getAllApprovers
   */
  getAllApprovers(params: {
    fromRegionTypeId: number
    toRegionTypeId: number
    procTypeId: string
    securityLevelId: string | number
    isCustomerData: number
    dpCode: string
    isUrgent: number
    redAreaId: number
    isContainLargeModel: number
    applicationId: string
  }): Promise<ApproverItem[]> {
    return request.raw<ApproverItem[]>(
      '/workflowService/services/frontendService/frontend/approvalInfo/getAllApprovers',
      params,
    )
  },
  /**
   * 我的申请单列表 - 真实后端接口
   * POST /workflowService/services/frontendService/frontend/myApplication/page/{pageSize}/{pageNum}
   */
  getMyApplicationList(
    pageSize: number,
    pageNum: number,
    query?: MyApplicationQuery,
  ): Promise<MyApplicationResponse> {
    return request.raw<MyApplicationResponse>(
      `/workflowService/services/frontendService/frontend/myApplication/page/${pageSize}/${pageNum}`,
      query || {},
    )
  },
  /**
   * 申请单详情 - 真实后端接口
   * GET /workflowService/services/frontendService/frontend/application/approvalDetails?applicationId={id}
   */
  getApplicationDetail(applicationId: number | string): Promise<ApplicationDetailResponse> {
    return request.rawGet<ApplicationDetailResponse>(
      '/workflowService/services/frontendService/frontend/application/approvalDetails',
      { params: { applicationId } },
    )
  },
  /**
   * 关闭申请单 - 真实后端接口
   * GET /workflowService/services/frontendService/frontend/application/close?applicationId={id}
   * 响应: true/false
   */
  closeApplication(applicationId: number | string): Promise<boolean> {
    return request.rawGet<boolean>(
      '/workflowService/services/frontendService/frontend/application/close',
      { params: { applicationId } },
    )
  },
  /**
   * 获取申请单流程进展 - 真实后端接口
   * GET /workflowService/services/frontendService/frontend/application/getProcessDetails?applicationId={id}
   */
  getProcessDetails(applicationId: number | string): Promise<ProcessDetailsResponse> {
    return request.rawGet<ProcessDetailsResponse>(
      '/workflowService/services/frontendService/frontend/application/getProcessDetails',
      { params: { applicationId } },
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

/** 审批人信息 */
export interface ApproverItem {
  userAccount: string | null
  userCN: string | null
  approverTypeId: number // 0=一层, 1=二层, 2=三层, 3=四层
  itemIsTest: number | null
  dataType: number
  isDisplayApprover: number
  isChangeApprover: string | null
}

/** 真实后端 - 我的申请单单条记录 */
export interface MyApplicationItem {
  applicationId: number
  procType: string
  transWay: string // 如 "外网,绿区"
  currentHandler: string
  currentStatus: string // 如 "通知下载"
  applicationStatus: number
  toAreaId: number | null
  formAreaId: number | null
  applicantW3Account: string
  taskStatus: string // 如 "正常"
  downloadW3Account: string | null
  createdBy: string | null
  creationDate: string
  lastUpdateDate: string
  reason: string
  keyword: string | null
  targetName: string // 对方名称
  downloadStatus: number
  applicationStartTime: string | null
  applicationEndTime: string | null
  abc: boolean
  externalCode: string | null
  publishServiceWhitelist: string | null
  toAreaIdList: string[] | null
  formAreaIdList: string[] | null
  toRedAreaId: number | null
  formRedAreaId: number | null
  isCrossTransfer: number
  dirManagerConfirm: string | null
  managerW3Account: string | null
}

/** 真实后端 - 我的申请单列表响应 */
export interface MyApplicationResponse {
  pageVO: RealPageVO
  result: MyApplicationItem[]
}

/** 真实后端 - 我的申请单查询参数 */
export interface MyApplicationQuery {
  keyword?: string
  formAreaId?: number
  toAreaId?: number
  reason?: string
}

/** 真实后端 - 下载用户 */
export interface DownloadUser {
  w3Account: string
  fullName: string
}

/** 真实后端 - 申请单详情 - 基本信息 */
export interface AppBaseInfo {
  status: number
  createdBy: string
  creationDate: string
  lastUpdatedBy: string
  lastUpdateDate: string
  applicationId: number
  applicantW3Account: string
  applicationStatus: number
  departmentCodePath: string | null
  departmentName: string | null
  departmentPath: string | null
  externalCode: string
  memo: string | null
  transWay: string
  isDeptChannel: number | null
  procType: number
  parentId: number | null
  routineChannelDate: string | null
  reason: string
  securityLevel: number | null
  isApplicantPromiseNoVersionFile: number | null
  isManagerPromiseNoVersionFile: number | null
  isThirdPartyIntegration: number | null
  transmissionStatus: string | null
  transmissionStatus2: string | null
  transmissionOpinions: string | null
  projectGroupId: number | null
  projectGroup: string | null
  projectTeamId: number | null
  projectTeam: string | null
  sendNotification: string | null
  emailNotification: number
  authorizedExternalCode: string | null
  uploadNotification: string // 如 "[1,2]"
  downloadNotification: string
  dirManagerConfirm: number
  managerW3Account: string
  kiaConfirms: number
}

/** 真实后端 - 申请单详情 - 审批路由 */
export interface AppBaseApprovalRoute {
  status: number
  createdBy: string
  creationDate: string
  lastUpdatedBy: string
  lastUpdateDate: string | null
  applicationId: number
  approvalRouteId: number
  deptId: string
  departmentCodePath: string
  departmentName: string
  departmentPath: string
  userDeptId: string
  userDeptCodePath: string
  selectedDeptName: string
  userDepartmentName: string | null
  isCustomerData: number
  isContainSourceCode: number | null
  isMinManagerApproval: number
  isManagerMinChange: number
  isManagerApproval: number
  isDirectManagerMustHwEmployees: number
  isManager4Approval: number
  isManager3Approval: number
  isManager2Approval: number
  isChiefApproval: number
  isInfoManagerApproval: number
  isManagerCopyApproval: number | null
  isGuarantorApproval: number
  isCopyInfoManagerApproval: number | null
  sourceType: string | null
  managerMinW3Account: string
  managerMinUser: any | null
  managerW3Account: string
  managerUser: any | null
  managerCopyW3Account: string
  managerCopyUser: any | null
  manager4W3Account: string
  manager4User: any | null
  manager3W3Account: string
  manager3User: any | null
  manager2W3Account: string
  manager2User: any | null
  managerInfoCopyW3Account: string
  managerInfoCopyUser: any | null
  guarantorW3Account: string
  guarantorUser: any | null
  managerInfoW3Account: string
  managerInfoUser: any | null
  managerChiefW3Account: string
  managerChiefUser: any | null
  adminUpdateApprover: string
  adminUpdateUser: any | null
  isNeedApproval: number
  isApproved: number
  projectGroupId: number | null
  projectTeamId: number | null
  securityLevel: number
  isContainLargeModel: number
  isAbcManagerApproval: number
  abcManagerW3Account: string
  abcManagerUser: any | null
}

/** 真实后端 - 申请单详情 - 城市区域关系 */
export interface AppBaseCountryCityRegionRelation {
  status: number
  createdBy: string
  creationDate: string
  lastUpdatedBy: string
  lastUpdateDate: string
  applicationId: number
  fromCityId: number
  fromCityName: string
  fromCountryId: number | null
  fromCountryName: string | null
  fromRedAreaId: number | null
  fromRegionId: number
  fromRegionTypeId: number
  fromRegionMod: number
  toCityId: number
  toCityName: string
  toCountryId: number | null
  toCountryName: string | null
  toRedAreaId: number | null
  toRegionId: number
  toRegionTypeId: number
  toRegionMod: number
  isSensitiveCountryFileTransfer: number | null
  transitRegionId: number | null
  fromRegionSubTypeId: number | null
  toRegionSubTypeId: number | null
}

/** 真实后端 - 申请单详情 - 外部信息 */
export interface AppBaseExternalInfo {
  applicationId: number
  applicationType: number
  vendorName: string | null
  vendorFtpAddress: string | null
  vendorFtpVirtualPath: string | null
  vendorFtpFiles: string | null
  vendorFtpUserName: string | null
  sourceCodeApplicationId: number | null
  sourceCodeOptions: number | null
  sourceCodeArchiveAddress: string | null
  channelNo: string | null
  vendorId: number | null
  vendorFtpId: number | null
  vendorFtpAccountId: number | null
  vendorObsId: number | null
  vendorObsAccountId: number | null
  vendorObsAddress: string | null
  vendorObsBucket: string | null
  vendorObsFiles: string | null
  vendorObsVirtualPath: string | null
  personnelId: number | null
  codeName: string | null
  abc: boolean
  keywordDetection: boolean
}

/** 真实后端 - 申请单详情 - 上传下载信息 */
export interface AppBaseUploadDownloadInfo {
  status: number
  createdBy: string | null
  creationDate: string
  lastUpdatedBy: string | null
  lastUpdateDate: string
  applicationId: number
  applicationSize: number
  usePasscode: number
  uploaderEmail: string
  uploaderW3Account: string
  uploadEndDate: string
  uploadMailTemplateId: number
  uploadMode: number
  uploadPasscode: string
  uploadPasscodeDate: string
  uploadUrl: string
  isUploaded: number // 0=未上传, 1=已上传
  isExternalAutoDownload: number
  downloadEmail: string | null
  downloadW3Account: string
  downloadUser: DownloadUser[]
  downloadEndDate: string
  downloadMailTemplateId: number
  downloadUrl: string
  downloadMode: number
  downloadPasscode: string
  downloadPasscodeDate: string
  downloadNotificationStatus: number
  downloadNotificationDate: string | null
  transferMode: number | null
  auditUrl: string
  isCrossTransfer: number
}

/** 真实后端 - 申请单详情 - 工作流 */
export interface AppBpmWorkFlow {
  applicationId: number
  currentHandler: string
}

/** 真实后端 - 申请单详情 - 传输信息 */
export interface AppTransInfo {
  transferMode: number
}

/** 真实后端 - 申请单详情响应 */
export interface ApplicationDetailResponse {
  appBaseApprovalRoute: AppBaseApprovalRoute
  appBaseCountryCityRegionRelation: AppBaseCountryCityRegionRelation
  appBaseExternalInfo: AppBaseExternalInfo
  appBaseInfo: AppBaseInfo
  appBaseUploadDownloadInfo: AppBaseUploadDownloadInfo
  appBpmWorkFlow: AppBpmWorkFlow
  appCustomerNetworkFiles: any | null
  appSourceCodeFiles: any | null
  appTransInfo: AppTransInfo
  attachment: any | null
  overallShowDownloadUrl: boolean
  isCrossApproval: any | null
  edsInfo: any | null
}

/** 真实后端 - 流程进展步骤 */
export interface ProcessStepItem {
  status: string | null
  createdBy: string | null
  creationDate: string
  lastUpdatedBy: string | null
  lastUpdateDate: string | null
  applicationId: number
  isCross: string | null
  applicationStatus: number
  statusName: string
  usedTime: number // 秒
  totalTime: string // 如 "16:58:08"
}

/** 真实后端 - 流程进展响应 */
export interface ProcessDetailsResponse {
  applicationId: number
  taskStatus: string // 如 "用户关闭"
  applicationStatus: string // 如 "流程结束"
  applicationStatusId: number
  viewData: any | null
  nodeInfos: any | null
  listSteps: ProcessStepItem[]
}



