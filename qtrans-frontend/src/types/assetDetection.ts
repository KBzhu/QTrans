/**
 * 资产检测结果相关类型定义
 */

/** 关键资产统计结果项 */
export interface KiaResultItem {
  /** 记录数 */
  record: number
  /** 文件类型 */
  fileType: number
}

/** 关键资产统计响应 */
export interface KiaResultCountResponse {
  /** 分类型统计结果 */
  result: KiaResultItem[]
  /** 总数量 */
  count: number
  /** 总大小（带单位） */
  fileSizeSum: string
  /** 结果消息 */
  resultMessage: string | null
}

/** 关键资产文件项 */
export interface KiaKeyFileItem {
  /** 文件路径 */
  fileName: string
  /** 文件类型 */
  fileType: number
  /** 备注 */
  remark: string
  /** 密级 */
  secretLevel: number | string
  /** 文件大小（带单位） */
  fileSizeUnit?: string
  /** 压缩层级 */
  unzipLevel?: number
  /** 文件路径 */
  filePath?: string
}

/** 密级枚举项 */
export interface SecretLevelItem {
  /** 编码值 */
  value: string | number
  /** 展示名称 */
  label: string
}

/** 所有检测文件项（新增） */
export interface KiaFileItem {
  /** 文件路径 */
  fileName: string
  /** 文件类型 */
  fileType: number
  /** 备注 */
  remark: string
  /** 密级 */
  secretLevel: number | string
  /** 文件大小（带单位） */
  fileSizeUnit?: string
  /** 压缩层级 */
  unzipLevel?: number
  /** 文件路径 */
  filePath?: string
}

/** 分页查询请求参数（新增） */
export interface KiaResultListRequest {
  /** 申请单ID */
  applicationId: number | string
  /** 页码 */
  pageNum: number
  /** 每页数量 */
  pageSize: number
  /** 文件类型筛选（可选） */
  fileType?: number
  /** 文件名关键字查询（可选） */
  fileName?: string
}

/** 分页信息（后端 pageVO） */
export interface KiaResultPageVO {
  /** 总行数 */
  totalRows: number
  /** 当前页码 */
  curPage: number
  /** 每页数量 */
  pageSize: number
  /** 结果模式 */
  resultMode: number
  /** 起始索引 */
  startIndex: number
  /** 结束索引 */
  endIndex: number
  /** 排序字段 */
  orderBy: string | null
  /** 过滤字符串 */
  filterStr: string | null
  /** 总页数 */
  totalPages: number
}

/** 分页查询响应（适配后端实际结构） */
export interface KiaResultListResponse {
  /** 分页信息 */
  pageVO: KiaResultPageVO
  /** 文件列表 */
  result: KiaFileItem[]
}
