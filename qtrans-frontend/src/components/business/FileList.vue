<script setup lang="ts">
import { IconDelete, IconDownload, IconEye } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import { computed } from 'vue'
import type { FileMeta } from '@/mocks/db'
import { formatFileSize } from '@/utils/format'
import dayjs from 'dayjs'
import './file-list.scss'

interface Props {
  applicationId: string
  mode?: 'upload' | 'download' | 'view'
  files?: FileMeta[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view',
  files: () => [],
  loading: false,
})

interface Emits {
  (e: 'delete', fileId: string): void
  (e: 'download', fileId: string): void
  (e: 'preview', fileId: string): void
}

const emit = defineEmits<Emits>()

const columns = computed(() => {
  const baseColumns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      width: 300,
      ellipsis: true,
      tooltip: true,
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      width: 120,
      slotName: 'fileSize',
    },
    {
      title: '上传时间',
      dataIndex: 'createTime',
      width: 180,
      slotName: 'createTime',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      slotName: 'status',
    },
  ]

  if (props.mode !== 'view') {
    baseColumns.push({
      title: '操作',
      slotName: 'action',
      width: 120,
    } as any)
  }

  return baseColumns
})

const totalSize = computed(() => {
  return props.files.reduce((sum, file) => sum + (file.fileSize || 0), 0)
})

const totalSizeText = computed(() => {
  return formatFileSize(totalSize.value)
})

function getStatusText(status: FileMeta['status']): string {
  const statusMap: Record<FileMeta['status'], string> = {
    pending: '待上传',
    uploading: '上传中',
    paused: '已暂停',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

function getStatusColor(status: FileMeta['status']): string {
  const colorMap: Record<FileMeta['status'], string> = {
    pending: 'gray',
    uploading: 'blue',
    paused: 'orange',
    completed: 'green',
    failed: 'red',
    cancelled: 'gray',
  }
  return colorMap[status] || 'gray'
}

function handleDelete(record: FileMeta) {
  emit('delete', record.fileId)
}

function handleDownload(record: FileMeta) {
  emit('download', record.fileId)
  Message.success(`开始下载 ${record.fileName}`)
}

function handlePreview(record: FileMeta) {
  emit('preview', record.fileId)
}

function formatTime(timestamp?: number): string {
  if (!timestamp)
    return '-'
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<template>
  <div class="file-list">
    <a-table
      :columns="columns"
      :data="files"
      :loading="loading"
      :pagination="false"
      :bordered="false"
      row-key="fileId"
    >
      <template #fileSize="{ record }">
        <span>{{ formatFileSize(record.fileSize) }}</span>
      </template>

      <template #createTime="{ record }">
        <span>{{ formatTime(record.createTime) }}</span>
      </template>

      <template #status="{ record }">
        <a-tag :color="getStatusColor(record.status)">
          {{ getStatusText(record.status) }}
        </a-tag>
      </template>

      <template #action="{ record }">
        <a-space>
          <!-- 上传模式：删除按钮 -->
          <a-button
            v-if="mode === 'upload' && record.status === 'pending'"
            type="text"
            size="small"
            status="danger"
            @click="handleDelete(record)"
          >
            <template #icon>
              <IconDelete />
            </template>
          </a-button>

          <!-- 下载模式：下载按钮 -->
          <a-button
            v-if="mode === 'download' && record.status === 'completed'"
            type="text"
            size="small"
            @click="handleDownload(record)"
          >
            <template #icon>
              <IconDownload />
            </template>
          </a-button>

          <!-- 查看模式：预览按钮 -->
          <a-button
            v-if="mode === 'view' && record.status === 'completed'"
            type="text"
            size="small"
            @click="handlePreview(record)"
          >
            <template #icon>
              <IconEye />
            </template>
          </a-button>
        </a-space>
      </template>

      <template #empty>
        <a-empty description="暂无文件">
          <template v-if="mode === 'upload'">
            <a-button type="primary">
              上传文件
            </a-button>
          </template>
        </a-empty>
      </template>
    </a-table>

    <!-- 文件总大小统计 -->
    <div v-if="files.length > 0" class="file-list__summary">
      <span>共 {{ files.length }} 个文件，总大小 {{ totalSizeText }}</span>
    </div>
  </div>
</template>
