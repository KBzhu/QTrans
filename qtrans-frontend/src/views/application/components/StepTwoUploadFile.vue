<!-- StepTwoUploadFile.vue -->
<script setup lang="ts">
import { IconDelete, IconFile, IconRefresh } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import { onMounted, ref } from 'vue'
import { watchDeep } from '@vueuse/core'
import type { FileEntity } from '@/api/transWebService'
import { calculateSHA256 } from '@/api/transWebService'
import type { TransUploadFileItem } from '@/composables/useTransUpload'
import { useTransUpload } from '@/composables/useTransUpload'
import TransFileTable from '@/components/business/TransFileTable.vue'
import { formatFileSize } from '@/utils/format'
import { validateFileNames } from '@/utils/upload-validator'

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
  checkStorageSpace,
} = useTransUpload()

const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedUploadedFiles = ref<FileEntity[]>([])
const autoSubmitTriggered = ref(false)

// 监听上传列表变化，实现自动提交
watchDeep(uploadFileList, (list: TransUploadFileItem[]) => {
  if (!props.autoSubmitAfterUpload || list.length === 0 || autoSubmitTriggered.value) return

  // 检查是否所有文件都已结束（完成/错误/暂停），且至少有一个完成
  const completedFiles = list.filter((f: TransUploadFileItem) => f.status === 'completed')
  if (completedFiles.length === 0) return

  const hasActive = list.some((f: TransUploadFileItem) =>
    f.status === 'uploading' || f.status === 'hashing' || f.status === 'verifying' || f.status === 'pending',
  )
  if (hasActive) return

  // 检查所有已完成文件的哈希校验是否通过
  const allHashMatched = completedFiles.every((f: TransUploadFileItem) =>
    !f.hashState || f.hashState.status === 'matched',
  )

  if (allHashMatched) {
    autoSubmitTriggered.value = true
    handleAutoSubmit()
  }
})

async function handleAutoSubmit() {
  const ok = await confirmUpload(props.params)
  if (ok) {
    Message.success('自动提交成功')
    emit('confirmed')
  } else {
    autoSubmitTriggered.value = false
  }
}

onMounted(() => initPage())

async function initPage() {
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

  // P0-3: 对齐老代码 onSubmit，校验文件名/路径合法性
  const blackList = initData.value?.blackList || ''
  const maxLength4Name = initData.value?.maxLength4Name || 256
  const maxLength4Path = initData.value?.maxLength4Path || 512
  const invalidFiles = validateFileNames(files, blackList, maxLength4Name, maxLength4Path, '')
  if (invalidFiles.length > 0) {
    const errorMessages = invalidFiles.map(f => `${f.file.name}: ${f.error}`).join('\n')
    Message.error(`文件名校验不通过：${errorMessages}`)
    // 过滤掉非法文件，仅上传合法文件
    const invalidFileNames = new Set(invalidFiles.map(f => f.file.name))
    files = files.filter(f => !invalidFileNames.has(f.name))
    if (files.length === 0) return
  }

  // P1-5: 对齐老代码 onValidate，检查存储空间
  const totalFileSize = files.reduce((sum, f) => sum + f.size, 0)
  const hasSpace = await checkStorageSpace(props.params, totalFileSize)
  if (!hasSpace) return

  // 重复上传拦截：逐文件计算 SHA256，与已上传且校验通过的文件比对
  // 条件：hash 相同且文件名相同才视为重复，hash 相同但文件名不同则放行
  const uploadedFiles = fileListData.value?.fileList ?? []
  const duplicateFiles: string[] = []
  const uniqueFiles: File[] = []

  for (const file of files) {
    // 计算当前文件 hash
    const fileHash = await calculateSHA256(file)
    // 比对已上传列表：hash 匹配 + 文件名相同 才视为重复
    const duplicate = uploadedFiles.find((f: FileEntity) => {
      // 文件名不同，即使 hash 相同也放行
      if (f.fileName !== file.name) return false
      const validClientHash = f.clientFileHashCode && f.clientFileHashCode !== 'null' && f.clientFileHashCode !== ''
      const validServerHash = f.hashCode && f.hashCode !== 'null' && f.hashCode !== ''
      if (validClientHash && f.clientFileHashCode === fileHash) return true
      if (validServerHash && f.hashCode.toUpperCase() === fileHash.toUpperCase()) return true
      return false
    })
    if (duplicate) {
      duplicateFiles.push(file.name)
    } else {
      uniqueFiles.push(file)
    }
  }

  if (duplicateFiles.length > 0) {
    Message.warning(`${duplicateFiles.join('、')} 在服务器上已存在，请勿重复上传`)
  }

  if (uniqueFiles.length === 0) return

  autoSubmitTriggered.value = false
  await uploadFiles(uniqueFiles, props.params, '', updateUploadProgress)
}

