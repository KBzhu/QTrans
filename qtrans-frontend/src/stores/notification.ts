import type { Notification as AppNotification } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { notificationApi } from '@/api/notification'
import { useAuthStore } from './auth'

const notificationPersistKey = `notification:${import.meta.env.VITE_APP_TYPE || 'tenant'}`

function sortNotifications(list: AppNotification[]) {

  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function mergeNotifications(list: AppNotification[]) {
  const mergedMap = new Map<string, AppNotification>()
  list.forEach((item) => {
    mergedMap.set(item.id, item)
  })

  return sortNotifications([...mergedMap.values()])
}

export const useNotificationStore = defineStore('notification', () => {
  const authStore = useAuthStore()
  const notifications = ref<AppNotification[]>([])
  const unreadCount = ref(0)
  const currentUserId = computed(() => authStore.currentUser?.id)

  function getNotificationsByUser(userId?: string) {
    return userId ? notifications.value.filter(item => item.userId === userId) : notifications.value
  }

  function getVisibleNotifications() {
    return currentUserId.value ? getNotificationsByUser(currentUserId.value) : []
  }

  function hasRemoteNotifications(userId?: string) {
    if (!userId)
      return false

    return getNotificationsByUser(userId).some(item => item.source !== 'local')
  }

  function recalculateUnreadCount() {
    unreadCount.value = getVisibleNotifications().filter(item => !item.read).length
  }

  function replaceScopedNotifications(userId: string, remoteList: AppNotification[]) {
    const otherUsers = notifications.value.filter(item => item.userId !== userId)
    const localNotifications = notifications.value.filter(item => item.userId === userId && item.source === 'local')
    notifications.value = mergeNotifications([...otherUsers, ...localNotifications, ...remoteList])
  }


  watch(currentUserId, () => {
    recalculateUnreadCount()
  }, { immediate: true })

  async function fetchNotifications(userId = currentUserId.value) {
    if (!userId) {
      recalculateUnreadCount()
      return []
    }

    try {
      const list = await notificationApi.getList(userId)
      replaceScopedNotifications(userId, list)
    }
    catch {
      recalculateUnreadCount()
      return getNotificationsByUser(userId)
    }

    recalculateUnreadCount()
    return getNotificationsByUser(userId)
  }


  async function markAsRead(id: string) {
    const target = notifications.value.find(item => item.id === id)
    if (!target)
      return null

    if (target.read)
      return target

    const updated = target.source === 'local'
      ? { ...target, read: true }
      : await notificationApi.markAsRead(id)

    notifications.value = sortNotifications(notifications.value.map(item => (item.id === id ? { ...item, ...updated, read: true } : item)))
    recalculateUnreadCount()
    return updated
  }

  async function markAllAsRead(userId = currentUserId.value) {
    if (!userId)
      return

    const userNotifications = getNotificationsByUser(userId)
    if (userNotifications.every(item => item.read))
      return

    if (hasRemoteNotifications(userId))
      await notificationApi.markAllAsRead(userId)

    notifications.value = notifications.value.map(item => (item.userId === userId ? { ...item, read: true } : item))
    recalculateUnreadCount()
  }

  async function deleteNotification(id: string) {
    const target = notifications.value.find(item => item.id === id)
    if (!target)
      return false

    if (target.source !== 'local')
      await notificationApi.delete(id)

    notifications.value = notifications.value.filter(item => item.id !== id)
    recalculateUnreadCount()
    return true
  }

  async function clearRead(userId = currentUserId.value) {
    if (!userId)
      return 0

    const readList = getNotificationsByUser(userId).filter(item => item.read)
    if (readList.length === 0)
      return 0

    if (readList.some(item => item.source !== 'local'))
      await notificationApi.clearRead(userId)

    notifications.value = notifications.value.filter(item => item.userId !== userId || !item.read)
    recalculateUnreadCount()
    return readList.length
  }

  function addNotification(notification: AppNotification) {
    const nextNotification = {
      ...notification,
      source: notification.source ?? 'local',
    }

    notifications.value = mergeNotifications([nextNotification, ...notifications.value])
    recalculateUnreadCount()
    return nextNotification
  }

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
    addNotification,
  }
}, {
  persist: {
    key: notificationPersistKey,
    pick: ['notifications', 'unreadCount'],
  },

})


