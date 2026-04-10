import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useApprovalList } from '../useApprovalList'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('useApprovalList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default values', () => {
    const {
      activeTab,
      listData,
      loading,
      pagination,
      filters,
    } = useApprovalList()

    expect(activeTab.value).toBe('pending')
    expect(listData.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(pagination.current).toBe(1)
    expect(pagination.pageSize).toBe(10)
    expect(filters.keyword).toBe('')
  })

  it('handles tab change correctly', () => {
    const { activeTab, handleTabChange, pagination } = useApprovalList()

    expect(activeTab.value).toBe('pending')

    handleTabChange('approved')
    expect(activeTab.value).toBe('approved')
    expect(pagination.current).toBe(1)

    handleTabChange('all')
    expect(activeTab.value).toBe('all')
  })

  it('resets filters correctly', () => {
    const { filters, handleReset, pagination } = useApprovalList()

    filters.keyword = 'QT123'
    filters.transferType = 'green-to-red'

    handleReset()

    expect(filters.keyword).toBe('')
    expect(filters.transferType).toBe('all')
    expect(pagination.current).toBe(1)
  })

  it('handles page change correctly', () => {
    const { pagination, handlePageChange } = useApprovalList()

    expect(pagination.current).toBe(1)

    handlePageChange(2)
    expect(pagination.current).toBe(2)
  })

  it('handles page size change correctly', () => {
    const { pagination, handlePageSizeChange } = useApprovalList()

    expect(pagination.pageSize).toBe(10)

    handlePageSizeChange(20)
    expect(pagination.pageSize).toBe(20)
    expect(pagination.current).toBe(1)
  })

  it('handles search correctly', () => {
    const { pagination, handleSearch } = useApprovalList()

    pagination.current = 3

    handleSearch()
    expect(pagination.current).toBe(1)
  })
})
