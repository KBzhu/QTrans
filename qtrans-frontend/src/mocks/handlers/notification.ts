import { baseHttp as http } from './_utils'
import { getDemoState } from '../data/demo-init'
import { failed, mockDelay, success } from './_utils'

function sortByCreatedAt<T extends { createdAt: string }>(list: T[]) {
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const notificationHandlers = [
  http.get('/api/notifications', async ({ request }) => {
    await mockDelay(180)

    const state = getDemoState()
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    const list = userId
      ? state.notifications.filter(item => item.userId === userId)
      : state.notifications

    return success(sortByCreatedAt(list))
  }),

  http.delete('/api/notifications/read-items', async ({ request }) => {
    await mockDelay(120)

    const state = getDemoState()
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const beforeCount = state.notifications.length

    state.notifications = state.notifications.filter((item) => {
      if (!item.read)
        return true

      return userId ? item.userId !== userId : false
    })

    return success(beforeCount - state.notifications.length, '已清空已读消息')
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

  http.delete('/api/notifications/:id', async ({ params }) => {
    await mockDelay(120)

    const id = String(params.id)
    const state = getDemoState()
    const recordIndex = state.notifications.findIndex(item => item.id === id)

    if (recordIndex < 0)
      return failed('通知不存在', 404)

    state.notifications.splice(recordIndex, 1)
    return success(true, '已删除通知')
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

