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
  fromZone: 'green' | 'yellow' | 'red' | 'cross' | 'external' | 'hisilicon'
  toZone: 'green' | 'yellow' | 'red' | 'cross' | 'external' | 'hisilicon'
  fromIcon: string
  toIcon: string
  arrowIcon: string
  tabGroup: string
  order: number
  status: StatusEnum
}

export interface ImportUIConfigRequest {
  type: UIConfigTab
  payload: unknown
}
