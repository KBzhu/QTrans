import type { SecurityArea } from '@/composables/useApplicationForm'
import type { ApprovalRouteConfig } from './types'
import { computed, ref, watch } from 'vue'
import { applicationApi } from '@/api/application'
import { HIGH_TO_LOW_PAIRS, REGION_TYPE_MAP } from './constants'

export interface ApproverOption {
  label: string
  value: string
  displayName: string
  userAccount: string
}

/** 审批人选项列表 */
export interface ApproverOptions {
  level1: ApproverOption[] // 直接主管（一层）
  level2: ApproverOption[] // 二层审批人
  level3: ApproverOption[] // 三层审批人
  level4: ApproverOption[] // 四层审批人
}

/**
 * 解析 userAccount 格式 "chenzhuo 00363421" -> { displayName, account }
 */
function parseUserAccount(userAccount: string): { displayName: string, account: string } {
  if (!userAccount) {
    return { displayName: '', account: '' }
  }
  const parts = userAccount.trim().split(/\s+/)
  if (parts.length >= 2) {
    return { displayName: parts[0]!, account: parts[1]! }
  }
  return { displayName: userAccount, account: userAccount }
}

/**
 * 转换审批人数据为选项格式
 */
function transformToOptions(approvers: Array<{ userAccount: string | null, userCN: string | null, approverTypeId: number }>): ApproverOptions {
  const options: ApproverOptions = {
    level1: [],
    level2: [],
    level3: [],
    level4: [],
  }

  approvers.forEach((item) => {
    if (!item.userAccount) return

    const { displayName, account } = parseUserAccount(item.userAccount)
    const option: ApproverOption = {
      label: `${displayName} / ${account}`,
      value: account,
      displayName,
      userAccount: account,
    }

    // approverTypeId: 0=一层, 1=二层, 2=三层, 3=四层
    switch (item.approverTypeId) {
      case 0:
        options.level1.push(option)
        break
      case 1:
        options.level2.push(option)
        break
      case 2:
        options.level3.push(option)
        break
      case 3:
        options.level4.push(option)
        break
    }
  })

  return options
}

export function useApprovalRoute(
  getFormData: () => {
    sourceArea: SecurityArea
    targetArea: SecurityArea
    securityLevel: string | undefined
    departmentId: string | undefined
    containsCustomerData: 'yes' | 'no'
  },
  onUpdateFormData: (updates: Partial<any>) => void,
) {
  const loading = ref(false)
  const config = ref<ApprovalRouteConfig>({
    showDirectSupervisor: false,
    showApproverLevel2: false,
    showApproverLevel3: false,
    showApproverLevel4: false,
  })

  /** 审批人选项（二/三/四层） */
  const approverOptions = ref<ApproverOptions>({
    level1: [],
    level2: [],
    level3: [],
    level4: [],
  })

  const isHighToLow = computed(() => {
    const { sourceArea, targetArea } = getFormData()
    const key = `${sourceArea}->${targetArea}`
    return HIGH_TO_LOW_PAIRS.has(key)
  })

  async function fetch() {
    const { sourceArea, targetArea, securityLevel, departmentId, containsCustomerData } = getFormData()
    if (!securityLevel || !departmentId)
      return

    const from = REGION_TYPE_MAP[sourceArea]
    const to = REGION_TYPE_MAP[targetArea]
    if (from === undefined || to === undefined)
      return

    loading.value = true
    try {
      // 并行调用两个接口
      const [routeRes, approversRes] = await Promise.all([
        applicationApi.findApprovalRoute({
          procTypeId: '0',
          fromRegionTypeId: from,
          toRegionTypeId: to,
          securityLevelId: securityLevel,
          isCustomerData: containsCustomerData === 'yes' ? 1 : 0,
          isUrgent: 0,
          deptId: departmentId,
          isContainLargeModel: 0,
        }),
        applicationApi.getAllApprovers({
          fromRegionTypeId: from,
          toRegionTypeId: to,
          procTypeId: '0',
          securityLevelId: securityLevel,
          isCustomerData: containsCustomerData === 'yes' ? 1 : 0,
          dpCode: departmentId,
          isUrgent: 0,
          redAreaId: 0,
          isContainLargeModel: 0,
          applicationId: '',
        }),
      ])

      // 处理审批层级配置
      const first = routeRes?.result?.[0]
      if (first) {
        config.value = {
          showDirectSupervisor: first.isManagerApproval === 1,
          showApproverLevel2: first.isManager2Approval === 1,
          showApproverLevel3: first.isManager3Approval === 1,
          showApproverLevel4: first.isManager4Approval === 1,
        }
      }
      else {
        resetConfig()
      }

      // 处理审批人选项
      if (approversRes && Array.isArray(approversRes)) {
        approverOptions.value = transformToOptions(approversRes)

        // 自动选中第一个审批人（二/三/四层）
        const autoSelect: Record<string, string> = {}
        const level2First = approverOptions.value.level2[0]
        if (level2First) {
          autoSelect.approverLevel2 = level2First.value
        }
        const level3First = approverOptions.value.level3[0]
        if (level3First) {
          autoSelect.approverLevel3 = level3First.value
        }
        const level4First = approverOptions.value.level4[0]
        if (level4First) {
          autoSelect.approverLevel4 = level4First.value
        }
        if (Object.keys(autoSelect).length > 0) {
          onUpdateFormData(autoSelect)
        }
      }
      else {
        resetApproverOptions()
      }
    }
    catch {
      resetConfig()
      resetApproverOptions()
    }
    finally {
      loading.value = false
    }
  }

  function resetConfig() {
    config.value = {
      showDirectSupervisor: false,
      showApproverLevel2: false,
      showApproverLevel3: false,
      showApproverLevel4: false,
    }
  }

  function resetApproverOptions() {
    approverOptions.value = {
      level1: [],
      level2: [],
      level3: [],
      level4: [],
    }
  }

  function clearApprovers() {
    onUpdateFormData({
      directSupervisor: '',
      approverLevel2: '',
      approverLevel3: '',
      approverLevel4: '',
    })
  }

  // 监听密级变化
  watch(
    () => getFormData().securityLevel,
    (val) => {
      if (val && isHighToLow.value) {
        fetch()
      }
      else {
        resetConfig()
        resetApproverOptions()
        clearApprovers()
      }
    },
    { immediate: false },
  )

  return {
    loading,
    config,
    approverOptions,
    isHighToLow,
    fetch,
    resetConfig,
    resetApproverOptions,
  }
}
