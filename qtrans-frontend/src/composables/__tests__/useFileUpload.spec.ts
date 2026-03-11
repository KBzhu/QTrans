import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFileUpload, generateFileId } from '../useFileUpload'
import { fileApi } from '@/api'
import { CHUNK_SIZE } from '@/utils/constants'

// Mock IndexedDB
const mockFileChunks = new Map()
const mockFileMetas = new Map()

vi.mock('@/mocks/db', () => ({
  db: {
    fileChunks: {
      add: vi.fn((chunk) => {
        const id = Date.now() + Math.random()
        mockFileChunks.set(id, { ...chunk, id })
        return Promise.resolve(id)
      }),
      where: vi.fn((field) => ({
        equals: vi.fn((value) => ({
          toArray: vi.fn(() => {
            const results: any[] = []
            mockFileChunks.forEach((chunk) => {
              if (chunk[field] === value) {
                results.push(chunk)
              }
            })
            return Promise.resolve(results)
          }),
          first: vi.fn(() => {
            let result = null
            mockFileChunks.forEach((chunk) => {
              if (chunk[field] === value && !result) {
                result = chunk
              }
            })
            return Promise.resolve(result)
          }),
          delete: vi.fn(() => {
            const toDelete: any[] = []
            mockFileChunks.forEach((chunk, id) => {
              if (chunk[field] === value) {
                toDelete.push(id)
              }
            })
            toDelete.forEach(id => mockFileChunks.delete(id))
            return Promise.resolve()
          }),
        })),
      })),
      clear: vi.fn(() => {
        mockFileChunks.clear()
        return Promise.resolve()
      }),
    },
    fileMetas: {
      add: vi.fn((meta) => {
        const id = Date.now() + Math.random()
        mockFileMetas.set(id, { ...meta, id })
        return Promise.resolve(id)
      }),
      put: vi.fn((meta) => {
        const id = meta.id || Date.now() + Math.random()
        mockFileMetas.set(id, { ...meta, id })
        return Promise.resolve(id)
      }),
      where: vi.fn((field) => ({
        equals: vi.fn((value) => ({
          first: vi.fn(() => {
            let result = null
            mockFileMetas.forEach((meta) => {
              if (meta[field] === value && !result) {
                result = meta
              }
            })
            return Promise.resolve(result)
          }),
          delete: vi.fn(() => {
            const toDelete: any[] = []
            mockFileMetas.forEach((meta, id) => {
              if (meta[field] === value) {
                toDelete.push(id)
              }
            })
            toDelete.forEach(id => mockFileMetas.delete(id))
            return Promise.resolve()
          }),
        })),
      })),
      update: vi.fn((id, updates) => {
        const meta = mockFileMetas.get(id)
        if (meta) {
          mockFileMetas.set(id, { ...meta, ...updates })
        }
        return Promise.resolve()
      }),
      delete: vi.fn((id) => {
        mockFileMetas.delete(id)
        return Promise.resolve()
      }),
      clear: vi.fn(() => {
        mockFileMetas.clear()
        return Promise.resolve()
      }),
    },
  },
}))

// Mock fileApi
vi.mock('@/api', () => ({
  fileApi: {
    uploadChunk: vi.fn(),
    mergeChunks: vi.fn(),
    deleteFile: vi.fn(),
    getFileList: vi.fn(),
  },
}))

