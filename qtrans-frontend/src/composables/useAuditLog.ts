import type { AuditActionType, AuditLogQuery, AuditLogRecord } from '@/types'
import dayjs from 'dayjs'
import { reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { auditLogApi } from '@/api/auditLog'

export interface AuditLogFilters {
  actionType: AuditActionType | 'all'
  operator: string
  operationRange: string[]
  ip: string
}

export interface AuditLogPagination {
  current: number
  pageSize: number
  total: number
}

const actionTypeLabelMap: Record<AuditActionType, string> = {
  login: '登录',
  application: '申请单',
  file: '文件',
  approval: '审批',
  transfer: '传输',
  system: '系统配置',
}

const actionTypeColorMap: Record<AuditActionType, string> = {
  login: 'arcoblue',
  application: 'purple',
  file: 'green',
  approval: 'orange',
  transfer: 'cyan',
  system: 'red',
}

function formatCell(value: string) {
  if (/[,"\n\r]/.test(value))
    return `"${value.replace(/"/g, '""')}"`

  return value
}

function triggerCsvDownload(csv: string, fileName: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function useAuditLog() {
  const listData = ref<AuditLogRecord[]>([])
  const loading = ref(false)

  const pagination = reactive<AuditLogPagination>({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const filters = reactive<AuditLogFilters>({
    actionType: 'all',
    operator: '',
    operationRange: [],
    ip: '',
  })

  const actionTypeOptions = [
    { label: '全部类型', value: 'all' },
    { label: '登录', value: 'login' },
    { label: '申请单', value: 'application' },
    { label: '文件', value: 'file' },
    { label: '审批', value: 'approval' },
    { label: '传输', value: 'transfer' },
    { label: '系统配置', value: 'system' },
  ]

  async function fetchList() {
    loading.value = true
    try {
      const [startDate, endDate] = filters.operationRange
      const params: AuditLogQuery = {
        pageNum: pagination.current,
        pageSize: pagination.pageSize,
        actionType: filters.actionType,
        operator: filters.operator.trim() || undefined,
        ip: filters.ip.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }

      const res = await auditLogApi.getList(params)
      listData.value = res.list
      pagination.total = res.total
    }
    catch (error: any) {
      Message.error(error.message || '获取日志列表失败')
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
    filters.actionType = 'all'
    filters.operator = ''
    filters.operationRange = []
    filters.ip = ''
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

  function handleExport() {
    if (!listData.value.length) {
      Message.warning('暂无可导出的日志数据')
      return
    }

    const headers = ['操作时间', '操作类型', '操作用户', 'IP地址', '操作详情', '关联资源', '操作结果']
    const rows = listData.value.map(item => [
      dayjs(item.operationTime).format('YYYY-MM-DD HH:mm:ss'),
      getActionTypeLabel(item.actionType),
      item.operator,
      item.ip,
      item.detail,
      item.resource,
      getResultLabel(item.result),
    ].map(col => formatCell(col)).join(','))

    const csv = `${headers.join(',')}\n${rows.join('\n')}`
    triggerCsvDownload(csv, `audit-log-${dayjs().format('YYYYMMDD-HHmmss')}.csv`)
    Message.success(`已导出 ${listData.value.length} 条日志`)
  }

  function getActionTypeLabel(actionType: AuditActionType) {
    return actionTypeLabelMap[actionType]
  }

  function getActionTypeColor(actionType: AuditActionType) {
    return actionTypeColorMap[actionType] || 'gray'
  }

  function getResultLabel(result: 'success' | 'failed') {
    return result === 'success' ? '成功' : '失败'
  }

  function getResultColor(result: 'success' | 'failed') {
    return result === 'success' ? 'green' : 'red'
  }

  return {
    listData,
    loading,
    pagination,
    filters,
    actionTypeOptions,
    fetchList,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    handleExport,
    getActionTypeLabel,
    getActionTypeColor,
    getResultLabel,
    getResultColor,
  }
}
