import type { SecurityArea } from '@/composables/useApplicationForm'
import type { CitySelectionState } from './types'
import { ref, watch } from 'vue'
import { applicationApi } from '@/api/application'
import { useAuthStore } from '@/stores'
import { REGION_TYPE_MAP } from './constants'

export function useCitySelection(
  getFormData: () => { sourceArea: SecurityArea, targetArea: SecurityArea },
  onUpdateFormData: (updates: Partial<any>) => void,
) {
  const authStore = useAuthStore()

  const state = ref<CitySelectionState>({
    uploadCityOptions: [],
    downloadCityOptions: [],
    uploadCityLoading: false,
    downloadCityLoading: false,
    selectedUploadRegionId: 0,
  })

  async function fetchUploadCities() {
    const { sourceArea, targetArea } = getFormData()
    const from = REGION_TYPE_MAP[sourceArea]
    const to = REGION_TYPE_MAP[targetArea]
    if (from === undefined || to === undefined)
      return

    state.value.uploadCityLoading = true
    try {
      const res = await applicationApi.findUploadCity({
        fromRegionTypeId: from,
        toRegionTypeId: to,
        isInternetFtpUpload: 0,
        w3Account: authStore.currentUser?.username || '',
      })
      state.value.uploadCityOptions = res?.cityList || []

      // 自动选中第一个城市并触发联动
      const first = state.value.uploadCityOptions[0]
      if (first) {
        state.value.selectedUploadRegionId = first.regionId
        onUpdateFormData({
          sourceCity: [first.countryName, first.cityName],
          sourceCityId: first.cityId,
          targetCity: [],
          targetCityId: 0,
        })
        fetchDownloadCities(first.regionId)
      }
    }
    catch {
      state.value.uploadCityOptions = []
    }
    finally {
      state.value.uploadCityLoading = false
    }
  }

  async function fetchDownloadCities(uploadRegionId: number) {
    const { sourceArea, targetArea } = getFormData()
    const from = REGION_TYPE_MAP[sourceArea]
    const to = REGION_TYPE_MAP[targetArea]
    if (from === undefined || to === undefined)
      return

    state.value.downloadCityLoading = true
    try {
      const res = await applicationApi.findDownloadCity({
        uploadRegionId,
        fromRegionTypeId: from,
        toRegionTypeId: to,
        isInternetFtpUpload: 0,
        w3Account: authStore.currentUser?.username || '',
      })
      state.value.downloadCityOptions = res?.cityList || []

      const first = state.value.downloadCityOptions[0]
      if (first) {
        onUpdateFormData({
          targetCity: [first.countryName, first.cityName],
          targetCityId: first.cityId,
        })
      }
    }
    catch {
      state.value.downloadCityOptions = []
    }
    finally {
      state.value.downloadCityLoading = false
    }
  }

  function onSourceCityChange(value: { province: string, city: string, cityId: number, regionId: number }) {
    state.value.selectedUploadRegionId = value.regionId
    onUpdateFormData({
      sourceCity: [value.province, value.city],
      sourceCityId: value.cityId,
      targetCity: [],
      targetCityId: 0,
    })
    fetchDownloadCities(value.regionId)
  }

  function onTargetCityChange(value: { province: string, city: string, cityId: number }) {
    onUpdateFormData({
      targetCity: [value.province, value.city],
      targetCityId: value.cityId,
    })
  }

  // 监听区域变化
  watch(
    [
      () => getFormData().sourceArea,
      () => getFormData().targetArea,
    ],
    () => {
      state.value.uploadCityOptions = []
      state.value.downloadCityOptions = []
      state.value.selectedUploadRegionId = 0
      onUpdateFormData({
        sourceCity: [],
        sourceCityId: 0,
        targetCity: [],
        targetCityId: 0,
      })
      fetchUploadCities()
    },
    { immediate: true },
  )

  return {
    state,
    fetchUploadCities,
    fetchDownloadCities,
    onSourceCityChange,
    onTargetCityChange,
  }
}
