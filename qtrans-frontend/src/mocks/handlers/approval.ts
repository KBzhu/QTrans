import type { ApprovalAction, ApprovalLevel, ApprovalRecord } from '@/types'
import { http } from 'msw'
import { getDemoState } from '../data/demo-init'
import { failed, mockDelay, success } from './_utils'

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

  http.post('/api/approvals/:id/approve', async ({ params, request }) => {
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

    state.approvals.unshift(buildRecord(id, 'approve', payload.opinion || '审批通过'))
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
