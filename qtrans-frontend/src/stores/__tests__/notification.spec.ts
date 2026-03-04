import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotificationStore } from '@/stores/notification'

const { markAsReadMock, markAllReadMock } = vi.hoisted(() => ({
  markAsReadMock: vi.fn(),
  markAllReadMock: vi.fn(),
}))

vi.mock('@/api/notification', () => ({

  notificationApi: {
    getList: vi.fn(),
    markAsRead: markAsReadMock,
    markAllAsRead: markAllReadMock,
  },
}))

describe('useNotificationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    markAsReadMock.mockReset()
    markAllReadMock.mockReset()
  })

  it('markAsRead decreases unreadCount', async () => {
    markAsReadMock.mockResolvedValueOnce({
      id: 'n-1',
      userId: 'u1',
      type: 'system',
      title: 't1',
      content: 'c1',
      read: true,
      createdAt: new Date().toISOString(),
    })

    const store = useNotificationStore()
    store.notifications = [
      { id: 'n-1', userId: 'u1', type: 'system', title: 't1', content: 'c1', read: false, createdAt: new Date().toISOString() },
      { id: 'n-2', userId: 'u1', type: 'system', title: 't2', content: 'c2', read: false, createdAt: new Date().toISOString() },
    ]
    store.unreadCount = 2

    await store.markAsRead('n-1')

    expect(store.unreadCount).toBe(1)
  })

  it('markAllAsRead sets unreadCount to 0', async () => {
    markAllReadMock.mockResolvedValueOnce(true)

    const store = useNotificationStore()
    store.notifications = [
      { id: 'n-1', userId: 'u1', type: 'system', title: 't1', content: 'c1', read: false, createdAt: new Date().toISOString() },
      { id: 'n-2', userId: 'u1', type: 'system', title: 't2', content: 'c2', read: false, createdAt: new Date().toISOString() },
    ]
    store.unreadCount = 2

    await store.markAllAsRead()

    expect(store.unreadCount).toBe(0)
  })
})
