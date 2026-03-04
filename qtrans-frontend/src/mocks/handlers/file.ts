import { db } from '../db'
import { http } from 'msw'
import { failed, mockDelay, success } from './_utils'

interface UploadChunkPayload {
  fileId: string
  chunkIndex: number
  chunkHash: string
  size: number
  fileName: string
  fileSize: number
  applicationId: string
  totalChunks: number
}

export const fileHandlers = [
  http.post('/api/files/upload', async ({ request }) => {
    await mockDelay(200)

    const payload = await request.json() as UploadChunkPayload

    await db.fileChunks.put({
      fileId: payload.fileId,
      chunkIndex: payload.chunkIndex,
      chunkHash: payload.chunkHash,
      size: payload.size,
      uploadTime: Date.now(),
    })

    const meta = await db.fileMetas.where('fileId').equals(payload.fileId).first()

    if (!meta) {
      await db.fileMetas.add({
        fileId: payload.fileId,
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        fileType: '',
        totalChunks: payload.totalChunks,
        uploadedChunks: 1,
        applicationId: payload.applicationId,
        status: 'uploading',
        createTime: Date.now(),
        updateTime: Date.now(),
      })
    }
    else {
      await db.fileMetas.update(meta.id!, {
        uploadedChunks: Math.min(meta.totalChunks, meta.uploadedChunks + 1),
        status: 'uploading',
        updateTime: Date.now(),
      })
    }

    return success({ uploaded: true })
  }),

  http.post('/api/files/merge', async ({ request }) => {
    await mockDelay(200)

    const payload = await request.json() as { fileId: string }
    const meta = await db.fileMetas.where('fileId').equals(payload.fileId).first()

    if (!meta)
      return failed('文件不存在', 404)

    await db.fileMetas.update(meta.id!, {
      uploadedChunks: meta.totalChunks,
      status: 'completed',
      updateTime: Date.now(),
    })

    return success({ success: true }, '分片合并成功')
  }),

  http.get('/api/files/:id/chunks', async ({ params }) => {
    await mockDelay(120)

    const fileId = String(params.id)
    const chunks = await db.fileChunks.where('fileId').equals(fileId).toArray()

    return success({
      fileId,
      uploadedChunks: chunks.map(item => item.chunkIndex).sort((a, b) => a - b),
    })
  }),

  http.delete('/api/files/:id', async ({ params }) => {
    await mockDelay(150)

    const fileId = String(params.id)
    await db.transaction('rw', db.fileChunks, db.fileMetas, async () => {
      await db.fileChunks.where('fileId').equals(fileId).delete()
      await db.fileMetas.where('fileId').equals(fileId).delete()
    })

    return success(null, '文件已删除')
  }),

  http.get('/api/files/:id/download', async ({ params }) => {
    await mockDelay(100)
    const fileId = String(params.id)

    return success({
      fileId,
      url: `https://download.qtrans.demo/${fileId}`,
      expiredAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
  }),
]
