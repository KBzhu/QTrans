<script setup lang="ts">
import { computed } from 'vue'
import type { CityItem } from '@/api/application'

interface Props {
  modelValue?: string[]
  options?: CityItem[]
  loading?: boolean
  disabled?: boolean
}

const props = defineProps<Props>()

interface Emits {
  (e: 'change', value: { province: string; city: string; cityId: number; regionId: number }): void
}

const emit = defineEmits<Emits>()

const selectOptions = computed(() =>
  (props.options || []).map(c => ({ label: c.cityName, value: String(c.cityId) })),
)

// 根据 modelValue[1]（城市名）反查当前选中的 cityId
const selectedCityId = computed(() => {
  const cityName = props.modelValue?.[1]
  if (!cityName || !props.options) return undefined
  const found = props.options.find(c => c.cityName === cityName)
  return found ? String(found.cityId) : undefined
})

function onChange(val: string) {
  const city = props.options?.find(c => String(c.cityId) === val)
  if (!city) return
  emit('change', {
    province: city.countryName,
    city: city.cityName,
    cityId: city.cityId,
    regionId: city.regionId,
  })
}
</script>

<template>
  <a-select
    :model-value="selectedCityId"
    :options="selectOptions"
    :loading="loading"
    :disabled="disabled"
    placeholder="请选择城市"
    allow-search
    @change="onChange"
  />
</template>

<style scoped lang="scss">
</style>
