import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useApplicationStore } from '@/stores/application'
import { STORAGE_KEYS } from '@/utils/constants'

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}))

vi.mock('@/api/application', () => ({

  applicationApi: {
    getList: vi.fn(),
    getDetail: vi.fn(),
    create: createMock,
    update: vi.fn(),
    remove: vi.fn(),
    saveDraft: vi.fn(),
    getDrafts: vi.fn(),
  },
}))

describe('useApplicationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    createMock.mockReset()
  })

  it('saveDraft writes to localStorage', async () => {
    const store = useApplicationStore()
    await store.saveDraft({
      id: 'draft-1',
      applyReason: 'demo',
    })

    const cached = localStorage.getItem(STORAGE_KEYS.DRAFTS)
    expect(cached).toContain('draft-1')
  })

  it('createApplication appends new item to list', async () => {
    createMock.mockResolvedValueOnce({
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
      status: 'draft',
      applicantId: 'u_submitter',
      applicantName: '张提交',
      createdAt: new Date().toISOString(),
    })

    const store = useApplicationStore()
    await store.createApplication({ applyReason: 'demo' })

    expect(store.applications[0]?.id).toBe('app-1')
    expect(store.total).toBe(1)
  })
})
