import type { StatusEnum } from './common'
import type { UserRole } from './user'

export type UIConfigTab = 'text' | 'card' | 'i18n' | 'button'

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

export interface UICardConfigItem {
  id: string
  name: string
  code: string
  order: number
  required: boolean
  fieldConfig: string
  status: StatusEnum
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

export interface SaveCardConfigRequest {
  id?: string
  name: string
  code: string
  order: number
  required: boolean
  fieldConfig: string
  status: StatusEnum
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

export interface ImportUIConfigRequest {
  type: UIConfigTab
  payload: unknown
}
