import { request } from '@/utils'

/** 部门信息 */
export interface DeptItem {
  deptId: number
  deptCode: string
  parentId: number | null
  parentCode: string
  deptPath: string
  deptPathName: string | null
  deptName: string
  deptLevel: string | number
  remark?: string
  leaderList?: any[]
  parentDept?: DeptItem[] | null
  childrenDept?: DeptItem[] | null
}

/** 模糊查询部门响应 */
export interface SuggestDeptResponse {
  status: boolean
  message: string | null
  result: DeptItem[]
}

/** 用户部门信息（含完整路径） */
export interface UserDeptInfo {
  userId: number
  account: string
  name: string
  userType: number
  deptCode: string
  deptCodeDesc: string
  deptInfos: DeptItem[]
}

/** 根据用户账号查询部门信息响应 */
export interface SearchDeptByAccountResponse {
  data: UserDeptInfo
  code: number
  message: string | null
}

/** 根据部门Code查询下层部门响应 */
export interface GetSubDeptByCodeResponse {
  status: boolean
  message: string | null
  result: DeptItem[]
}

export const deptApi = {
  /**
   * 根据名称模糊查询部门
   * POST /workflowService/services/frontendService/frontend/org/suggestDept
   */
  suggestDept(deptName: string): Promise<SuggestDeptResponse> {
    return request.raw<SuggestDeptResponse>(
      '/workflowService/services/frontendService/frontend/org/suggestDept',
      { deptName },
    )
  },

  /**
   * 根据当前登录用户账号查询部门信息（含完整层级路径）
   * POST /user-center/api/v2/iam/user/search-dept-by-account
   */
  searchDeptByAccount(account: string, usertype: number): Promise<SearchDeptByAccountResponse> {
    return request.raw<SearchDeptByAccountResponse>(
      '/user-center/api/v2/iam/user/search-dept-by-account',
      { account, usertype },
    )
  },

  /**
   * 根据部门Code查询下层部门
   * POST /workflowService/services/frontendService/frontend/getSubDeptByCode
   */
  getSubDeptByCode(deptCode: string): Promise<GetSubDeptByCodeResponse> {
    return request.raw<GetSubDeptByCodeResponse>(
      '/workflowService/services/frontendService/frontend/getSubDeptByCode',
      { deptCode },
    )
  },
}
