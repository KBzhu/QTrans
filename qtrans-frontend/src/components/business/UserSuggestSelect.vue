<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUserSuggest } from '@/composables/useUserSuggest'

interface Props {
  modelValue?: string | string[]
  placeholder?: string
  multiple?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: '请输入至少3个字符搜索人员',
  multiple: false,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[] | undefined): void
  (e: 'change', value: string | string[] | undefined): void
}>()

const { loading, options, search, clear, MIN_KEYWORD_LENGTH } = useUserSuggest()
const searchValue = ref('')

// 内部选中值
const selectedValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

// 下拉展开时的占位提示
const computedPlaceholder = computed(() => {
  if (searchValue.value.length > 0 && searchValue.value.length < MIN_KEYWORD_LENGTH) {
    return `还需输入 ${MIN_KEYWORD_LENGTH - searchValue.value.length} 个字符`
  }
  return props.placeholder
})

// 处理搜索输入
function handleSearch(val: string) {
  searchValue.value = val
  search(val)
}

// 处理选择变化
function handleChange(val: string | string[] | undefined) {
  selectedValue.value = val
}

// 处理下拉框关闭
function handlePopupVisibleChange(visible: boolean) {
  if (!visible) {
    clear()
    searchValue.value = ''
  }
}

// 监听 disabled 变化，清空搜索
watch(() => props.disabled, (val) => {
  if (val) {
    clear()
    searchValue.value = ''
  }
})
</script>

<template>
  <a-select
    :model-value="selectedValue"
    :options="options"
    :loading="loading"
    :disabled="disabled"
    :multiple="multiple"
    :placeholder="computedPlaceholder"
    :filter-option="false"
    allow-search
    allow-clear
    @search="handleSearch"
    @change="handleChange"
    @popup-visible-change="handlePopupVisibleChange"
  />
</template>
