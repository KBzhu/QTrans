import type { ApplicationFormData } from '@/composables/useApplicationForm'
import { computed, ref, watch } from 'vue'
import { applicationApi } from '@/api/application'
import { HIGH_TO_LOW_PAIRS, REGION_TYPE_MAP } from './constants'

type SecurityLevelFormState = Pick<ApplicationFormData, 'sourceArea' | 'targetArea' | 'securityLevel'>

export function useSecurityLevel(
  getFormData: () => SecurityLevelFormState,
  onUpdateFormData: (updates: Partial<ApplicationFormData>) => void,
) {
  const options = ref<{ label: string, value: string }[]>([])
  const loading = ref(false)
  let fetchVersion = 0

  function resetOptions() {
    options.value = []
  }

  function updateSecurityLevel(nextSecurityLevel: string | undefined) {
    if (getFormData().securityLevel === nextSecurityLevel)
      return

    onUpdateFormData({ securityLevel: nextSecurityLevel })
  }

  async function fetch() {
    const { sourceArea, targetArea, securityLevel } = getFormData()
    const from = REGION_TYPE_MAP[sourceArea]
    const to = REGION_TYPE_MAP[targetArea]
    if (from === undefined || to === undefined)
      return

    const currentFetchVersion = ++fetchVersion
    loading.value = true
    try {
      const list = await applicationApi.findSecurityLevelList({
        fromRegionTypeId: from,
        toRegionTypeId: to,
        isUrgent: 0,
        isContainSourceCode: 0,
        procType: '0',
        isContainLargeModel: 0,
      })
      if (currentFetchVersion !== fetchVersion)
        return

      const nextOptions = (list || []).map((item: any) => ({
        value: item.securityLookupVO?.itemCode ?? '',
        label: item.securityLookupVO?.itemName ?? '',
      }))
      options.value = nextOptions

      const hasCurrentValue = Boolean(
        securityLevel
        && nextOptions.some(item => item.value === securityLevel),
      )
      updateSecurityLevel(hasCurrentValue ? securityLevel : nextOptions[0]?.value)
    }
    catch {
      if (currentFetchVersion !== fetchVersion)
        return

      resetOptions()
      updateSecurityLevel(undefined)
    }
    finally {
      if (currentFetchVersion === fetchVersion)
        loading.value = false
    }
  }

  const isHighToLow = computed(() => {
    const { sourceArea, targetArea } = getFormData()
    const key = `${sourceArea}->${targetArea}`
    return HIGH_TO_LOW_PAIRS.has(key)
  })

  watch(
    [
      () => getFormData().sourceArea,
      () => getFormData().targetArea,
    ],
    ([sourceArea, targetArea]) => {
      if (!HIGH_TO_LOW_PAIRS.has(`${sourceArea}->${targetArea}`)) {
        fetchVersion += 1
        loading.value = false
        resetOptions()
        updateSecurityLevel(undefined)
        return
      }

      void fetch()
    },
    { immediate: true },
  )

  return {
    options,
    loading,
    isHighToLow,
    fetch,
  }
}

