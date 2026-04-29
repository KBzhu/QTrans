import type { Application, Notification, User } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotificationList } from '../useNotificationList'
import { useApplicationStore, useAuthStore, useNotificationStore } from '@/stores'

function createUser(id = 'u1'): User {
  return {
    id,
    username: id,
    name: `用户-${id}`,
    email: `${id}@demo.com`,
    phone: '13800000000',
    department: '研发部',
    departmentName: '研发部',
    roles: ['submitter'],
    status: 'enabled',
    loginType: 2,
  }
}

function createApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: overrides.id || 'app-1',
    applicationNo: overrides.applicationNo || 'QT202603100001',
    transferType: overrides.transferType || 'green-to-green',
    department: overrides.department || '研发部',
    sourceArea: overrides.sourceArea || 'green',
    targetArea: overrides.targetArea || 'green',
    sourceCountry: overrides.sourceCountry || '中国',
    sourceCity: overrides.sourceCity || ['北京'],
    targetCountry: overrides.targetCountry || '中国',
    targetCity: overrides.targetCity || ['上海'],
    downloaderAccounts: overrides.downloaderAccounts || ['demo-user'],
    ccAccounts: overrides.ccAccounts || [],
    containsCustomerData: overrides.containsCustomerData || false,
    applyReason: overrides.applyReason || '测试通知链路',
    applicantNotifyOptions: overrides.applicantNotifyOptions || ['in_app'],
    downloaderNotifyOptions: overrides.downloaderNotifyOptions || ['in_app'],
    status: overrides.status || 'pending_approval',
    applicantId: overrides.applicantId || 'u1',
    applicantName: overrides.applicantName || '张提交',
    currentApprovalLevel: overrides.currentApprovalLevel || 1,
    createdAt: overrides.createdAt || '2026-03-10T08:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-03-10T09:00:00.000Z',
  }
}

function createNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: overrides.id || 'notification-default',
    userId: overrides.userId || 'u1',
    type: overrides.type || 'system',
    title: overrides.title || '系统通知',
    content: overrides.content || '测试消息内容',
    relatedId: overrides.relatedId,
    read: overrides.read ?? false,
    createdAt: overrides.createdAt || '2026-03-10T10:00:00.000Z',
    source: overrides.source || 'mock',
  }
}

