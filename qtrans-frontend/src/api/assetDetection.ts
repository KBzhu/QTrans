import type { KiaKeyFileItem, KiaResultCountResponse, SecretLevelItem } from '@/types/assetDetection'
import { request } from '@/utils'

export const assetDetectionApi = {
  /**
   * 查询关键资产统计
   * POST /workflowService/services/frontendService/frontend/kiaResult/findKiaResultCount
   */
  getKiaResultCount(applicationId: number | string): Promise<KiaResultCountResponse> {
    return request.raw<KiaResultCountResponse>(
      '/workflowService/services/frontendService/frontend/kiaResult/findKiaResultCount',
      { applicationId },
    )
  },

  /**
   * 查询关键资产列表
   * POST /workflowService/services/frontendService/frontend/kiaResult/findKiaResultKeyList
   */
  getKiaResultKeyList(applicationId: number | string): Promise<KiaKeyFileItem[]> {
    return request.raw<KiaKeyFileItem[]>(
      '/workflowService/services/frontendService/frontend/kiaResult/findKiaResultKeyList',
      { applicationId },
    )
  },

  /**
   * 查询密级枚举列表
   * GET /commonService/services/jalor/lookup/itemquery/listbycodes/KIA_TOOLS_SECURITY_LEVERL/{lang}
   */
  getSecretLevelList(lang = 'zh_CN'): Promise<SecretLevelItem[]> {
    return request.rawGet<Record<string, any[]>>(
      `/commonService/services/jalor/lookup/itemquery/listbycodes/KIA_TOOLS_SECURITY_LEVERL/${lang}`,
    ).then((data) => {
      const items = data?.KIA_TOOLS_SECURITY_LEVERL || []
      // 按 itemIndex 排序并转换为统一格式
      return items
        .sort((x, y) => x.itemIndex - y.itemIndex)
        .map(item => ({
          value: item.itemCode,
          label: item.itemName,
        }))
    })
  },
}
