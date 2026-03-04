import type { User, UserRole } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth'
import { STORAGE_KEYS } from '@/utils/constants'

const permissionMap: Record<UserRole, string[]> = {
  submitter: ['application:create', 'application:update', 'application:submit'],
  approver1: ['approval:handle', 'application:read'],
  approver2: ['approval:handle', 'application:read'],
  approver3: ['approval:handle', 'application:read'],
  admin: ['*'],
  partner: ['application:read'],
  vendor: ['application:read'],
  subsidiary: ['application:read'],
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const currentUser = ref<User | null>(null)

  const isLoggedIn = computed(() => Boolean(token.value && currentUser.value))
  const userRoles = computed(() => currentUser.value?.roles || [])
  const isAdmin = computed(() => userRoles.value.includes('admin'))

  function persistAuthState() {
    if (token.value)
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token.value)

    if (currentUser.value)
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(currentUser.value))
  }

  function clearAuthState() {
    token.value = ''
    currentUser.value = null
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_INFO)
  }

  async function login(username: string, password: string) {
    const result = await authApi.login({ username, password })
    token.value = result.token
    currentUser.value = result.user
    persistAuthState()
    return result.user
  }

  async function logout() {
    try {
      await authApi.logout()
    }
    finally {
      clearAuthState()
      if (!window.location.pathname.includes('/login'))
        window.location.href = '/login'
    }
  }

  function initAuth() {
    const cachedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    const cachedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO)

    if (cachedToken)
      token.value = cachedToken

    if (cachedUser) {
      try {
        currentUser.value = JSON.parse(cachedUser) as User
      }
      catch {
        currentUser.value = null
      }
    }
  }

  function hasRole(role: UserRole): boolean {
    return userRoles.value.includes(role)
  }

  function hasPermission(permission: string): boolean {
    if (isAdmin.value)
      return true

    return userRoles.value.some((role) => {
      const rolePermissions = permissionMap[role] || []
      return rolePermissions.includes('*') || rolePermissions.includes(permission)
    })
  }

  return {
    token,
    currentUser,
    isLoggedIn,
    userRoles,
    isAdmin,
    login,
    logout,
    initAuth,
    hasRole,
    hasPermission,
    clearAuthState,
  }
}, {
  persist: {
    pick: ['token', 'currentUser'],
  },
})

