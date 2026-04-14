import type { ApplicationFormData } from '@/composables/useApplicationForm'
import { computed, ref, watch } from 'vue'
import { applicationApi } from '@/api/application'
import { useRegionMetadataStore } from '@/stores'

type SecurityLevelFormState = Pick<ApplicationFormData, 'sourceArea' | 'targetArea' | 'securityLevel'>

export function useSecurityLevel(
  getFormData: () => SecurityLevelFormState,
  onUpdateFormData: (updates: Partial<ApplicationFormData>) => void,
) {
  const regionMetadataStore = useRegionMetadataStore()
  const options = ref<{ label: string, value: string }[]>([])
  const loading = ref(false)
  const displaySecretLevel = ref(false) // 是否显示密级选择
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
    const fromId = regionMetadataStore.getFromId()
    const toId = regionMetadataStore.getToId()
    if (fromId === null || toId === null)
      return

    const currentFetchVersion = ++fetchVersion
    loading.value = true
    try {
      const list = await applicationApi.findSecurityLevelList({
        fromRegionTypeId: fromId,
        toRegionTypeId: toId,
        isUrgent: 0,
        isContainSourceCode: 0,
        procType: '0',
        isContainLargeModel: 0,
      })
      if (currentFetchVersion !== fetchVersion)
        return

      // 判断是否显示密级选择（根据后端返回的 isDisplaySecretLevelControl）
      const shouldDisplay = (list || []).some((item: any) => item.isDisplaySecretLevelControl === 1)
      displaySecretLevel.value = shouldDisplay

      if (!shouldDisplay) {
        resetOptions()
        updateSecurityLevel(undefined)
        return
      }

      const nextOptions = (list || []).map((item: any) => ({
        value: item.securityLookupVO?.itemCode ?? '',
        label: item.securityLookupVO?.itemName ?? '',
      }))
      options.value = nextOptions

      const { securityLevel } = getFormData()
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
      displaySecretLevel.value = false
      updateSecurityLevel(undefined)
    }
    finally {
      if (currentFetchVersion === fetchVersion)
        loading.value = false
    }
  }

  // 监听区域变化，从 store 获取新的区域 ID
  watch(
    [
      () => regionMetadataStore.metadata,
    ],
    () => {
      void fetch()
    },
    { immediate: true },
  )

  return {
    options,
    loading,
    displaySecretLevel,
    fetch,
  }
}
