import type { SecurityArea } from '@/composables/useApplicationForm'
import type { ApprovalRouteConfig } from './types'
import { computed, ref, watch } from 'vue'
import { applicationApi } from '@/api/application'
import { HIGH_TO_LOW_PAIRS, REGION_TYPE_MAP } from './constants'

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
      const res = await applicationApi.findApprovalRoute({
        procTypeId: '0',
        fromRegionTypeId: from,
        toRegionTypeId: to,
        securityLevelId: securityLevel,
        isCustomerData: containsCustomerData === 'yes' ? 1 : 0,
        isUrgent: 0,
        deptId: departmentId,
        isContainLargeModel: 0,
      })

      const first = res?.result?.[0]
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
    }
    catch {
      resetConfig()
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
        clearApprovers()
      }
    },
    { immediate: false },
  )

  return {
    loading,
    config,
    isHighToLow,
    fetch,
    resetConfig,
  }
}