// Mock Message
vi.mock('@arco-design/web-vue', () => ({
  Message: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('useFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 清空 mock IndexedDB
    mockFileChunks.clear()
    mockFileMetas.clear()
  })

  describe('generateFileId', () => {
    it('generates unique file ID based on file properties and applicationId', () => {
      const file = new File(['test'], 'test.txt', {
        type: 'text/plain',
        lastModified: 1234567890,
      })
      const applicationId = 'app-001'

      const fileId = generateFileId(file, applicationId)

      expect(fileId).toBe(`${applicationId}-test.txt-${file.size}-${file.lastModified}`)
      expect(fileId).toContain('app-001')
      expect(fileId).toContain('test.txt')
    })

    it('generates different IDs for different files', () => {
      const file1 = new File(['test1'], 'file1.txt', { lastModified: 1000 })
      const file2 = new File(['test2'], 'file2.txt', { lastModified: 2000 })
      const applicationId = 'app-001'

      const fileId1 = generateFileId(file1, applicationId)
      const fileId2 = generateFileId(file2, applicationId)

      expect(fileId1).not.toBe(fileId2)
    })
  })

  describe('uploadFile', () => {
    it('uploads a small file in single chunk', async () => {
      const { uploadFile } = useFileUpload()
      const fileContent = 'test content'
      const file = new File([fileContent], 'small.txt', { type: 'text/plain' })
      const applicationId = 'app-001'

      vi.mocked(fileApi.uploadChunk).mockResolvedValue({
        success: true,
        chunkIndex: 0,
      })
      vi.mocked(fileApi.mergeChunks).mockResolvedValue({
        success: true,
        uploadedFileId: 'file-uploaded-001',
      })

      const result = await uploadFile(file, applicationId)

      expect(result).toBe('file-uploaded-001')
      expect(fileApi.uploadChunk).toHaveBeenCalledTimes(1)
      expect(fileApi.mergeChunks).toHaveBeenCalledTimes(1)
    })

    it('uploads large file in multiple chunks', async () => {
      const { uploadFile } = useFileUpload()
      // 创建 15MB 文件（3个分片）
      const fileSize = 15 * 1024 * 1024
      const file = new File([new ArrayBuffer(fileSize)], 'large.bin', {
        type: 'application/octet-stream',
      })
      const applicationId = 'app-002'

      vi.mocked(fileApi.uploadChunk).mockResolvedValue({
        success: true,
        chunkIndex: 0,
      })
      vi.mocked(fileApi.mergeChunks).mockResolvedValue({
        success: true,
        uploadedFileId: 'file-large-002',
      })

      const result = await uploadFile(file, applicationId)

      const expectedChunks = Math.ceil(fileSize / CHUNK_SIZE)
      expect(result).toBe('file-large-002')
      expect(fileApi.uploadChunk).toHaveBeenCalledTimes(expectedChunks)
      expect(fileApi.mergeChunks).toHaveBeenCalledTimes(1)
    })

    it('calls onProgress callback during upload', async () => {
      const { uploadFile } = useFileUpload()
      const file = new File(['test'], 'progress.txt', { type: 'text/plain' })
      const applicationId = 'app-003'
      const onProgress = vi.fn()

      vi.mocked(fileApi.uploadChunk).mockResolvedValue({
        success: true,
        chunkIndex: 0,
      })
      vi.mocked(fileApi.mergeChunks).mockResolvedValue({
        success: true,
        uploadedFileId: 'file-003',
      })

      await uploadFile(file, applicationId, onProgress)

      expect(onProgress).toHaveBeenCalled()
      const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1]
      expect(lastCall[0]).toMatchObject({
        status: 'completed',
        progress: 100,
      })
    })

    it('stores file meta and chunks in IndexedDB', async () => {
      const { uploadFile } = useFileUpload()
      const file = new File(['test'], 'meta.txt', { type: 'text/plain' })
      const applicationId = 'app-004'

      vi.mocked(fileApi.uploadChunk).mockResolvedValue({
        success: true,
        chunkIndex: 0,
      })
      vi.mocked(fileApi.mergeChunks).mockResolvedValue({
        success: true,
        uploadedFileId: 'file-004',
      })

      await uploadFile(file, applicationId)

      const fileId = generateFileId(file, applicationId)
      
      // 验证 fileChunks 和 fileMetas 被调用
      const chunksArray: any[] = []
      mockFileChunks.forEach((chunk) => {
        if (chunk.fileId === fileId) {
          chunksArray.push(chunk)
        }
      })
      
      let metaFound = null
      mockFileMetas.forEach((meta) => {
        if (meta.fileId === fileId && !metaFound) {
          metaFound = meta
        }
      })

      expect(metaFound).toBeDefined()
      expect((metaFound as any)?.status).toBe('completed')
      expect(chunksArray.length).toBeGreaterThan(0)
    })

    it('handles upload error and updates status', async () => {
      const { uploadFile } = useFileUpload()
      const file = new File(['error'], 'error.txt', { type: 'text/plain' })
      const applicationId = 'app-005'

      vi.mocked(fileApi.uploadChunk).mockRejectedValue(new Error('Network error'))

      await expect(uploadFile(file, applicationId)).rejects.toThrow('Network error')

      const fileId = generateFileId(file, applicationId)
      let metaFound = null
      mockFileMetas.forEach((meta) => {
        if (meta.fileId === fileId && !metaFound) {
          metaFound = meta
        }
      })

      expect((metaFound as any)?.status).toBe('failed')
    })
  })

  describe('resumeUpload - 断点续传', () => {
    it('resumes upload from last uploaded chunk', async () => {
      const { uploadFile } = useFileUpload()
      const fileSize = 15 * 1024 * 1024 // 15MB = 3 chunks
      const file = new File([new ArrayBuffer(fileSize)], 'resume.bin', {
        type: 'application/octet-stream',
      })
      const applicationId = 'app-resume'
      const fileId = generateFileId(file, applicationId)

      // 模拟已上传第 0 个分片
      const chunkId = Date.now()
      mockFileChunks.set(chunkId, {
        id: chunkId,
        fileId,
        chunkIndex: 0,
        chunkHash: '',
        uploadTime: Date.now(),
        size: CHUNK_SIZE,
      })

      vi.mocked(fileApi.uploadChunk).mockResolvedValue({
        success: true,
        chunkIndex: 1,
      })
      vi.mocked(fileApi.mergeChunks).mockResolvedValue({
        success: true,
        uploadedFileId: 'file-resumed',
      })

      await uploadFile(file, applicationId)

      // 应该只上传剩余的 2 个分片（索引 1 和 2）
      expect(fileApi.uploadChunk).toHaveBeenCalledTimes(2)
    })

    it('skips all chunks if file is already uploaded', async () => {
      const { uploadFile } = useFileUpload()
      const fileSize = 10 * 1024 * 1024 // 10MB = 2 chunks
      const file = new File([new ArrayBuffer(fileSize)], 'complete.bin', {
        type: 'application/octet-stream',
      })
      const applicationId = 'app-complete'
      const fileId = generateFileId(file, applicationId)
      const totalChunks = Math.ceil(fileSize / CHUNK_SIZE)

      // 模拟所有分片已上传
      for (let i = 0; i < totalChunks; i++) {
        const chunkId = Date.now() + i
        mockFileChunks.set(chunkId, {
          id: chunkId,
          fileId,
          chunkIndex: i,
          chunkHash: '',
          uploadTime: Date.now(),
          size: CHUNK_SIZE,
        })
      }

      vi.mocked(fileApi.mergeChunks).mockResolvedValue({
        success: true,
        uploadedFileId: 'file-complete',
      })

      await uploadFile(file, applicationId)

      // 不应调用 uploadChunk，直接合并
      expect(fileApi.uploadChunk).not.toHaveBeenCalled()
      expect(fileApi.mergeChunks).toHaveBeenCalledTimes(1)
    })
  })

  describe('pauseUpload', () => {
    it('pauses ongoing upload', async () => {
      const { uploadFile, pauseUpload } = useFileUpload()
      const fileSize = 20 * 1024 * 1024 // 20MB = 4 chunks
      const file = new File([new ArrayBuffer(fileSize)], 'pause.bin', {
        type: 'application/octet-stream',
      })
      const applicationId = 'app-pause'
      const fileId = generateFileId(file, applicationId)

      let uploadCount = 0
      vi.mocked(fileApi.uploadChunk).mockImplementation(async () => {
        uploadCount++
        // 在第 2 个分片上传后暂停
        if (uploadCount === 2) {
          pauseUpload(fileId)
        }
        await new Promise(resolve => setTimeout(resolve, 50))
        return { success: true, chunkIndex: uploadCount - 1 }
      })

      await expect(uploadFile(file, applicationId)).rejects.toThrow()

      // 验证上传被中断
      expect(uploadCount).toBeLessThan(4)
    })
  })

  describe('cancelUpload', () => {
    it('cancels upload and cleans up IndexedDB data', async () => {
      const { cancelUpload } = useFileUpload()
      const file = new File(['cancel'], 'cancel.txt', { type: 'text/plain' })
      const applicationId = 'app-cancel'
      const fileId = generateFileId(file, applicationId)

      // 添加测试数据
      const chunkId = Date.now()
      mockFileChunks.set(chunkId, {
        id: chunkId,
        fileId,
        chunkIndex: 0,
        chunkHash: '',
        uploadTime: Date.now(),
        size: 100,
      })
      
      const metaId = Date.now() + 1
      mockFileMetas.set(metaId, {
        id: metaId,
        fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        applicationId,
        totalChunks: 1,
        uploadedChunks: 1,
        status: 'uploading',
        createTime: Date.now(),
        updateTime: Date.now(),
      })

      await cancelUpload(fileId)

      const chunksArray: any[] = []
      mockFileChunks.forEach((chunk) => {
        if (chunk.fileId === fileId) {
          chunksArray.push(chunk)
        }
      })
      
      let metaFound = null
      mockFileMetas.forEach((meta) => {
        if (meta.fileId === fileId && !metaFound) {
          metaFound = meta
        }
      })

      expect(chunksArray.length).toBe(0)
      expect(metaFound).toBeNull()
    })
  })

  describe('getUploadProgress', () => {
    it('returns upload progress for a file', async () => {
      const { uploadFile, getUploadProgress } = useFileUpload()
      const file = new File(['progress'], 'progress.txt', { type: 'text/plain' })
      const applicationId = 'app-progress'
      const fileId = generateFileId(file, applicationId)

      vi.mocked(fileApi.uploadChunk).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return { success: true, chunkIndex: 0 }
      })
      vi.mocked(fileApi.mergeChunks).mockResolvedValue({
        success: true,
        uploadedFileId: 'file-progress',
      })

      const uploadPromise = uploadFile(file, applicationId)

      // 在上传过程中检查进度
      await new Promise(resolve => setTimeout(resolve, 5))
      const progress = getUploadProgress(fileId)

      expect(progress).toBeDefined()
      expect(progress?.fileId).toBe(fileId)
      expect(progress?.fileName).toBe('progress.txt')

      await uploadPromise
    })

    it('returns undefined for non-existent file', () => {
      const { getUploadProgress } = useFileUpload()

      const progress = getUploadProgress('non-existent-file-id')

      expect(progress).toBeUndefined()
    })
  })

  describe('customRequest', () => {
    it('adapts to ArcoDesign Upload component', async () => {
      const { customRequest } = useFileUpload()
      const file = new File(['custom'], 'custom.txt', { type: 'text/plain' })
      const applicationId = 'app-custom'

      const onProgress = vi.fn()
      const onSuccess = vi.fn()
      const onError = vi.fn()

      const option = {
        fileItem: { file },
        onProgress,
        onSuccess,
        onError,
      } as any

      vi.mocked(fileApi.uploadChunk).mockResolvedValue({
        success: true,
        chunkIndex: 0,
      })
      vi.mocked(fileApi.mergeChunks).mockResolvedValue({
        success: true,
        uploadedFileId: 'file-custom',
      })

      await customRequest(option, applicationId)

      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          fileId: 'file-custom',
          fileName: 'custom.txt',
        }),
      )
      expect(onError).not.toHaveBeenCalled()
    })

    it('calls onError when upload fails', async () => {
      const { customRequest } = useFileUpload()
      const file = new File(['error'], 'error.txt', { type: 'text/plain' })
      const applicationId = 'app-error'

      const onProgress = vi.fn()
      const onSuccess = vi.fn()
      const onError = vi.fn()

      const option = {
        fileItem: { file },
        onProgress,
        onSuccess,
        onError,
      } as any

      vi.mocked(fileApi.uploadChunk).mockRejectedValue(new Error('Upload failed'))

      await customRequest(option, applicationId)

      expect(onError).toHaveBeenCalled()
      expect(onSuccess).not.toHaveBeenCalled()
    })
  })
})
