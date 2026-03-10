import type { Notification, User } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'

const { getListMock, markAsReadMock, markAllReadMock, deleteMock, clearReadMock } = vi.hoisted(() => ({
  getListMock: vi.fn(),
  markAsReadMock: vi.fn(),
  markAllReadMock: vi.fn(),
  deleteMock: vi.fn(),
  clearReadMock: vi.fn(),
}))

vi.mock('@/api/notification', () => ({
  notificationApi: {
    getList: getListMock,
    markAsRead: markAsReadMock,
    markAllAsRead: markAllReadMock,
    delete: deleteMock,
    clearRead: clearReadMock,
  },
}))

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

describe('useNotificationStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())

    getListMock.mockReset()
    markAsReadMock.mockReset()
    markAllReadMock.mockReset()
    deleteMock.mockReset()
    clearReadMock.mockReset()

    const authStore = useAuthStore()
    authStore.currentUser = createUser('u1')
    authStore.token = 'token'
  })

  it('fetchNotifications merges remote and local notifications for current user', async () => {
    getListMock.mockResolvedValueOnce([
      createNotification({ id: 'remote-unread', read: false }),
      createNotification({ id: 'remote-read', read: true }),
    ])

    const store = useNotificationStore()
    store.notifications = [
      createNotification({ id: 'local-u1', source: 'local', read: false }),
      createNotification({ id: 'other-user', userId: 'u2', read: false }),
    ]

    await store.fetchNotifications('u1')

    expect(getListMock).toHaveBeenCalledWith('u1')
    expect(store.notifications.map(item => item.id)).toEqual(expect.arrayContaining(['local-u1', 'remote-unread', 'remote-read', 'other-user']))
    expect(store.unreadCount).toBe(2)
  })

  it('markAsRead skips api call for local notifications', async () => {
    const store = useNotificationStore()
    store.notifications = [
      createNotification({ id: 'local-only', source: 'local', read: false }),
    ]
    store.unreadCount = 1

    await store.markAsRead('local-only')

    expect(markAsReadMock).not.toHaveBeenCalled()
    expect(store.notifications[0]?.read).toBe(true)
    expect(store.unreadCount).toBe(0)
  })

  it('clearRead and deleteNotification keep current user scope correct', async () => {
    clearReadMock.mockResolvedValueOnce(1)
    deleteMock.mockResolvedValueOnce(true)

    const store = useNotificationStore()
    store.notifications = [
      createNotification({ id: 'u1-read-remote', read: true }),
      createNotification({ id: 'u1-read-local', read: true, source: 'local' }),
      createNotification({ id: 'u1-unread', read: false, source: 'local' }),
      createNotification({ id: 'u2-read', userId: 'u2', read: true }),
    ]
    store.unreadCount = 1

    const cleared = await store.clearRead('u1')
    await store.deleteNotification('u2-read')

    expect(clearReadMock).toHaveBeenCalledWith('u1')
    expect(cleared).toBe(2)
    expect(deleteMock).toHaveBeenCalledWith('u2-read')
    expect(store.notifications.map(item => item.id)).toEqual(['u1-unread'])
    expect(store.unreadCount).toBe(1)
  })

  it('markAllAsRead only updates current user notifications', async () => {
    markAllReadMock.mockResolvedValueOnce(true)

    const store = useNotificationStore()
    store.notifications = [
      createNotification({ id: 'u1-unread', read: false }),
      createNotification({ id: 'u2-unread', userId: 'u2', read: false }),
    ]
    store.unreadCount = 1

    await store.markAllAsRead('u1')

    expect(markAllReadMock).toHaveBeenCalledWith('u1')
    expect(store.notifications.find(item => item.id === 'u1-unread')?.read).toBe(true)
    expect(store.notifications.find(item => item.id === 'u2-unread')?.read).toBe(false)
    expect(store.unreadCount).toBe(0)
  })
})

