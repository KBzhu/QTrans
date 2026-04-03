/**
 * 管理员申请单管理 - 类型定义
 * 对接真实后端接口：GET /commonService/services/common/commonApplicationSearchService/getAuditApplicationByPage
 */

/** 申请单记录（管理员视角） */
export interface AdminApplicationRecord {
  /** 申请单ID */
  applicationId: number
  /** 申请人账号 */
  applicantW3Account: string
  /** 下载人账号 */
  downloadW3Account: string
  /** 当前状态 */
  currentStatus: string
  /** 传输方式（如：黄区,绿区） */
  transWay: string
  /** 安全等级名称 */
  securityLevelName: string
  /** 安全等级ID */
  securityLevelId: number
  /** 创建时间 */
  creationDate: string
  /** 申请原因 */
  reason: string
  /** 源城市 */
  fromCityName: string
  /** 目标城市 */
  toCityName: string
  /** 部门路径 */
  userDepartmentNamePath: string
  /** 是否客户数据（0=否，1=是） */
  isCustomerData: number
  /** 是否包含源码 */
  isContainSourceCode?: string | null
  /** 当前处理人 */
  currentHandler?: string | null
  /** 部门ID */
  deptId?: string
  /** 下载人邮箱 */
  downloadEmail?: string
  /** 上传人邮箱 */
  uploaderEmail?: string | null
  /** 服务请求码 */
  serviceRequestCode?: string | null
  /** 部门名称路径 */
  deptNamePath?: string | null
  /** 审批URL */
  auditUrl?: string | null
  /** 关键词 */
  keyWord?: string | null
  /** 密级列表 */
  secretLevels?: string | null
  /** 申请单状态枚举 */
  applicationStatusEnum?: string | null
  /** 创建日期列表 */
  creationDates?: string | null
  /** 目标名称 */
  targetName?: string
  /** 申请开始时间 */
  applicationStartTime?: string | null
  /** 申请结束时间 */
  applicationEndTime?: string | null

  // 审批人信息
  managerW3Account?: string | null
  managerW3AccountComment?: string | null
  managerMinW3Account?: string | null
  managerMinW3AccountComment?: string | null
  manager4W3Account?: string | null
  manager4W3AccountComment?: string | null
  manager3W3Account?: string | null
  manager3W3AccountComment?: string | null
  manager2W3Account?: string | null
  manager2W3AccountComment?: string | null
  managerInfoW3Account?: string | null
  managerInfoW3AccountComment?: string | null
  managerChiefW3Account?: string | null
  managerChiefW3AccountComment?: string | null
  guarantorW3Account?: string | null
  guarantorW3AccountComment?: string | null

  /** 源区域ID */
  formAreaId?: number | null
  /** 目标区域ID */
  toAreaId?: number | null
  /** 创建人 */
  createdBy?: string | null
}

/** 真实后端响应格式 - 分页信息 */
export interface AdminApplicationPageVO {
  totalRows: number
  curPage: number
  pageSize: number
  resultMode: number
  startIndex: number
  endIndex: number
  orderBy: string | null
  filterStr: string | null
  totalPages: number
}

/** 真实后端响应格式 */
export interface AdminApplicationResponse {
  pageVO: AdminApplicationPageVO
  result: AdminApplicationRecord[]
}

/** 申请单查询参数 */
export interface AdminApplicationQuery {
  /** 页码 */
  pageNum: number
  /** 每页条数 */
  pageSize: number
  /** 申请单ID */
  applicationId?: number | string
  /** 申请人账号 */
  applicantW3Account?: string
  /** 下载人账号 */
  downloadW3Account?: string
  /** 安全等级ID */
  securityLevelId?: number | string
  /** 源区域ID */
  formAreaId?: number | string
  /** 目标区域ID */
  toAreaId?: number | string
  /** 申请开始时间 */
  applicationStartTime?: string
  /** 申请结束时间 */
  applicationEndTime?: string
}
