import type { LoginResponse, User } from '@/types'
import { request } from '@/utils'

/**
 * 登录用户类型（usertype）
 * 与后端 loginType 保持一致，Number 格式供其他接口使用
 */
export const LOGIN_USER_TYPE = 2

/** 真实后端登录请求格式 */
interface RealLoginRequest {
  model: {
    account: string
    password: string
    loginType: string
  }
}

export const authApi = {
  /**
   * 登录 - 调用真实后端接口
   * TODO: 参数暂写死，后续改为动态传入
   */
  async login(): Promise<LoginResponse> {
    const payload: RealLoginRequest = {
      model: {
        account: 'ywx1420846',
        password: 'Fjtgyxa_006^',
        loginType: '2',
      },
    }
    // request.raw 返回的是响应拦截器处理后的 data 字段（即 token 字符串）
    const token = await request.raw<string>(
      '/service/v1/userCenter/authentication/login',
      payload,
    )
    return {
      token: token || '',
      user: {
        id: '1',
        username: 'ywx1420846',
        name: '测试用户',
        email: 'test@example.com',
        phone: '',
        department: '',
        departmentName: '',
        roles: ['submitter'],
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
}
