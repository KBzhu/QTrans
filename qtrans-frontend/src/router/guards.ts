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

    if (isLoggedIn && to.path === '/login')
      return { path: getDefaultHome() }

    if (requiresAuth && !isLoggedIn) {
      return {
        path: '/login',
        query: {
          redirect: to.fullPath,
        },
      }
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
