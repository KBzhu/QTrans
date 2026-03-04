import type { User, UserStatus } from '@/types'
import { http } from 'msw'
import { getDemoState } from '../data/demo-init'
import { failed, mockDelay, success } from './_utils'

function withoutPassword(user: ReturnType<typeof getDemoState>['users'][number]): User {
  const { password: _, ...safeUser } = user
  return safeUser
}

export const userHandlers = [
  http.get('/api/users', async ({ request }) => {
    await mockDelay(200)

    const state = getDemoState()
    const url = new URL(request.url)
    const keyword = (url.searchParams.get('keyword') || '').trim().toLowerCase()

    const list = state.users
      .filter((item) => {
        if (!keyword)
          return true

        return [item.username, item.name, item.email, item.departmentName]
          .some(field => field.toLowerCase().includes(keyword))
      })
      .map(withoutPassword)

    return success(list)
  }),

  http.post('/api/users', async ({ request }) => {
    await mockDelay(250)

    const payload = await request.json() as Partial<User> & { password?: string }
    const state = getDemoState()

    if (!payload.username)
      return failed('用户名不能为空', 400)

    const existed = state.users.some(item => item.username === payload.username)
    if (existed)
      return failed('用户名已存在', 409)

    const now = new Date().toISOString()
    const created = {
      id: `u_${Date.now()}`,
      username: payload.username,
      password: payload.password || '123456',
      name: payload.name || payload.username,
      email: payload.email || `${payload.username}@qtrans.demo`,
      phone: payload.phone || '',
      department: payload.department || 'dept-it',
      departmentName: payload.departmentName || 'IT部',
      roles: payload.roles || ['submitter'],
      status: payload.status || 'enabled',
      createdAt: now,
      updatedAt: now,
    }

    state.users.unshift(created)
    return success(withoutPassword(created), '创建成功')
  }),

  http.put('/api/users/:id', async ({ params, request }) => {
    await mockDelay(250)

    const id = String(params.id)
    const payload = await request.json() as Partial<User>
    const state = getDemoState()
    const index = state.users.findIndex(item => item.id === id)

    if (index < 0)
      return failed('用户不存在', 404)

    const patch = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<User>
    const current = state.users[index]

    if (!current)
      return failed('用户不存在', 404)

    Object.assign(current, patch, {
      id,
      updatedAt: new Date().toISOString(),
    })

    return success(withoutPassword(current), '更新成功')


  }),


  http.put('/api/users/:id/status', async ({ params, request }) => {
    await mockDelay(150)

    const id = String(params.id)
    const payload = await request.json() as { status: UserStatus }
    const state = getDemoState()
    const user = state.users.find(item => item.id === id)

    if (!user)
      return failed('用户不存在', 404)

    user.status = payload.status || 'enabled'
    user.updatedAt = new Date().toISOString()

    return success(withoutPassword(user), '状态已更新')
  }),
]
