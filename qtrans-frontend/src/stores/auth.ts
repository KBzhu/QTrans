import type { User, UserRole } from '@/types'
import { useIntervalFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { authApi, buildSsoRedirectUrl } from '@/api/auth'
import { getDefaultHome } from '@/router/routes'
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

const authPersistKey = `auth:${import.meta.env.VITE_APP_TYPE || 'tenant'}`

export const useAuthStore = defineStore('auth', () => {

  const token = ref('')
  const currentUser = ref<User | null>(null)

  const isLoggedIn = computed(() => Boolean(token.value && currentUser.value))
  const userRoles = computed(() => currentUser.value?.roles || [])
  const isAdmin = computed(() => userRoles.value.includes('admin'))

  /** 清理认证状态（pinia 插件会自动清理 localStorage） */
  function clearAuthState() {
    token.value = ''
    currentUser.value = null
  }

  /**
   * 跳转到统一登录系统
   * @param redirectPath 登录成功后回调到本系统的路径，默认取当前页面完整 URL
   */
  function redirectToSso(redirectPath?: string) {
    const redirectUrl = redirectPath || window.location.href
    window.location.href = buildSsoRedirectUrl(redirectUrl)
  }

  /**
   * 登录 - 调用统一登录系统后端接口（保留兼容，但主流程不再使用）
   */
  async function login(params: any) {
    const result = await authApi.login(params)
    token.value = result.token
    currentUser.value = result.user
    return result.user
  }

  /**
   * 从 SSO 回调的 URL 参数登录
   * 统一登录系统回调时 URL 带有 token + 用户信息参数，直接解析存入 store
   */
  function loginBySsoCallback(query: Record<string, string | undefined>) {
    const result = authApi.parseSsoCallback(query)
    token.value = result.token
    currentUser.value = result.user
    return result.user
  }

  async function logout() {
    try {
      await authApi.logout()
    }
    finally {
      pauseRefresh()
      clearAuthState()
      // 重定向到统一登录系统
      // redirectUrl 必须指向 /login 页面（SSO 回调中转页），而非根路径
      // 这样 SSO 回调链路：SSO → /login → handleSsoCallback 解析 token → 跳转首页
      const baseUrl = window.location.origin + (import.meta.env.BASE_URL || '/')
      const loginCallbackUrl = new URL(baseUrl + 'login')
      loginCallbackUrl.searchParams.set('redirect', getDefaultHome())
      redirectToSso(loginCallbackUrl.toString())
    }
  }

  /**
   * 刷新 Token
   * 文件传输可能持续很久，需定时刷新避免 token 过期中断用户操作
   * 调用 getUserAuthority 接口延长后端 token 过期时间，接口不返回新 token
   */
  async function refreshToken() {
    if (!token.value) return
    try {
      await authApi.refreshToken()
    }
    catch {
      await logout()
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
    loginBySsoCallback,
    logout,
    hasRole,
    hasPermission,
    clearAuthState,
    refreshToken,
    pauseRefresh,
    resumeRefresh,
    isTokenRefreshActive: isActive,
    redirectToSso,
  }
}, {
  persist: {
    key: authPersistKey,
    storage: localStorage,

    pick: ['token', 'currentUser'],
    // 使用 serializer 确保 token 直接存储为字符串，user 存储为 JSON
    serializer: {
      serialize: (state) => {
        const obj: Record<string, unknown> = {}
        if (state.token)
          obj[STORAGE_KEYS.AUTH_TOKEN] = state.token
        if (state.currentUser)
          obj[STORAGE_KEYS.USER_INFO] = JSON.stringify(state.currentUser)
        return JSON.stringify(obj)
      },
      deserialize: (str) => {
        try {
          const obj = JSON.parse(str)
          const token = obj[STORAGE_KEYS.AUTH_TOKEN] || ''
          const userStr = obj[STORAGE_KEYS.USER_INFO]
          const currentUser = userStr ? JSON.parse(userStr) : null
          return { token, currentUser }
        }
        catch {
          return { token: '', currentUser: null }
        }
      },
    },
  },
})

