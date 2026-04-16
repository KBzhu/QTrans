import type { CityDomainMapping, PageResponse, SecurityDomain } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRegionManage } from '@/composables/useRegionManage'

const {
  getCityListMock,
  createCityMock,
  updateCityMock,
  deleteCityMock,
  getDomainListMock,
  createDomainMock,
  updateDomainMock,
  deleteDomainMock,
  toggleDomainStatusMock,
  getAllDomainsMock,
} = vi.hoisted(() => ({
  getCityListMock: vi.fn(),
  createCityMock: vi.fn(),
  updateCityMock: vi.fn(),
  deleteCityMock: vi.fn(),
  getDomainListMock: vi.fn(),
  createDomainMock: vi.fn(),
  updateDomainMock: vi.fn(),
  deleteDomainMock: vi.fn(),
  toggleDomainStatusMock: vi.fn(),
  getAllDomainsMock: vi.fn(),
}))

vi.mock('@/api/regionManage', () => ({
  regionManageApi: {
    getCityList: getCityListMock,
    createCity: createCityMock,
    updateCity: updateCityMock,
    deleteCity: deleteCityMock,
    getDomainList: getDomainListMock,
    createDomain: createDomainMock,
    updateDomain: updateDomainMock,
    deleteDomain: deleteDomainMock,
    toggleDomainStatus: toggleDomainStatusMock,
    getAllDomains: getAllDomainsMock,
  },
}))

vi.mock('@arco-design/web-vue', async () => {
  const actual = await vi.importActual('@arco-design/web-vue')
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    },
    Modal: {
      confirm: vi.fn(),
    },
  }
})

