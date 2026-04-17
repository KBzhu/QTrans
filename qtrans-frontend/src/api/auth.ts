import type { LoginResponse, SsoLoginResponse, User } from '@/types'
import { request } from '@/utils'

/**
 * 登录用户类型（usertype）
 * 与后端 loginType 保持一致，Number 格式供其他接口使用
 */
export const LOGIN_USER_TYPE = 2

/** 人员搜索结果项 */
export interface SuggestUserItem {
  userId: number
  userAccount: string
  employeeNumber: string
  displayNameCn: string
  dept: string
  userType: string
  email: string | null
}

/** 人员搜索响应 */
export interface SuggestUserResponse {
  status: boolean
  message: string | null
  result: SuggestUserItem[]
}

/** 统一登录系统 URL */
export const SSO_LOGIN_URL = 'https://10.90.37.157/usercenter/login'

/** 统一登录系统回调时 URL 中的 token 参数名 */
export const SSO_TOKEN_PARAM = 'token'

/** SSO 回调时 URL 中携带的用户信息参数名 */
export const SSO_USER_PARAMS = {
  userId: 'userId',
  account: 'account',
  name: 'name',
  email: 'email',
  deptCode: 'deptCode',
  groupName: 'groupName',
  isActive: 'isActive',
} as const

/**
 * 构建统一登录系统重定向 URL
 * @param redirectUrl 登录成功后回调的完整 URL
 */
export function buildSsoRedirectUrl(redirectUrl: string): string {
  return `${SSO_LOGIN_URL}?redirectUrl=${encodeURIComponent(redirectUrl)}`
}

/**
 * 将 SSO 响应中的 userDO 映射为系统内部 User 对象
 */
function mapSsoUserToUser(userDO: SsoLoginResponse['userDO'], account: string): User {
  return {
    id: String(userDO.id),
    username: userDO.account || account,
    name: userDO.name || '',
    email: userDO.email || '',
    phone: '',
    department: userDO.deptCode || '',
    departmentName: userDO.groupName || '',
    // SSO 不返回角色信息，默认赋予 submitter，角色由后端接口控制
    roles: ['submitter'],
    status: userDO.isActive !== false ? 'enabled' : 'disabled',
  }
}

export const authApi = {
  /**
   * 登录 - 调用统一登录系统后端接口
   * 接收 SSO 回调后携带的 token，调用后端获取用户信息
   */
  async login(params: { model: { account: string; password: string; loginType: string } }): Promise<LoginResponse> {
    const res = await request.raw<SsoLoginResponse>(
      '/service/v1/userCenter/authentication/login',
      params,
    )
    return {
      token: res.token || '',
      user: mapSsoUserToUser(res.userDO, params.model.account),
    }
  },

  /**
   * 从 SSO 回调的 URL 参数解析登录信息
   * SSO 重定向时将 token + 用户信息编码在 URL 参数中，无需额外接口调用
   */
  parseSsoCallback(query: Record<string, string | undefined>): LoginResponse {
    const token = query[SSO_TOKEN_PARAM] || ''
    const user: User = {
      id: query[SSO_USER_PARAMS.userId] || '',
      username: query[SSO_USER_PARAMS.account] || '',
      name: query[SSO_USER_PARAMS.name] || '',
      email: query[SSO_USER_PARAMS.email] || '',
      phone: '',
      department: query[SSO_USER_PARAMS.deptCode] || '',
      departmentName: query[SSO_USER_PARAMS.groupName] || '',
      roles: ['submitter'],
      status: query[SSO_USER_PARAMS.isActive] === '0' ? 'disabled' : 'enabled',
    }
    return { token, user }
  },

  logout(): Promise<null> {
    return request.post<null>('/auth/logout')
  },
  /**
   * 刷新 Token
   * 接口与之前相同，但响应格式已统一为 SSO 格式（{ token, userDO, ... }）
   */
  async refreshToken(): Promise<LoginResponse> {
    const res = await request.raw<SsoLoginResponse>(
      '/auth/refresh',
    )
    return {
      token: res.token || '',
      user: mapSsoUserToUser(res.userDO, res.userDO?.account || ''),
    }
  },
  getProfile(): Promise<User> {
    return request.get<User>('/auth/profile')
  },
  /**
   * 人员模糊查询
   * POST /workflowService/services/frontendService/frontend/suggestUser
   */
  async suggestUser(keyWord: string): Promise<SuggestUserItem[]> {
    const res = await request.raw<SuggestUserResponse>(
      '/workflowService/services/frontendService/frontend/suggestUser',
      { keyWord, userType: LOGIN_USER_TYPE },
    )
    return res?.result || []
  },
}
