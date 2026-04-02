<script setup lang="ts">
import { computed } from 'vue'

import { useRouter } from 'vue-router'
import { useAuthStore, useNotificationStore } from '@/stores'
import type { UserRole } from '@/types'
import { assetPath } from '@/utils/path'
import RoleSwitcher from './RoleSwitcher.vue'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const roleNameMap: Record<UserRole, string> = {
  submitter: '普通用户（申请者）',
  approver1: '一级审批人',
  approver2: '二级审批人',
  approver3: '三级审批人',
  admin: '管理员',
  partner: '合作方',
  vendor: '供应商',
  subsidiary: '子公司',
}

const activeRole = computed(() => authStore.currentUser?.roles?.[0] || 'submitter')
const displayName = computed(() => authStore.currentUser?.name || authStore.currentUser?.username || '访客')
const accountText = computed(() => {
  const user = authStore.currentUser
  if (!user)
    return '--'

  return `${user.username} ${user.id}`
})
const departmentText = computed(() => {
  return authStore.currentUser?.departmentName || authStore.currentUser?.department || '--'
})
const roleTag = computed(() => {
  const role = activeRole.value as UserRole
  return roleNameMap[role] || '普通用户（申请者）'
})

async function goProfile() {
  await router.push('/profile')
}

async function goNotifications() {
  await router.push('/notifications')
}

async function handleLogout() {
  await authStore.logout()
}

watch(
  () => authStore.currentUser?.id,
  async (userId) => {
    if (!userId)
      return

    await notificationStore.fetchNotifications(userId)
  },
  { immediate: true },
)

</script>

<template>
  <header class="app-header">
    <div class="app-header__left">
      <div class="logo-box">
        <img :src="assetPath('/figma/3830_3/4.svg')" alt="logo" class="logo-icon" />
      </div>
      <div class="title">文件传输系统</div>
    </div>

    <div class="app-header__right">
      <RoleSwitcher />

      <button class="notify-btn" @click="goNotifications">
        <img :src="assetPath('/figma/3971_1105/5.svg')" alt="通知" />
        <span v-if="notificationStore.unreadCount > 0" class="badge">{{ notificationStore.unreadCount }}</span>
      </button>

      <a-dropdown trigger="click" position="br">
        <button class="user-name-btn">
          <span class="name">{{ accountText }}</span>
          <img :src="assetPath('/figma/3971_1105/6.svg')" alt="展开" class="name-arrow" />
        </button>

        <template #content>
          <div class="user-dropdown">
            <div class="user-dropdown__main">
              <div class="user-dropdown__name">{{ displayName }}</div>
              <div class="user-dropdown__sub">{{ accountText }}</div>
              <div class="user-dropdown__sub">{{ departmentText }}</div>
              <div class="user-dropdown__role">{{ roleTag }}</div>
            </div>
            <button class="user-dropdown__action" @click="goProfile">
              个人中心
            </button>
            <button class="user-dropdown__action user-dropdown__action--logout" @click="handleLogout">
              <img :src="assetPath('/figma/3971_1105/29.svg')" alt="退出" class="logout-icon" />
              <span>退出登录</span>
            </button>
          </div>
        </template>
      </a-dropdown>
    </div>
  </header>
</template>

<style scoped src="./styles/app-header.scss"></style>
