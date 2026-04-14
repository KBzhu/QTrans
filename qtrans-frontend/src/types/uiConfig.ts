import type { StatusEnum } from './common'
import type { UserRole } from './user'

export type UIConfigTab = 'text' | 'i18n' | 'button' | 'application' | 'transferTab' | 'transferType'

/** 申请单配置类型 */
export type UIApplicationConfigType = 'applicantNotifyOptions' | 'downloaderNotifyOptions' | 'recentTransferTemplates' | 'noticeItems'

/** 申请单配置项 */
export interface UIApplicationConfigItem {
  id: string
  type: UIApplicationConfigType
  label: string
  value: string
  order: number
  status: StatusEnum
}

export interface UITextConfigItem {
  key: string
  module: string
  zhCN: string
  enUS: string
  description: string
}

export interface UITextTreeNode {
  key: string
  title: string
  children?: UITextTreeNode[]
  isLeaf?: boolean
}

export interface UILanguageConfig {
  code: string
  name: string
  status: StatusEnum
  progress: number
}

export type TranslationStatus = 'done' | 'pending'

export interface UITranslationItem {
  key: string
  zhCN: string
  enUS: string
  status: TranslationStatus
}

export interface UIButtonConfigItem {
  id: string
  name: string
  code: string
  page: string
  roles: UserRole[]
  condition: string
  status: StatusEnum
}

export interface SaveTextConfigRequest {
  zhCN: string
  enUS: string
  description: string
}

export interface SaveButtonConfigRequest {
  id?: string
  name: string
  code: string
  page: string
  roles: UserRole[]
  condition: string
  status: StatusEnum
}

/** 传输类型页签配置 */
export interface UITransferTabConfigItem {
  id: string
  key: string
  label: string
  order: number
  status: StatusEnum
}

/** 传输类型卡片配置 */
export interface UITransferTypeConfigItem {
  id: string
  key: string
  title: string
  desc: string
  fromZone: string  // 区域 code，如 'green'
  toZone: string    // 区域 code，如 'yellow'
  fromIcon: string  // from 区域图标路径（从 itemAttr2 获取）
  toIcon: string    // to 区域图标路径（从 itemAttr3 获取）
  arrowIcon: string // 箭头图标（统一使用 /icons/arrow.svg）
  fromStyle: string // from 区域样式（从 itemAttr4 获取，分号前部分）
  toStyle: string   // to 区域样式（从 itemAttr4 获取，分号后部分）
  tabGroup: string
  order: number
  status: StatusEnum
  // 以下字段暂时保留用于兼容
  level?: string
  levelText?: string
  itemAttr5?: string // 原始区域元数据（fromCode,fromName,fromId,toCode,toName,toId）
}

export interface ImportUIConfigRequest {
  type: UIConfigTab
  payload: unknown
}
