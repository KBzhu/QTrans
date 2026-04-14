import type { ApplicationFormData } from '@/composables/useApplicationForm'
import type { ApprovalRouteConfig } from './types'
import { computed, ref, watch } from 'vue'
import { applicationApi } from '@/api/application'
import { useRegionMetadataStore } from '@/stores'

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

type ApprovalRouteFormState = Pick<
  ApplicationFormData,
  | 'sourceArea'
  | 'targetArea'
  | 'securityLevel'
  | 'departmentId'
  | 'containsCustomerData'
  | 'directSupervisor'
  | 'approverLevel2'
  | 'approverLevel3'
  | 'approverLevel4'
>

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

function createEmptyConfig(): ApprovalRouteConfig {
  return {
    showDirectSupervisor: false,
    showApproverLevel2: false,
    showApproverLevel3: false,
    showApproverLevel4: false,
  }
}

function createEmptyApproverOptions(): ApproverOptions {
  return {
    level1: [],
    level2: [],
    level3: [],
    level4: [],
  }
}

/**
 * 转换审批人数据为选项格式
 */
function transformToOptions(approvers: Array<{ userAccount: string | null, userCN: string | null, approverTypeId: number }>): ApproverOptions {
  const options = createEmptyApproverOptions()

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
  getFormData: () => ApprovalRouteFormState,
  onUpdateFormData: (updates: Partial<ApplicationFormData>) => void,
) {
  const regionMetadataStore = useRegionMetadataStore()
  const loading = ref(false)
  const config = ref<ApprovalRouteConfig>(createEmptyConfig())

  /** 审批人选项（二/三/四层） */
  const approverOptions = ref<ApproverOptions>(createEmptyApproverOptions())
  let fetchVersion = 0

  const isHighToLow = computed(() => {
    // 根据 sourceArea 和 targetArea 判断是否是高密传低密
    const { sourceArea, targetArea } = getFormData()
    const highAreas = ['yellow', 'red']
    const lowAreas = ['green', 'external']
    return highAreas.includes(sourceArea) && lowAreas.includes(targetArea)
  })

  function syncApproverSelections(nextConfig: ApprovalRouteConfig, nextOptions: ApproverOptions) {
    const formData = getFormData()
    const updates: Partial<ApplicationFormData> = {}

    if (!nextConfig.showDirectSupervisor && formData.directSupervisor) {
      updates.directSupervisor = ''
    }

    const levelMappings = [
      { field: 'approverLevel2', visible: nextConfig.showApproverLevel2, options: nextOptions.level2 },
      { field: 'approverLevel3', visible: nextConfig.showApproverLevel3, options: nextOptions.level3 },
      { field: 'approverLevel4', visible: nextConfig.showApproverLevel4, options: nextOptions.level4 },
    ] as const

    levelMappings.forEach(({ field, visible, options }) => {
      const currentValue = formData[field] || ''
      const nextValue = visible
        ? (options.some(option => option.value === currentValue) ? currentValue : (options[0]?.value || ''))
        : ''

      if (currentValue !== nextValue) {
        updates[field] = nextValue
      }
    })

    if (Object.keys(updates).length > 0) {
      onUpdateFormData(updates)
    }
  }

  async function fetch() {
    const { securityLevel, departmentId, containsCustomerData } = getFormData()
    if (!securityLevel || !departmentId)
      return

    const fromId = regionMetadataStore.getFromId()
    const toId = regionMetadataStore.getToId()
    if (fromId === null || toId === null)
      return

    const currentFetchVersion = ++fetchVersion
    loading.value = true
    try {
      const [routeRes, approversRes] = await Promise.all([
        applicationApi.findApprovalRoute({
          procTypeId: '0',
          fromRegionTypeId: fromId,
          toRegionTypeId: toId,
          securityLevelId: securityLevel,
          isCustomerData: containsCustomerData === 'yes' ? 1 : 0,
          isUrgent: 0,
          deptId: departmentId,
          isContainLargeModel: 0,
        }),
        applicationApi.getAllApprovers({
          fromRegionTypeId: fromId,
          toRegionTypeId: toId,
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
      if (currentFetchVersion !== fetchVersion)
        return

      const first = routeRes?.result?.[0]
      const nextConfig = first
        ? {
            showDirectSupervisor: first.isManagerApproval === 1,
            showApproverLevel2: first.isManager2Approval === 1,
            showApproverLevel3: first.isManager3Approval === 1,
            showApproverLevel4: first.isManager4Approval === 1,
          }
        : createEmptyConfig()
      const nextApproverOptions = Array.isArray(approversRes)
        ? transformToOptions(approversRes)
        : createEmptyApproverOptions()

      config.value = nextConfig
      approverOptions.value = nextApproverOptions
      syncApproverSelections(nextConfig, nextApproverOptions)
    }
    catch {
      if (currentFetchVersion !== fetchVersion)
        return

      resetConfig()
      resetApproverOptions()
      clearApprovers()
    }
    finally {
      if (currentFetchVersion === fetchVersion)
        loading.value = false
    }
  }

  function resetConfig() {
    config.value = createEmptyConfig()
  }

  function resetApproverOptions() {
    approverOptions.value = createEmptyApproverOptions()
  }

  function clearApprovers() {
    const { directSupervisor, approverLevel2, approverLevel3, approverLevel4 } = getFormData()
    if (!directSupervisor && !approverLevel2 && !approverLevel3 && !approverLevel4)
      return

    onUpdateFormData({
      directSupervisor: '',
      approverLevel2: '',
      approverLevel3: '',
      approverLevel4: '',
    })
  }

  // 监听区域元数据和表单数据变化
  watch(
    [
      () => regionMetadataStore.metadata,
      () => getFormData().securityLevel || '',
      () => getFormData().departmentId || '',
      () => getFormData().containsCustomerData,
    ],
    ([, securityLevel, departmentId]) => {
      if (!securityLevel || !departmentId) {
        fetchVersion += 1
        loading.value = false
        resetConfig()
        resetApproverOptions()
        clearApprovers()
        return
      }

      void fetch()
    },
    { immediate: true },
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
