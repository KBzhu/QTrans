import type { RouteMeta, RouteRecordRaw } from 'vue-router'

import type { UserRole } from '@/types'

export type AppLayout = 'blank' | 'default'
export type AppType = 'tenant' | 'admin'

export interface AppRouteMeta extends RouteMeta {

  requiresAuth?: boolean
  roles?: UserRole[]
  title: string
  icon?: string
  layout: AppLayout
  hidden?: boolean
  /** 路由所属面：tenant=租户面, admin=管理面, shared=两面共有 */
  appType?: AppType | 'shared'
}

const authRoles: UserRole[] = ['submitter', 'approver1', 'approver2', 'approver3', 'admin', 'partner', 'vendor', 'subsidiary']
const approverRoles: UserRole[] = ['approver1', 'approver2', 'approver3', 'admin']
const adminRoles: UserRole[] = ['admin']

/** 默认首页路径，按 appType 区分 */
const DEFAULT_HOME: Record<AppType, string> = {
  tenant: '/dashboard',
  admin: '/transfers',
}

/** 获取当前面默认首页 */
export function getDefaultHome(): string {
  const appType = (import.meta.env.VITE_APP_TYPE as AppType) || 'tenant'
  return DEFAULT_HOME[appType] || '/dashboard'
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: getDefaultHome(),
  },
  // ==================== 公共路由 (shared) ====================
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: {
      title: '登录',
      icon: 'icon-lock',
      layout: 'blank',
      requiresAuth: false,
      hidden: true,
      appType: 'shared',
    } as AppRouteMeta,
  },

  // TransWebService 上传下载页面（从外部跳转）
  {
    path: '/trans/upload',
    name: 'TransUpload',
    component: () => import('@/views/trans/TransUploadView.vue'),
    meta: {
      title: '文件上传',
      icon: 'icon-upload',
      layout: 'blank',
      requiresAuth: false,
      hidden: true,
      appType: 'shared',
    } as AppRouteMeta,
  },
  {
    path: '/trans/download',
    name: 'TransDownload',
    component: () => import('@/views/trans/TransDownloadView.vue'),
    meta: {
      title: '文件下载',
      icon: 'icon-download',
      layout: 'blank',
      requiresAuth: false,
      hidden: true,
      appType: 'shared',
    } as AppRouteMeta,
  },
  {
    path: '/trans/demo',
    name: 'TransFileTableDemo',
    component: () => import('@/views/trans/TransFileTableDemo.vue'),
    meta: {
      title: '组件演示 - TransFileTable',
      icon: 'icon-apps',
      layout: 'blank',
      requiresAuth: false,
      hidden: true,
      appType: 'shared',
    } as AppRouteMeta,
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: {
      title: '无权限',
      icon: 'icon-stop',
      layout: 'blank',
      requiresAuth: false,
      hidden: true,
      appType: 'shared',
    } as AppRouteMeta,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '页面不存在',
      icon: 'icon-question-circle',
      layout: 'blank',
      requiresAuth: false,
      hidden: true,
      appType: 'shared',
    } as AppRouteMeta,
  },

  // ==================== 租户面路由 (tenant) ====================
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: {
      title: '首页',
      icon: 'icon-home',
      layout: 'default',
      requiresAuth: true,
      roles: authRoles,
      appType: 'tenant',
    } as AppRouteMeta,
  },
  {
    path: '/transfer',
    name: 'Transfer',
    component: () => import('@/views/transfer/index.vue'),
    meta: {
      title: '传输申请',
      icon: 'icon-send',
      layout: 'default',
      requiresAuth: true,
      roles: authRoles,
      hidden: true,
      appType: 'tenant',
    } as AppRouteMeta,
  },
  {
    path: '/applications',
    name: 'ApplicationList',
    component: () => import('@/views/application/ApplicationListView.vue'),
    meta: {
      title: '我的申请单',
      icon: 'icon-file',
      layout: 'default',
      requiresAuth: true,
      roles: authRoles,
      appType: 'tenant',
    } as AppRouteMeta,
  },
  {
    path: '/downloads/pending',
    name: 'PendingDownloads',
    component: () => import('@/views/download/DownloadListView.vue'),
    meta: {
      title: '待我下载',
      icon: 'icon-download',
      layout: 'default',
      requiresAuth: true,
      roles: authRoles,
      appType: 'tenant',
    } as AppRouteMeta,
  },
  {
    path: '/application/select-type',
    name: 'SelectType',
    component: () => import('@/views/application/SelectTypeView.vue'),
    meta: {
      title: '选择传输类型',
      icon: 'icon-swap',
      layout: 'default',
      requiresAuth: true,
      roles: authRoles,
      hidden: true,
      appType: 'tenant',
    } as AppRouteMeta,
  },
  {
    path: '/application/create',
    name: 'CreateApplication',
    component: () => import('@/views/application/CreateApplicationView.vue'),
    meta: {
      title: '创建申请单',
      icon: 'icon-plus',
      layout: 'default',
      requiresAuth: true,
      roles: authRoles,
      hidden: true,
      appType: 'tenant',
    } as AppRouteMeta,
  },
  {
    path: '/application/:id',
    name: 'ApplicationDetail',
    component: () => import('@/views/application/ApplicationDetailView.vue'),
    meta: {
      title: '申请详情',
      icon: 'icon-file',
      layout: 'default',
      requiresAuth: true,
      roles: authRoles,
      hidden: true,
      appType: 'tenant',
    } as AppRouteMeta,
  },
  {
    path: '/approvals',
    name: 'ApprovalList',
    component: () => import('@/views/approvals/ApprovalListView.vue'),
    meta: {
      title: '审批管理',
      icon: 'icon-check-circle',
      layout: 'default',
      requiresAuth: true,
      roles: approverRoles,
      appType: 'tenant',
    } as AppRouteMeta,
  },
  {
    path: '/approvals/:id',
    name: 'ApprovalDetail',
    component: () => import('@/views/approvals/ApprovalDetailView.vue'),
    meta: {
      title: '审批详情',
      icon: 'icon-file',
      layout: 'default',
      requiresAuth: true,
      roles: approverRoles,
      hidden: true,
      appType: 'tenant',
    } as AppRouteMeta,
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
    meta: {
      title: '个人中心',
      icon: 'icon-user',
      layout: 'default',
      requiresAuth: true,
      roles: authRoles,
      hidden: true,
      appType: 'tenant',
    } as AppRouteMeta,
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/notifications/index.vue'),
    meta: {
      title: '通知中心',
      icon: 'icon-notification',
      layout: 'default',
      requiresAuth: true,
      roles: authRoles,
      hidden: true,
      appType: 'tenant',
    } as AppRouteMeta,
  },

  // ==================== 管理面路由 (admin) ====================
  {
    path: '/transfers',
    name: 'TransferList',
    component: () => import('@/views/transfers/index.vue'),
    meta: {
      title: '传输管理',
      icon: 'icon-folder',
      layout: 'default',
      requiresAuth: true,
      roles: adminRoles,
      appType: 'admin',
    } as AppRouteMeta,
  },
  {
    path: '/users',
    name: 'UserList',
    component: () => import('@/views/users/index.vue'),
    meta: {
      title: '用户管理',
      icon: 'icon-user-group',
      layout: 'default',
      requiresAuth: true,
      roles: adminRoles,
      appType: 'admin',
    } as AppRouteMeta,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/index.vue'),
    meta: {
      title: '系统配置',
      icon: 'icon-settings',
      layout: 'default',
      requiresAuth: true,
      roles: adminRoles,
      appType: 'admin',
    } as AppRouteMeta,
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('@/views/logs/index.vue'),
    meta: {
      title: '日志审计',
      icon: 'icon-list',
      layout: 'default',
      requiresAuth: true,
      roles: adminRoles,
      appType: 'admin',
    } as AppRouteMeta,
  },
  {
    path: '/region',
    name: 'Region',
    component: () => import('@/views/region/index.vue'),
    meta: {
      title: '区域管理',
      icon: 'icon-location',
      layout: 'default',
      requiresAuth: true,
      roles: adminRoles,
      appType: 'admin',
    } as AppRouteMeta,
  },
    {
      path: '/channels',
      name: 'Channels',
      component: () => import('@/views/channel/index.vue'),
      meta: {
        title: '传输通道管理',
        icon: 'icon-branches',
        layout: 'default',
        requiresAuth: true,
        roles: adminRoles,
        appType: 'admin',
      } as AppRouteMeta,
    },
    {
      path: '/ui-config',
      name: 'UIConfig',
      component: () => import('@/views/ui-config/index.vue'),
      meta: {
        title: '界面配置',
        icon: 'icon-computer',
        layout: 'default',
        requiresAuth: true,
        roles: adminRoles,
        appType: 'admin',
      } as AppRouteMeta,
    },
  ]

  /**
   * 根据 VITE_APP_TYPE 过滤路由，仅保留当前面 + 公共路由
   */
  export function filterRoutesByAppType(allRoutes: RouteRecordRaw[]): RouteRecordRaw[] {
    const appType = (import.meta.env.VITE_APP_TYPE as AppType) || 'tenant'

    return allRoutes.map((route) => {
      // redirect 路由（如 '/'）直接保留
      if (route.redirect) {
        return { ...route, redirect: getDefaultHome() }
      }

      const meta = route.meta as AppRouteMeta | undefined
      if (!meta || !meta.appType) {
        return route
      }

      // 仅保留 shared 或与当前 appType 匹配的路由
      if (meta.appType === 'shared' || meta.appType === appType) {
        return route
      }

      return null
    }).filter((route): route is RouteRecordRaw => route !== null)
  }

  /** 过滤后的路由列表 */
  export const filteredRoutes = filterRoutesByAppType(routes)

  /** 过滤后的菜单路由 */
  export const menuRoutes = filteredRoutes.filter((route) => {
    const meta = route.meta as AppRouteMeta | undefined
    return Boolean(route.name && meta?.layout === 'default' && !meta.hidden)
  })
