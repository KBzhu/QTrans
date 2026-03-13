<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cities, type ProvinceCities, type CityItem, DEFAULT_CITY } from '@/mocks/data/cities'

interface Props {
  modelValue?: string[]
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  allowSearch?: boolean
  defaultToFirst?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  placeholder: '请选择省份/城市',
  disabled: false,
  allowClear: true,
  allowSearch: true,
  defaultToFirst: false,
})

interface Emits {
  (e: 'update:modelValue', value: string[]): void
  (e: 'change', value: string[], cityInfo: CityItem | null): void
}

const emit = defineEmits<Emits>()

// 将城市数据转换为 a-cascader 需要的格式
interface CascaderOption {
  label: string
  value: string
  children?: CascaderOption[]
}

const cascaderData = computed<CascaderOption[]>(() => {
  return cities.map(province => ({
    label: province.province,
    value: province.provinceCode,
    children: province.cities.map(city => ({
      label: city.name,
      value: city.code,
    })),
  }))
})

// 查找城市信息
function findCityInfo(provinceCode: string, cityCode: string): CityItem | null {
  const province = cities.find(p => p.provinceCode === provinceCode)
  if (!province) return null
  return province.cities.find(c => c.code === cityCode) || null
}

// 当前选中的值
const selectedValue = ref<string[]>(props.modelValue)

// 监听外部传入的值变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      selectedValue.value = newVal
    }
  },
  { immediate: true },
)

// 初始化默认城市
if (props.defaultToFirst && selectedValue.value.length === 0) {
  selectedValue.value = [...DEFAULT_CITY]
  emit('update:modelValue', selectedValue.value)
}

// 处理选择变化
function handleChange(value: string[] | undefined) {
  const newValue = Array.isArray(value) ? value : []
  selectedValue.value = newValue
  emit('update:modelValue', newValue)

  // 查找选中城市并触发 change 事件
  if (newValue.length >= 2) {
    const cityInfo = findCityInfo(newValue[0], newValue[1])
    emit('change', newValue, cityInfo)
  }
  else {
    emit('change', newValue, null)
  }
}
</script>

<template>
  <a-cascader
    :model-value="selectedValue"
    :options="cascaderData"
    :placeholder="placeholder"
    :disabled="disabled"
    :allow-clear="allowClear"
    :allow-search="allowSearch"
    path-mode
    class="city-selector"
    @change="handleChange"
  />
</template>

<style src="./CitySelector.scss" lang="scss" scoped />

