<script setup lang="ts">
import type { NotificationListItem } from '@/composables/useNotificationList'
import type { NotificationType } from '@/types'
import type { Component } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCheckCircle, IconDelete, IconNotification, IconSend } from '@arco-design/web-vue/es/icon'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationList } from '@/composables/useNotificationList'
import { formatDateTime } from '@/utils/format'
import './notification-list.scss'

const router = useRouter()
const loadMoreRef = ref<HTMLElement | null>(null)
const expandedIds = ref<string[]>([])

const {
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
} = useNotificationList()

const expandedIdSet = computed(() => new Set(expandedIds.value))

const typeIconMap: Record<NotificationType, Component> = {
  system: IconNotification,
  approval: IconCheckCircle,
  transfer: IconSend,
}

const typeLabelMap: Record<NotificationType, string> = {
  system: '系统通知',
  approval: '审批通知',
  transfer: '传输通知',
}

useIntersectionObserver(loadMoreRef, ([entry]) => {
  if (entry?.isIntersecting)
    loadMore()
})

function formatRelativeTime(time: string) {
  const diff = Date.now() - new Date(time).getTime()
  if (Number.isNaN(diff))
    return '--'

  if (diff < 60 * 1000)
    return '刚刚'

  if (diff < 60 * 60 * 1000)
    return `${Math.max(1, Math.floor(diff / (60 * 1000)))} 分钟前`

  if (diff < 24 * 60 * 60 * 1000)
    return `${Math.max(1, Math.floor(diff / (60 * 60 * 1000)))} 小时前`

  if (diff < 7 * 24 * 60 * 60 * 1000)
    return `${Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)))} 天前`

  return formatDateTime(time).slice(0, 16)
}

function getNotificationIcon(type: NotificationType) {
  return typeIconMap[type]
}

function getTypeLabel(type: NotificationType) {
  return typeLabelMap[type]
}

function isExpanded(id: string) {
  return expandedIdSet.value.has(id)
}

function toggleExpand(id: string) {
  if (expandedIdSet.value.has(id)) {
    expandedIds.value = expandedIds.value.filter(item => item !== id)
    return
  }

  expandedIds.value = [...expandedIds.value, id]
}

async function onMarkRead(item: NotificationListItem) {
  const updated = await handleMarkRead(item.id)
  if (!updated)
    return

  Message.success(`已标记“${item.title}”为已读`)
}

async function onMarkAllRead() {
  if (unreadCount.value === 0) {
    Message.info('当前没有未读消息')
    return
  }

  await handleMarkAllRead()
  Message.success('已将当前账号消息全部标记为已读')
}

async function onDelete(item: NotificationListItem) {
  await handleDelete(item.id)
  expandedIds.value = expandedIds.value.filter(id => id !== item.id)
  Message.success(`已删除“${item.title}”`)
}

async function onClearRead() {
  const removedCount = await handleClearRead()
  if (removedCount === 0) {
    Message.info('当前没有可清理的已读消息')
    return
  }

  expandedIds.value = expandedIds.value.filter((id) => {
    return listData.value.some(item => item.id === id)
  })
  Message.success(`已清空 ${removedCount} 条已读消息`)
}

function goToRelated(item: NotificationListItem) {
  if (!item.relatedId)
    return

  void router.push(`/application/${item.relatedId}`)
}

onMounted(() => {
  void fetchList()
})
</script>

