import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useApprovalDetail } from '../useApprovalDetail'
import type { Application, TransferType } from '@/types'
import { useApprovalStore, useFileStore } from '@/stores'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@arco-design/web-vue', () => ({
  Message: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('useApprovalDetail', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default values', () => {
    const { loading, detailData, activeTab, approvalOpinion } = useApprovalDetail()

    expect(loading.value).toBe(false)
    expect(detailData.value).toBeNull()
    expect(activeTab.value).toBe('info')
    expect(approvalOpinion.value).toBe('')
  })

  it('computes status label correctly', () => {
    const { detailData, statusLabel } = useApprovalDetail()

    detailData.value = {
      id: 'app-1',
      status: 'pending_approval',
    } as Application

    expect(statusLabel.value).toBe('待审批')
  })

  it('computes transfer type label correctly', () => {
    const result = useApprovalDetail()

    result.detailData.value = {
      id: 'app-1',
      transferType: 'green-to-red',
    } as Application

    expect(result.transferTypeLabel.value).toBe('绿区传到红区')
  })

  it('computes approval levels correctly for different transfer types', () => {
    const { detailData, totalApprovalLevels } = useApprovalDetail()

    detailData.value = {
      id: 'app-1',
      transferType: 'green-to-green' as TransferType,
    } as Application
    expect(totalApprovalLevels.value).toBe(1)

    detailData.value = {
      id: 'app-2',
      transferType: 'cross-country' as TransferType,
    } as Application
    expect(totalApprovalLevels.value).toBe(3)
  })

  it('computes current approval label correctly', () => {
    const { detailData, currentApprovalLabel } = useApprovalDetail()

    detailData.value = {
      id: 'app-1',
      status: 'pending_approval',
      currentApprovalLevel: 2,
    } as Application

    expect(currentApprovalLabel.value).toBe('二级审批')
  })

  it('determines if approval is last level correctly', () => {
    const { detailData } = useApprovalDetail()

    detailData.value = {
      id: 'app-1',
      transferType: 'green-to-yellow' as TransferType,
      currentApprovalLevel: 1,
    } as Application

    expect(detailData.value.currentApprovalLevel).toBe(1)
  })

  it('computes canOperate correctly', () => {
    const { detailData, canOperate } = useApprovalDetail()

    detailData.value = {
      id: 'app-1',
      status: 'pending_approval',
    } as Application
    expect(canOperate.value).toBe(true)

    detailData.value = {
      id: 'app-2',
      status: 'approved',
    } as Application
    expect(canOperate.value).toBe(false)
  })

  it('builds basic info rows correctly', () => {
    const { detailData, basicInfoRows } = useApprovalDetail()

    detailData.value = {
      id: 'app-1',
      applicationNo: 'QT20260305001',
      applicantId: 'u001',
      applicantName: '张三',
      status: 'pending_approval',
      currentApprovalLevel: 1,
      createdAt: '2026-03-05T10:00:00Z',
      updatedAt: '2026-03-05T11:00:00Z',
    } as Application

    const rows = basicInfoRows.value
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.find(r => r.label === '申请单号')?.value).toBe('QT20260305001')
    expect(rows.find(r => r.label === '申请人')?.value).toContain('张三')
  })

  it('builds application info rows correctly', () => {
    const { detailData, applicationInfoRows } = useApprovalDetail()

    detailData.value = {
      id: 'app-1',
      department: '研发部',
      transferType: 'green-to-red' as TransferType,
      sourceArea: 'green',
      targetArea: 'red',
      sourceCountry: '中国',
      sourceCity: ['北京'],
      targetCountry: '美国',
      targetCity: ['纽约'],
      containsCustomerData: true,
      applyReason: '业务需求',
    } as Application

    const rows = applicationInfoRows.value
    expect(rows.find(r => r.label === '部门')?.value).toBe('研发部')
    expect(rows.find(r => r.label === '包含客户网络数据')?.value).toBe('是')
  })

  it('builds file list correctly', () => {
    const { detailData, files } = useApprovalDetail()

    detailData.value = {
      id: 'app-1',
      storageSize: 100,
      createdAt: '2026-03-05T10:00:00Z',
    } as Application

    expect(files.value.length).toBeGreaterThan(0)
    expect(files.value[0].fileName).toContain('.zip')
  })

  it('handleApprove starts transfer on last approval level', async () => {
    vi.useFakeTimers()

    const approvalStore = useApprovalStore()
    const fileStore = useFileStore()
    const composable = useApprovalDetail()

    composable.detailData.value = {
      id: 'app-last',
      applicationNo: 'QT-LAST',
      transferType: 'green-to-yellow',
      currentApprovalLevel: 1,
      status: 'pending_approval',
      applicantId: 'u_submitter',
      applicantName: '张提交',
      department: '研发部',
      sourceArea: 'green',
      targetArea: 'yellow',
      sourceCountry: '中国',
      sourceCity: ['北京'],
      targetCountry: '中国',
      targetCity: ['上海'],
      downloaderAccounts: ['u_downloader'],
      containsCustomerData: false,
      applyReason: 'demo',
      applicantNotifyOptions: ['in_app'],
      downloaderNotifyOptions: ['in_app'],
      storageSize: 1,
      uploadExpireTime: new Date().toISOString(),
      downloadExpireTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    } as Application

    approvalStore.approve = vi.fn().mockResolvedValue({
      ...composable.detailData.value,
      status: 'approved',
      currentApprovalLevel: 0,
    }) as any
    approvalStore.fetchApprovalHistory = vi.fn().mockResolvedValue([]) as any
    fileStore.startTransfer = vi.fn().mockResolvedValue(undefined) as any

    await composable.handleApprove()

    expect(fileStore.startTransfer).toHaveBeenCalledWith('app-last')
    vi.runAllTimers()
    vi.useRealTimers()
  })

  it('handleExempt starts transfer immediately', async () => {
    vi.useFakeTimers()

    const approvalStore = useApprovalStore()
    const fileStore = useFileStore()
    const composable = useApprovalDetail()

    composable.detailData.value = {
      id: 'app-exempt',
      applicationNo: 'QT-EXEMPT',
      transferType: 'cross-country',
      currentApprovalLevel: 3,
      status: 'pending_approval',
      applicantId: 'u_submitter',
      applicantName: '张提交',
      department: '研发部',
      sourceArea: 'green',
      targetArea: 'red',
      sourceCountry: '中国',
      sourceCity: ['北京'],
      targetCountry: '美国',
      targetCity: ['纽约'],
      downloaderAccounts: ['u_downloader'],
      containsCustomerData: false,
      applyReason: 'demo',
      applicantNotifyOptions: ['in_app'],
      downloaderNotifyOptions: ['in_app'],
      storageSize: 1,
      uploadExpireTime: new Date().toISOString(),
      downloadExpireTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    } as Application

    approvalStore.skip = vi.fn().mockResolvedValue({
      ...composable.detailData.value,
      status: 'approved',
      currentApprovalLevel: 0,
    }) as any
    approvalStore.fetchApprovalHistory = vi.fn().mockResolvedValue([]) as any
    fileStore.startTransfer = vi.fn().mockResolvedValue(undefined) as any

    await composable.handleExempt()

    expect(fileStore.startTransfer).toHaveBeenCalledWith('app-exempt')
    vi.runAllTimers()
    vi.useRealTimers()
  })
})
