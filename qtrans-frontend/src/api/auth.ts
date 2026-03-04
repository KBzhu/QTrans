import type { LoginRequest, LoginResponse, User } from '@/types'
import { request } from '@/utils'

export const authApi = {
  login(payload: LoginRequest): Promise<LoginResponse> {
    return request.post<LoginResponse>('/auth/login', payload)
  },
  logout(): Promise<null> {
    return request.post<null>('/auth/logout')
  },
  refreshToken(): Promise<{ token: string }> {
    return request.post<{ token: string }>('/auth/refresh')
  },
  getProfile(): Promise<User> {
    return request.get<User>('/auth/profile')
  },
}
