import type { Notification as AppNotification } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationApi } from '@/api/notification'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<AppNotification[]>([])
  const unreadCount = ref(0)

  function recalculateUnreadCount() {
    unreadCount.value = notifications.value.filter(item => !item.read).length
  }

  async function fetchNotifications(userId?: string) {
    const list = await notificationApi.getList(userId)
    notifications.value = list
    recalculateUnreadCount()
    return list
  }

  async function markAsRead(id: string) {
    const updated = await notificationApi.markAsRead(id)
    notifications.value = notifications.value.map(item => (item.id === id ? updated : item))
    recalculateUnreadCount()
    return updated
  }

  async function markAllAsRead(userId?: string) {
    await notificationApi.markAllAsRead(userId)
    notifications.value = notifications.value.map(item => ({ ...item, read: true }))
    recalculateUnreadCount()
  }

  function addNotification(notification: AppNotification) {
    notifications.value = [notification, ...notifications.value]
    recalculateUnreadCount()
  }

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
  }
}, {
  persist: {
    pick: ['notifications', 'unreadCount'],
  },
})

