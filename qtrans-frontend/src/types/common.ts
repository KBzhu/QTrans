export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PageRequest {
  pageNum: number
  pageSize: number
}

export interface PageResponse<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
  totalPages: number
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

export type Nullable<T> = T | null

export type ValueOf<T> = T[keyof T]

export type StatusEnum = 'enabled' | 'disabled'

export interface OptionItem {
  label: string
  value: string | number
  disabled?: boolean
}
