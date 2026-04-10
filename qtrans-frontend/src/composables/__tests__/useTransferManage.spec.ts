import type { Application, TransferState } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTransferManage } from '../useTransferManage'
import { useApplicationStore, useFileStore } from '@/stores'

function createApplication(overrides: Partial<Application> = {}): Application {
  const now = '2026-03-10T10:00:00.000Z'
  return {
    id: overrides.id || 'app-1',
    applicationNo: overrides.applicationNo || 'QT202603100001',
    transferType: overrides.transferType || 'green-to-red',
    department: overrides.department || '研发部',
    sourceArea: overrides.sourceArea || 'green',
    targetArea: overrides.targetArea || 'red',
    sourceCountry: overrides.sourceCountry || '中国',
    sourceCity: overrides.sourceCity || ['北京'],
    targetCountry: overrides.targetCountry || '中国',
    targetCity: overrides.targetCity || ['上海'],
    downloaderAccounts: overrides.downloaderAccounts || ['downloader'],
    ccAccounts: overrides.ccAccounts || [],
    containsCustomerData: overrides.containsCustomerData || false,
    applyReason: overrides.applyReason || '测试传输',
    applicantNotifyOptions: overrides.applicantNotifyOptions || ['in_app'],
    downloaderNotifyOptions: overrides.downloaderNotifyOptions || ['in_app'],
    status: overrides.status || 'transferring',
    applicantId: overrides.applicantId || 'u-admin',
    applicantName: overrides.applicantName || '张三',
    currentApprovalLevel: overrides.currentApprovalLevel || 0,
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
  }
}

function setTransferState(fileStore: ReturnType<typeof useFileStore>, state: TransferState) {
  fileStore.setTransferState(state)
}

describe('useTransferManage', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('filters records by tab and search conditions', async () => {
    const applicationStore = useApplicationStore()
    const fileStore = useFileStore()

    applicationStore.applications = [
      createApplication({
        id: 'app-transferring',
        applicationNo: 'QT-TRANS-001',
        applicantName: '张三',
        status: 'transferring',
        updatedAt: '2026-03-10T11:00:00.000Z',
      }),
      createApplication({
        id: 'app-error',
        applicationNo: 'QT-ERROR-002',
        applicantName: '李四',
        status: 'approved',
        updatedAt: '2026-03-09T11:00:00.000Z',
      }),
      createApplication({
        id: 'app-completed',
        applicationNo: 'QT-DONE-003',
        applicantName: '王五',
        status: 'completed',
        updatedAt: '2026-03-08T11:00:00.000Z',
      }),
    ]

    setTransferState(fileStore, {
      applicationId: 'app-transferring',
      status: 'transferring',
      progress: 45,
      speedBytesPerSec: 2048,
      transferredBytes: 1024,
      totalBytes: 4096,
      remainingSeconds: 2,
    })

    setTransferState(fileStore, {
      applicationId: 'app-error',
      status: 'error',
      progress: 80,
      speedBytesPerSec: 0,
      transferredBytes: 2048,
      totalBytes: 4096,
      remainingSeconds: 0,
      errorMessage: 'network',
    })

    applicationStore.fetchApplications = vi.fn().mockResolvedValue({
      list: applicationStore.applications,
      total: applicationStore.applications.length,
      pageNum: 1,
      pageSize: 200,
    }) as any

    const composable = useTransferManage()
    await composable.fetchList()

    expect(composable.filteredRecords.value.map(item => item.id)).toEqual(['app-transferring', 'app-error'])

    await composable.handleTabChange('completed')
    expect(composable.listData.value.map(item => item.id)).toEqual(['app-completed'])

    await composable.handleTabChange('all')
    composable.filters.applicationNo = 'ERROR'
    await composable.handleSearch()
    expect(composable.listData.value.map(item => item.id)).toEqual(['app-error'])

    composable.filters.applicationNo = ''
    composable.filters.applicantName = '张三'
    composable.filters.transferRange = ['2026-03-10', '2026-03-10']
    await composable.handleSearch()
    expect(composable.listData.value.map(item => item.id)).toEqual(['app-transferring'])
  })

  it('handles pause, resume, retry and batch operations', async () => {
    const applicationStore = useApplicationStore()
    const fileStore = useFileStore()

    applicationStore.applications = [
      createApplication({ id: 'app-transferring', status: 'transferring' }),
      createApplication({ id: 'app-paused', status: 'transferring', applicationNo: 'QT-PAUSED-002' }),
      createApplication({ id: 'app-error', status: 'approved', applicationNo: 'QT-ERROR-003' }),
    ]

    setTransferState(fileStore, {
      applicationId: 'app-transferring',
      status: 'transferring',
      progress: 20,
      speedBytesPerSec: 1024,
      transferredBytes: 100,
      totalBytes: 1000,
      remainingSeconds: 3,
    })
    setTransferState(fileStore, {
      applicationId: 'app-paused',
      status: 'paused',
      progress: 35,
      speedBytesPerSec: 0,
      transferredBytes: 350,
      totalBytes: 1000,
      remainingSeconds: 4,
    })
    setTransferState(fileStore, {
      applicationId: 'app-error',
      status: 'error',
      progress: 60,
      speedBytesPerSec: 0,
      transferredBytes: 600,
      totalBytes: 1000,
      remainingSeconds: 0,
      errorMessage: 'boom',
    })

    applicationStore.fetchApplications = vi.fn().mockResolvedValue({
      list: applicationStore.applications,
      total: applicationStore.applications.length,
      pageNum: 1,
      pageSize: 200,
    }) as any

    const pauseMock = vi.fn((id: string) => fileStore.getTransferStateByApplicationId(id))
    const resumeMock = vi.fn((id: string) => fileStore.getTransferStateByApplicationId(id))
    const retryMock = vi.fn().mockResolvedValue(undefined)

    fileStore.pauseTransfer = pauseMock as any
    fileStore.resumeTransfer = resumeMock as any
    fileStore.retryTransfer = retryMock as any

    const composable = useTransferManage()
    await composable.fetchList()

    composable.handlePause('app-transferring')
    composable.handleResume('app-paused')
    await composable.handleRetry('app-error')

    expect(pauseMock).toHaveBeenCalledWith('app-transferring')
    expect(resumeMock).toHaveBeenCalledWith('app-paused')
    expect(retryMock).toHaveBeenCalledWith('app-error')

    composable.selectedRows.value = ['app-transferring', 'app-paused', 'app-error']
    expect(composable.canBatchPause.value).toBe(true)
    expect(composable.canBatchResume.value).toBe(true)

    expect(await composable.handleBatchPause()).toBe(1)
    expect(await composable.handleBatchResume()).toBe(1)
  })

  it('resets filters and selection to defaults', async () => {
    const applicationStore = useApplicationStore()
    applicationStore.fetchApplications = vi.fn().mockResolvedValue({ list: [], total: 0, pageNum: 1, pageSize: 200 }) as any

    const composable = useTransferManage()
    composable.filters.applicationNo = 'QT'
    composable.filters.transferType = 'cross-country'
    composable.filters.applicantName = '张三'
    composable.filters.transferRange = ['2026-03-01', '2026-03-10']
    composable.selectedRows.value = ['app-1']

    await composable.handleReset()

    expect(composable.filters.applicationNo).toBe('')
    expect(composable.filters.transferType).toBe('all')
    expect(composable.filters.applicantName).toBe('')
    expect(composable.filters.transferRange).toEqual([])
    expect(composable.selectedRows.value).toEqual([])
  })
})

