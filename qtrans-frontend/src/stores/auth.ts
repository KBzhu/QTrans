import type { User, UserRole } from '@/types'
import { useIntervalFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { authApi } from '@/api/auth'
import { STORAGE_KEYS } from '@/utils/constants'

/** Token 刷新间隔：15 分钟 */
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000

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
  const isRefreshing = ref(false)

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

  /**
   * 刷新 Token
   * - 调用后端刷新接口获取新 token
   * - 刷新成功后更新本地存储
   * - 刷新失败则登出用户
   */
  async function refreshToken() {
    if (!token.value || isRefreshing.value)
      return

    isRefreshing.value = true
    try {
      const result = await authApi.refreshToken()
      token.value = result.token
      persistAuthState()
    }
    catch {
      // 刷新失败，登出用户
      await logout()
    }
    finally {
      isRefreshing.value = false
    }
  }

  // 使用 VueUse 的 useIntervalFn 实现定时刷新
  const { pause: pauseRefresh, resume: resumeRefresh, isActive } = useIntervalFn(
    refreshToken,
    TOKEN_REFRESH_INTERVAL,
    { immediate: false },
  )

  // 监听登录状态，自动启停刷新定时器
  watch(isLoggedIn, (loggedIn) => {
    if (loggedIn) {
      resumeRefresh()
    }
    else {
      pauseRefresh()
    }
  }, { immediate: true })

  /**
   * 登录 - 调用真实后端接口
   * TODO: 当前参数在 API 层写死，后续改为动态传入
   */
  async function login() {
    const result = await authApi.login()
    token.value = result.token
    currentUser.value = result.user
    persistAuthState()
    // 登录成功后启动刷新定时器（由 watch 自动处理）
    return result.user
  }

  async function logout() {
    try {
      await authApi.logout()
    }
    finally {
      pauseRefresh() // 停止刷新定时器
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
    isRefreshing,
    isTokenRefreshActive: isActive,
    login,
    logout,
    initAuth,
    hasRole,
    hasPermission,
    clearAuthState,
    refreshToken,
    pauseRefresh,
    resumeRefresh,
  }
}, {
  persist: {
    pick: ['token', 'currentUser'],
  },
})

