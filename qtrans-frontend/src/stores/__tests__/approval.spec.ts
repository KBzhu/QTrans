import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useApprovalStore } from '@/stores/approval'

const { approveMock } = vi.hoisted(() => ({
  approveMock: vi.fn(),
}))

vi.mock('@/api/approval', () => ({

  approvalApi: {
    getPending: vi.fn(),
    approve: approveMock,
    reject: vi.fn(),
    skip: vi.fn(),
  },
}))

describe('useApprovalStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    approveMock.mockReset()
  })

  it('approve removes item from pendingApprovals', async () => {
    approveMock.mockResolvedValueOnce({ id: 'app-1', status: 'approved' })

    const store = useApprovalStore()
    store.pendingApprovals = [
      {
        id: 'app-1',
        applicationNo: 'QT1',
        transferType: 'green-to-green',
        department: '研发部',
        sourceArea: 'green',
        targetArea: 'green',
        sourceCountry: '中国',
        sourceCity: ['北京'],
        targetCountry: '中国',
        targetCity: ['上海'],
        downloaderAccounts: [],
        containsCustomerData: false,
        applyReason: 'demo',
        applicantNotifyOptions: ['in_app'],
        downloaderNotifyOptions: ['in_app'],
        storageSize: 0,
        uploadExpireTime: new Date().toISOString(),
        downloadExpireTime: new Date().toISOString(),
        status: 'pending_approval',
        applicantId: 'u_submitter',
        applicantName: '张提交',
        currentApprovalLevel: 1,
        createdAt: new Date().toISOString(),
      },
    ]

    await store.approve('app-1', 'ok')

    expect(store.pendingApprovals).toHaveLength(0)
    expect(store.pendingCount).toBe(0)
  })
})