describe('useNotificationList', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())

    const authStore = useAuthStore()
    authStore.currentUser = createUser('u1')
    authStore.token = 'token'
  })

  it('filters notifications by tab and supports loadMore', async () => {
    const applicationStore = useApplicationStore()
    const notificationStore = useNotificationStore()

    applicationStore.applications = [
      createApplication({ id: 'app-1', applicationNo: 'QT202603100001' }),
      createApplication({ id: 'app-2', applicationNo: 'QT202603100002' }),
    ]

    notificationStore.notifications = [
      createNotification({ id: 'n-1', type: 'approval', relatedId: 'app-1', createdAt: '2026-03-10T15:00:00.000Z' }),
      createNotification({ id: 'n-2', type: 'system', createdAt: '2026-03-10T14:00:00.000Z' }),
      createNotification({ id: 'n-3', type: 'transfer', relatedId: 'app-2', read: true, createdAt: '2026-03-10T13:00:00.000Z' }),
      createNotification({ id: 'n-4', type: 'approval', createdAt: '2026-03-10T12:00:00.000Z' }),
      createNotification({ id: 'n-5', type: 'system', read: true, createdAt: '2026-03-10T11:00:00.000Z' }),
      createNotification({ id: 'n-6', type: 'transfer', createdAt: '2026-03-10T10:00:00.000Z' }),
      createNotification({ id: 'n-other', userId: 'u2', type: 'approval', createdAt: '2026-03-10T16:00:00.000Z' }),
    ]
    notificationStore.unreadCount = 4

    applicationStore.fetchApplications = vi.fn().mockResolvedValue({
      list: applicationStore.applications,
      total: applicationStore.applications.length,
      pageNum: 1,
      pageSize: 200,
    }) as any
    notificationStore.fetchNotifications = vi.fn().mockResolvedValue(notificationStore.notifications) as any

    const composable = useNotificationList()
    await composable.fetchList()

    expect(composable.getTabCount('all')).toBe(6)
    expect(composable.listData.value).toHaveLength(5)
    expect(composable.hasMore.value).toBe(true)
    expect(composable.listData.value[0]?.applicationNo).toBe('QT202603100001')

    composable.loadMore()
    expect(composable.listData.value).toHaveLength(6)
    expect(composable.hasMore.value).toBe(false)

    composable.handleTabChange('approval')
    expect(composable.listData.value.map(item => item.id)).toEqual(['n-1', 'n-4'])

    composable.handleTabChange('unread')
    expect(composable.listData.value.every(item => !item.read)).toBe(true)
    expect(composable.getTabCount('unread')).toBe(4)
  })

  it('delegates mark read, delete and clear read operations to store', async () => {
    const applicationStore = useApplicationStore()
    const notificationStore = useNotificationStore()

    notificationStore.notifications = [
      createNotification({ id: 'n-1', read: false, createdAt: '2026-03-10T12:00:00.000Z' }),
      createNotification({ id: 'n-2', read: true, createdAt: '2026-03-10T11:00:00.000Z' }),
      createNotification({ id: 'n-3', type: 'transfer', read: false, createdAt: '2026-03-10T10:00:00.000Z' }),
      createNotification({ id: 'n-other', userId: 'u2', read: true, createdAt: '2026-03-10T09:00:00.000Z' }),
    ]
    notificationStore.unreadCount = 2

    applicationStore.fetchApplications = vi.fn().mockResolvedValue({ list: [], total: 0, pageNum: 1, pageSize: 200 }) as any
    notificationStore.fetchNotifications = vi.fn().mockResolvedValue(notificationStore.notifications) as any
    notificationStore.markAsRead = vi.fn(async (id: string) => {
      const target = notificationStore.notifications.find(item => item.id === id)
      if (!target)
        return null

      notificationStore.notifications = notificationStore.notifications.map(item => (item.id === id ? { ...item, read: true } : item))
      notificationStore.unreadCount = notificationStore.notifications.filter(item => item.userId === 'u1' && !item.read).length
      return { ...target, read: true }
    }) as any
    notificationStore.deleteNotification = vi.fn(async (id: string) => {
      notificationStore.notifications = notificationStore.notifications.filter(item => item.id !== id)
      notificationStore.unreadCount = notificationStore.notifications.filter(item => item.userId === 'u1' && !item.read).length
      return true
    }) as any
    notificationStore.clearRead = vi.fn(async (userId: string) => {
      const readCount = notificationStore.notifications.filter(item => item.userId === userId && item.read).length
      notificationStore.notifications = notificationStore.notifications.filter(item => item.userId !== userId || !item.read)
      notificationStore.unreadCount = notificationStore.notifications.filter(item => item.userId === userId && !item.read).length
      return readCount
    }) as any

    const composable = useNotificationList()
    await composable.fetchList()

    await composable.handleMarkRead('n-1')
    expect(notificationStore.markAsRead).toHaveBeenCalledWith('n-1')
    expect(composable.unreadCount.value).toBe(1)

    await composable.handleDelete('n-3')
    expect(notificationStore.deleteNotification).toHaveBeenCalledWith('n-3')
    expect(composable.listData.value.map(item => item.id)).toEqual(['n-1', 'n-2'])

    const removedCount = await composable.handleClearRead()
    expect(notificationStore.clearRead).toHaveBeenCalledWith('u1')
    expect(removedCount).toBe(2)
    expect(composable.listData.value.map(item => item.id)).toEqual([])
    expect(composable.hasReadMessages.value).toBe(false)

  })
})
