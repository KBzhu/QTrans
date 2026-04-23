/**
 * 上传断点续传 IndexedDB 数据库
 * 用于存储分片上传状态，支持跨会话断点续传
 */
import Dexie, { type Table } from 'dexie'

/** 分片信息 */
export interface ChunkInfo {
  id?: number
  fileUUID: string          // 文件唯一标识
  chunkIndex: number        // 分片索引（从 0 开始）
  chunkHash: string         // 分片 MD5/SHA-256 哈希
  chunkSize: number         // 分片大小（字节）
  uploadedAt: Date          // 上传完成时间
}

/** 上传记录 */
export interface UploadRecord {
  id?: number
  fileUUID: string          // 文件唯一标识
  fileName: string          // 文件名
  fileSize: number          // 文件大小（字节）
  totalChunks: number       // 总分片数
  uploadParams: string      // 加密的 params
  relativeDir: string       // 上传目录
  status: 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled'
  createdAt: Date           // 创建时间
  updatedAt: Date           // 最后更新时间
  completedAt?: Date        // 完成时间
  clientHash?: string       // 全文件 SHA-256 hash（用于断点续传时校验文件一致性）
}

/**
 * 上传数据库类
 */
class UploadDatabase extends Dexie {
  chunks!: Table<ChunkInfo, number>
  uploads!: Table<UploadRecord, number>

  constructor() {
    super('TransUploadDB')

    this.version(1).stores({
      chunks: '++id, fileUUID, chunkIndex, [fileUUID+chunkIndex]',
      uploads: '++id, fileUUID, fileName, status, updatedAt'
    })

    // v2: 为 uploads 表增加 uploadParams 索引，支持按 params 查询未完成任务
    this.version(2).stores({
      uploads: '++id, fileUUID, fileName, status, updatedAt, uploadParams'
    }).upgrade((tx) => {
      // 升级时将现有记录的 uploadParams 设为空字符串，避免查询时报 undefined
      const table = tx.table('uploads')
      return table.toCollection().modify((record: any) => {
        if (!record.uploadParams) {
          record.uploadParams = ''
        }
      })
    })

    // v3: 为 uploads 表增加 clientHash 字段，支持断点续传时校验文件一致性
    this.version(3).stores({
      uploads: '++id, fileUUID, fileName, status, updatedAt, uploadParams'
    }).upgrade((tx) => {
      const table = tx.table('uploads')
      return table.toCollection().modify((record: any) => {
        if (!record.clientHash) {
          record.clientHash = ''
        }
      })
    })
  }
}

// 单例实例
const db = new UploadDatabase()

// ============ 分片操作 ============

/**
 * 保存分片信息
 */
export async function saveChunk(chunk: Omit<ChunkInfo, 'id'>): Promise<number> {
  // 先删除旧记录（如果存在）
  await db.chunks
    .where(['fileUUID', 'chunkIndex'])
    .equals([chunk.fileUUID, chunk.chunkIndex])
    .delete()
  
  return db.chunks.add({
    ...chunk,
    uploadedAt: new Date()
  })
}

/**
 * 获取文件的所有已上传分片
 */
export async function getChunksByFileUUID(fileUUID: string): Promise<ChunkInfo[]> {
  return db.chunks.where('fileUUID').equals(fileUUID).toArray()
}

/**
 * 获取文件的已上传分片索引集合
 */
export async function getUploadedChunkIndexes(fileUUID: string): Promise<Set<number>> {
  const chunks = await getChunksByFileUUID(fileUUID)
  return new Set(chunks.map(c => c.chunkIndex))
}

/**
 * 删除文件的所有分片记录
 */
export async function deleteChunksByFileUUID(fileUUID: string): Promise<void> {
  await db.chunks.where('fileUUID').equals(fileUUID).delete()
}

// ============ 上传记录操作 ============

/**
 * 创建上传记录
 */
export async function createUploadRecord(record: Omit<UploadRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date()
  return db.uploads.add({
    ...record,
    createdAt: now,
    updatedAt: now
  })
}

/**
 * 获取上传记录
 */
export async function getUploadRecord(fileUUID: string): Promise<UploadRecord | undefined> {
  return db.uploads.where('fileUUID').equals(fileUUID).first()
}

/**
 * 更新上传记录状态
 */
export async function updateUploadStatus(
  fileUUID: string,
  status: UploadRecord['status'],
  extra?: Partial<UploadRecord>
): Promise<void> {
  const record = await getUploadRecord(fileUUID)
  if (record?.id) {
    await db.uploads.update(record.id, {
      status,
      updatedAt: new Date(),
      ...extra
    })
  }
}

/**
 * 更新上传记录（按 fileUUID）
 */
export async function updateUploadRecord(
  fileUUID: string,
  changes: Partial<UploadRecord>,
): Promise<void> {
  const record = await getUploadRecord(fileUUID)
  if (record?.id) {
    await db.uploads.update(record.id, {
      updatedAt: new Date(),
      ...changes,
    })
  }
}

/**
 * 删除上传记录
 */
export async function deleteUploadRecord(fileUUID: string): Promise<void> {
  const record = await getUploadRecord(fileUUID)
  if (record?.id) {
    await db.uploads.delete(record.id)
  }
}

/**
 * 获取指定 params 的所有未完成上传记录
 */
export async function getPendingUploads(params: string): Promise<UploadRecord[]> {
  return db.uploads
    .where('uploadParams')
    .equals(params)
    .filter(record => record.status === 'uploading' || record.status === 'paused')
    .toArray()
}

/**
 * 获取所有未完成的上传记录
 */
export async function getAllPendingUploads(): Promise<UploadRecord[]> {
  return db.uploads
    .filter(record => record.status === 'uploading' || record.status === 'paused')
    .toArray()
}

// ============ 清理操作 ============

/**
 * 清理已完成的记录（超过 7 天）
 */
export async function cleanCompletedRecords(daysToKeep = 7): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysToKeep)
  
  const toDelete = await db.uploads
    .filter(record =>
      record.status === 'completed'
      && !!record.completedAt
      && new Date(record.completedAt) < cutoff,
    )
    .toArray()
  
  for (const record of toDelete) {
    if (record.fileUUID) {
      await deleteChunksByFileUUID(record.fileUUID)
    }
    if (record.id) {
      await db.uploads.delete(record.id)
    }
  }
  
  return toDelete.length
}

/**
 * 清理失败的记录（超过 30 天）
 */
export async function cleanFailedRecords(daysToKeep = 30): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysToKeep)
  
  const toDelete = await db.uploads
    .filter(record => 
      record.status === 'failed' && 
      new Date(record.updatedAt) < cutoff
    )
    .toArray()
  
  for (const record of toDelete) {
    if (record.fileUUID) {
      await deleteChunksByFileUUID(record.fileUUID)
    }
    if (record.id) {
      await db.uploads.delete(record.id)
    }
  }
  
  return toDelete.length
}

/**
 * 清理所有数据
 */
export async function clearAll(): Promise<void> {
  await db.chunks.clear()
  await db.uploads.clear()
}

export { db }
export default db
