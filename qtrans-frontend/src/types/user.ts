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
  loginType: number
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

/** 统一登录系统响应中的 userDO 结构 */
export interface SsoUserDO {
  id: number
  createdId?: number
  updatedId?: number
  createdDate?: string
  updatedDate?: string
  account: string
  name: string
  loginType: number
  lastLoginDate?: string
  lastLoginIp?: string
  deptCode?: string
  groupName?: string
  isActive?: boolean
  email?: string
  expireTime?: string
}

/** 统一登录系统完整响应（rawClient 已解包 code/data 后） */
export interface SsoLoginResponse {
  token: string
  targetUrl: string | null
  uid: string | null
  userDO: SsoUserDO
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

