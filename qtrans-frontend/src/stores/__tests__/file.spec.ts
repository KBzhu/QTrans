import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Application, TransferState } from '@/types'
import { useApplicationStore } from '@/stores/application'
import { useFileStore } from '@/stores/file'
import { useNotificationStore } from '@/stores/notification'

const {
  simulateTransferMock,
  pauseTransferMock,
  resumeTransferMock,
  cancelTransferMock,
  getTransferStateMock,
  updateApplicationMock,
} = vi.hoisted(() => ({
  simulateTransferMock: vi.fn(),
  pauseTransferMock: vi.fn(),
  resumeTransferMock: vi.fn(),
  cancelTransferMock: vi.fn(),
  getTransferStateMock: vi.fn(),
  updateApplicationMock: vi.fn(),
}))

vi.mock('@/composables/useTransferSimulator', () => ({
  useTransferSimulator: () => ({
    simulateTransfer: simulateTransferMock,
    pauseTransfer: pauseTransferMock,
    resumeTransfer: resumeTransferMock,
    cancelTransfer: cancelTransferMock,
    getTransferState: getTransferStateMock,
  }),
}))

vi.mock('@/api/application', () => ({
  applicationApi: {
    getList: vi.fn(),
    getDetail: vi.fn(),
    create: vi.fn(),
    update: updateApplicationMock,
    remove: vi.fn(),
    saveDraft: vi.fn(),
    getDrafts: vi.fn(),
  },
}))

const baseApplication: Application = {
  id: 'app-1',
  applicationNo: 'QT202603060001',
  transferType: 'green-to-external',
  department: '研发部',
  sourceArea: 'green',
  targetArea: 'external',
  sourceCountry: '中国',
  sourceCity: ['北京'],
  targetCountry: '中国',
  targetCity: ['上海'],
  downloaderAccounts: ['downloader-1'],
  ccAccounts: [],
  containsCustomerData: false,
  applyReason: 'demo',
  applicantNotifyOptions: ['in_app'],
  downloaderNotifyOptions: ['in_app'],
  status: 'approved',
  applicantId: 'submitter-1',
  applicantName: '张提交',
  currentApprovalLevel: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('useFileStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()

    updateApplicationMock.mockImplementation(async (id: string, payload: Partial<Application>) => {
      const applicationStore = useApplicationStore()
      const current = applicationStore.applications.find(item => item.id === id) || baseApplication
      return {
        ...current,
        ...payload,
        id,
        updatedAt: new Date().toISOString(),
      }
    })
  })

  it('updateUploadProgress updates progress value', () => {
    const store = useFileStore()

    store.addFile({
      id: 'file-1',
      applicationId: 'app-1',
      fileName: 'demo.txt',
      fileSize: 100,
      fileType: 'text/plain',
      uploadStatus: 'pending',
      uploadProgress: 0,
    })

    store.updateUploadProgress('file-1', 50, 1024)

    expect(store.uploadProgress.get('file-1')?.progress).toBe(50)
    expect(store.uploadStatus.get('file-1')).toBe('uploading')
  })

  it('pauseUpload sets paused status', () => {
    const store = useFileStore()

    store.addFile({
      id: 'file-2',
      applicationId: 'app-1',
      fileName: 'demo2.txt',
      fileSize: 200,
      fileType: 'text/plain',
      uploadStatus: 'uploading',
      uploadProgress: 10,
    })

    store.pauseUpload('file-2')

    expect(store.uploadStatus.get('file-2')).toBe('paused')
  })

  it('startTransfer updates application status and pushes completion notifications', async () => {
    const fileStore = useFileStore()
    const applicationStore = useApplicationStore()
    const notificationStore = useNotificationStore()

    applicationStore.applications = [{ ...baseApplication }]
    fileStore.addFile({
      id: 'file-3',
      applicationId: 'app-1',
      fileName: 'archive.zip',
      fileSize: 2048,
      fileType: 'application/zip',
      uploadStatus: 'completed',
      uploadProgress: 100,
    })

    simulateTransferMock.mockImplementation((applicationId: string, totalBytes: number, onProgress: (payload: TransferState) => void, onComplete: () => void) => {
      onProgress({
        applicationId,
        status: 'transferring',
        progress: 42,
        speedBytesPerSec: 512,
        transferredBytes: 860,
        totalBytes,
        remainingSeconds: 3,
      })
      onComplete()
      return vi.fn()
    })

    await fileStore.startTransfer('app-1')
    await Promise.resolve()

    expect(updateApplicationMock).toHaveBeenCalledTimes(2)

    expect(applicationStore.applications[0]?.status).toBe('completed')
    expect(fileStore.getTransferStateByApplicationId('app-1')).toMatchObject({
      status: 'completed',
      progress: 100,
      totalBytes: 2048,
    })
    expect(notificationStore.notifications).toHaveLength(2)
    expect(notificationStore.notifications[0]?.title).toBe('文件传输已完成')
  })

  it('pauseTransfer and resumeTransfer keep transfer state in sync', () => {
    const fileStore = useFileStore()

    fileStore.setTransferState({
      applicationId: 'app-1',
      status: 'transferring',
      progress: 25,
      speedBytesPerSec: 1024,
      transferredBytes: 256,
      totalBytes: 1024,
      remainingSeconds: 1,
    })

    pauseTransferMock.mockReturnValue({
      applicationId: 'app-1',
      status: 'paused',
      progress: 25,
      speedBytesPerSec: 0,
      transferredBytes: 256,
      totalBytes: 1024,
      remainingSeconds: 1,
    })

    resumeTransferMock.mockReturnValue({
      applicationId: 'app-1',
      status: 'transferring',
      progress: 25,
      speedBytesPerSec: 1024,
      transferredBytes: 256,
      totalBytes: 1024,
      remainingSeconds: 1,
    })

    const paused = fileStore.pauseTransfer('app-1')
    expect(paused?.status).toBe('paused')
    expect(fileStore.getTransferStateByApplicationId('app-1')?.status).toBe('paused')

    const resumed = fileStore.resumeTransfer('app-1')
    expect(resumed?.status).toBe('transferring')
    expect(fileStore.getTransferStateByApplicationId('app-1')?.status).toBe('transferring')
  })
})
