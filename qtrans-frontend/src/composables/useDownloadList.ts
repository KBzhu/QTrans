import type { WaitingDownloadItem } from '@/api/application'
import { applicationApi } from '@/api/application'
import { Message } from '@arco-design/web-vue'
import { reactive, ref } from 'vue'

// ─── 下载状态映射 ─────────────────────────────────────────────────────────────
// 真实字段: downloadStatus = "Wait Download" | "Downloading" | "Downloaded"
// Mock 枚举: 'not_started' | 'partial' | 'completed'
export type DownloadStatus = 'not_started' | 'partial' | 'completed'

const downloadStatusMap: Record<string, DownloadStatus> = {
  'Wait Download': 'not_started',
  'Downloading': 'partial',
  'Downloaded': 'completed',
}

const downloadStatusLabelMap: Record<DownloadStatus, string> = {
  not_started: '未下载',
  partial: '部分下载',
  completed: '已下载',
}

// ─── 申请状态映射 ─────────────────────────────────────────────────────────────
// 真实字段: currentStatus = "Notification Download" | ... (英文描述)
// Mock 枚举: 'pending_upload' | 'pending_approval' | 'approved' | ...
// 【字段差异】真实接口无 mock 中的 status 枚举，用 currentStatus 英文字符串代替
const currentStatusLabelMap: Record<string, string> = {
  'Notification Download': '通知下载',
  'Pending Approval': '待审批',
  'Approved': '已批准',
  'Rejected': '已驳回',
  'Transferring': '传输中',
  'Completed': '已完成',
}

// ─── 传输方式映射 ──────────────────────────────────────────────────────────────
// 真实字段: transWay = "Green Zone,Green Zone" (英文逗号分隔)
// Mock 字段: transferType = 'green-to-green' 枚举
// 【字段差异】真实接口返回英文描述，非枚举，需本地转换显示
function formatTransWay(transWay: string): string {
  if (!transWay) return '-'
  const map: Record<string, string> = {
    'Green Zone': '绿区',
    'Yellow Zone': '黄区',
    'Red Zone': '红区',
  }
  return transWay
    .split(',')
    .map(s => map[s.trim()] || s.trim())
    .join(' → ')
}

// ─── 文件数 ────────────────────────────────────────────────────────────────────
// 【字段差异】真实接口未返回文件数，mock 通过 fileStore 获取
// 目前用 0 填充，后续有文件列表接口后可补充
function getMockFileCount(_applicationId: string): number {
  return 0
}

export interface DownloadListFilters {
  keyword: string
  status: string // 对应 currentStatus 英文值，或 'all'
  downloadStatus: 'all' | DownloadStatus
}

export interface DownloadListPagination {
  current: number
  pageSize: number
  total: number
}

export function useDownloadList() {
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

  // 原始接口数据
  const rawList = ref<WaitingDownloadItem[]>([])
  // 经过前端过滤后展示的数据
  const listData = ref<WaitingDownloadItem[]>([])

  function applyFilters() {
    const keyword = filters.keyword.trim().toLowerCase()
    let result = rawList.value

    if (filters.status !== 'all') {
      result = result.filter(item => item.currentStatus === filters.status)
    }

    if (filters.downloadStatus !== 'all') {
      result = result.filter(item => {
        const mapped = downloadStatusMap[item.downloadStatus] || 'not_started'
        return mapped === filters.downloadStatus
      })
    }

    if (keyword) {
      result = result.filter(item =>
        [
          item.applicationId,
          item.reason,
          item.applicantW3Account,
          formatTransWay(item.transWay),
        ].join(' ').toLowerCase().includes(keyword)
      )
    }

    // 注意：真实接口已经分页，前端过滤在当前页数据上进行
    // 若需要跨页过滤，需改为每次过滤后重新请求（当前仅在已加载数据中过滤）
    listData.value = result
    pagination.total = result.length
  }

  async function fetchList() {
    loading.value = true
    try {
      const res = await applicationApi.getWaitingDownloadList(
        pagination.pageSize,
        pagination.current,
      )
      rawList.value = res.result || []
      pagination.total = res.pageVO?.totalRows ?? rawList.value.length
      applyFilters()
    }
    catch (err: any) {
      Message.error(err?.message || '获取待下载列表失败')
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

  async function handlePageChange(page: number) {
    pagination.current = page
    await fetchList()
  }

  async function handlePageSizeChange(pageSize: number) {
    pagination.pageSize = pageSize
    pagination.current = 1
    await fetchList()
  }

  // ─── 工具函数 ───────────────────────────────────────────────────────────────

  function getFileCountByApplicationId(applicationId: string): number {
    return getMockFileCount(applicationId)
  }

  //未用上
  function getDownloadStatusByApplicationId(applicationId: string): DownloadStatus {
    const item = rawList.value.find(i => i.applicationId === applicationId)
    if (!item) return 'not_started'
    return downloadStatusMap[item.downloadStatus] || 'not_started'
  }

  //未用上，后端不支持
  function getDownloadStatusLabel(status: DownloadStatus): string {
    return downloadStatusLabelMap[status]
  }

  function getTransferTypeLabel(transWay: string): string {
    return formatTransWay(transWay)
  }

  function getCurrentStatusLabel(currentStatus: string): string {
    return currentStatusLabelMap[currentStatus] || currentStatus
  }

  /**
   * 下载 - 路由到 /trans/download?params=原URL中params后面的部分
   * 例: downloadUrl = "https://xxx/transWeb/valid?params=security%3A..."
   *  → router.push('/trans/download?params=security%3A...')
   */
  function getDownloadRoute(applicationId: string): { path: string, query: Record<string, string> } | null {
    const item = rawList.value.find(i => i.applicationId === applicationId)
    if (!item || !item.downloadUrl) return null
    // 提取原 URL 中 params= 后面的值（已编码的字符串）
    const urlObj = new URL(item.downloadUrl)
    const paramsValue = urlObj.searchParams.get('params')
    if (!paramsValue) return null
    return { path: '/trans/download', query: { params: paramsValue } }
  }

  function handleDownloadApplication(applicationId: string): { downloaded: number, total: number, fallback: number } {
    const item = rawList.value.find(i => i.applicationId === applicationId)
    if (!item || !item.downloadUrl) {
      return { downloaded: 0, total: 0, fallback: 0 }
    }
    return { downloaded: 1, total: 1, fallback: 0 }
  }

  return {
    loading,
    filters,
    pagination,
    listData,
    rawList,
    fetchList,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    getFileCountByApplicationId,
    getDownloadStatusByApplicationId,
    getDownloadStatusLabel,
    getTransferTypeLabel,
    getCurrentStatusLabel,
    handleDownloadApplication,
    getDownloadRoute,
    formatTransWay,
  }
}