/**
 * 刷新已上传文件列表（带重试）
 * 上传完成后后端 hashCode 可能还没算完，FileListHandler 返回 null
 * 对齐老代码逻辑：如果 hashCode 为 null，延迟再刷新一次
 */
async function refreshFileListWithRetry(relativeDir: string, params: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    // 延迟刷新：给后端计算哈希的时间
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
    await loadFileList(relativeDir, params)
    // 检查新上传的文件是否已有 hashCode
    const hasNullHash = fileListData.value?.fileList.some(
      (f: FileEntity) => f.clientFileHashCode && f.clientFileHashCode !== 'null' && f.clientFileHashCode !== '' && (!f.hashCode || f.hashCode === 'null'),
    )
    if (!hasNullHash) break
    console.log(`[文件列表刷新] 第 ${i + 1} 次刷新后仍有 hashCode 为 null 的文件，将重试...`)
  }
}



/**
 * 更新上传进度
 * composable 内部已通过响应式引用(ri)直接更新进度，此处仅需处理完成后的列表刷新
 */
function updateUploadProgress(item: TransUploadFileItem) {
  if (item.status === 'completed' && props.params) {
    const idx = uploadFileList.value.findIndex((f: TransUploadFileItem) => f.id === item.id)
    if (idx >= 0) {
      uploadFileList.value.splice(idx, 1)
      refreshFileListWithRetry('', props.params)
    }
  }
}

const handlePause = (id: string) => pauseUpload(id, props.params)
const handleResume = (id: string) => resumeUpload(id, props.params, updateUploadProgress)
const handleDelete = (id: string) => cancelUpload(id, props.params)
const handleRetry = (id: string) => retryUpload(id, props.params, updateUploadProgress)

function handleToggleSelect(id: string) {
  const item = uploadFileList.value.find((f: TransUploadFileItem) => f.id === id)
  if (item) item.selected = !item.selected
}

function handleBatchPause() { batchPause(props.params) }
function handleBatchResume() { batchResume(props.params, updateUploadProgress) }
function handleBatchDelete() { batchCancel(props.params) }

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
    selectedUploadedFiles.value.map((f: FileEntity) => ({ fileName: f.fileName, relativeDir: f.relativeDir })),
    props.params,
  )
  selectedUploadedFiles.value = []
}

async function handleDeleteUploadedFile(file: FileEntity) {
  await removeFiles([{ fileName: file.fileName, relativeDir: file.relativeDir }], props.params)
  // 从选中列表中移除
  const idx = selectedUploadedFiles.value.findIndex((f: FileEntity) => f.fileId === file.fileId)
  if (idx >= 0) selectedUploadedFiles.value.splice(idx, 1)
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
          :show-hash-status="true"
          :uploaded-files="fileListData.fileList"
          :selected-uploaded-files="selectedUploadedFiles"
          @toggle-select-uploaded="handleToggleSelectUploaded"
          @batch-delete="handleDeleteSelectedUploaded"
          @delete-uploaded-file="handleDeleteUploadedFile"
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
