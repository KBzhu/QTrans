import type { User, UserStatus } from '@/types'
import { request } from '@/utils'

export interface UserQueryParams {
  keyword?: string
  role?: string
  department?: string
  status?: UserStatus
  pageNum?: number
  pageSize?: number
}

export interface CreateUserRequest {
  username: string
  name: string
  email: string
  phone: string
  department: string
  departmentName: string
  roles: string[]
  password?: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  phone?: string
  department?: string
  departmentName?: string
  roles?: string[]
}

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
