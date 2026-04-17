import type { Router } from 'vue-router'
import type { UserRole } from '@/types'
import { useAuthStore } from '@/stores'
import { getDefaultHome } from './routes'
import type { AppRouteMeta } from './routes'


function hasAnyRole(roles: UserRole[] | undefined, userRoles: UserRole[]): boolean {
  if (!roles || roles.length === 0)
    return true

  return roles.some(role => userRoles.includes(role))
}

export function setupRouterGuards(router: Router) {
  router.beforeEach((to) => {
    const authStore = useAuthStore()

    // pinia-plugin-persistedstate 会自动恢复状态，无需手动 initAuth
    const isLoggedIn = authStore.isLoggedIn
    const requiresAuth = to.meta.requiresAuth === true
    const meta = to.meta as AppRouteMeta
    const appType = import.meta.env.VITE_APP_TYPE as string || 'tenant'

    // 已登录用户访问 /login 页面（SSO 回调中转页），放行由 LoginView 处理
    if (isLoggedIn && to.path === '/login')
      return { path: getDefaultHome() }

    if (requiresAuth && !isLoggedIn) {
      // 未登录：重定向到统一登录系统
      // redirectUrl 指向 QTrans 的 /login 页，并带 redirect 参数记录原始目标页
      // 这样 SSO 回调链路：SSO → /login?token=xxx&redirect=/dashboard → handleSsoCallback 处理 token 后跳转
      const loginUrl = new URL(window.location.origin)
      loginUrl.pathname = (import.meta.env.BASE_URL || '/') + 'login'
      loginUrl.searchParams.set('redirect', to.fullPath)
      authStore.redirectToSso(loginUrl.toString())
      return false // 阻止路由跳转，等待 SSO 重定向
    }

    // appType 兜底检查：确保不能访问其他面的路由
    if (meta?.appType && meta.appType !== 'shared' && meta.appType !== appType) {
      return { path: getDefaultHome() }
    }

    const roles = to.meta.roles as UserRole[] | undefined
    if (requiresAuth && !hasAnyRole(roles, authStore.userRoles))
      return { path: '/403' }

    const pageTitle = typeof to.meta.title === 'string' ? to.meta.title : 'QTrans'
    document.title = `${pageTitle} - ${import.meta.env.VITE_APP_TITLE || 'QTrans'}`

    return true
  })


}
