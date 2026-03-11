import type { ApprovalAction, ApprovalLevel, ApprovalRecord, Application, TransferType, UserRole } from '@/types'
import type { DemoState } from '../data/demo-init'
import { http } from 'msw'
import { getDemoState } from '../data/demo-init'
import { failed, mockDelay, success } from './_utils'

const approvalLevelMap: Record<TransferType, number> = {
  'green-to-green': 0,
  'green-to-yellow': 1,
  'green-to-red': 2,
  'yellow-to-yellow': 1,
  'yellow-to-red': 2,
  'red-to-red': 2,
  'cross-country': 3,
}

function getRequiredApprovalLevels(transferType: TransferType): number {
  return approvalLevelMap[transferType] || 0
}

function parseUserIdFromAuthorization(authorization: string | null) {
  if (!authorization)
    return ''

  const token = authorization.replace(/^Bearer\s+/i, '').trim()
  const match = token.match(/^mock-token-([a-zA-Z0-9_]+)-\d+$/)
  return match?.[1] || ''
}

function getCurrentUser(state: DemoState, authorization: string | null) {
  const userId = parseUserIdFromAuthorization(authorization)
  if (!userId)
    return null
  return state.users.find(item => item.id === userId) || null
}

function getApproverLevelByRoles(roles: UserRole[]): number {
  if (roles.includes('admin'))
    return 99
  if (roles.includes('approver3'))
    return 3
  if (roles.includes('approver2'))
    return 2
  if (roles.includes('approver1'))
    return 1
  return 0
}

function canHandleApplication(user: NonNullable<ReturnType<typeof getCurrentUser>>, app: Application) {
  const approverLevel = getApproverLevelByRoles(user.roles)
  if (approverLevel === 99)
    return true
  return app.status === 'pending_approval' && app.currentApprovalLevel === approverLevel
}

function buildRecord(app: Application, action: ApprovalAction, opinion: string, user: NonNullable<ReturnType<typeof getCurrentUser>>): ApprovalRecord {
  const level = Math.min(3, Math.max(1, app.currentApprovalLevel || 1)) as ApprovalLevel

  return {
    id: `apr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    applicationId: app.id,
    level,
    approverId: user.id,
    approverName: user.name,
    action,
    opinion,
    createdAt: new Date().toISOString(),
  }
}

function dedupeApplications(list: Application[]) {
  const map = new Map<string, Application>()
  list.forEach((item) => {
    map.set(item.id, item)
  })
  return [...map.values()].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
}

function getScopedPending(state: DemoState, user: NonNullable<ReturnType<typeof getCurrentUser>>) {
  const pending = state.applications.filter(item => item.status === 'pending_approval')
  if (user.roles.includes('admin'))
    return pending
  return pending.filter(item => canHandleApplication(user, item))
}

function getScopedProcessed(state: DemoState, user: NonNullable<ReturnType<typeof getCurrentUser>>) {
  const records = user.roles.includes('admin')
    ? state.approvals
    : state.approvals.filter(item => item.approverId === user.id)

  const applications = records
    .map(record => state.applications.find(app => app.id === record.applicationId))
    .filter(Boolean) as Application[]

  return dedupeApplications(applications)
}

export const approvalHandlers = [
  http.get('/api/approvals/pending', async ({ request }) => {
    await mockDelay(200)
    const state = getDemoState()
    const user = getCurrentUser(state, request.headers.get('authorization'))

    if (!user)
      return failed('未登录', 401)

    return success(dedupeApplications(getScopedPending(state, user)))
  }),

  http.get('/api/approvals/processed', async ({ request }) => {
    await mockDelay(180)
    const state = getDemoState()
    const user = getCurrentUser(state, request.headers.get('authorization'))

    if (!user)
      return failed('未登录', 401)

    return success(getScopedProcessed(state, user))
  }),

  http.get('/api/approvals/all', async ({ request }) => {
    await mockDelay(180)
    const state = getDemoState()
    const user = getCurrentUser(state, request.headers.get('authorization'))

    if (!user)
      return failed('未登录', 401)

    const all = dedupeApplications([
      ...getScopedPending(state, user),
      ...getScopedProcessed(state, user),
    ])

    return success(all)
  }),

  http.get('/api/approvals/:id/history', async ({ params }) => {
    await mockDelay(160)
    const id = String(params.id)
    const state = getDemoState()
    const records = state.approvals
      .filter(item => item.applicationId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return success(records)
  }),

  http.post('/api/approvals/:id/approve', async ({ params, request }) => {
    await mockDelay(250)

    const id = String(params.id)
    const payload = await request.json().catch(() => ({})) as { opinion?: string }
    const state = getDemoState()
    const user = getCurrentUser(state, request.headers.get('authorization'))

    if (!user)
      return failed('未登录', 401)

    const app = state.applications.find(item => item.id === id)
    if (!app)
      return failed('申请单不存在', 404)

    if (!canHandleApplication(user, app))
      return failed('当前账号无权审批该申请单', 403)

    const requiredLevels = getRequiredApprovalLevels(app.transferType)
    const currentLevel = app.currentApprovalLevel || (requiredLevels > 0 ? 1 : 0)

    state.approvals.unshift(buildRecord(app, 'approve', payload.opinion || '审批通过', user))

    if (requiredLevels === 0 || currentLevel >= requiredLevels) {
      app.status = 'approved'
      app.currentApprovalLevel = 0
    }
    else {
      app.currentApprovalLevel = (currentLevel + 1) as ApprovalLevel
      app.status = 'pending_approval'
    }

    app.updatedAt = new Date().toISOString()
    return success(app, '审批通过')
  }),

  http.post('/api/approvals/:id/reject', async ({ params, request }) => {
    await mockDelay(250)

    const id = String(params.id)
    const payload = await request.json().catch(() => ({})) as { opinion?: string }
    const state = getDemoState()
    const user = getCurrentUser(state, request.headers.get('authorization'))

    if (!user)
      return failed('未登录', 401)

    const app = state.applications.find(item => item.id === id)
    if (!app)
      return failed('申请单不存在', 404)

    if (!canHandleApplication(user, app))
      return failed('当前账号无权审批该申请单', 403)

    app.status = 'rejected'
    app.updatedAt = new Date().toISOString()

    state.approvals.unshift(buildRecord(app, 'reject', payload.opinion || '审批驳回', user))
    return success(app, '已驳回')
  }),

  http.post('/api/approvals/:id/skip', async ({ params, request }) => {
    await mockDelay(250)

    const id = String(params.id)
    const payload = await request.json().catch(() => ({})) as { opinion?: string }
    const state = getDemoState()
    const user = getCurrentUser(state, request.headers.get('authorization'))

    if (!user)
      return failed('未登录', 401)

    const app = state.applications.find(item => item.id === id)
    if (!app)
      return failed('申请单不存在', 404)

    if (!user.roles.includes('admin'))
      return failed('仅管理员可执行免审', 403)

    app.status = 'approved'
    app.currentApprovalLevel = 0
    app.updatedAt = new Date().toISOString()

    state.approvals.unshift(buildRecord(app, 'exempt', payload.opinion || '免审通过', user))
    return success(app, '免审通过')
  }),
]
