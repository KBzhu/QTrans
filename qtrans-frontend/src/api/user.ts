import type { CreateUserRequest, UpdateUserRequest, User, UserQueryParams, UserStatus } from '@/types'
import { request } from '@/utils'

export type { CreateUserRequest, UpdateUserRequest, UserQueryParams }



export const userApi = {
  getList(params?: UserQueryParams): Promise<User[]> {
    return request.get<User[]>('/users', { params })
  },
  create(data: CreateUserRequest): Promise<User> {
    return request.post<User>('/users', data)
  },
  update(id: string, data: UpdateUserRequest): Promise<User> {
    return request.put<User>(`/users/${id}`, data)
  },
  updateStatus(id: string, status: UserStatus): Promise<User> {
    return request.put<User>(`/users/${id}/status`, { status })
  },
  delete(id: string): Promise<boolean> {
    return request.delete<boolean>(`/users/${id}`)
  },
  resetPassword(id: string): Promise<{ tempPassword: string }> {
    return request.put<{ tempPassword: string }>(`/users/${id}/reset-password`)
  },
}
