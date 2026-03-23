import type { SecurityArea } from '@/composables/useApplicationForm'
import { computed, ref, watch } from 'vue'
import { applicationApi } from '@/api/application'
import { HIGH_TO_LOW_PAIRS, REGION_TYPE_MAP } from './constants'

export function useSecurityLevel(
  getFormData: () => { sourceArea: SecurityArea, targetArea: SecurityArea },
  onUpdateFormData: (updates: Partial<any>) => void,
) {
  const options = ref<{ label: string, value: string }[]>([])
  const loading = ref(false)

  async function fetch() {
    const { sourceArea, targetArea } = getFormData()
    const from = REGION_TYPE_MAP[sourceArea]
    const to = REGION_TYPE_MAP[targetArea]
    if (from === undefined || to === undefined)
      return

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
      options.value = (list || []).map((item: any) => ({
        value: item.securityLookupVO?.itemCode ?? '',
        label: item.securityLookupVO?.itemName ?? '',
      }))

      // 自动选中第一个
      if (options.value[0]) {
        onUpdateFormData({ securityLevel: options.value[0].value })
      }
    }
    catch {
      options.value = []
    }
    finally {
      loading.value = false
    }
  }

  const isHighToLow = computed(() => {
    const { sourceArea, targetArea } = getFormData()
    const key = `${sourceArea}->${targetArea}`
    return HIGH_TO_LOW_PAIRS.has(key)
  })

  // 监听高密传低密状态
  watch(
    isHighToLow,
    (val) => {
      if (val) {
        fetch()
      }
      else {
        options.value = []
        onUpdateFormData({ securityLevel: undefined })
      }
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
