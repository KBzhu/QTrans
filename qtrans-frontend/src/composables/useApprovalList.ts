import type { Application } from '@/types'
import { computed, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { useApprovalStore } from '@/stores'

export type ApprovalTabType = 'pending' | 'approved' | 'all'

export interface ApprovalListFilters {
  keyword: string
  transferType: string
  applicant: string
  dateRange: string[]
}

export interface ApprovalListPagination {
  current: number
  pageSize: number
  total: number
}

const transferTypeLabelMap: Record<Application['transferType'], string> = {
  'green-to-green': '绿区传到绿区',
  'green-to-yellow': '绿区传到黄区',
  'green-to-red': '绿区传到红区',
  'yellow-to-yellow': '黄区传到黄区',
  'yellow-to-red': '黄区传到红区',
  'red-to-red': '红区传到红区',
  'cross-country': '跨国传输',
}

export function useApprovalList() {
  const approvalStore = useApprovalStore()
  const loading = ref(false)
  const activeTab = ref<ApprovalTabType>('pending')

  const filters = reactive<ApprovalListFilters>({
    keyword: '',
    transferType: 'all',
    applicant: '',
    dateRange: [],
  })

  const pagination = reactive<ApprovalListPagination>({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const allApprovals = ref<Application[]>([])

  const filteredList = computed(() => {
    let result: Application[] = []

    if (activeTab.value === 'pending') {
      result = approvalStore.pendingApprovals
    }
    else if (activeTab.value === 'approved') {
      result = allApprovals.value.filter(item =>
        item.status === 'approved' || item.status === 'rejected',
      )
    }
    else {
      result = allApprovals.value
    }

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      result = result.filter(item =>
        item.applicationNo.toLowerCase().includes(kw)
        || transferTypeLabelMap[item.transferType]?.toLowerCase().includes(kw),
      )
    }

    if (filters.transferType && filters.transferType !== 'all') {
      result = result.filter(item => item.transferType === filters.transferType)
    }

    if (filters.applicant) {
      const applicant = filters.applicant.toLowerCase()
      result = result.filter(item =>
        item.applicantName.toLowerCase().includes(applicant),
      )
    }

    if (filters.dateRange?.length === 2) {
      const [start, end] = filters.dateRange
      if (start && end) {
        result = result.filter((item) => {
          const createdAt = dayjs(item.createdAt).format('YYYY-MM-DD')
          return createdAt >= start && createdAt <= end
        })
      }
    }

    pagination.total = result.length

    const startIdx = (pagination.current - 1) * pagination.pageSize
    return result.slice(startIdx, startIdx + pagination.pageSize)
  })

  const listData = computed(() => filteredList.value)

  async function fetchList() {
    loading.value = true
    try {
      await approvalStore.fetchPendingApprovals()
      
      allApprovals.value = [
        ...approvalStore.pendingApprovals,
        ...(approvalStore.approvalHistory
          .map((record) => {
            return approvalStore.pendingApprovals.find(app => app.id === record.applicationId)
          })
          .filter(Boolean) as Application[]),
      ]
    }
    finally {
      loading.value = false
    }
  }

  function handleTabChange(tab: ApprovalTabType) {
    activeTab.value = tab
    pagination.current = 1
  }

  function handleSearch() {
    pagination.current = 1
  }

  function handleReset() {
    filters.keyword = ''
    filters.transferType = 'all'
    filters.applicant = ''
    filters.dateRange = []
    pagination.current = 1
  }

  function handlePageChange(page: number) {
    pagination.current = page
  }

  function handlePageSizeChange(pageSize: number) {
    pagination.pageSize = pageSize
    pagination.current = 1
  }

  return {
    loading,
    activeTab,
    filters,
    pagination,
    listData,
    filteredList,
    fetchList,
    handleTabChange,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
  }
}
