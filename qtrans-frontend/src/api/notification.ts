import type { Notification } from '@/types'
import { request } from '@/utils'

export const notificationApi = {
  getList(userId?: string): Promise<Notification[]> {
    return request.get<Notification[]>('/notifications', {
      params: userId ? { userId } : undefined,
    })
  },
  markAsRead(id: string): Promise<Notification> {
    return request.put<Notification>(`/notifications/${id}/read`)
  },
  markAllAsRead(userId?: string): Promise<boolean> {
    return request.put<boolean>('/notifications/read-all', userId ? { userId } : {})
  },
  delete(id: string): Promise<boolean> {
    return request.delete<boolean>(`/notifications/${id}`)
  },
  clearRead(userId?: string): Promise<number> {
    return request.delete<number>('/notifications/read-items', {
      params: userId ? { userId } : undefined,
    })
  },
}

