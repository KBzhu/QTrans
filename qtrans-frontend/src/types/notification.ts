export type NotificationType = 'system' | 'approval' | 'transfer'
export type NotificationSource = 'mock' | 'local'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  relatedId?: string
  read: boolean
  createdAt: string
  source?: NotificationSource
}

