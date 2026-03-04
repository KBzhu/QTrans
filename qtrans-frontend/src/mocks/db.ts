import Dexie, { type EntityTable } from 'dexie'

export interface FileChunk {
  id?: number
  fileId: string
  chunkIndex: number
  chunkData?: Blob
  chunkHash: string
  uploadTime: number
  size: number
}

export interface FileMeta {
  id?: number
  fileId: string
  fileName: string
  fileSize: number
  fileType: string
  totalChunks: number
  uploadedChunks: number
  md5?: string
  applicationId: string
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled'
  createTime: number
  updateTime: number
}

class QTransDB extends Dexie {
  fileChunks!: EntityTable<FileChunk, 'id'>
  fileMetas!: EntityTable<FileMeta, 'id'>

  constructor() {
    super('QTransDB')
    this.version(1).stores({
      fileChunks: '++id, fileId, chunkIndex, [fileId+chunkIndex]',
      fileMetas: '++id, fileId, applicationId, status, updateTime',
    })
  }
}

export const db = new QTransDB()
