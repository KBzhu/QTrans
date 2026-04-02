import type { LoginRequest } from '@/types'
import { baseHttp as http } from './_utils'
import { getDemoState } from '../data/demo-init'
import { failed, mockDelay, success } from './_utils'

function withoutPassword(user: (typeof getDemoState extends () => infer T ? T : never)['users'][number]) {
  const { password: _, ...safeUser } = user
  return safeUser
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await mockDelay(500)

    const payload = await request.json() as LoginRequest
    const state = getDemoState()
    const user = state.users.find(item => item.username === payload.username && item.password === payload.password)

    if (!user)
      return failed('账号或密码错误', 401)

    if (user.status !== 'enabled')
      return failed('账号已禁用', 403)

    return success({
      token: `mock-token-${user.id}-${Date.now()}`,
      user: withoutPassword(user),
    })
  }),

  http.post('/api/auth/logout', async () => {
    await mockDelay(200)
    return success(null)
  }),

  http.post('/api/auth/refresh', async () => {
    await mockDelay(200)
    return success({ token: `mock-token-refresh-${Date.now()}` })
  }),

  http.get('/api/auth/profile', async ({ request }) => {
    await mockDelay(150)
    const state = getDemoState()
    const auth = request.headers.get('authorization')

    if (!auth)
      return failed('未登录', 401)

    const userId = auth.split('-')[2]
    const user = state.users.find(item => item.id === userId) || state.users[0]

    if (!user)
      return failed('用户不存在', 404)

    return success(withoutPassword(user))
  }),

]
