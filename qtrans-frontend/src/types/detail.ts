export interface DetailFieldItem {
  label: string
  value: string
  fullRow?: boolean
}

export interface DetailFileItem {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  sha256: string
}
