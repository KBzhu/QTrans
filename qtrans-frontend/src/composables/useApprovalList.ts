import type { WaitingApprovalItem } from '@/api/approval'
import type { TransferType } from '@/constants'
import { reactive, ref, watch } from 'vue'
import { approvalApi } from '@/api/approval'
import { AREA_ID_MAP, transWayToTransferType } from '@/constants'

export type ApprovalTabType = 'pending' | 'approved' | 'all'

export interface ApprovalListFilters {
  keyword: string
  transferType: TransferType | 'all'
}

export interface ApprovalListPagination {
  current: number
  pageSize: number
  total: number
}

/** 列表项 - 映射后的前端数据结构 */
export interface ApprovalListItem {
  id: string
  applicationId: number
  applicationNo: string
  transferType: TransferType
  applicantName: string
  applicantDepartmentName: string
  createdAt: string
  updatedAt: string
  currentApprovalStatus: string
  reason: string
}

/**
 * 将后端数据映射为前端列表项
 */
function mapToListItem(item: WaitingApprovalItem): ApprovalListItem {
  return {
    id: String(item.applicationId),
    applicationId: item.applicationId,
    applicationNo: String(item.applicationId),
    transferType: transWayToTransferType(item.transWay) as TransferType,
    applicantName: item.createdBy,
    applicantDepartmentName: '',
    createdAt: item.creationDate,
    updatedAt: item.lastUpdateDate,
    currentApprovalStatus: item.currentStatus,
    reason: item.reason,
  }
}

export function useApprovalList() {
  const loading = ref(false)
  const activeTab = ref<ApprovalTabType>('pending')

  const filters = reactive<ApprovalListFilters>({
    keyword: '',
    transferType: 'all',
  })

  const pagination = reactive<ApprovalListPagination>({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const listData = ref<ApprovalListItem[]>([])

  /**
   * 将传输类型转换为区域 ID 参数
   */
  function getAreaIdsFromTransferType(transferType: TransferType | 'all'): { formAreaId?: number, toAreaId?: number } {
    if (transferType === 'all')
      return {}

    const [sourceArea, targetArea] = transferType.split('-to-') as [string, string]
    const formAreaId = AREA_ID_MAP[sourceArea as keyof typeof AREA_ID_MAP]
    const toAreaId = AREA_ID_MAP[targetArea as keyof typeof AREA_ID_MAP]

    return { formAreaId, toAreaId }
  }

  async function fetchList() {
    loading.value = true
    try {
      const { formAreaId, toAreaId } = getAreaIdsFromTransferType(filters.transferType)
      const query = {
        keyword: filters.keyword || undefined,
        formAreaId,
        toAreaId,
        procType: '0', // 正常传输
      }

      let response
      if (activeTab.value === 'pending') {
        response = await approvalApi.getWaitingForApproval(pagination.pageSize, pagination.current, query)
      }
      else if (activeTab.value === 'approved') {
        response = await approvalApi.getMyApproved(pagination.pageSize, pagination.current, query)
      }
      else {
        // 全部审批：暂时返回空，后续如果有对应接口再补充
        listData.value = []
        pagination.total = 0
        return
      }

      listData.value = (response?.result || []).map(mapToListItem)
      pagination.total = response?.pageVO?.totalRows || 0
    }
    catch (error) {
      console.error('fetchList error:', error)
      listData.value = []
      pagination.total = 0
    }
    finally {
      loading.value = false
    }
  }

  function handleTabChange(tab: ApprovalTabType) {
    activeTab.value = tab
    pagination.current = 1
    fetchList()
  }

  function handleSearch() {
    pagination.current = 1
    fetchList()
  }

  function handleReset() {
    filters.keyword = ''
    filters.transferType = 'all'
    pagination.current = 1
    fetchList()
  }

  function handlePageChange(page: number) {
    pagination.current = page
    fetchList()
  }

  function handlePageSizeChange(pageSize: number) {
    pagination.pageSize = pageSize
    pagination.current = 1
    fetchList()
  }

  // 监听筛选条件变化，重新获取数据
  watch(
    () => filters.transferType,
    () => {
      pagination.current = 1
      fetchList()
    },
  )

  return {
    loading,
    activeTab,
    filters,
    pagination,
    listData,
    fetchList,
    handleTabChange,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
  }
}
