import type { ApprovalRecord, Application, Notification } from '@/types'
import { applications, cities, departments, users, type MockUser } from './index'

export interface DemoState {
  users: MockUser[]
  applications: Application[]
  approvals: ApprovalRecord[]
  notifications: Notification[]
  departments: typeof departments
  cities: typeof cities
}

const seedApprovals: ApprovalRecord[] = [
  {
    id: 'apr-1002-1',
    applicationId: 'app-1002',
    level: 1,
    approverId: 'u_approver1',
    approverName: '王审批一',
    action: 'approve',
    opinion: '业务合理，同意。',
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
  {
    id: 'apr-1005-1',
    applicationId: 'app-1005',
    level: 1,
    approverId: 'u_approver1',
    approverName: '王审批一',
    action: 'reject',
    opinion: '缺少必要授权附件。',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
]

function createNotification(record: Omit<Notification, 'read' | 'source'> & Partial<Pick<Notification, 'read' | 'source'>>): Notification {
  return {
    read: false,
    source: 'mock',
    ...record,
  }
}

const seedNotifications: Notification[] = [
  createNotification({
    id: 'ntf-submitter-1',
    userId: 'u_submitter',
    type: 'approval',
    title: '申请单已进入一级审批',
    content: '申请单 QT202603040002 已进入一级审批，请留意审批进度。',
    relatedId: 'app-1002',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  }),
  createNotification({
    id: 'ntf-submitter-2',
    userId: 'u_submitter',
    type: 'transfer',
    title: '文件传输进行中',
    content: '申请单 QT202603040003 当前正在传输，预计稍后完成。',
    relatedId: 'app-1003',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  }),
  createNotification({
    id: 'ntf-submitter-3',
    userId: 'u_submitter',
    type: 'system',
    title: '系统维护通知',
    content: '今晚 22:00-22:30 将进行通知服务维护，期间站内消息可能短暂延迟。',
    read: true,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  }),
  createNotification({
    id: 'ntf-submitter-4',
    userId: 'u_submitter',
    type: 'approval',
    title: '申请单审批被驳回',
    content: '申请单 QT202603040005 因附件不完整被驳回，请补充后重新提交。',
    relatedId: 'app-1005',
    read: true,
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
  }),
  createNotification({
    id: 'ntf-submitter-5',
    userId: 'u_submitter',
    type: 'system',
    title: '草稿即将过期',
    content: '您有 1 份草稿将在 3 天后失效，请尽快补充并提交。',
    relatedId: 'app-1004',
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  }),
  createNotification({
    id: 'ntf-submitter-6',
    userId: 'u_submitter',
    type: 'transfer',
    title: '文件已完成归档',
    content: '申请单 QT202603040001 已完成归档，可前往待我下载页面查看。',
    relatedId: 'app-1001',
    read: true,
    createdAt: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
  }),
  createNotification({
    id: 'ntf-approver1-1',
    userId: 'u_approver1',
    type: 'approval',
    title: '待审批提醒',
    content: '您有新的审批任务 QT202603040002，请在 48 小时内处理。',
    relatedId: 'app-1002',
    createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
  }),
  createNotification({
    id: 'ntf-approver1-2',
    userId: 'u_approver1',
    type: 'system',
    title: '审批 SLA 提醒',
    content: '近 7 日一级审批平均时长高于基线，请关注待办积压情况。',
    read: true,
    createdAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
  }),
  createNotification({
    id: 'ntf-approver2-1',
    userId: 'u_approver2',
    type: 'approval',
    title: '二级审批待处理',
    content: '申请单 QT202603040003 已流转至您，请尽快处理。',
    relatedId: 'app-1003',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  }),
  createNotification({
    id: 'ntf-approver3-1',
    userId: 'u_approver3',
    type: 'approval',
    title: '三级审批提醒',
    content: '申请单 QT202603040003 已到达最终审批节点，可直接审批或免审。',
    relatedId: 'app-1003',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  }),
  createNotification({
    id: 'ntf-admin-1',
    userId: 'u_admin',
    type: 'system',
    title: '系统公告',
    content: '消息中心已启用批量已读与清空已读能力，请协助体验。',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  }),
  createNotification({
    id: 'ntf-admin-2',
    userId: 'u_admin',
    type: 'transfer',
    title: '传输异常告警',
    content: '申请单 QT202603040003 的传输速度低于阈值，请关注链路状态。',
    relatedId: 'app-1003',
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
  }),
  createNotification({
    id: 'ntf-admin-3',
    userId: 'u_admin',
    type: 'approval',
    title: '审批链路审计完成',
    content: '今日审批链路抽检已完成，未发现越权操作。',
    read: true,
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  }),
]


function deepClone<T>(data: T): T {
  if (typeof structuredClone === 'function')
    return structuredClone(data)

  return JSON.parse(JSON.stringify(data)) as T
}

let state: DemoState | null = null

export function initDemoData(force = false): DemoState {
  if (state && !force)
    return state

  state = {
    users: deepClone(users),
    applications: deepClone(applications),
    approvals: deepClone(seedApprovals),
    notifications: deepClone(seedNotifications),
    departments: deepClone(departments),
    cities: deepClone(cities),
  }

  return state
}

export function getDemoState(): DemoState {
  return initDemoData()
}
