export type NotificationType = 'system' | 'approval' | 'transfer'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  relatedId?: string
  read: boolean
  createdAt: string
}
