<!-- StepTwoUploadFile.vue -->
<script setup lang="ts">
import { IconDelete, IconFile, IconRefresh } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import { onMounted, ref } from 'vue'
import type { FileEntity } from '@/api/transWebService'
import type { TransUploadFileItem } from '@/composables/useTransUpload'
import { useTransUpload } from '@/composables/useTransUpload'
import TransFileTable from '@/components/business/TransFileTable.vue'
import { formatFileSize } from '@/utils/format'

interface Props {
  params:string
  lang?: string
  autoSubmitAfterUpload: boolean
}

const props = withDefaults(defineProps<Props>(), { lang: 'zh_CN' })

const emit = defineEmits<{
  (e: 'update:autoSubmitAfterUpload', value: boolean): void
  (e: 'confirmed'): void
}>()

const {
  uploading,
  initLoading,
  initData,
  fileListData,
  uploadFileList,
  initialize,
  loadFileList,
  uploadFiles,
  confirmUpload,
  pauseUpload,
  resumeUpload,
  cancelUpload,
  retryUpload,
  clearCompleted,
  batchPause,
  batchResume,
  batchCancel,
  removeFiles,
} = useTransUpload()

const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedUploadedFiles = ref<FileEntity[]>([])

onMounted(() => initPage())

async function initPage() {
  debugger
  if (!props.params) return Message.error('缺少必要参数 params')
  const ok = await initialize(props.params, props.lang)
  if (!ok) Message.error('初始化失败，请检查参数是否正确')
}

async function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  await handleFiles(Array.from(input.files))
  input.value = ''
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  if (!e.dataTransfer?.files?.length) return
  await handleFiles(Array.from(e.dataTransfer.files))
}

async function handleFiles(files: File[]) {
  const maxCount = initData.value?.maxLength4Name ? 1000 : 20
  if (uploadFileList.value.length + files.length > maxCount)
    return Message.error(`最多只能上传 ${maxCount} 个文件`)
  const maxSize = (initData.value?.applicationSize || 1024) * 1024 * 1024
  for (const file of files) {
    if (file.size > maxSize)
      return Message.error(`文件 ${file.name} 超过最大限制 ${formatFileSize(maxSize)}`)
  }
  await uploadFiles(files, props.params, '', updateUploadProgress)
}

function updateUploadProgress(item: TransUploadFileItem) {
  if (item.status === 'completed') {
    const index = uploadFileList.value.findIndex(f => f.id === item.id)
    if (index >= 0) uploadFileList.value.splice(index, 1)
    loadFileList('', props.params)
    return
  }
  const index = uploadFileList.value.findIndex(f => f.id === item.id)
  if (index >= 0) uploadFileList.value[index] = { ...item }
}

const handlePause = (id: string) => pauseUpload(id, props.params)
const handleResume = (id: string) => resumeUpload(id, props.params, updateUploadProgress)
const handleDelete = (id: string) => cancelUpload(id)
const handleRetry = (id: string) => retryUpload(id, props.params, updateUploadProgress)
const handleToggleSelect = (id: string) => {
  const item = uploadFileList.value.find(f => f.id === id)
  if (item) item.selected = !item.selected
}
const handleBatchPause = () => batchPause(props.params)
const handleBatchResume = () => batchResume(props.params, updateUploadProgress)
const handleBatchDelete = () => batchCancel()

async function handleRefresh() {
  await loadFileList('', props.params)
}

function handleToggleSelectUploaded(file: FileEntity) {
  const index = selectedUploadedFiles.value.indexOf(file)
  index >= 0
    ? selectedUploadedFiles.value.splice(index, 1)
    : selectedUploadedFiles.value.push(file)
}

async function handleDeleteSelectedUploaded() {
  if (!selectedUploadedFiles.value.length) return Message.warning('请先选择要删除的文件')
  await removeFiles(
    selectedUploadedFiles.value.map(f => ({ fileName: f.fileName, relativeDir: f.relativeDir })),
    props.params,
  )
  selectedUploadedFiles.value = []
}
</script>

<template>
  <div class="upload-step">
    <!-- 顶部操作栏 -->
    <div class="upload-step__header">
      <div class="upload-step__actions">
        <a-button type="primary" @click="fileInputRef?.click()">
          <template #icon><IconUpload /></template>
          上传
        </a-button>
        <input ref="fileInputRef" type="file" multiple hidden @change="handleFileSelect" />
        <a-checkbox
          :model-value="autoSubmitAfterUpload"
          @change="(val: boolean) => emit('update:autoSubmitAfterUpload', val)"
        >
          上传完毕后自动提交
        </a-checkbox>
      </div>
      <a-button type="text" class="privacy-link">
        <template #icon><IconFile /></template>
        隐私政策
      </a-button>
    </div>

    <div v-if="initLoading" class="upload-step__loading">
      <a-spin />
    </div>

    <template v-else-if="initData">
      <!-- 拖拽上传区 -->
      <div
        class="upload-dropzone"
        :class="{ 'is-dragging': isDragging }"
        @drop="handleDrop"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @click="fileInputRef?.click()"
      >
        <IconUpload class="dropzone-icon" />
        <p>点击或拖拽文件到此处上传</p>
        <p class="dropzone-hint">
          单个文件不超过 {{ formatFileSize((initData.applicationSize || 10) * 1024 * 1024 * 1024) }}
        </p>
      </div>

      <!-- 传输任务 -->
      <section v-if="uploadFileList.length > 0" class="upload-section">
        <TransFileTable
          :files="uploadFileList"
          mode="upload"
          :show-batch-actions="true"
          :show-hash-status="true"
          @pause="handlePause"
          @resume="handleResume"
          @delete="handleDelete"
          @retry="handleRetry"
          @toggle-select="handleToggleSelect"
          @batch-pause="handleBatchPause"
          @batch-resume="handleBatchResume"
          @batch-delete="handleBatchDelete"
          @clear-completed="clearCompleted"
        />
      </section>

      <!-- 已上传文件列表 -->
      <section v-if="fileListData?.fileList.length" class="upload-section">
        <div class="upload-section__header">
          <h3 class="upload-section__title">已上传文件 ({{ fileListData.totalFileCount }})</h3>
          <div class="upload-section__toolbar">
            <a-button type="text" size="small" status="success" @click="handleRefresh">
              <template #icon><IconRefresh /></template>
              刷新
            </a-button>
            <a-button
              v-if="selectedUploadedFiles.length > 0"
              type="text"
              size="small"
              status="danger"
              @click="handleDeleteSelectedUploaded"
            >
              <template #icon><IconDelete /></template>
              删除选中 ({{ selectedUploadedFiles.length }})
            </a-button>
          </div>
        </div>
        <TransFileTable
          :files="[]"
          mode="uploaded"
          :show-batch-actions="false"
          :uploaded-files="fileListData.fileList"
          :selected-uploaded-files="selectedUploadedFiles"
          @toggle-select-uploaded="handleToggleSelectUploaded"
          @batch-delete="handleDeleteSelectedUploaded"
        />
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.upload-dropzone {
  border: 2px dashed var(--color-border-2);
  border-radius: 4px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;

  &.is-dragging {
    border-color: rgb(var(--primary-6));
    background: var(--color-primary-light-1);
  }

  .dropzone-icon {
    font-size: 32px;
    color: var(--color-text-3);
  }

  .dropzone-hint {
    color: var(--color-text-3);
    font-size: 12px;
  }
}
</style>
