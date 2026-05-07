<script setup lang="ts">
import type { DetailFileItem } from '@/types'
import type { PaginationProps } from '@arco-design/web-vue'
import { IconDownload, IconFile } from '@arco-design/web-vue/es/icon'
import { ref, watch } from 'vue'
import { formatFileSize } from '@/utils'

interface Props {
  files: DetailFileItem[]
  loading?: boolean
  /** 是否显示下载按钮和批量下载区域 */
  showDownload?: boolean
  /** 分页配置，传入 false 则不显示分页 */
  pagination?: PaginationProps | false
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showDownload: false,
  pagination: false,
})

interface Emits {
  (e: 'download', file: DetailFileItem): void
  (e: 'batchDownload', files: DetailFileItem[]): void
  (e: 'pageChange', page: number, pageSize?: number): void
}

const emit = defineEmits<Emits>()
const selectedRowKeys = ref<string[]>([])

/** 行唯一 key 字段名，用于 row-key */
const ROW_KEY_FIELD = '_rowKey'

// 为每条数据注入唯一 key（id + fileName 组合，解决 hash 相同文件名不同时选中冲突）
const processedFiles = computed(() =>
  props.files.map((f) => ({ ...f, [ROW_KEY_FIELD]: `${f.id}::${f.fileName}` })),
)

// 数据或分页变更时清空选中
watch([() => props.files, () => props.pagination], () => {
  selectedRowKeys.value = []
})

const rowSelection = computed(() => ({
  type: 'checkbox' as const,
  selectedRowKeys: selectedRowKeys.value,
  showCheckedAll: true,
}))

function onSelectChange(keys: (string | number)[]) {
  selectedRowKeys.value = keys.map(String)
}

function onBatchDownload() {
  if (selectedRowKeys.value.length === 0)
    return
  const selected = processedFiles.value.filter(f => selectedRowKeys.value.includes(f[ROW_KEY_FIELD]))
  emit('batchDownload', selected)
}

function handlePageChange(page: number, pageSize?: number) {
  emit('pageChange', page, pageSize)
}
</script>

<template>
  <section class="detail-file-table">
    <a-table
      :data="processedFiles"
      :loading="props.loading"
      :row-key="ROW_KEY_FIELD"
      :pagination="props.pagination"
      :row-selection="rowSelection"
      @select="onSelectChange"
      @select-all="(checked: boolean) => selectedRowKeys = checked ? processedFiles.map(f => f[ROW_KEY_FIELD]) : []"
      @page-change="handlePageChange"
      @page-size-change="(pageSize: number) => handlePageChange(1, pageSize)"
    >
      <template #columns>
        <a-table-column title="文件名称" data-index="fileName" :width="360">
          <template #cell="{ record }">
            <div class="detail-file-table__name-cell">
              <IconFile class="detail-file-table__file-icon" />
              <span class="detail-file-table__name">{{ record.fileName }}</span>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="文件大小" :width="140">
          <template #cell="{ record }">{{ formatFileSize(record.fileSize) }}</template>
        </a-table-column>

        <a-table-column title="SHA256" :width="520" ellipsis tooltip>
          <template #cell="{ record }">
            <span class="detail-file-table__sha">{{ record.sha256 }}</span>
          </template>
        </a-table-column>

        <a-table-column title="操作" v-if="props.showDownload" :width="100" align="center">
          <template #cell="{ record }">
            <a-button
              type="text"
              class="detail-file-table__action"
              @click="emit('download', record)"
            >
              <IconDownload />
            </a-button>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <div v-if="props.showDownload" class="detail-file-table__footer">
      <a-button type="primary" :disabled="selectedRowKeys.length === 0" @click="onBatchDownload">
        <template #icon>
          <IconDownload />
        </template>
        批量下载  
      </a-button>
    </div>
  </section>
</template>

<style scoped lang="scss" src="./detail-file-table.scss"></style>
