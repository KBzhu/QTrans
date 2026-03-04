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

const seedNotifications: Notification[] = [
  {
    id: 'ntf-1',
    userId: 'u_submitter',
    type: 'approval',
    title: '申请单已进入审批',
    content: '申请单 QT202603040002 已进入一级审批。',
    relatedId: 'app-1002',
    read: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ntf-2',
    userId: 'u_submitter',
    type: 'transfer',
    title: '文件传输进行中',
    content: '申请单 QT202603040003 当前正在传输。',
    relatedId: 'app-1003',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
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
