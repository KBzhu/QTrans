import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore } from '@/stores/auth'

const { loginMock, logoutMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  logoutMock: vi.fn(),
}))

vi.mock('@/api/auth', () => ({

  authApi: {
    login: loginMock,
    logout: logoutMock,
  },
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    loginMock.mockReset()
    logoutMock.mockReset()
  })

  it('login sets token and currentUser', async () => {
    loginMock.mockResolvedValueOnce({
      token: 'token-123',
      user: {
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
      },
    })

    const store = useAuthStore()
    await store.login({ model: { account: 'submitter', password: '123456', loginType: '2' } })

    expect(store.token).toBe('token-123')
    expect(store.currentUser?.username).toBe('submitter')
    expect(store.isLoggedIn).toBe(true)
  })

  it('logout clears state', async () => {
    logoutMock.mockResolvedValueOnce(null)

    const store = useAuthStore()
    store.token = 'token-abc'
    store.currentUser = {
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

    await store.logout()

    expect(store.token).toBe('')
    expect(store.currentUser).toBeNull()
  })

  it('hasRole returns correct boolean', () => {
    const store = useAuthStore()
    store.currentUser = {
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

    expect(store.hasRole('submitter')).toBe(true)
    expect(store.hasRole('admin')).toBe(false)
  })
})
