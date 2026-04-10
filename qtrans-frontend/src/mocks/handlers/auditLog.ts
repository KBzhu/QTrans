import type { AuditActionType, AuditLogRecord, AuditResult } from '@/types'
import dayjs from 'dayjs'
import { baseHttp as http } from './_utils'
import { getPagination, mockDelay, success } from './_utils'

const actionTypePool: AuditActionType[] = ['login', 'application', 'file', 'approval', 'transfer', 'system']
const resultPool: AuditResult[] = ['success', 'success', 'success', 'failed']
const operatorPool = ['张三', '李四', '王五', '赵六', '系统管理员']
const detailPool = {
  login: ['用户登录系统', '用户退出登录', '用户登录失败，密码错误'],
  application: ['创建申请单', '编辑申请单', '提交申请单'],
  file: ['上传文件', '下载文件', '删除文件'],
  approval: ['审批通过', '审批驳回', '发起免审'],
  transfer: ['发起传输任务', '暂停传输任务', '重试传输任务'],
  system: ['更新系统配置', '变更通知策略', '修改存储策略'],
} as const

const resourcePool = {
  login: ['auth/session', 'auth/token'],
  application: ['application/QT202603100001', 'application/QT202603100002'],
  file: ['file/spec-v1.docx', 'file/design-v2.pdf', 'file/report.xlsx'],
  approval: ['approval/QT202603100003', 'approval/QT202603100004'],
  transfer: ['transfer/QT202603100005', 'transfer/QT202603100006'],
  system: ['settings/transfer', 'settings/notification', 'settings/storage'],
} as const

function createLogs(count = 56): AuditLogRecord[] {
  const now = dayjs()
  return Array.from({ length: count }).map((_, index) => {
    const actionType = actionTypePool[index % actionTypePool.length] as AuditActionType
    const result = resultPool[index % resultPool.length] as AuditResult
    const operator = operatorPool[index % operatorPool.length] as string
    const detailList = detailPool[actionType]
    const resourceList = resourcePool[actionType]
    const detail: string = (detailList[index % detailList.length] as string) || ''
    const resource: string = (resourceList[index % resourceList.length] as string) || ''

    return {
      id: `audit-${index + 1}`,
      operationTime: now.subtract(index * 2, 'hour').toISOString(),
      actionType,
      operator,
      ip: `10.10.${(index % 20) + 1}.${(index % 200) + 10}`,
      detail,
      resource,
      result,
    }
  })
}

let auditLogs = createLogs()

function filterLogs(raw: AuditLogRecord[], params: URLSearchParams) {
  const actionType = params.get('actionType')
  const operator = (params.get('operator') || '').trim().toLowerCase()
  const ip = (params.get('ip') || '').trim().toLowerCase()
  const startDate = params.get('startDate')
  const endDate = params.get('endDate')

  return raw.filter((item) => {
    const actionTypeMatched = !actionType || actionType === 'all' ? true : item.actionType === actionType
    const operatorMatched = operator ? item.operator.toLowerCase().includes(operator) : true
    const ipMatched = ip ? item.ip.toLowerCase().includes(ip) : true

    const operationAt = dayjs(item.operationTime)
    const rangeMatched = startDate && endDate
      ? operationAt.valueOf() >= dayjs(startDate).startOf('day').valueOf()
        && operationAt.valueOf() <= dayjs(endDate).endOf('day').valueOf()
      : true

    return actionTypeMatched && operatorMatched && ipMatched && rangeMatched
  })
}

export const auditLogHandlers = [
  http.get('/api/audit-logs', async ({ request }) => {
    await mockDelay(200)

    const url = new URL(request.url)
    const filtered = filterLogs(auditLogs, url.searchParams)
      .sort((a, b) => dayjs(b.operationTime).valueOf() - dayjs(a.operationTime).valueOf())

    const pagination = getPagination(url)
    return success(pagination.toPage(filtered))
  }),

  http.post('/api/audit-logs/reset', async () => {
    await mockDelay(80)
    auditLogs = createLogs()
    return success(true, '审计日志已重置')
  }),
]
