import { HttpResponse } from 'msw'
import { baseHttp as http } from './_utils'

// 模拟存储的分片数据
const uploadedChunks = new Map<string, Set<number>>()
const mergedFiles = new Map<string, string>()

export const fileHandlers = [
  // 上传分片
  http.post('/api/files/upload/chunk', async ({ request }) => {
    const formData = await request.formData()
    const fileId = formData.get('fileId') as string
    const chunkIndex = Number(formData.get('chunkIndex'))
    const totalChunks = Number(formData.get('totalChunks'))

    if (!uploadedChunks.has(fileId)) {
      uploadedChunks.set(fileId, new Set())
    }

    uploadedChunks.get(fileId)!.add(chunkIndex)

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))

    return HttpResponse.json({
      success: true,
      chunkIndex,
      message: `分片 ${chunkIndex + 1}/${totalChunks} 上传成功`,
    })
  }),

  // 合并分片
  http.post('/api/files/upload/merge', async ({ request }) => {
    const body = await request.json() as { fileId: string, totalChunks: number }
    const { fileId, totalChunks } = body

    const chunks = uploadedChunks.get(fileId)
    if (!chunks || chunks.size !== totalChunks) {
      return HttpResponse.json(
        {
          success: false,
          message: `分片不完整: ${chunks?.size || 0}/${totalChunks}`,
        },
        { status: 400 },
      )
    }

    // 生成上传后的文件 ID
    const uploadedFileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    mergedFiles.set(fileId, uploadedFileId)

    // 清理分片记录
    uploadedChunks.delete(fileId)

    // 模拟合并延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    return HttpResponse.json({
      success: true,
      uploadedFileId,
      fileUrl: `/uploads/${uploadedFileId}`,
    })
  }),

  // 删除文件
  http.delete('/api/files/:fileId', async ({ params }) => {
    const { fileId } = params

    uploadedChunks.delete(fileId as string)
    mergedFiles.delete(fileId as string)

    return HttpResponse.json({
      success: true,
    })
  }),

  // 获取文件列表
  http.get('/api/files/list/:applicationId', async ({ params }) => {
    const { applicationId } = params

    // 返回模拟文件列表
    return HttpResponse.json([
      {
        id: `file-1-${applicationId}`,
        fileName: '测试文件.zip',
        fileSize: 1024 * 1024 * 10,
        uploadTime: Date.now() - 3600000,
        status: 'completed',
      },
    ])
  }),
]
