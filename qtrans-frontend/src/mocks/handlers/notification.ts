import { http } from 'msw'
import { getDemoState } from '../data/demo-init'
import { failed, mockDelay, success } from './_utils'

export const notificationHandlers = [
  http.get('/api/notifications', async ({ request }) => {
    await mockDelay(180)

    const state = getDemoState()
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    const list = userId
      ? state.notifications.filter(item => item.userId === userId)
      : state.notifications

    return success(list)
  }),

  http.put('/api/notifications/:id/read', async ({ params }) => {
    await mockDelay(120)

    const id = String(params.id)
    const state = getDemoState()
    const record = state.notifications.find(item => item.id === id)

    if (!record)
      return failed('通知不存在', 404)

    record.read = true
    return success(record, '已标记已读')
  }),

  http.put('/api/notifications/read-all', async ({ request }) => {
    await mockDelay(120)

    const payload = await request.json().catch(() => ({})) as { userId?: string }
    const state = getDemoState()

    state.notifications.forEach((item) => {
      if (!payload.userId || payload.userId === item.userId)
        item.read = true
    })

    return success(true, '已全部标记已读')
  }),
]
