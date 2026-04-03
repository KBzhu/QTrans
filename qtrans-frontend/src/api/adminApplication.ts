import type { AdminApplicationQuery, AdminApplicationResponse } from '@/types'
import { request } from '@/utils'

/**
 * 管理员申请单管理 API
 * 对接真实后端接口
 */
export const adminApplicationApi = {
  /**
   * 获取申请单列表（分页）
   * GET /commonService/services/common/commonApplicationSearchService/getAuditApplicationByPage/{pageSize}/{curPage}
   */
  getList(params: AdminApplicationQuery): Promise<AdminApplicationResponse> {
    const { pageSize, pageNum, ...queryParams } = params
    const url = `/commonService/services/common/commonApplicationSearchService/getAuditApplicationByPage/${pageSize}/${pageNum}`

    // 构建查询参数（过滤掉 undefined 和空字符串）
    const searchParams = new URLSearchParams()
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        searchParams.append(key, String(value))
      }
    })

    const queryString = searchParams.toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url

    return request.rawGet<AdminApplicationResponse>(fullUrl)
  },
}
