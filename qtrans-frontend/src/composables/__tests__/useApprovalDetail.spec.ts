import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useApprovalDetail } from '../useApprovalDetail'
import { useAuthStore } from '@/stores'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useRoute: () => ({
    query: {},
    params: {},
  }),
}))

vi.mock('@arco-design/web-vue', () => ({
  Message: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Modal: {
    success: vi.fn(),
    confirm: vi.fn(),
  },
}))

vi.mock('@/api/application', () => ({
  applicationApi: {
    getApplicationDetail: vi.fn(),
    getProcessDetails: vi.fn().mockResolvedValue(null),
    getFileList: vi.fn().mockResolvedValue({ result: [], pageVO: { totalRows: 0 } }),
  },
}))

vi.mock('@/api/approval', () => ({
  approvalApi: {
    userApproved: vi.fn(),
    getHistory: vi.fn().mockResolvedValue([]),
  },
}))

describe('useApprovalDetail', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    const authStore = useAuthStore()
    authStore.currentUser = {
      id: 'u_approver1',
      username: 'approver1',
      name: '王审批一',
      email: 'approver1@qtrans.demo',
      phone: '13800000002',
      department: 'dept-security',
      departmentName: '安全部',
      roles: ['approver1'],
      status: 'enabled',
      loginType: 2,
    }
    authStore.token = 'mock-token-u_approver1-1'
  })

  it('initializes with default values', () => {
    const { loading, detailData, activeTab, approvalOpinion } = useApprovalDetail()

    expect(loading.value).toBe(false)
    expect(detailData.value).toBeNull()
    expect(activeTab.value).toBe('info')
    expect(approvalOpinion.value).toBe('')
  })

  it('statusLabel returns "-" when no detailData', () => {
    const { statusLabel } = useApprovalDetail()
    expect(statusLabel.value).toBe('-')
  })

  it('basicInfoRows returns empty when no detailData', () => {
    const { basicInfoRows } = useApprovalDetail()
    expect(basicInfoRows.value).toEqual([])
  })

  it('applicationInfoRows returns empty when no detailData', () => {
    const { applicationInfoRows } = useApprovalDetail()
    expect(applicationInfoRows.value).toEqual([])
  })

  it('canOperateBase returns false when no detailData', () => {
    const { canOperateBase } = useApprovalDetail()
    expect(canOperateBase.value).toBe(false)
  })

  it('fetchDetail loads data from api', async () => {
    const { applicationApi } = await import('@/api/application')
    const mockDetail = {
      appBaseInfo: {
        applicationId: 123,
        applicantW3Account: 'submitter',
        applicationStatus: 2,
        creationDate: '2026-03-05T10:00:00Z',
        lastUpdateDate: null,
        transWay: 'green,red',
        reason: 'demo',
        status: 2,
        createdBy: 'submitter',
        lastUpdatedBy: 'submitter',
      },
      appBaseApprovalRoute: {
        isNeedApproval: 1,
        selectedDeptName: '研发部',
        isCustomerData: false,
        managerCopyW3Account: '',
        status: 2,
        createdBy: 'submitter',
        creationDate: '2026-03-05T10:00:00Z',
        lastUpdatedBy: 'submitter',
        lastUpdateDate: null,
        applicationId: 123,
        approvalRouteId: 1,
        deptId: 'dept-rd',
        abcManagerUser: null,
      },
      appBaseCountryCityRegionRelation: {
        fromRegionTypeId: 1,
        toRegionTypeId: 4,
        fromCountryName: '中国',
        fromCityName: '北京',
        toCountryName: '中国',
        toCityName: '上海',
      },
      appBaseUploadDownloadInfo: {
        downloadUser: [],
        auditUrl: '',
      },
      appBpmWorkFlow: {
        applicationId: 123,
        currentHandler: 'approver1',
        status: 2,
        createdBy: 'submitter',
        creationDate: '2026-03-05T10:00:00Z',
        lastUpdatedBy: 'submitter',
        lastUpdateDate: null,
      },
    }

    vi.mocked(applicationApi.getApplicationDetail).mockResolvedValueOnce(mockDetail as any)

    const { fetchDetail, detailData } = useApprovalDetail()
    await fetchDetail('123')

    expect(applicationApi.getApplicationDetail).toHaveBeenCalledWith('123')
    expect(detailData.value).not.toBeNull()
  })
})
