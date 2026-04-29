import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { setupRouterGuards } from '@/router/guards'
import { useAuthStore } from '@/stores'

// 使用简单的模拟组件，避免加载包含SVG引用的真实组件
const MockComponent = { template: '<div>Mock</div>' }

const mockRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: MockComponent,
    meta: { title: '登录', layout: 'blank', requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: MockComponent,
    meta: { title: '首页', layout: 'default', requiresAuth: true },
  },
  {
    path: '/users',
    name: 'UserList',
    component: MockComponent,
    meta: { title: '用户管理', layout: 'default', requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: MockComponent,
    meta: { title: '无权限', layout: 'blank', requiresAuth: false },
  },
]

describe('RouterGuards', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('redirects to login when not authenticated', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: mockRoutes,
    })

    setupRouterGuards(router)

    await router.push('/dashboard')
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('redirects to 403 when role not allowed', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: mockRoutes,
    })

    setupRouterGuards(router)

    const authStore = useAuthStore()
    authStore.token = 'token-1'
    authStore.currentUser = {
      id: 'u_submitter',
      username: 'submitter',
      name: '张提交',
      email: 'submitter@demo.com',
      phone: '13800000001',
      department: 'dept-rd',
      departmentName: '研发部',
      roles: ['submitter'],
      status: 'enabled',
      loginType: 2,
    }

    await router.push('/users')
    expect(router.currentRoute.value.name).toBe('Forbidden')
  })
})
