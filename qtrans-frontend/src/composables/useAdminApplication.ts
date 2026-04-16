import type { AdminApplicationQuery, AdminApplicationRecord } from '@/types'
import { reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { adminApplicationApi } from '@/api/adminApplication'

/** 筛选条件 */
export interface AdminApplicationFilters {
  applicationId: string
  applicantW3Account: string
  downloadW3Account: string
  securityLevelId: string | number
  formAreaId: string | number
  toAreaId: string | number
  applicationStartTime: string
  applicationEndTime: string
}

/** 分页状态 */
export interface AdminApplicationPagination {
  current: number
  pageSize: number
  total: number
}

/** 安全等级选项（根据实际业务配置） */
const securityLevelOptions = [
  { label: '全部', value: '' },
  { label: '内部公开', value: 11 },
  { label: '秘密', value: 12 },
  { label: '机密', value: 13 },
  { label: '绝密', value: 14 },
]

/** 区域选项（根据实际业务配置） */
const areaOptions = [
  { label: '全部', value: '' },
  { label: '黄区', value: 0 },
  { label: '绿区', value: 1 },
  { label: '外网', value: 2 },
]

/** 状态颜色映射 */
const statusColorMap: Record<string, string> = {
  '通知下载': 'green',
  '待审批': 'orange',
  '审批中': 'blue',
  '已驳回': 'red',
  '已完成': 'cyan',
  '传输中': 'purple',
}

export function useAdminApplication() {
  const listData = ref<AdminApplicationRecord[]>([])
  const loading = ref(false)

  const pagination = reactive<AdminApplicationPagination>({
    current: 1,
    pageSize: 15,
    total: 0,
  })

  const filters = reactive<AdminApplicationFilters>({
    applicationId: '',
    applicantW3Account: '',
    downloadW3Account: '',
    securityLevelId: '',
    formAreaId: '',
    toAreaId: '',
    applicationStartTime: '',
    applicationEndTime: '',
  })

  /**
   * 获取申请单列表
   */
  async function fetchList() {
    loading.value = true
    try {
      const params: AdminApplicationQuery = {
        pageNum: pagination.current,
        pageSize: pagination.pageSize,
        applicationId: filters.applicationId.trim() || undefined,
        applicantW3Account: filters.applicantW3Account.trim() || undefined,
        downloadW3Account: filters.downloadW3Account.trim() || undefined,
        securityLevelId: filters.securityLevelId || undefined,
        formAreaId: filters.formAreaId || undefined,
        toAreaId: filters.toAreaId || undefined,
        applicationStartTime: filters.applicationStartTime || undefined,
        applicationEndTime: filters.applicationEndTime || undefined,
      }

      const response = await adminApplicationApi.getList(params)

      listData.value = response.result || []
      pagination.total = response.pageVO?.totalRows || 0
    }
    catch (error: any) {
      Message.error(error.message || '获取申请单列表失败')
      listData.value = []
      pagination.total = 0
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 搜索
   */
  async function handleSearch() {
    pagination.current = 1
    await fetchList()
  }

  /**
   * 重置筛选条件
   */
  async function handleReset() {
    filters.applicationId = ''
    filters.applicantW3Account = ''
    filters.downloadW3Account = ''
    filters.securityLevelId = ''
    filters.formAreaId = ''
    filters.toAreaId = ''
    filters.applicationStartTime = ''
    filters.applicationEndTime = ''
    pagination.current = 1
    await fetchList()
  }

  /**
   * 页码变化
   */
  async function handlePageChange(page: number) {
    pagination.current = page
    await fetchList()
  }

  /**
   * 每页条数变化
   */
  async function handlePageSizeChange(pageSize: number) {
    pagination.pageSize = pageSize
    pagination.current = 1
    await fetchList()
  }

  /**
   * 获取状态颜色
   */
  function getStatusColor(status: string): string {
    return statusColorMap[status] || 'gray'
  }

  /**
   * 格式化日期时间
   */
  function formatDateTime(dateTime?: string): string {
    if (!dateTime)
      return '-'
    return dateTime
  }

  /**
   * 格式化布尔值
   */
  function formatBoolean(value?: number | string | null): string {
    if (value === undefined || value === null)
      return '-'
    return value === 1 || value === '1' ? '是' : '否'
  }

  return {
    listData,
    loading,
    pagination,
    filters,
    securityLevelOptions,
    areaOptions,
    fetchList,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    getStatusColor,
    formatDateTime,
    formatBoolean,
  }
}
