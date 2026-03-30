export interface DetailFieldItem {
  label: string
  value: string
  fullRow?: boolean
}

export interface DetailFileItem {
  /** 文件唯一标识（使用 fileHashCode） */
  id: string
  fileName: string
  fileSize: number
  sha256: string
  relativeDir: string | null
  /** 后端格式化的文件大小，如 "44.52(KB)" */
  fileSizeUnit: string
}