<template>
  <section class="notification-list-page">
    <header class="notification-list-page__header">
      <div>
        <div class="notification-list-page__title-row">
          <h1 class="notification-list-page__title">消息中心</h1>
          <a-badge :count="unreadCount" :max-count="99">
            <span class="notification-list-page__badge-label">未读</span>
          </a-badge>
        </div>
        <p class="notification-list-page__subtitle">
          统一查看系统公告、审批提醒与传输消息，支持单条/批量已读和清理已读。
        </p>
      </div>

      <div class="notification-list-page__toolbar">
        <a-button :disabled="unreadCount === 0" @click="onMarkAllRead">全部已读</a-button>
        <a-button status="danger" :disabled="!hasReadMessages" @click="onClearRead">清空已读</a-button>
      </div>
    </header>

    <section class="notification-list-page__tabs-card">
      <a-tabs :active-key="activeTab" type="rounded" @change="handleTabChange">
        <a-tab-pane key="all">
          <template #title>
            <span class="notification-list-page__tab-title">全部</span>
            <span class="notification-list-page__tab-count">{{ getTabCount('all') }}</span>
          </template>
        </a-tab-pane>
        <a-tab-pane key="unread">
          <template #title>
            <span class="notification-list-page__tab-title">未读</span>
            <span class="notification-list-page__tab-count">{{ getTabCount('unread') }}</span>
          </template>
        </a-tab-pane>
        <a-tab-pane key="system">
          <template #title>
            <span class="notification-list-page__tab-title">系统通知</span>
            <span class="notification-list-page__tab-count">{{ getTabCount('system') }}</span>
          </template>
        </a-tab-pane>
        <a-tab-pane key="approval">
          <template #title>
            <span class="notification-list-page__tab-title">审批通知</span>
            <span class="notification-list-page__tab-count">{{ getTabCount('approval') }}</span>
          </template>
        </a-tab-pane>
        <a-tab-pane key="transfer">
          <template #title>
            <span class="notification-list-page__tab-title">传输通知</span>
            <span class="notification-list-page__tab-count">{{ getTabCount('transfer') }}</span>
          </template>
        </a-tab-pane>
      </a-tabs>
    </section>

    <section class="notification-list-page__list-card">
      <a-spin :loading="loading" class="notification-list-page__spin" tip="消息加载中...">
        <template v-if="listData.length > 0">
          <div class="notification-list-page__summary">
            当前筛选共 {{ total }} 条，已展示 {{ listData.length }} 条
          </div>

          <article
            v-for="item in listData"
            :key="item.id"
            :class="['notification-card', `notification-card--${item.type}`, { 'notification-card--unread': !item.read }]"
          >
            <div :class="['notification-card__icon', `notification-card__icon--${item.type}`]">
              <component :is="getNotificationIcon(item.type)" />
            </div>

            <div class="notification-card__content-wrap">
              <div class="notification-card__top">
                <div class="notification-card__main">
                  <div class="notification-card__title-row">
                    <h3 :class="['notification-card__title', { 'notification-card__title--unread': !item.read }]">
                      {{ item.title }}
                    </h3>
                    <span :class="['notification-card__type-tag', `notification-card__type-tag--${item.type}`]">
                      {{ getTypeLabel(item.type) }}
                    </span>
                  </div>

                  <p :class="['notification-card__content', { 'notification-card__content--expanded': isExpanded(item.id) }]">
                    {{ item.content }}
                  </p>

                  <a-button
                    v-if="item.content.length > 56"
                    type="text"
                    size="small"
                    class="notification-card__expand-btn"
                    @click="toggleExpand(item.id)"
                  >
                    {{ isExpanded(item.id) ? '收起' : '展开查看' }}
                  </a-button>

                  <button
                    v-if="item.relatedId"
                    type="button"
                    class="notification-card__related-link"
                    @click="goToRelated(item)"
                  >
                    相关申请单：{{ item.applicationNo || item.relatedId }}
                  </button>
                </div>

                <div class="notification-card__aside">
                  <a-tooltip :content="formatDateTime(item.createdAt)">
                    <span class="notification-card__time">{{ formatRelativeTime(item.createdAt) }}</span>
                  </a-tooltip>

                  <div class="notification-card__actions">
                    <a-button v-if="!item.read" type="text" size="small" @click="onMarkRead(item)">标记已读</a-button>
                    <a-button type="text" size="small" status="danger" @click="onDelete(item)">
                      <template #icon>
                        <IconDelete />
                      </template>
                      删除
                    </a-button>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <div ref="loadMoreRef" class="notification-list-page__load-more">
            <span v-if="hasMore">向下滚动加载更多消息</span>
            <span v-else>没有更多消息了</span>
          </div>
        </template>

        <div v-else class="notification-list-page__empty">
          <a-empty description="当前筛选条件下暂无消息" />
        </div>
      </a-spin>
    </section>
  </section>
</template>
