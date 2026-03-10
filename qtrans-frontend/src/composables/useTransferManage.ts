import type { Application, TransferState, TransferType } from '@/types'
import dayjs from 'dayjs'
import { computed, reactive, ref, watch } from 'vue'
import { useApplicationStore, useFileStore } from '@/stores'

export type TransferManageTab = 'transferring' | 'completed' | 'all'
export type TransferManageStatus = Exclude<TransferState['status'], 'pending'>

export interface TransferManageFilters {
  applicationNo: string
  transferType: 'all' | TransferType
  applicantName: string
  transferRange: string[]
}

export interface TransferManagePagination {
  current: number
  pageSize: number
  total: number
}

export interface TransferManageRecord {
  id: string
  applicationId: string
  applicationNo: string
  transferType: TransferType
  applicantName: string
  totalBytes: number
  progress: number
  speedBytesPerSec: number
  status: TransferManageStatus
  transferTime: string
  errorMessage?: string
}

const transferTypeLabelMap: Record<TransferType, string> = {
  'green-to-green': '绿区传到绿区',
  'green-to-yellow': '绿区传到黄区',
  'green-to-red': '绿区传到红区',
  'yellow-to-yellow': '黄区传到黄区',
  'yellow-to-red': '黄区传到红区',
  'red-to-red': '红区传到红区',
  'cross-country': '跨国传输',
}

const transferStatusLabelMap: Record<TransferManageStatus, string> = {
  transferring: '传输中',
  paused: '已暂停',
  completed: '已完成',
  error: '传输失败',
}

function getApplicationTotalBytes(application: Application, fileStore: ReturnType<typeof useFileStore>) {
  const totalByFiles = fileStore.getFilesByApplicationId(application.id)
    .reduce((sum, item) => sum + Math.max(item.fileSize, 0), 0)

  if (totalByFiles > 0)
    return totalByFiles

  return Math.max(1024 * 1024, Math.round((application.storageSize || 0) * 1024 * 1024))
}

function resolveStatus(application: Application, transferState: TransferState | null): TransferManageStatus | null {
  if (transferState) {
    if (transferState.status === 'pending')
      return 'transferring'

    return transferState.status
  }

  if (application.status === 'completed')
    return 'completed'

  if (application.status === 'transferring')
    return 'transferring'

  return null
}

