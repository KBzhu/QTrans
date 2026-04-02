import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { Message } from '@arco-design/web-vue'

import type { ApiResponse } from '@/types'
import { useAuthStore } from '@/stores'
import { assetPath } from '@/utils/path'

const requestClient = axios.create({
  baseURL: assetPath(import.meta.env.VITE_API_BASE_URL || '/api'),
  timeout: 15000,
})

requestClient.interceptors.request.use((config) => {
  // 从 pinia store 读取 token（避免与持久化机制冲突）
  const authStore = useAuthStore()
  const token = authStore.token
  if (token)
    config.headers.token = token

  return config
})

requestClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const { code, message, data } = response.data
    if (code !== 200)
      return Promise.reject(new Error(message || '请求失败'))

    return data as unknown as AxiosResponse
  },

  (error: AxiosError) => {
    const status = error.response?.status

    if (status === 401) {
      // 通过 store 清理认证状态
      const authStore = useAuthStore()
      authStore.clearAuthState()
      const basePath = import.meta.env.BASE_URL || '/'
      if (!window.location.pathname.includes('/login'))
        window.location.href = `${basePath}login`
    }
    else if (status === 403) {
      const basePath = import.meta.env.BASE_URL || '/'
      window.location.href = `${basePath}403`
    }
    else if (status === 500) {
      Message.error('服务器异常，请稍后重试')
    }
    else {
      Message.error(error.message || '网络异常')
    }

    return Promise.reject(error)
  },
)

/**
 * 真实后端请求客户端
 * 用于调用真实后端接口，响应格式与 mock API 不同
 * 成功响应格式: { applicationId, isRedirectToUploadServer, uploadUrl, ... }
 * 错误响应格式: { code, httpCode, message, ... }
 */
const rawClient = axios.create({
  baseURL: '',
  timeout: 30000,
})

rawClient.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  const token = authStore.token
  if (token)
    config.headers.token = token

  if (config.url)
    config.url = assetPath(config.url)

  // 为 /commonService 文根的请求添加 Referer 头（本地调试需要）
  if (config.url?.includes('/commonService')) {
    config.headers.Referer = 'http://localhost.huawei.com'
  }

  return config
})

rawClient.interceptors.response.use(
  (response) => {
    const data = response.data
    // 检查是否是错误响应（有 code 字段且不是成功状态）
    if (data && typeof data.code === 'string' && data.code !== 'success' && data.code !== '0') {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    // 成功响应直接返回 data
    return data
  },
  (error: AxiosError<any>) => {
    // HTTP 错误处理
    const errorData = error.response?.data
    const message = errorData?.message || error.message || '网络异常'
    Message.error(message)
    return Promise.reject(new Error(message))
  },
)

export const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return requestClient.get<unknown, T>(url, config)
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return requestClient.post<unknown, T>(url, data, config)
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return requestClient.put<unknown, T>(url, data, config)
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return requestClient.delete<unknown, T>(url, config)
  },
  /**
   * 发送请求到真实后端（使用 rawClient 处理真实后端响应格式）
   * 用于调用真实后端接口，响应格式与 mock API 不同
   */
  raw<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return rawClient.post<unknown, T>(url, data, config)
  },
  /**
   * 发送 GET 请求到真实后端
   */
  rawGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return rawClient.get<unknown, T>(url, config)
  },
}
