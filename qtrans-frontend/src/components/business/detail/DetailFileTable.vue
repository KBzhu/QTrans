<script setup lang="ts">
import type { DetailFileItem } from '@/types'
import { IconDownload, IconFile } from '@arco-design/web-vue/es/icon'
import { computed, ref } from 'vue'
import { formatFileSize, formatDateTime } from '@/utils'

interface Props {
  files: DetailFileItem[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

interface Emits {
  (e: 'download', file: DetailFileItem): void
  (e: 'batchDownload', fileIds: string[]): void
}

const emit = defineEmits<Emits>()
const selectedRowKeys = ref<string[]>([])

const rowSelection = computed(() => ({
  type: 'checkbox' as const,
  selectedRowKeys: selectedRowKeys.value,
  showCheckedAll: true,
}))

function onBatchDownload() {
  if (selectedRowKeys.value.length === 0)
    return

  emit('batchDownload', selectedRowKeys.value)
}
</script>

<template>
  <section class="detail-file-table">
    <a-table
      :data="files"
      :loading="loading"
      row-key="id"
      :pagination="false"
      :row-selection="rowSelection"
      @select="(keys: string[]) => selectedRowKeys = keys"
      @select-all="(checked: boolean) => selectedRowKeys = checked ? files.map(item => item.id) : []"
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

        <a-table-column title="上传时间" :width="200">
          <template #cell="{ record }">{{ formatDateTime(record.uploadedAt).replace(/-/g, '/') }}</template>
        </a-table-column>

        <a-table-column title="SHA256" :width="520" ellipsis tooltip>
          <template #cell="{ record }">
            <span class="detail-file-table__sha">{{ record.sha256 }}</span>
          </template>
        </a-table-column>

        <a-table-column title="操作" :width="100" align="center">
          <template #cell="{ record }">
            <a-button type="text" class="detail-file-table__action" @click="emit('download', record)">
              <IconDownload />
            </a-button>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <div class="detail-file-table__footer">
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