export function useTransferManage() {
  const applicationStore = useApplicationStore()
  const fileStore = useFileStore()

  const activeTab = ref<TransferManageTab>('transferring')
  const loading = ref(false)
  const filters = reactive<TransferManageFilters>({
    applicationNo: '',
    transferType: 'all',
    applicantName: '',
    transferRange: [],
  })
  const pagination = reactive<TransferManagePagination>({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const selectedRows = ref<string[]>([])

  const allRecords = computed<TransferManageRecord[]>(() => {
    return applicationStore.applications
      .map((application) => {
        const transferState = fileStore.getTransferStateByApplicationId(application.id)
        const status = resolveStatus(application, transferState)
        if (!status)
          return null

        const totalBytes = transferState?.totalBytes || getApplicationTotalBytes(application, fileStore)
        const progress = transferState?.progress
          ?? (status === 'completed' ? 100 : Number(fileStore.transferProgress.get(application.id) || 0))

        return {
          id: application.id,
          applicationId: application.id,
          applicationNo: application.applicationNo,
          transferType: application.transferType,
          applicantName: application.applicantName,
          totalBytes,
          progress,
          speedBytesPerSec: transferState?.speedBytesPerSec || 0,
          status,
          transferTime: application.updatedAt || application.createdAt,
          errorMessage: transferState?.errorMessage,
        }
      })
      .filter((item): item is TransferManageRecord => Boolean(item))
      .sort((a, b) => dayjs(b.transferTime).valueOf() - dayjs(a.transferTime).valueOf())
  })

  const filteredRecords = computed(() => {
    const applicationNo = filters.applicationNo.trim().toLowerCase()
    const applicantName = filters.applicantName.trim().toLowerCase()
    const [start, end] = filters.transferRange

    return allRecords.value.filter((record) => {
      const tabMatched = activeTab.value === 'all'
        ? true
        : activeTab.value === 'completed'
          ? record.status === 'completed'
          : record.status === 'transferring' || record.status === 'paused' || record.status === 'error'

      const applicationNoMatched = applicationNo
        ? record.applicationNo.toLowerCase().includes(applicationNo)
        : true

      const transferTypeMatched = filters.transferType === 'all'
        ? true
        : record.transferType === filters.transferType

      const applicantMatched = applicantName
        ? record.applicantName.toLowerCase().includes(applicantName)
        : true

      const rangeMatched = start && end
        ? dayjs(record.transferTime).valueOf() >= dayjs(start).startOf('day').valueOf()
          && dayjs(record.transferTime).valueOf() <= dayjs(end).endOf('day').valueOf()
        : true

      return tabMatched && applicationNoMatched && transferTypeMatched && applicantMatched && rangeMatched
    })
  })

  const listData = computed(() => {
    const start = (pagination.current - 1) * pagination.pageSize
    return filteredRecords.value.slice(start, start + pagination.pageSize)
  })

  const selectedRecords = computed(() => {
    const selectedSet = new Set(selectedRows.value)
    return filteredRecords.value.filter(record => selectedSet.has(record.id))
  })

  const canBatchPause = computed(() => selectedRecords.value.some(record => record.status === 'transferring'))
  const canBatchResume = computed(() => selectedRecords.value.some(record => record.status === 'paused'))

  watch(filteredRecords, (records) => {
    pagination.total = records.length
    const maxPage = Math.max(1, Math.ceil(records.length / pagination.pageSize))
    if (pagination.current > maxPage)
      pagination.current = maxPage

    const visibleIds = new Set(records.map(record => record.id))
    selectedRows.value = selectedRows.value.filter(id => visibleIds.has(id))
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

  async function handleTabChange(tab: string | number) {
    activeTab.value = String(tab) as TransferManageTab
    pagination.current = 1
    await fetchList()
  }

  async function handleSearch() {
    pagination.current = 1
    await fetchList()
  }

  async function handleReset() {
    filters.applicationNo = ''
    filters.transferType = 'all'
    filters.applicantName = ''
    filters.transferRange = []
    pagination.current = 1
    selectedRows.value = []
    await fetchList()
  }

  function handlePageChange(page: number) {
    pagination.current = page
  }

  function handlePageSizeChange(pageSize: number) {
    pagination.pageSize = pageSize
    pagination.current = 1
  }

  function handleSelectionChange(keys: (string | number)[]) {
    selectedRows.value = keys.map(key => String(key))
  }

  function handlePause(id: string) {
    return fileStore.pauseTransfer(id)
  }

  function handleResume(id: string) {
    return fileStore.resumeTransfer(id)
  }

  async function handleRetry(id: string) {
    return fileStore.retryTransfer(id)
  }

  async function handleBatchPause() {
    const targets = selectedRecords.value.filter(record => record.status === 'transferring')
    targets.forEach(record => handlePause(record.applicationId))
    return targets.length
  }

  async function handleBatchResume() {
    const targets = selectedRecords.value.filter(record => record.status === 'paused')
    targets.forEach(record => handleResume(record.applicationId))
    return targets.length
  }

  function getTransferTypeLabel(type: TransferType) {
    return transferTypeLabelMap[type]
  }

  function getStatusLabel(status: TransferManageStatus) {
    return transferStatusLabelMap[status]
  }

  return {
    activeTab,
    listData,
    loading,
    pagination,
    filters,
    selectedRows,
    selectedRecords,
    canBatchPause,
    canBatchResume,
    filteredRecords,
    fetchList,
    handleTabChange,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    handleSelectionChange,
    handlePause,
    handleResume,
    handleRetry,
    handleBatchPause,
    handleBatchResume,
    getTransferTypeLabel,
    getStatusLabel,
  }
}
