export type FileStatus =
  | 'pending'
  | 'uploading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface UploadProgress {
  fileId: string
  progress: number
  uploadedBytes: number
  totalBytes: number
  speed: number
  status: FileStatus
}

export interface FileInfo {
  id: string
  applicationId: string
  fileName: string
  fileSize: number
  fileType: string
  uploadStatus: FileStatus
  uploadProgress: number
  uploadedAt?: string
  fileBlob?: Blob
}

export interface FileChunk {
  id?: number
  fileId: string
  chunkIndex: number
  size: number
  uploadedAt: number
}

export interface FileMeta {
  id?: number
  fileId: string
  applicationId: string
  fileName: string
  fileSize: number
  totalChunks: number
  status: FileStatus
  createdAt: number
  updatedAt?: number
}

export type TransferStatus = 'pending' | 'transferring' | 'paused' | 'completed' | 'error'

export interface TransferState {
  applicationId: string
  status: TransferStatus
  progress: number
  speedBytesPerSec: number
  transferredBytes: number
  totalBytes: number
  remainingSeconds: number
  errorMessage?: string
}

