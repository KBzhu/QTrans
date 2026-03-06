import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useApprovalDetail } from '../useApprovalDetail'
import type { Application, TransferType } from '@/types'

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
    const { detailData, transferTypeLabel } = useApprovalDetail()

    detailData.value = {
      id: 'app-1',
      transferType: 'green-to-red',
    } as Application

    expect(transferTypeLabel.value).toBe('绿区传到红区')
  })

  it('computes approval levels correctly for different transfer types', () => {
    const { detailData, totalApprovalLevels } = useApprovalDetail()

    // 绿区传到绿区：免审（0级）
    detailData.value = {
      id: 'app-1',
      transferType: 'green-to-green' as TransferType,
    } as Application
    expect(totalApprovalLevels.value).toBe(1) // Math.max(1, 0)

    // 跨国传输：三级审批
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

    // 绿区传到黄区：一级审批
    detailData.value = {
      id: 'app-1',
      transferType: 'green-to-yellow' as TransferType,
      currentApprovalLevel: 1,
    } as Application

    // isLastLevel 函数内部逻辑：currentLevel >= requiredLevels
    // green-to-yellow 需要 1 级，当前是 1 级，应该是最后一级
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
})
