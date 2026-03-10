import type {
  CityDomainMapping,
  CityMappingQueryParams,
  CreateCityMappingRequest,
  CreateSecurityDomainRequest,
  DomainQueryParams,
  DomainStatus,
  SecurityDomain,
  UpdateCityMappingRequest,
  UpdateSecurityDomainRequest,
} from '@/types'
import { computed, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { regionManageApi } from '@/api'

export type RegionTab = 'city' | 'domain'
export type ModalMode = 'city' | 'domain'

export function useRegionManage() {
  // ========== 公共状态 ==========
  const activeTab = ref<RegionTab>('city')
  const loading = ref(false)
  const modalVisible = ref(false)
  const modalMode = ref<ModalMode>('city')
  const editingItem = ref<CityDomainMapping | SecurityDomain | null>(null)

  // ========== 城市映射 ==========
  const cityListData = ref<CityDomainMapping[]>([])
  const cityPagination = ref({ pageNum: 1, pageSize: 10, total: 0 })
  const cityFilters = ref<CityMappingQueryParams>({
    keyword: '',
    domainCode: undefined,
    status: undefined,
  })

  // ========== 安全域配置 ==========
  const domainListData = ref<SecurityDomain[]>([])
  const domainPagination = ref({ pageNum: 1, pageSize: 10, total: 0 })
  const domainFilters = ref<DomainQueryParams>({
    keyword: '',
    status: undefined,
  })

  // 所有可用安全域（用于下拉）
  const allDomains = ref<SecurityDomain[]>([])

  const isEditMode = computed(() => !!editingItem.value)

  // ========== 城市映射操作 ==========
  async function fetchCityList() {
    loading.value = true
    try {
      const params: CityMappingQueryParams = {
        ...cityFilters.value,
        status: cityFilters.value.status || undefined,
        pageNum: cityPagination.value.pageNum,
        pageSize: cityPagination.value.pageSize,
      }
      const res = await regionManageApi.getCityList(params)
      cityListData.value = res.list
      cityPagination.value.total = res.total
    }
    catch (error: any) {
      Message.error(error.message || '获取城市映射列表失败')
    }
    finally {
      loading.value = false
    }
  }

  function handleCitySearch() {
    cityPagination.value.pageNum = 1
    fetchCityList()
  }

  function handleCityReset() {
    cityFilters.value = { keyword: '', domainCode: undefined, status: undefined }
    cityPagination.value.pageNum = 1
    fetchCityList()
  }

  function handleCityPageChange(page: number) {
    cityPagination.value.pageNum = page
    fetchCityList()
  }

  function handleCityPageSizeChange(size: number) {
    cityPagination.value.pageSize = size
    cityPagination.value.pageNum = 1
    fetchCityList()
  }

  function handleCreateCity() {
    editingItem.value = null
    modalMode.value = 'city'
    modalVisible.value = true
  }

  function handleEditCity(item: CityDomainMapping) {
    editingItem.value = { ...item }
    modalMode.value = 'city'
    modalVisible.value = true
  }

  function handleDeleteCity(item: CityDomainMapping) {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除城市 "${item.cityName}" 的安全域映射吗？`,
      okText: '删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          await regionManageApi.deleteCity(item.id)
          Message.success('删除成功')
          fetchCityList()
        }
        catch (error: any) {
          Message.error(error.message || '删除失败')
        }
      },
    })
  }

  async function handleSaveCity(formData: CreateCityMappingRequest | UpdateCityMappingRequest) {
    try {
      if (isEditMode.value && editingItem.value) {
        await regionManageApi.updateCity(editingItem.value.id, formData as UpdateCityMappingRequest)
        Message.success('更新成功')
      }
      else {
        await regionManageApi.createCity(formData as CreateCityMappingRequest)
        Message.success('创建成功')
      }
      modalVisible.value = false
      fetchCityList()
    }
    catch (error: any) {
      Message.error(error.message || '保存失败')
      throw error
    }
  }

  // ========== 安全域操作 ==========
  async function fetchDomainList() {
    loading.value = true
    try {
      const params: DomainQueryParams = {
        ...domainFilters.value,
        status: domainFilters.value.status || undefined,
        pageNum: domainPagination.value.pageNum,
        pageSize: domainPagination.value.pageSize,
      }
      const res = await regionManageApi.getDomainList(params)
      domainListData.value = res.list
      domainPagination.value.total = res.total
    }
    catch (error: any) {
      Message.error(error.message || '获取安全域列表失败')
    }
    finally {
      loading.value = false
    }
  }

  function handleDomainSearch() {
    domainPagination.value.pageNum = 1
    fetchDomainList()
  }

  function handleDomainReset() {
    domainFilters.value = { keyword: '', status: undefined }
    domainPagination.value.pageNum = 1
    fetchDomainList()
  }

  function handleDomainPageChange(page: number) {
    domainPagination.value.pageNum = page
    fetchDomainList()
  }

  function handleDomainPageSizeChange(size: number) {
    domainPagination.value.pageSize = size
    domainPagination.value.pageNum = 1
    fetchDomainList()
  }

  function handleCreateDomain() {
    editingItem.value = null
    modalMode.value = 'domain'
    modalVisible.value = true
  }

  function handleEditDomain(item: SecurityDomain) {
    editingItem.value = { ...item }
    modalMode.value = 'domain'
    modalVisible.value = true
  }

  function handleDeleteDomain(item: SecurityDomain) {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除安全域 "${item.name}" 吗？此操作会影响已关联的城市映射。`,
      okText: '删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          await regionManageApi.deleteDomain(item.id)
          Message.success('删除成功')
          fetchDomainList()
        }
        catch (error: any) {
          Message.error(error.message || '删除失败')
        }
      },
    })
  }

  async function handleSaveDomain(formData: CreateSecurityDomainRequest | UpdateSecurityDomainRequest) {
    try {
      if (isEditMode.value && editingItem.value) {
        await regionManageApi.updateDomain(editingItem.value.id, formData as UpdateSecurityDomainRequest)
        Message.success('更新成功')
      }
      else {
        await regionManageApi.createDomain(formData as CreateSecurityDomainRequest)
        Message.success('创建成功')
      }
      modalVisible.value = false
      fetchDomainList()
      fetchAllDomains()
    }
    catch (error: any) {
      Message.error(error.message || '保存失败')
      throw error
    }
  }

  async function handleToggleDomainStatus(item: SecurityDomain) {
    const nextStatus: DomainStatus = item.status === 'enabled' ? 'disabled' : 'enabled'
    const actionText = nextStatus === 'enabled' ? '启用' : '禁用'
    try {
      await regionManageApi.toggleDomainStatus(item.id, nextStatus)
      Message.success(`${actionText}成功`)
      fetchDomainList()
    }
    catch (error: any) {
      Message.error(error.message || `${actionText}失败`)
    }
  }

  // 加载可用安全域（用于下拉选择）
  async function fetchAllDomains() {
    try {
      allDomains.value = await regionManageApi.getAllDomains()
    }
    catch {
      allDomains.value = []
    }
  }

  // ========== Tab 切换 ==========
  function handleTabChange(tab: RegionTab) {
    activeTab.value = tab
    if (tab === 'city') {
      fetchCityList()
    }
    else {
      fetchDomainList()
    }
  }

  // ========== 弹窗统一关闭 ==========
  function handleModalClose() {
    modalVisible.value = false
    editingItem.value = null
  }

  return {
    // 公共
    activeTab,
    loading,
    modalVisible,
    modalMode,
    editingItem,
    isEditMode,
    allDomains,
    // 城市映射
    cityListData,
    cityPagination,
    cityFilters,
    fetchCityList,
    handleCitySearch,
    handleCityReset,
    handleCityPageChange,
    handleCityPageSizeChange,
    handleCreateCity,
    handleEditCity,
    handleDeleteCity,
    handleSaveCity,
    // 安全域
    domainListData,
    domainPagination,
    domainFilters,
    fetchDomainList,
    handleDomainSearch,
    handleDomainReset,
    handleDomainPageChange,
    handleDomainPageSizeChange,
    handleCreateDomain,
    handleEditDomain,
    handleDeleteDomain,
    handleSaveDomain,
    handleToggleDomainStatus,
    // 初始化
    fetchAllDomains,
    handleTabChange,
    handleModalClose,
  }
}
