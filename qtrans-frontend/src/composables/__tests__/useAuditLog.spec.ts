import type { AuditLogRecord, PageResponse } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuditLog } from '@/composables/useAuditLog'
import { Message } from '@arco-design/web-vue'

const { getListMock } = vi.hoisted(() => ({
  getListMock: vi.fn(),
}))

vi.mock('@/api/auditLog', () => ({
  auditLogApi: {
    getList: getListMock,
  },
}))

vi.mock('@arco-design/web-vue', async () => {
  const actual = await vi.importActual('@arco-design/web-vue')
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    },
  }
})

function createRecord(overrides: Partial<AuditLogRecord> = {}): AuditLogRecord {
  return {
    id: overrides.id || 'audit-1',
    operationTime: overrides.operationTime || '2026-03-10T10:00:00.000Z',
    actionType: overrides.actionType || 'system',
    operator: overrides.operator || '系统管理员',
    ip: overrides.ip || '10.10.1.23',
    detail: overrides.detail || '更新系统配置',
    resource: overrides.resource || 'settings/transfer',
    result: overrides.result || 'success',
  }
}

function createPageResponse(list: AuditLogRecord[]): PageResponse<AuditLogRecord> {
  return {
    list,
    total: list.length,
    pageNum: 1,
    pageSize: 10,
    totalPages: 1,
  }
}

describe('useAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchList loads audit logs with default params', async () => {
    const records = [createRecord({ id: 'audit-1' }), createRecord({ id: 'audit-2', actionType: 'login' })]
    getListMock.mockResolvedValueOnce(createPageResponse(records))

    const composable = useAuditLog()
    await composable.fetchList()

    expect(getListMock).toHaveBeenCalledWith(expect.objectContaining({
      pageNum: 1,
      pageSize: 10,
      actionType: 'all',
    }))
    expect(composable.listData.value).toHaveLength(2)
    expect(composable.pagination.total).toBe(2)
  })

  it('handleSearch resets page and requests by filters', async () => {
    getListMock.mockResolvedValueOnce(createPageResponse([]))

    const composable = useAuditLog()
    composable.pagination.current = 3
    composable.filters.actionType = 'approval'
    composable.filters.operator = '张三'
    composable.filters.operationRange = ['2026-03-01', '2026-03-10']
    composable.filters.ip = '10.10.1'
    await composable.handleSearch()

    expect(composable.pagination.current).toBe(1)
    expect(getListMock).toHaveBeenCalledWith(expect.objectContaining({
      actionType: 'approval',
      operator: '张三',
      startDate: '2026-03-01',
      endDate: '2026-03-10',
      ip: '10.10.1',
    }))
  })

  it('handleReset clears filters and fetches', async () => {
    getListMock.mockResolvedValueOnce(createPageResponse([]))

    const composable = useAuditLog()
    composable.filters.actionType = 'transfer'
    composable.filters.operator = '李四'
    composable.filters.operationRange = ['2026-03-01', '2026-03-02']
    composable.filters.ip = '10.1.1.1'
    await composable.handleReset()

    expect(composable.filters.actionType).toBe('all')
    expect(composable.filters.operator).toBe('')
    expect(composable.filters.operationRange).toEqual([])
    expect(composable.filters.ip).toBe('')
    expect(getListMock).toHaveBeenCalled()
  })

  it('handlePageChange updates page and fetches', async () => {
    getListMock.mockResolvedValueOnce(createPageResponse([]))

    const composable = useAuditLog()
    await composable.handlePageChange(2)

    expect(composable.pagination.current).toBe(2)
    expect(getListMock).toHaveBeenCalledWith(expect.objectContaining({ pageNum: 2 }))
  })

  it('handlePageSizeChange updates size, resets page and fetches', async () => {
    getListMock.mockResolvedValueOnce(createPageResponse([]))

    const composable = useAuditLog()
    composable.pagination.current = 4
    await composable.handlePageSizeChange(20)

    expect(composable.pagination.current).toBe(1)
    expect(composable.pagination.pageSize).toBe(20)
    expect(getListMock).toHaveBeenCalledWith(expect.objectContaining({ pageNum: 1, pageSize: 20 }))
  })

  it('handleExport warns when list is empty', () => {
    const composable = useAuditLog()
    composable.listData.value = []

    composable.handleExport()

    expect(Message.warning).toHaveBeenCalledWith('暂无可导出的日志数据')
  })

  it('label and color helpers return expected values', () => {
    const composable = useAuditLog()

    expect(composable.getActionTypeLabel('system')).toBe('系统配置')
    expect(composable.getActionTypeColor('system')).toBe('red')
    expect(composable.getResultLabel('success')).toBe('成功')
    expect(composable.getResultColor('failed')).toBe('red')
  })

  it('fetchList handles api error', async () => {
    getListMock.mockRejectedValueOnce(new Error('network error'))

    const composable = useAuditLog()
    await composable.fetchList()

    expect(Message.error).toHaveBeenCalledWith('network error')
  })
})
