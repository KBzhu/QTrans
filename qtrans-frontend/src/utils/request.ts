import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { Message } from '@arco-design/web-vue'

import type { ApiResponse } from '@/types'
import { STORAGE_KEYS } from './constants'

const requestClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

requestClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  if (token)
    config.headers.Authorization = `Bearer ${token}`

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
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      if (!window.location.pathname.includes('/login'))
        window.location.href = '/login'
    }
    else if (status === 403) {
      window.location.href = '/403'
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
   * 发送请求（跳过 baseURL，直接使用完整 URL）
   * 用于调用真实后端接口，不走 /api 前缀
   */
  raw<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return requestClient.post<unknown, T>(url, data, { ...config, baseURL: '' })
  },
}
