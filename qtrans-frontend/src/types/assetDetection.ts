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
}

/** 密级枚举项 */
export interface SecretLevelItem {
  /** 编码值 */
  value: string | number
  /** 展示名称 */
  label: string
}
