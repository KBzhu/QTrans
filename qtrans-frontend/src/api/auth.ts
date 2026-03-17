import type { LoginResponse, User } from '@/types'
import { request } from '@/utils'

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
  code: number
  message: string
  data: {
    token: string
    userInfo: Partial<User>
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
    const res = await request.raw<RealLoginResponse>(
      '/service/v1/userCenter/authentication/login',
      payload,
    )
    return {
      token: res.data.token,
      user: {
        id: res.data.userInfo.id || '1',
        username: res.data.userInfo.username || 'ywx1420846',
        name: res.data.userInfo.name || '测试用户',
        email: res.data.userInfo.email || 'test@example.com',
        phone: res.data.userInfo.phone || '',
        department: res.data.userInfo.department || '',
        departmentName: res.data.userInfo.departmentName || '',
        roles: (res.data.userInfo.roles as User['roles']) || ['submitter'],
        status: res.data.userInfo.status || 'enabled',
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
