import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import type { UserRole } from '@/types'
import { SSO_TOKEN_PARAM, SSO_USER_PARAMS } from '@/api/auth'

/** 所有 SSO 回调需要清除的 URL 参数名 */
const SSO_QUERY_PARAMS = [SSO_TOKEN_PARAM, ...Object.values(SSO_USER_PARAMS)]

function getDefaultRouteByRole(roles?: UserRole[]): string {
  const appType = import.meta.env.VITE_APP_TYPE as string || 'tenant'

  // 管理面所有角色都跳转到传输管理
  if (appType === 'admin')
    return '/transfers'

  // 租户面根据角色跳转
  if (!roles || roles.length === 0)
    return '/dashboard'

  const primary = roles[0]
  if (primary === 'submitter')
    return '/applications'
  if (primary?.startsWith('approver'))
    return '/approvals'
  if (primary === 'admin')
    return '/dashboard'

  return '/dashboard'
}

export function useLogin() {
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()

  const loading = ref(false)
  const errorMessage = ref('')

  /**
   * 处理 SSO 回调
   * 统一登录系统回调时 URL 上携带 token + 用户信息参数
   * 直接从 URL 解析，无需额外接口调用
   */
  function handleSsoCallback() {
    const ssoToken = (route.query[SSO_TOKEN_PARAM] as string) || ''

    if (!ssoToken) {
      // URL 上没有 token，说明不是 SSO 回调，跳转到统一登录系统
      authStore.redirectToSso()
      return
    }

    loading.value = true
    errorMessage.value = ''

    try {
      // 从 URL 参数直接解析 token + 用户信息
      const query = route.query as Record<string, string | undefined>
      const user = authStore.loginBySsoCallback(query)

      // 清除 URL 上的 SSO 参数，避免暴露在地址栏
      const cleanQuery = { ...route.query }
      for (const key of SSO_QUERY_PARAMS) {
        delete cleanQuery[key]
      }
      router.replace({ path: route.path, query: cleanQuery })

      // 跳转到目标页
      const redirect = cleanQuery.redirect as string | undefined
      if (redirect) {
        router.push(redirect)
      }
      else {
        const target = getDefaultRouteByRole(user.roles)
        router.push(target)
      }
    }
    catch {
      errorMessage.value = '登录失败，请重新登录'
      const cleanQuery = { ...route.query }
      for (const key of SSO_QUERY_PARAMS) {
        delete cleanQuery[key]
      }
      router.replace({ path: route.path, query: cleanQuery })
      setTimeout(() => authStore.redirectToSso(), 1500)
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    errorMessage,
    handleSsoCallback,
  }
}
