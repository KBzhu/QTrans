<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore, useNotificationStore } from '@/stores'

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
}>()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const roleSwitcherOptions = [
  { label: '提交人', value: 'submitter' },
  { label: '一级审批', value: 'approver1' },
  { label: '二级审批', value: 'approver2' },
  { label: '三级审批', value: 'approver3' },
  { label: '管理员', value: 'admin' },
] as const

const activeRole = computed(() => authStore.currentUser?.roles?.[0] || 'submitter')
const displayName = computed(() => authStore.currentUser?.name || authStore.currentUser?.username || '访客')

async function switchDemoRole(role: string) {
  await authStore.login(role, '123456')

  if (route.path === '/login')
    router.push('/dashboard')
}

async function goProfile() {
  await router.push('/profile')
}

async function goNotifications() {
  await router.push('/notifications')
}

async function handleLogout() {
  await authStore.logout()
}

onMounted(async () => {
  if (authStore.currentUser?.id)
    await notificationStore.fetchNotifications(authStore.currentUser.id)
})
</script>

<template>
  <header class="app-header">
    <div class="app-header__left">
      <button class="icon-btn" @click="emit('toggleSidebar')">☰</button>
      <div class="logo-box">
        <img src="/figma/3830_3/4.svg" alt="logo" class="logo-icon" />
      </div>
      <div class="title">文件传输系统</div>
    </div>

    <div class="app-header__right">
      <button class="notify-btn" @click="goNotifications">
        <img src="/figma/3830_3/5.svg" alt="通知" />
        <span v-if="notificationStore.unreadCount > 0" class="badge">{{ notificationStore.unreadCount }}</span>
      </button>

      <select :value="activeRole" class="role-switch" @change="switchDemoRole(($event.target as HTMLSelectElement).value)">
        <option v-for="option in roleSwitcherOptions" :key="option.value" :value="option.value">
          Demo切换：{{ option.label }}
        </option>
      </select>

      <div class="user-block">
        <span class="name">{{ displayName }}</span>
        <button class="text-btn" @click="goProfile">个人中心</button>
        <button class="text-btn danger" @click="handleLogout">退出</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(12px, 1.4vw, 20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
}

.app-header__left,
.app-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-btn {
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}

.logo-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ad46ff 0%, #00bba7 100%);
}

.logo-icon {
  width: 24px;
  height: 24px;
}

.title {
  font-size: clamp(16px, 1.3vw, 20px);
  font-weight: 700;
  background: linear-gradient(180deg, #9810fa 0%, #009689 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.notify-btn {
  position: relative;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: linear-gradient(135deg, #ad46ff 0%, #00bba7 50%, #2b7fff 100%);
}

.notify-btn img {
  width: 18px;
  height: 18px;
}

.badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #ef4444;
  color: #fff;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  font-size: 11px;
  display: grid;
  place-items: center;
  padding: 0 4px;
}

.role-switch {
  height: 32px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  padding: 0 8px;
  background: #fff;
}

.user-block {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  color: #0f172a;
  font-weight: 600;
}

.text-btn {
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  background: #e2e8f0;
  color: #0f172a;
  cursor: pointer;
}

.text-btn.danger {
  background: #fee2e2;
  color: #b91c1c;
}

@media (max-width: 1024px) {
  .role-switch {
    width: 140px;
  }

  .name {
    display: none;
  }
}

@media (max-width: 768px) {
  .title {
    display: none;
  }

  .user-block .text-btn:first-of-type {
    display: none;
  }
}
</style>
