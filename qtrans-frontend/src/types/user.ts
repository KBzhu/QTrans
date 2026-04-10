import type { StatusEnum } from './common'

export type UserRole =
  | 'submitter'
  | 'approver1'
  | 'approver2'
  | 'approver3'
  | 'admin'
  | 'partner'
  | 'vendor'
  | 'subsidiary'

export type UserStatus = StatusEnum

export interface User {
  id: string
  username: string
  name: string
  email: string
  phone: string
  department: string
  departmentName: string
  roles: UserRole[]
  status: UserStatus
  createdAt?: string
  updatedAt?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface UserQueryParams {
  keyword?: string
  role?: UserRole
  department?: string
  status?: UserStatus | ''
}

export interface CreateUserRequest {
  username: string
  name: string
  email: string
  phone: string
  department: string
  departmentName: string
  roles: UserRole[]
  password?: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  phone?: string
  department?: string
  departmentName?: string
  roles?: UserRole[]
  status?: UserStatus
}

