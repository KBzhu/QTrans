import type { Application, ApplicationStatus } from '@/types'
import { computed, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useApplicationStore } from '@/stores'

export interface ApplicationListFilters {
  keyword: string
  status: 'all' | ApplicationStatus
  dateRange: string[]
}

export interface ApplicationListPagination {
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

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap(item => (Array.isArray(item) ? item : [item]))
      .map(item => String(item).trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/[,，、/\s]+/g)
      .map(item => item.trim())
      .filter(Boolean)
  }

  if (typeof value === 'number')
    return [String(value)]

  return []
}

function normalizeApplication(item: Application): Application {
  return {
    ...item,
    sourceCity: normalizeStringArray(item.sourceCity),
    targetCity: normalizeStringArray(item.targetCity),
    downloaderAccounts: normalizeStringArray(item.downloaderAccounts),
    applyReason: String(item.applyReason || '').trim(),
  }
}

function mergeApplications(records: Application[]): Application[] {

  const map = new Map<string, Application>()
  records.forEach((item) => {
    map.set(item.id, item)
  })

  return [...map.values()].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
}

export function useApplicationList() {
  const applicationStore = useApplicationStore()
  const loading = ref(false)
  const advancedVisible = ref(false)

  const filters = reactive<ApplicationListFilters>({
    keyword: '',
    status: 'all',
    dateRange: [],
  })

  const pagination = reactive<ApplicationListPagination>({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const allList = computed(() => {
    const merged = mergeApplications([...applicationStore.applications, ...applicationStore.drafts])
    return merged.map(item => normalizeApplication(item))
  })


  const filteredList = computed(() => {
    const keyword = filters.keyword.trim().toLowerCase()

    return allList.value.filter((item) => {
      const statusMatched = filters.status === 'all' ? true : item.status === filters.status
      const keywordMatched = keyword
        ? [
            item.applicationNo,
            item.applyReason,
            transferTypeLabelMap[item.transferType],
            item.downloaderAccounts.join(' '),
          ].join(' ').toLowerCase().includes(keyword)
        : true

      const dateMatched = filters.dateRange.length === 2
        ? (() => {
            const start = dayjs(filters.dateRange[0]).startOf('day').valueOf()
            const end = dayjs(filters.dateRange[1]).endOf('day').valueOf()
            const createdAt = dayjs(item.createdAt).valueOf()
            return createdAt >= start && createdAt <= end
          })()
        : true

      return statusMatched && keywordMatched && dateMatched
    })
  })

  const listData = computed(() => {
    const start = (pagination.current - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredList.value.slice(start, end)
  })

  watch(filteredList, (list) => {
    pagination.total = list.length
    const maxPage = Math.max(1, Math.ceil(list.length / pagination.pageSize))
    if (pagination.current > maxPage)
      pagination.current = maxPage
  }, { immediate: true })

  async function fetchList() {
    loading.value = true
    try {
      await applicationStore.fetchApplications({ pageNum: 1, pageSize: 200 })
    }
    finally {
      loading.value = false
    }
  }

  async function handleSearch() {
    pagination.current = 1
    await fetchList()
  }

  async function handleReset() {
    filters.keyword = ''
    filters.status = 'all'
    filters.dateRange = []
    pagination.current = 1
    await fetchList()
  }

  function handlePageChange(page: number) {
    pagination.current = page
  }

  function handlePageSizeChange(size: number) {
    pagination.pageSize = size
    pagination.current = 1
  }

  async function handleDelete(id: string) {
    const inApplications = applicationStore.applications.some(item => item.id === id)
    const inDrafts = applicationStore.drafts.some(item => item.id === id)

    if (inApplications)
      await applicationStore.deleteApplication(id)

    if (inDrafts)
      applicationStore.deleteDraft(id)

    await fetchList()
  }

  async function handleWithdraw(id: string) {
    await applicationStore.updateApplication(id, { status: 'draft' })
    await fetchList()
  }

  return {
    loading,
    advancedVisible,
    filters,
    pagination,
    listData,
    filteredList,
    fetchList,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    handleDelete,
    handleWithdraw,
  }
}
