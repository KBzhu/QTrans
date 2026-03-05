import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { setupRouterGuards } from '@/router/guards'
import { routes } from '@/router/routes'
import { useAuthStore } from '@/stores'

describe('RouterGuards', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('redirects to login when not authenticated', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    setupRouterGuards(router)

    await router.push('/dashboard')
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('redirects to 403 when role not allowed', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
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
    }

    await router.push('/users')
    expect(router.currentRoute.value.name).toBe('Forbidden')
  })
})
