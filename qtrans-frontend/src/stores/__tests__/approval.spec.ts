import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useApprovalStore } from '@/stores/approval'

const { approveMock } = vi.hoisted(() => ({
  approveMock: vi.fn(),
}))

vi.mock('@/api/approval', () => ({
  approvalApi: {
    getWaitingForApproval: vi.fn().mockResolvedValue({ pageVO: { totalRows: 0 }, result: [] }),
    userApproved: approveMock,
    getHistory: vi.fn().mockResolvedValue([]),
  },
}))

describe('useApprovalStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    approveMock.mockReset()
  })

  it('approve calls userApproved with correct params', async () => {
    approveMock.mockResolvedValueOnce({ success: true })

    const store = useApprovalStore()
    await store.approve(1, 'ok')

    expect(approveMock).toHaveBeenCalledWith({
      approvedType: 1,
      comments: 'ok',
      appBpmWorkFlow: { applicationId: 1 },
    })
  })

  it('reject calls userApproved with approvedType 0', async () => {
    approveMock.mockResolvedValueOnce({ success: true })

    const store = useApprovalStore()
    await store.reject(1, '驳回原因')

    expect(approveMock).toHaveBeenCalledWith({
      approvedType: 0,
      comments: '驳回原因',
      appBpmWorkFlow: { applicationId: 1 },
    })
  })

  it('fetchPendingApprovals updates pendingCount', async () => {
    const { approvalApi } = await import('@/api/approval')
    vi.mocked(approvalApi.getWaitingForApproval).mockResolvedValueOnce({
      pageVO: { totalRows: 3 },
      result: [],
    } as any)

    const store = useApprovalStore()
    await store.fetchPendingApprovals()

    expect(store.pendingCount).toBe(3)
  })
})
