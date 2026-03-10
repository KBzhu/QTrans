import { request } from '@/utils'

/**
 * 系统配置 API
 */
export const systemConfigApi = {
  /**
   * 获取配置
   */
  getConfig: (tab: string) => request.get(`/system-config/${tab}`),

  /**
   * 更新配置
   */
  updateConfig: (tab: string, data: any) => request.put(`/system-config/${tab}`, data)
}

