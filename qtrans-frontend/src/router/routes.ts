import type { RouteMeta, RouteRecordRaw } from 'vue-router'

import type { UserRole } from '@/types'

export type AppLayout = 'blank' | 'default'

export interface AppRouteMeta extends RouteMeta {

  requiresAuth?: boolean
  roles?: UserRole[]
  title: string
  icon?: string
  layout: AppLayout
  hidden?: boolean
}


const authRoles: UserRole[] = ['submitter', 'approver1', 'approver2', 'approver3', 'admin', 'partner', 'vendor', 'subsidiary']
const approverRoles: UserRole[] = ['approver1', 'approver2', 'approver3', 'admin']
const adminRoles: UserRole[] = ['admin']

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
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
    } as AppRouteMeta,
  },
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
    } as AppRouteMeta,
  },

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
    } as AppRouteMeta,
  },
]

export const menuRoutes = routes.filter((route) => {
  const meta = route.meta as AppRouteMeta | undefined
  return Boolean(route.name && meta?.layout === 'default' && !meta.hidden)
})