function createCity(overrides: Partial<CityDomainMapping> = {}): CityDomainMapping {
  return {
    id: 'city-1',
    cityName: '北京',
    country: '中国',
    domainCode: 'external',
    domainName: '外网',
    domainColor: '#722ed1',
    status: 'enabled',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function createDomain(overrides: Partial<SecurityDomain> = {}): SecurityDomain {
  return {
    id: 'domain-1',
    name: '绿区',
    code: 'green',
    color: '#00b42a',
    description: '低风险',
    status: 'enabled',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function createPage<T>(list: T[]): PageResponse<T> {
  return { list, total: list.length, pageNum: 1, pageSize: 10, totalPages: 1 }
}

describe('useRegionManage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============ 城市映射 ============
  it('fetchCityList loads city data', async () => {
    const cities = [createCity({ id: 'city-1' }), createCity({ id: 'city-2', cityName: '上海' })]
    getCityListMock.mockResolvedValueOnce(createPage(cities))

    const composable = useRegionManage()
    await composable.fetchCityList()

    expect(getCityListMock).toHaveBeenCalledWith(expect.objectContaining({
      pageNum: 1,
      pageSize: 10,
    }))
    expect(composable.cityListData.value).toHaveLength(2)
    expect(composable.cityPagination.value.total).toBe(2)
  })

  it('handleCreateCity opens modal in city mode', () => {
    const composable = useRegionManage()
    composable.handleCreateCity()

    expect(composable.modalVisible.value).toBe(true)
    expect(composable.modalMode.value).toBe('city')
    expect(composable.editingItem.value).toBeNull()
  })

  it('handleEditCity opens modal with city data', () => {
    const composable = useRegionManage()
    const city = createCity()
    composable.handleEditCity(city)

    expect(composable.modalVisible.value).toBe(true)
    expect(composable.modalMode.value).toBe('city')
    expect(composable.editingItem.value).toEqual(city)
    expect(composable.isEditMode.value).toBe(true)
  })

  it('handleSaveCity creates new city when not in edit mode', async () => {
    getCityListMock.mockResolvedValueOnce(createPage([]))
    createCityMock.mockResolvedValueOnce(createCity())

    const composable = useRegionManage()
    await composable.handleSaveCity({ cityName: '北京', country: '中国', domainCode: 'external' })

    expect(createCityMock).toHaveBeenCalledWith({ cityName: '北京', country: '中国', domainCode: 'external' })
    expect(composable.modalVisible.value).toBe(false)
  })

  it('handleSaveCity updates city when in edit mode', async () => {
    getCityListMock.mockResolvedValueOnce(createPage([]))
    updateCityMock.mockResolvedValueOnce(createCity())

    const composable = useRegionManage()
    composable.handleEditCity(createCity({ id: 'city-99' }))
    await composable.handleSaveCity({ cityName: '北京改' })

    expect(updateCityMock).toHaveBeenCalledWith('city-99', { cityName: '北京改' })
    expect(composable.modalVisible.value).toBe(false)
  })

  it('handleCitySearch resets page to 1 and fetches', async () => {
    getCityListMock.mockResolvedValueOnce(createPage([]))

    const composable = useRegionManage()
    composable.cityPagination.value.pageNum = 5
    await composable.handleCitySearch()

    expect(composable.cityPagination.value.pageNum).toBe(1)
    expect(getCityListMock).toHaveBeenCalled()
  })

  it('handleCityReset clears filters and fetches', async () => {
    getCityListMock.mockResolvedValueOnce(createPage([]))

    const composable = useRegionManage()
    composable.cityFilters.value.keyword = 'test'
    composable.cityFilters.value.domainCode = 'external'
    await composable.handleCityReset()

    expect(composable.cityFilters.value.keyword).toBe('')
    expect(composable.cityFilters.value.domainCode).toBeUndefined()
    expect(getCityListMock).toHaveBeenCalled()
  })

  // ============ 安全域 ============
  it('fetchDomainList loads domain data', async () => {
    const domains = [createDomain(), createDomain({ id: 'domain-2', name: '黄区', code: 'yellow' })]
    getDomainListMock.mockResolvedValueOnce(createPage(domains))

    const composable = useRegionManage()
    await composable.fetchDomainList()

    expect(getDomainListMock).toHaveBeenCalledWith(expect.objectContaining({ pageNum: 1, pageSize: 10 }))
    expect(composable.domainListData.value).toHaveLength(2)
    expect(composable.domainPagination.value.total).toBe(2)
  })

  it('handleCreateDomain opens modal in domain mode', () => {
    const composable = useRegionManage()
    composable.handleCreateDomain()

    expect(composable.modalVisible.value).toBe(true)
    expect(composable.modalMode.value).toBe('domain')
    expect(composable.editingItem.value).toBeNull()
  })

  it('handleEditDomain opens modal with domain data', () => {
    const composable = useRegionManage()
    const domain = createDomain()
    composable.handleEditDomain(domain)

    expect(composable.modalVisible.value).toBe(true)
    expect(composable.modalMode.value).toBe('domain')
    expect(composable.editingItem.value).toEqual(domain)
  })

  it('handleSaveDomain creates new domain', async () => {
    getDomainListMock.mockResolvedValueOnce(createPage([]))
    getAllDomainsMock.mockResolvedValueOnce([])
    createDomainMock.mockResolvedValueOnce(createDomain())

    const composable = useRegionManage()
    await composable.handleSaveDomain({ name: '绿区', code: 'green', color: '#00b42a', description: '', status: 'enabled' })

    expect(createDomainMock).toHaveBeenCalled()
    expect(composable.modalVisible.value).toBe(false)
  })

  it('handleSaveDomain updates domain when in edit mode', async () => {
    getDomainListMock.mockResolvedValueOnce(createPage([]))
    getAllDomainsMock.mockResolvedValueOnce([])
    updateDomainMock.mockResolvedValueOnce(createDomain())

    const composable = useRegionManage()
    composable.handleEditDomain(createDomain({ id: 'domain-99' }))
    await composable.handleSaveDomain({ name: '绿区改' })

    expect(updateDomainMock).toHaveBeenCalledWith('domain-99', { name: '绿区改' })
  })

  it('handleToggleDomainStatus switches domain status', async () => {
    toggleDomainStatusMock.mockResolvedValueOnce(createDomain({ status: 'disabled' }))
    getDomainListMock.mockResolvedValueOnce(createPage([]))

    const composable = useRegionManage()
    await composable.handleToggleDomainStatus(createDomain({ id: 'domain-1', status: 'enabled' }))

    expect(toggleDomainStatusMock).toHaveBeenCalledWith('domain-1', 'disabled')
  })

  it('fetchAllDomains loads enabled domain options', async () => {
    const domains = [createDomain(), createDomain({ id: 'domain-2', name: '黄区', code: 'yellow' })]
    getAllDomainsMock.mockResolvedValueOnce(domains)

    const composable = useRegionManage()
    await composable.fetchAllDomains()

    expect(composable.allDomains.value).toHaveLength(2)
  })

  it('fetchCityList handles api error', async () => {
    const { Message } = await import('@arco-design/web-vue')
    getCityListMock.mockRejectedValueOnce(new Error('network error'))

    const composable = useRegionManage()
    await composable.fetchCityList()

    expect(Message.error).toHaveBeenCalledWith('network error')
    expect(composable.loading.value).toBe(false)
  })

  it('handleTabChange switches activeTab and fetches corresponding data', async () => {
    getCityListMock.mockResolvedValueOnce(createPage([]))
    getDomainListMock.mockResolvedValueOnce(createPage([]))

    const composable = useRegionManage()

    composable.handleTabChange('domain')
    expect(composable.activeTab.value).toBe('domain')
    await Promise.resolve()
    expect(getDomainListMock).toHaveBeenCalled()

    composable.handleTabChange('city')
    expect(composable.activeTab.value).toBe('city')
    await Promise.resolve()
    expect(getCityListMock).toHaveBeenCalled()
  })
})
