import type { Application, ApplicationStatus, TransferType } from '@/types'
import dayjs from 'dayjs'
import { computed, reactive, ref, watch } from 'vue'
import { useApplicationStore, useAuthStore, useFileStore } from '@/stores'
import { STORAGE_KEYS } from '@/utils/constants'
import { getLocalStorage, setLocalStorage } from '@/utils/storage'

export type DownloadStatus = 'not_started' | 'partial' | 'completed'

interface DownloadRecord {
  applicationId: string
  fileId: string
  userId: string
  downloadedAt: string
}

export interface DownloadListFilters {
  keyword: string
  status: 'all' | ApplicationStatus
  downloadStatus: 'all' | DownloadStatus
}

export interface DownloadListPagination {
  current: number
  pageSize: number
  total: number
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

const downloadStatusLabelMap: Record<DownloadStatus, string> = {
  not_started: '未下载',
  partial: '部分下载',
  completed: '已下载',
}

function normalizeAccount(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function useDownloadList() {
  const applicationStore = useApplicationStore()
  const authStore = useAuthStore()
  const fileStore = useFileStore()

  const loading = ref(false)
  const filters = reactive<DownloadListFilters>({
    keyword: '',
    status: 'all',
    downloadStatus: 'all',
  })
  const pagination = reactive<DownloadListPagination>({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const downloadRecords = ref<DownloadRecord[]>(getLocalStorage<DownloadRecord[]>(STORAGE_KEYS.DOWNLOAD_RECORDS) || [])

  function syncDownloadRecords() {
    setLocalStorage(STORAGE_KEYS.DOWNLOAD_RECORDS, downloadRecords.value)
  }

  const currentUserMatchSet = computed(() => {
    const user = authStore.currentUser
    if (!user)
      return new Set<string>()

    return new Set<string>([
      user.id,
      user.username,
      user.email,
      user.name,
    ].map(normalizeAccount).filter(Boolean))
  })

  function isDownloaderApplication(application: Application) {
    if (application.status === 'draft')
      return false

    if (currentUserMatchSet.value.size === 0)
      return false

    return application.downloaderAccounts
      .map(normalizeAccount)
      .some(account => currentUserMatchSet.value.has(account))
  }

  function getFileCountByApplicationId(applicationId: string) {
    return fileStore.getFilesByApplicationId(applicationId).length
  }

  function getDownloadedFileIdsByApplicationId(applicationId: string) {
    const userId = authStore.currentUser?.id
    if (!userId)
      return new Set<string>()

    return new Set(
      downloadRecords.value
        .filter(record => record.applicationId === applicationId && record.userId === userId)
        .map(record => record.fileId),
    )
  }

  function getDownloadStatusByApplicationId(applicationId: string): DownloadStatus {
    const files = fileStore.getFilesByApplicationId(applicationId)
    if (files.length === 0)
      return 'not_started'

    const downloadedFileIds = getDownloadedFileIdsByApplicationId(applicationId)
    const downloadedCount = files.filter(file => downloadedFileIds.has(file.id)).length

    if (downloadedCount === 0)
      return 'not_started'

    if (downloadedCount >= files.length)
      return 'completed'

    return 'partial'
  }

  function markDownloaded(applicationId: string, fileId: string) {
    const userId = authStore.currentUser?.id
    if (!userId)
      return

    const exists = downloadRecords.value.some(record =>
      record.applicationId === applicationId
      && record.fileId === fileId
      && record.userId === userId,
    )

    if (exists)
      return

    downloadRecords.value.push({
      applicationId,
      fileId,
      userId,
      downloadedAt: new Date().toISOString(),
    })
    syncDownloadRecords()
  }

  function handleDownloadApplication(applicationId: string) {
    const files = fileStore.getFilesByApplicationId(applicationId)
    if (files.length === 0)
      return { downloaded: 0, total: 0, fallback: 0 }

    let fallbackCount = 0

    files.forEach((file) => {
      if (file.fileBlob) {
        triggerBrowserDownload(file.fileBlob, file.fileName)
      }
      else {
        const fallbackBlob = new Blob([`mock file content: ${file.fileName}`], { type: 'text/plain;charset=utf-8' })
        triggerBrowserDownload(fallbackBlob, file.fileName)
        fallbackCount += 1
      }

      markDownloaded(applicationId, file.id)
    })

    return {
      downloaded: files.length,
      total: files.length,
      fallback: fallbackCount,
    }
  }

  const allDownloadList = computed(() => {
    return applicationStore.applications
      .filter(isDownloaderApplication)
      .slice()
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
  })

  const filteredList = computed(() => {
    const keyword = filters.keyword.trim().toLowerCase()

    return allDownloadList.value.filter((item) => {
      const statusMatched = filters.status === 'all' ? true : item.status === filters.status
      const downloadStatusMatched = filters.downloadStatus === 'all'
        ? true
        : getDownloadStatusByApplicationId(item.id) === filters.downloadStatus

      const keywordMatched = keyword
        ? [
            item.applicationNo,
            item.applyReason,
            transferTypeLabelMap[item.transferType],
            item.applicantName,
          ].join(' ').toLowerCase().includes(keyword)
        : true

      return statusMatched && downloadStatusMatched && keywordMatched
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
    filters.downloadStatus = 'all'
    pagination.current = 1
    await fetchList()
  }

  function handlePageChange(page: number) {
    pagination.current = page
  }

  function handlePageSizeChange(pageSize: number) {
    pagination.pageSize = pageSize
    pagination.current = 1
  }

  function getTransferTypeLabel(type: TransferType) {
    return transferTypeLabelMap[type]
  }

  function getDownloadStatusLabel(status: DownloadStatus) {
    return downloadStatusLabelMap[status]
  }

  return {
    loading,
    filters,
    pagination,
    listData,
    filteredList,
    fetchList,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    getFileCountByApplicationId,
    getDownloadStatusByApplicationId,
    getDownloadStatusLabel,
    getTransferTypeLabel,
    handleDownloadApplication,
    markDownloaded,
  }
}
