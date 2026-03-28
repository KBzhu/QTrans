/**
 * 前端表单数据 → 后端接口请求体 转换器
 * 用于创建申请单接口对接
 */

import type { ApplicationFormData } from '@/composables/useApplicationForm'
import { useAuthStore } from '@/stores'
import { areaToId } from '@/constants'

// 通知渠道映射: 应用号/W3代办/邮件 → 1/2/3
const NOTIFY_CHANNEL_MAP: Record<string, number> = {
  in_app: 1,
  w3: 2,
  email: 3,
}

/**
 * 转换通知选项为数组数字字符串
 * ['in_app', 'email'] → "[1,3]"
 */
function convertNotifyOptions(channels: string[]): string {
  const numbers = channels
    .map(ch => NOTIFY_CHANNEL_MAP[ch])
    .filter(n => n !== undefined)
  return JSON.stringify(numbers)
}

/**
 * 构建后端接口请求体
 * @param formData 前端表单数据
 * @returns 后端接口请求体
 */
export function buildCreatePayload(formData: ApplicationFormData): Record<string, any> {
  const authStore = useAuthStore()
  const user = authStore.currentUser

  // 获取当前用户W3账号
  const currentW3Account = user?.username || ''

  // 区域类型转换（使用统一常量）
  const fromRegionTypeId = areaToId(formData.sourceArea)
  const toRegionTypeId = areaToId(formData.targetArea)

  // 城市名称（中文）
  const fromCityName = formData.sourceCity[1] || formData.sourceCity[0] || ''
  const toCityName = formData.targetCity[1] || formData.targetCity[0] || ''

  return {
    appBaseApprovalRoute: {
      isCustomerData: formData.containsCustomerData === 'yes' ? 1 : 0,
      isContainLargeModel: 0,
      selectedDeptName: formData.department,  // 完整路径: "华为技术/2012实验室/星光工程部"
      defaultSecretLevels99: !formData.securityLevel,
      securityLevel: formData.securityLevel ? Number(formData.securityLevel) : 99,
      promiseLookupVO: {},
      isMinManagerApproval: 0,
      isManagerApproval: formData.directSupervisor ? 1 : 0,
      isManager4Approval: formData.approverLevel4 ? 1 : 0,
      isManager3Approval: formData.approverLevel3 ? 1 : 0,
      isManager2Approval: formData.approverLevel2 ? 1 : 0,
      isChiefApproval: 0,
      isInfoManagerApproval: 0,
      isManagerCopyApproval: formData.ccAccounts.length > 0 ? 1 : 0,
      isGuarantorApproval: 0,
      isCopyInfoManagerApproval: 0,
      isAbcManagerApproval: false,
      managerMinW3Account: formData.minDeptSupervisor || '',
      manager2W3Account: formData.approverLevel2 || '',
      manager3W3Account: formData.approverLevel3 || '',
      manager4W3Account: formData.approverLevel4 || '',
      managerInfoW3Account: '',
      managerChiefW3Account: '',
      managerW3Account: formData.directSupervisor || '',
      managerCopyW3Account: formData.ccAccounts.join(','),  // 多账号逗号拼接
      guarantorW3Account: '',
      managerInfoCopyW3Account: '',
      abcManagerW3Account: '',
      userDeptId: formData.departmentId || '',
      approvalRouteId: 6,
    },
    appBaseCountryCityRegionRelation: {
      toRegionTypeId,
      fromRegionTypeId,
      fromCityId: formData.sourceCityId || 0,
      fromRegionId: 6,  // 固定值：城市-安全域通道ID
      fromCityName,     // 中文城市名: "深圳"
      toCityId: formData.targetCityId || 0,
      toRegionId: 6,    // 固定值
      toCityName,       // 中文城市名: "西安"
    },
    appBaseInfo: {
      procType: '0',    // 流程类型: 0=正常传输, 1=例行通道, 5=紧急传输
      applicantW3Account: currentW3Account,
      isHttps: 0,
      applicationId: '',
      emailNotification: false,
      externalCode: formData.srNumber || '',
      uploadNotification: convertNotifyOptions(formData.applicantNotifyOptions),
      downloadNotification: convertNotifyOptions(formData.downloaderNotifyOptions),
      kiaConfirms: 0,
      policyed: false,
      reason: formData.applyReason,
      sendNotification: null,
    },
    appBaseUploadDownloadInfo: {
      uploadMode: 0,    // 上传模式: 0=WEB, 1=FTP
      downloadMode: 0,  // 下载模式: 0=WEB, 1=FTP
      downloadW3Account: formData.downloaderAccounts.join(','),  // 多账号逗号拼接
    },
    appBpmWorkFlow: {
      currentHandler: currentW3Account,
    },
    appBaseExternalInfo: {
      applicationType: 0,
      abc: false,
    },
    appTransInfo: {
      transferMode: 0,
    },
    appCustomerNetworkFiles: null,
    edsInfo: {},
  }
}
