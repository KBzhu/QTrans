<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import type { UserRole } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const switching = ref(false)

const isDev = import.meta.env.MODE === 'development'

const roleNameMap: Record<string, string> = {
  submitter: '提交人',
  approver1: '一级审批',
  approver2: '二级审批',
  approver3: '三级审批',
  admin: '管理员',
}

const accounts = [
  { username: 'submitter', name: '张提交', role: 'submitter' as UserRole },
  { username: 'approver1', name: '王审批一', role: 'approver1' as UserRole },
  { username: 'approver2', name: '李审批二', role: 'approver2' as UserRole },
  { username: 'approver3', name: '赵审批三', role: 'approver3' as UserRole },
  { username: 'admin', name: '系统管理员', role: 'admin' as UserRole },
]

const currentRoleLabel = computed(() => {
  const role = authStore.currentUser?.roles?.[0]
  return role ? (roleNameMap[role] || role) : '未登录'
})

function getTagClass(role: string) {
  if (role === 'admin')
    return 'role-switcher__item-tag--admin'
  if (role.startsWith('approver'))
    return 'role-switcher__item-tag--approver'
  return 'role-switcher__item-tag--submitter'
}

async function switchRole(username: string) {
  if (switching.value)
    return

  switching.value = true
  try {
    await authStore.login(username, '123456')
    await router.push('/')
  }
  finally {
    switching.value = false
  }
}
</script>

<template>
  <div v-if="isDev" class="role-switcher">
    <span class="role-switcher__label">Demo</span>
    <a-dropdown trigger="click" position="br">
      <button class="role-switcher__trigger">
        <span>{{ currentRoleLabel }}</span>
        <a-spin v-if="switching" :size="12" class="role-switcher__spin" />
        <icon-down v-else class="role-switcher__arrow" />
      </button>
      <template #content>
        <a-doption
          v-for="account in accounts"
          :key="account.username"
          @click="switchRole(account.username)"
        >
          <div class="role-switcher__item">
            <span class="role-switcher__item-name">{{ account.name }}</span>
            <span :class="['role-switcher__item-tag', getTagClass(account.role)]">
              {{ roleNameMap[account.role] }}
            </span>
          </div>
        </a-doption>
      </template>
    </a-dropdown>
  </div>
</template>

<style scoped src="./styles/role-switcher.scss"></style>
