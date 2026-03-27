import type { MyApplicationItem } from '@/api/application'
import { applicationApi } from '@/api/application'
import { Message } from '@arco-design/web-vue'
import { reactive, ref } from 'vue'

// ─── 传输方式格式化 ─────────────────────────────────────────────────────────────
// 真实字段: transWay = "外网,绿区" (英文/中文逗号分隔)
function formatTransWay(transWay: string): string {
  if (!transWay) return '-'
  const map: Record<string, string> = {
    'Green Zone': '绿区',
    'Yellow Zone': '黄区',
    'Red Zone': '红区',
    '外网': '外网',
    '绿区': '绿区',
    '黄区': '黄区',
    '红区': '红区',
  }
  return transWay
    .split(',')
    .map(s => map[s.trim()] || s.trim())
    .join(' → ')
}

export interface ApplicationListFilters {
  keyword: string
}

export interface ApplicationListPagination {
  current: number
  pageSize: number
  total: number
}

export function useApplicationList() {
  const loading = ref(false)
  const advancedVisible = ref(false)

  const filters = reactive<ApplicationListFilters>({
    keyword: '',
  })

  const pagination = reactive<ApplicationListPagination>({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // 原始接口数据
  const rawList = ref<MyApplicationItem[]>([])
  // 展示数据（经过前端过滤）
  const listData = ref<MyApplicationItem[]>([])

  function applyFilters() {
    const keyword = filters.keyword.trim().toLowerCase()
    let result = rawList.value

    if (keyword) {
      result = result.filter(item =>
        [
          String(item.applicationId),
          item.reason,
          formatTransWay(item.transWay),
          item.applicantW3Account,
        ].join(' ').toLowerCase().includes(keyword),
      )
    }

    listData.value = result
  }

  async function fetchList() {
    loading.value = true
    try {
      const res = await applicationApi.getMyApplicationList(
        pagination.pageSize,
        pagination.current,
        filters.keyword ? { keyword: filters.keyword } : undefined,
      )
      rawList.value = res.result || []
      pagination.total = res.pageVO?.totalRows ?? rawList.value.length
      applyFilters()
    }
    catch (err: any) {
      Message.error(err?.message || '获取申请单列表失败')
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

  // ─── 操作相关（暂时保留 mock 实现）─────────────────────────────────────────────
  async function handleDelete(_id: string) {
    // TODO: 对接真实删除接口
    Message.success('删除成功')
    await fetchList()
  }

  async function handleWithdraw(_id: string) {
    // TODO: 对接真实撤回接口
    Message.success('撤回成功')
    await fetchList()
  }

  // ─── 工具函数 ───────────────────────────────────────────────────────────────

  function getTransferTypeLabel(transWay: string): string {
    return formatTransWay(transWay)
  }

  return {
    loading,
    advancedVisible,
    filters,
    pagination,
    listData,
    rawList,
    fetchList,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    handleDelete,
    handleWithdraw,
    getTransferTypeLabel,
    formatTransWay,
  }
}
