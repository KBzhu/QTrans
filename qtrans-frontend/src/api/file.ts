import { request } from '@/utils/request'

export interface UploadChunkResponse {
  success: boolean
  chunkIndex: number
  message?: string
}

export interface MergeChunksRequest {
  fileId: string
  totalChunks: number
}

export interface MergeChunksResponse {
  success: boolean
  uploadedFileId: string
  fileUrl?: string
}

/**
 * 上传文件分片
 */
export function uploadChunk(formData: FormData, config?: { signal?: AbortSignal }): Promise<UploadChunkResponse> {
  return request.post('/files/upload/chunk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    ...config,
  })
}

/**
 * 合并文件分片
 */
export function mergeChunks(data: MergeChunksRequest): Promise<MergeChunksResponse> {
  return request.post('/files/upload/merge', data)
}

/**
 * 删除文件
 */
export function deleteFile(fileId: string): Promise<{ success: boolean }> {
  return request.delete(`/files/${fileId}`)
}

/**
 * 获取文件列表
 */
export function getFileList(applicationId: string): Promise<any[]> {
  return request.get(`/files/list/${applicationId}`)
}

export const fileApi = {
  uploadChunk,
  mergeChunks,
  deleteFile,
  getFileList,
}
