import type { ApprovalAction, ApprovalLevel, ApprovalRecord, TransferType } from '@/types'
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

function buildRecord(applicationId: string, action: ApprovalAction, opinion: string): ApprovalRecord {
  const state = getDemoState()
  const application = state.applications.find(item => item.id === applicationId)
  const level = Math.min(3, Math.max(1, application?.currentApprovalLevel || 1)) as ApprovalLevel

  return {
    id: `apr-${Date.now()}`,
    applicationId,
    level,
    approverId: `u_approver${level}`,
    approverName: `审批人${level}`,
    action,
    opinion,
    createdAt: new Date().toISOString(),
  }
}

export const approvalHandlers = [
  http.get('/api/approvals/pending', async () => {
    await mockDelay(200)
    const state = getDemoState()
    const list = state.applications.filter(item => item.status === 'pending_approval')
    return success(list)
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
    const app = state.applications.find(item => item.id === id)

    if (!app)
      return failed('申请单不存在', 404)

    const requiredLevels = getRequiredApprovalLevels(app.transferType)
    const currentLevel = app.currentApprovalLevel || 1

    // 记录审批记录
    state.approvals.unshift(buildRecord(id, 'approve', payload.opinion || '审批通过'))

    // 判断是否为最后一级审批
    if (currentLevel >= requiredLevels) {
      // 最后一级审批通过，状态改为approved，自动开始传输
      app.status = 'approved'
      app.currentApprovalLevel = 0
    }
    else {
      // 不是最后一级，增加审批层级，继续待审批
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
    const app = state.applications.find(item => item.id === id)

    if (!app)
      return failed('申请单不存在', 404)

    app.status = 'rejected'
    app.updatedAt = new Date().toISOString()

    state.approvals.unshift(buildRecord(id, 'reject', payload.opinion || '审批驳回'))
    return success(app, '已驳回')
  }),

  http.post('/api/approvals/:id/skip', async ({ params, request }) => {
    await mockDelay(250)

    const id = String(params.id)
    const payload = await request.json().catch(() => ({})) as { opinion?: string }
    const state = getDemoState()
    const app = state.applications.find(item => item.id === id)

    if (!app)
      return failed('申请单不存在', 404)

    app.status = 'approved'
    app.currentApprovalLevel = 0
    app.updatedAt = new Date().toISOString()

    state.approvals.unshift(buildRecord(id, 'exempt', payload.opinion || '免审通过'))
    return success(app, '免审通过')
  }),
]
