import type { Notification, NotificationType } from '@/types'
import { computed, ref, watch } from 'vue'
import { useApplicationStore, useAuthStore, useNotificationStore } from '@/stores'

export type NotificationListTab = 'all' | 'unread' | NotificationType

export interface NotificationListItem extends Notification {
  applicationNo?: string
}

const PAGE_SIZE = 5

function sortByCreatedAt<T extends { createdAt: string }>(list: T[]) {
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function useNotificationList() {
  const authStore = useAuthStore()
  const applicationStore = useApplicationStore()
  const notificationStore = useNotificationStore()

  const loading = ref(false)
  const activeTab = ref<NotificationListTab>('all')
  const currentPage = ref(1)

  const currentUserId = computed(() => authStore.currentUser?.id)
  const applicationNoMap = computed(() => new Map(applicationStore.applications.map(item => [item.id, item.applicationNo])))

  const currentUserNotifications = computed(() => {
    const userId = currentUserId.value
    if (!userId)
      return []

    return sortByCreatedAt(notificationStore.notifications.filter(item => item.userId === userId))
  })

  const unreadCount = computed(() => notificationStore.unreadCount)
  const hasReadMessages = computed(() => currentUserNotifications.value.some(item => item.read))

  const filteredList = computed<NotificationListItem[]>(() => {
    return currentUserNotifications.value
      .filter((item) => {
        if (activeTab.value === 'all')
          return true

        if (activeTab.value === 'unread')
          return !item.read

        return item.type === activeTab.value
      })
      .map(item => ({
        ...item,
        applicationNo: item.relatedId ? applicationNoMap.value.get(item.relatedId) : undefined,
      }))
  })

  const listData = computed(() => filteredList.value.slice(0, currentPage.value * PAGE_SIZE))
  const hasMore = computed(() => filteredList.value.length > listData.value.length)
  const total = computed(() => filteredList.value.length)

  watch(filteredList, (list) => {
    if (list.length === 0) {
      currentPage.value = 1
      return
    }

    const maxPage = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
    if (currentPage.value > maxPage)
      currentPage.value = maxPage
  }, { immediate: true })

  watch(currentUserId, (userId, previousUserId) => {
    if (userId && userId !== previousUserId)
      void fetchList()
  })

  async function fetchList() {
    const userId = currentUserId.value
    if (!userId)
      return []

    loading.value = true
    try {
      await Promise.all([
        applicationStore.fetchApplications({ pageNum: 1, pageSize: 200 }),
        notificationStore.fetchNotifications(userId),
      ])
      return listData.value
    }
    finally {
      loading.value = false
    }
  }

  function handleTabChange(tab: string | number) {
    activeTab.value = String(tab) as NotificationListTab
    currentPage.value = 1
  }

  async function handleMarkRead(id: string) {
    return notificationStore.markAsRead(id)
  }

  async function handleMarkAllRead() {
    const userId = currentUserId.value
    if (!userId)
      return

    await notificationStore.markAllAsRead(userId)
  }

  async function handleDelete(id: string) {
    return notificationStore.deleteNotification(id)
  }

  async function handleClearRead() {
    const userId = currentUserId.value
    if (!userId)
      return 0

    return notificationStore.clearRead(userId)
  }

  function loadMore() {
    if (!hasMore.value || loading.value)
      return

    currentPage.value += 1
  }

  function getTabCount(tab: NotificationListTab) {
    if (tab === 'all')
      return currentUserNotifications.value.length

    if (tab === 'unread')
      return unreadCount.value

    return currentUserNotifications.value.filter(item => item.type === tab).length
  }

  return {
    listData,
    unreadCount,
    loading,
    hasMore,
    activeTab,
    hasReadMessages,
    total,
    fetchList,
    handleTabChange,
    handleMarkRead,
    handleMarkAllRead,
    handleDelete,
    handleClearRead,
    loadMore,
    getTabCount,
  }
}
