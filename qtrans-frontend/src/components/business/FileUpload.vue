<script setup lang="ts">
import { IconDelete, IconPause, IconPlayArrow, IconRefresh, IconUpload } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import { computed, ref } from 'vue'
import { formatFileSize } from '@/utils/format'
import { MAX_CONCURRENT_UPLOADS, MAX_FILE_SIZE } from '@/utils/constants'
import { useFileStore } from '@/stores'
import { useFileUpload } from '@/composables/useFileUpload'
import './file-upload.scss'

interface Props {
  applicationId?: string
  maxSize?: number
  maxCount?: number
  accept?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  applicationId: '',
  maxSize: MAX_FILE_SIZE,
  maxCount: 20,
  accept: '*',
  disabled: false,
})

interface Emits {
  (e: 'upload-success', file: File, fileId: string): void
  (e: 'upload-error', file: File, error: Error): void
  (e: 'all-uploaded'): void
}

const emit = defineEmits<Emits>()

const fileStore = useFileStore()
const { uploadFile: uploadFileReal } = useFileUpload()

type FileStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'paused'

interface UploadFileItem {
  id: string
  file: File
  status: FileStatus
  progress: number
  speed: number // bytes per second
  error?: string
}

const fileList = ref<UploadFileItem[]>([])
const uploadingCount = computed(() => fileList.value.filter(item => item.status === 'uploading').length)
const completedCount = computed(() => fileList.value.filter(item => item.status === 'completed').length)
const hasCompleted = computed(() => completedCount.value > 0)

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const iconMap: Record<string, string> = {
    'doc': '34',
    'docx': '34',
    'xls': '31',
    'xlsx': '31',
    'zip': '37',
    'ppt': '40',
    'pptx': '40',
    'pdf': '34',
    'txt': '34',
    'jpg': '34',
    'jpeg': '34',
    'png': '34',
    'gif': '34',
  }
  const iconNum = iconMap[ext] || '34'
  return `/figma/3883_5466/${iconNum}.svg`
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0)
    return '0 B/s'
  if (bytesPerSecond < 1024)
    return `${bytesPerSecond.toFixed(0)} B/s`
  if (bytesPerSecond < 1024 * 1024)
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
  return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`
}

function getStatusLabel(status: FileStatus): string {
  const labelMap: Record<FileStatus, string> = {
    pending: '待上传',
    uploading: '上传中',
    completed: '已完成',
    failed: '失败',
    paused: '已暂停',
  }
  return labelMap[status]
}

function getStatusColor(status: FileStatus): string {
  const colorMap: Record<FileStatus, string> = {
    pending: 'gray',
    uploading: 'blue',
    completed: 'green',
    failed: 'red',
    paused: 'orange',
  }
  return colorMap[status]
}

async function handleFileSelect(files: FileList | null) {
  if (!files || files.length === 0)
    return

  const newFiles = Array.from(files)

  // 检查文件数量限制
  if (fileList.value.length + newFiles.length > props.maxCount) {
    Message.error(`最多只能上传 ${props.maxCount} 个文件`)
    return
  }

  // 检查文件大小
  for (const file of newFiles) {
    if (file.size > props.maxSize) {
      Message.error(`文件 ${file.name} 超过最大限制 ${formatFileSize(props.maxSize)}`)
      return
    }
  }

  // 添加到文件列表
  for (const file of newFiles) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    fileList.value.push({
      id,
      file,
      status: 'pending',
      progress: 0,
      speed: 0,
    })
  }

  // 自动开始上传
  await startPendingUploads()
}

async function startPendingUploads() {
  const pendingFiles = fileList.value.filter(item => item.status === 'pending')

  for (const item of pendingFiles) {
    if (uploadingCount.value >= MAX_CONCURRENT_UPLOADS)
      break

    await uploadFile(item)
  }
}

// 真实上传函数（使用分片上传）
async function uploadFile(item: UploadFileItem) {
  if (!props.applicationId) {
    Message.error('缺少申请单ID，无法上传')
    return
  }

  item.status = 'uploading'
  item.progress = 0
  item.speed = 0

  try {
    const fileId = await uploadFileReal(
      item.file,
      props.applicationId,
      (progress) => {
        item.progress = Math.floor(progress.progress)
        item.speed = progress.speed
      },
    )

    // 上传成功，存入 fileStore
    item.status = 'completed'
    item.progress = 100
    item.speed = 0

    // 将文件信息存入 fileStore，这样申请详情页可以看到
    fileStore.addFile({
      id: fileId,
      applicationId: props.applicationId,
      fileName: item.file.name,
      fileSize: item.file.size,
      fileType: item.file.type || 'application/octet-stream',
      uploadStatus: 'completed',
      uploadProgress: 100,
      uploadedAt: new Date().toISOString(),
      fileBlob: item.file,
    })

    emit('upload-success', item.file, fileId)

    // 检查是否所有文件都已完成
    if (fileList.value.every(f => f.status === 'completed' || f.status === 'failed')) {
      emit('all-uploaded')
    }

    // 继续上传下一个待上传文件
    startPendingUploads()
  }
  catch (error: any) {
    item.status = 'failed'
    item.error = error.message || '上传失败'
    Message.error(`${item.file.name} 上传失败: ${item.error}`)

    // 继续上传下一个待上传文件
    startPendingUploads()
  }
}

function handlePause(item: UploadFileItem) {
  if (item.status === 'uploading') {
    item.status = 'paused'
    item.speed = 0
    Message.info(`已暂停上传 ${item.file.name}`)
  }
}

async function handleResume(item: UploadFileItem) {
  if (item.status === 'paused') {
    item.status = 'pending'
    Message.info(`继续上传 ${item.file.name}`)
    await uploadFile(item)
  }
}

async function handleRetry(item: UploadFileItem) {
  if (item.status === 'failed') {
    item.error = undefined
    item.status = 'pending'
    Message.info(`重试上传 ${item.file.name}`)
    await uploadFile(item)
  }
}

function handleDelete(item: UploadFileItem) {
  const index = fileList.value.findIndex(f => f.id === item.id)
  if (index >= 0) {
    fileList.value.splice(index, 1)
    Message.success(`已删除 ${item.file.name}`)
  }
}

function handlePauseAll() {
  const uploadingFiles = fileList.value.filter(item => item.status === 'uploading')
  uploadingFiles.forEach(item => handlePause(item))
  if (uploadingFiles.length > 0) {
    Message.info(`已暂停 ${uploadingFiles.length} 个文件`)
  }
}

function handleResumeAll() {
  const pausedFiles = fileList.value.filter(item => item.status === 'paused')
  pausedFiles.forEach(item => handleResume(item))
  if (pausedFiles.length > 0) {
    Message.info(`已继续 ${pausedFiles.length} 个文件`)
  }
}

function handleClearCompleted() {
  const completedFiles = fileList.value.filter(item => item.status === 'completed')
  fileList.value = fileList.value.filter(item => item.status !== 'completed')
  if (completedFiles.length > 0) {
    Message.success(`已清空 ${completedFiles.length} 个已完成文件`)
  }
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  if (props.disabled)
    return

  const files = e.dataTransfer?.files || null
  await handleFileSelect(files)
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

function handleClickUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = props.accept
  input.onchange = async (e) => {
    const target = e.target as HTMLInputElement
    await handleFileSelect(target.files)
  }
  input.click()
}
</script>

<template>
  <div class="file-upload">
    <!-- 上传区域 -->
    <div
      class="file-upload__drop-zone"
      :class="{ 'is-disabled': disabled }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @click="handleClickUpload"
    >
      <IconUpload class="drop-zone__icon" />
      <p class="drop-zone__text">点击或拖拽文件到此处上传</p>
      <p class="drop-zone__hint">
        支持单个或批量上传，最多 {{ maxCount }} 个文件，单个文件不超过 {{ formatFileSize(maxSize) }}
      </p>
    </div>

    <!-- 全局操作栏 -->
    <div v-if="fileList.length > 0" class="file-upload__toolbar">
      <div class="toolbar__info">
        共 {{ fileList.length }} 个文件，已完成 {{ completedCount }} 个
      </div>
      <div class="toolbar__actions">
        <a-button size="small" @click="handlePauseAll">
          <template #icon>
            <IconPause />
          </template>
          全部暂停
        </a-button>
        <a-button size="small" @click="handleResumeAll">
          <template #icon>
            <IconPlayArrow />
          </template>
          全部继续
        </a-button>
        <a-button v-if="hasCompleted" size="small" @click="handleClearCompleted">
          清空已完成
        </a-button>
      </div>
    </div>

    <!-- 文件列表 -->
    <div v-if="fileList.length > 0" class="file-upload__list">
      <div v-for="item in fileList" :key="item.id" class="file-item">
        <img :src="getFileIcon(item.file.name)" alt="file" class="file-item__icon" />

        <div class="file-item__info">
          <div class="file-item__header">
            <a-tooltip :content="item.file.name">
              <span class="file-item__name">{{ item.file.name }}</span>
            </a-tooltip>
            <span class="file-item__size">{{ formatFileSize(item.file.size) }}</span>
          </div>

          <div class="file-item__progress-wrap">
            <a-progress
              :percent="item.progress"
              :status="item.status === 'failed' ? 'danger' : item.status === 'completed' ? 'success' : 'normal'"
              :show-text="false"
              class="file-item__progress"
            />
            <div class="file-item__meta">
              <span class="file-item__speed">{{ formatSpeed(item.speed) }}</span>
              <a-tag :color="getStatusColor(item.status)" size="small">
                {{ getStatusLabel(item.status) }}
              </a-tag>
            </div>
          </div>

          <div v-if="item.error" class="file-item__error">
            {{ item.error }}
          </div>
        </div>

        <div class="file-item__actions">
          <a-button
            v-if="item.status === 'uploading'"
            type="text"
            size="small"
            @click="handlePause(item)"
          >
            <template #icon>
              <IconPause />
            </template>
          </a-button>

          <a-button
            v-if="item.status === 'paused'"
            type="text"
            size="small"
            @click="handleResume(item)"
          >
            <template #icon>
              <IconPlayArrow />
            </template>
          </a-button>

          <a-button
            v-if="item.status === 'failed'"
            type="text"
            size="small"
            @click="handleRetry(item)"
          >
            <template #icon>
              <IconRefresh />
            </template>
          </a-button>

          <a-button
            v-if="item.status !== 'uploading'"
            type="text"
            size="small"
            status="danger"
            @click="handleDelete(item)"
          >
            <template #icon>
              <IconDelete />
            </template>
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>
