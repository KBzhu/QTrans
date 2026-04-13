import type { LoginResponse, User } from '@/types'
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

/** 真实后端登录请求格式 */
interface RealLoginRequest {
  model: {
    account: string
    password: string
    loginType: string
  }
}

/** 真实后端登录响应格式 */
interface RealLoginResponse {
  data: {
    token: string
  }
}

export const authApi = {
  /**
   * 登录 - 调用真实后端接口
   * TODO: 参数暂写死，后续改为动态传入
   */
  async login(params: RealLoginRequest): Promise<LoginResponse> {
    const res = await request.raw<RealLoginResponse>(
      '/service/v1/userCenter/authentication/login',
      params,
    )
    return {
      token: res.data.token || '',
      user: {
        id: '1',
        username: params.model.account,
        name: '测试用户',
        email: 'test@example.com',
        phone: '',
        department: '',
        departmentName: '',
        roles: ['admin'],
        status: 'enabled',
      },
    }
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
