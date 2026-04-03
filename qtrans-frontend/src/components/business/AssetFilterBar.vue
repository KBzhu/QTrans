<script setup lang="ts">
import { computed } from 'vue'
import { FILE_TYPE_MAP } from '@/constants/fileType'

const props = defineProps<{
  /** 当前选中的文件类型 */
  modelValue?: number
  /** 搜索关键字 */
  searchKeyword?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
  (e: 'update:searchKeyword', value: string | undefined): void
  (e: 'search'): void
  (e: 'reset'): void
}>()

// 文件类型选项
const fileTypeOptions = computed(() => {
  const options = Object.entries(FILE_TYPE_MAP).map(([value, label]) => ({
    value: Number(value),
    label,
  }))
  // 添加"全部"选项
  return [{ value: undefined, label: '全部类型' }, ...options]
})

// 本地搜索关键字
const localSearchKeyword = computed({
  get: () => props.searchKeyword || '',
  set: (val: string) => {
    emit('update:searchKeyword', val || undefined)
  },
})

// 本地选中的文件类型
const localFileType = computed({
  get: () => props.modelValue,
  set: (val: number | undefined) => {
    emit('update:modelValue', val)
  },
})

// 处理搜索
function handleSearch() {
  emit('search')
}

// 处理重置
function handleReset() {
  emit('update:modelValue', undefined)
  emit('update:searchKeyword', undefined)
  emit('reset')
}
</script>

<template>
  <div class="asset-filter-bar">
    <div class="asset-filter-bar__left">
      <a-select
        v-model="localFileType"
        placeholder="选择文件类型"
        style="width: 200px"
        allow-clear
      >
        <a-option
          v-for="option in fileTypeOptions"
          :key="option.value"
          :value="option.value"
          :label="option.label"
        />
      </a-select>
    </div>
    <div class="asset-filter-bar__right">
      <a-input-search
        v-model="localSearchKeyword"
        placeholder="搜索文件名"
        style="width: 240px"
        allow-clear
        @search="handleSearch"
        @press-enter="handleSearch"
      />
      <a-button @click="handleReset">
        重置
      </a-button>
    </div>
  </div>
</template>

<style lang="scss">
.asset-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f7f8fa;
  border-radius: 4px;

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}
</style>
