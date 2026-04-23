<!-- StepTwoUploadFile.vue -->
<script setup lang="ts">
import { IconCheck, IconDelete, IconFile, IconFolder, IconRefresh, IconUpload } from '@arco-design/web-vue/es/icon'
import { Message, Modal } from '@arco-design/web-vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { useIntervalFn, watchDeep } from '@vueuse/core'
import type { FileEntity } from '@/api/transWebService'
import type { TransUploadFileItem } from '@/composables/useTransUpload'
import { useTransUpload } from '@/composables/useTransUpload'
import TransFileTable from '@/components/business/TransFileTable.vue'
import { formatFileSize } from '@/utils/format'
import { detectUploadNameConflicts, validateFileNames } from '@/utils/upload-validator'


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
  debouncedLoadFileList,
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

// Task 5: 哈希不匹配弹窗
const hashMismatchModalVisible = ref(false)
const mismatchedFiles = ref<TransUploadFileItem[]>([])

// Task 10: 文件列表增量刷新定时器
const FILE_LIST_POLL_INTERVAL = 10_000 // 每 10 秒轮询一次文件列表

const {
  pause: pauseFileListPolling,
  resume: resumeFileListPolling,
  isActive: isFileListPollingActive,
} = useIntervalFn(async () => {
  const hasActiveUpload = uploadFileList.value.some(
    (f: TransUploadFileItem) => f.status === 'uploading' || f.status === 'hashing' || f.status === 'verifying',
  )
  if (hasActiveUpload) return

  await debouncedLoadFileList('', props.params)
  console.log('[文件列表轮询] 已刷新文件列表')
}, FILE_LIST_POLL_INTERVAL, { immediate: false })


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

/**
 * Task 4: 手动确认提交
 * 1. 先显示二次确认弹窗
 * 2. 确认后再调用 confirmUpload
 * 3. 成功后 emit 'confirmed'
 */
function handleManualConfirmSubmit() {
  // 检查是否有哈希不匹配文件
  const mismatched = getHashMismatchedFiles()
  if (mismatched.length > 0) {
    mismatchedFiles.value = mismatched
    hashMismatchModalVisible.value = true
    return
  }

  doConfirmSubmit()
}

function doConfirmSubmit() {
  Modal.confirm({
    title: '确认提交文件',
    content: '提交后将无法继续上传新文件，是否确认提交？',
    okText: '确认提交',
    cancelText: '取消',
    onOk: async () => {
      const ok = await confirmUpload(props.params)
      if (ok) {
        Message.success('提交成功')
        emit('confirmed')
      }
    },
  })
}

/**
 * Task 5: 获取哈希不匹配的文件列表（来自上传队列）
 */
function getHashMismatchedFiles(): TransUploadFileItem[] {
  return uploadFileList.value.filter(
    (f: TransUploadFileItem) => f.hashState?.status === 'mismatched',
  )
}


/**
 * Task 5: 删除哈希不匹配文件并继续提交
 */
async function handleRemoveMismatchedAndSubmit() {
  // 批量删除不匹配的文件
  for (const file of mismatchedFiles.value) {
    await cancelUpload(file.id, props.params)
  }
  mismatchedFiles.value = []
  hashMismatchModalVisible.value = false

  // 删除后继续提交
  doConfirmSubmit()
}

/**
 * Task 9: 隐私政策弹窗
 */
function showPrivacyPolicy() {
  Modal.info({
    title: '隐私政策',
    content: '我们非常重视您的隐私保护。在使用本文件传输服务时，系统将收集必要的文件元数据（文件名、大小、上传时间等）用于传输管理。所有数据均按照公司信息安全政策进行存储和处理，不会用于任何其他目的。如有疑问，请联系管理员。',
    okText: '我已知晓',
    width: 480,
  })
}

onMounted(() => initPage())

async function initPage() {
  if (!props.params) return Message.error('缺少必要参数 params')
  const ok = await initialize(props.params, props.lang)
  if (!ok) Message.error('初始化失败，请检查参数是否正确')
  // Task 10: 启动文件列表轮询（增量刷新）
  startFileListPolling()
}

onUnmounted(() => {
  stopFileListPolling()
})

/**
 * Task 10: 启动文件列表轮询（增量刷新）
 * 对标老代码：定时拉取文件列表，保持 UI 与服务端状态同步
 */
function startFileListPolling() {
  pauseFileListPolling()
  resumeFileListPolling()
  console.log(`[文件列表轮询] 已启动（间隔 ${FILE_LIST_POLL_INTERVAL / 1000}s）`)
}

/**
 * Task 10: 停止文件列表轮询
 */
function stopFileListPolling() {
  if (!isFileListPollingActive.value) return

  pauseFileListPolling()
  console.log('[文件列表轮询] 已停止')
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

  const uploadedFiles = fileListData.value?.fileList ?? []
  const {
    readyFiles,
    serverDuplicates,
    queueDuplicates,
    selectionDuplicates,
  } = detectUploadNameConflicts(files, uploadedFiles, uploadFileList.value, '')

  if (selectionDuplicates.length > 0) {
    const names = [...new Set(selectionDuplicates.map(file => file.name))].join('、')
    Message.warning(`本次选择中存在重名文件，已自动忽略后续重复项：${names}`)
  }

  if (queueDuplicates.length > 0) {
    const names = [...new Set(queueDuplicates.map(file => file.name))].join('、')
    Message.error(`以下文件已在上传队列中，请勿重复添加：${names}`)
  }

  let filesToUpload = [...readyFiles]

  if (serverDuplicates.length > 0) {
    const names = [...new Set(serverDuplicates.map(file => file.name))].join('、')
    const confirmed = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '文件已存在',
        content: `${names} 在服务器上已存在同名文件，是否覆盖上传？`,
        okText: '覆盖上传',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })

    if (confirmed) {
      filesToUpload = filesToUpload.concat(serverDuplicates)
    }
  }

  if (filesToUpload.length === 0) return

  autoSubmitTriggered.value = false
  await uploadFiles(filesToUpload, props.params, '', updateUploadProgress)

}

/**
 * 刷新已上传文件列表（带重试 ）
 * 上传完成后后端 hashCode 可能还没算完，FileListHandler 返回 null
 * 对齐老代码逻辑：如果 hashCode 为 null，延迟再刷新一次
 */
async function refreshFileListWithRetry(relativeDir: string, params: string, maxRetries = 3) {
  // Task 6: 先防抖延迟，等 uploadFile 完成状态稳定后再刷新
  const doRefresh = async (attempt = 0) => {
    if (attempt > 0) {
      // 重试时给后端计算哈希的时间
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
    await loadFileList(relativeDir, params)
    // 检查新上传的文件是否已有 hashCode
    const hasNullHash = fileListData.value?.fileList.some(
      (f: FileEntity) => f.clientFileHashCode && f.clientFileHashCode !== 'null' && f.clientFileHashCode !== '' && (!f.hashCode || f.hashCode === 'null'),
    )
    if (!hasNullHash) return
    console.log(`[文件列表刷新] 第 ${attempt + 1} 次刷新后仍有 hashCode 为 null 的文件，将重试...`)
    if (attempt < maxRetries - 1) {
      await doRefresh(attempt + 1)
    }
  }
  // 防抖延迟 500ms 后执行刷新
  await new Promise(resolve => setTimeout(resolve, 500))
  await doRefresh(0)
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

/**
 * 继续上传
 * 断点续传恢复的任务没有 File 对象，需用户重新选择文件
 */
function handleResume(id: string) {
  const item = uploadFileList.value.find((f: TransUploadFileItem) => f.id === id)
  // 断点续传恢复的任务：唤起文件选择器让用户重新选择同一文件
  if (item && !item.file) {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        const restoredFile = files[0]
        // 校验文件名是否一致
        if (restoredFile.name !== item.fileName) {
          Message.error(`请选择同名文件：${item.fileName}`)
          return
        }
        // 校验文件大小是否一致（resumeUpload 内部也会校验，此处提前提示更友好）
        if (restoredFile.size !== item.fileSize) {
          Message.error(`文件大小不一致（期望: ${formatFileSize(item.fileSize || 0)}，实际: ${formatFileSize(restoredFile.size)}），请重新选择正确的文件`)
          return
        }
        await resumeUpload(id, props.params, updateUploadProgress, restoredFile)
      }
    }
    input.click()
    return
  }
  resumeUpload(id, props.params, updateUploadProgress)
}

const handleDelete = (id: string) => cancelUpload(id, props.params)
const handleRetry = (id: string) => retryUpload(id, props.params, updateUploadProgress)

function handleToggleSelect(id: string) {
  const item = uploadFileList.value.find((f: TransUploadFileItem) => f.id === id)
  if (item) item.selected = !item.selected
}

function handleBatchPause() { batchPause(props.params) }
function handleBatchResume() { batchResume(props.params, updateUploadProgress) }
function handleBatchDelete() { batchCancel(props.params) }

// Task 6: 刷新按钮防抖（500ms 避免频繁请求）
async function handleRefresh() {
  // 已有防抖的 debouncedLoadFileList，避免与 refreshFileListWithRetry 重复调用
  await debouncedLoadFileList('', props.params)
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

/**
 * 校验已上传文件是否存在哈希校验未通过的情况
 * 供父组件在"提交申请"前调用
 * @returns true=校验通过，false=存在未通过文件，已拦截
 */
function validateBeforeSubmit(): boolean {
  // 0. 检查上传队列中是否有尚未完成上传的文件
  const activeFiles = uploadFileList.value.filter((f: TransUploadFileItem) =>
    f.status === 'pending' || f.status === 'uploading' || f.status === 'hashing' || f.status === 'verifying',
  )
  if (activeFiles.length > 0) {
    const names = activeFiles.map(f => f.file.name).join('、')
    Message.error(`以下文件尚未上传完成：${names}`)
    return false
  }

  // 1. 检查上传队列中是否有哈希校验失败的文件
  const mismatchedUploading = uploadFileList.value.filter(
    (f: TransUploadFileItem) => f.hashState?.status === 'mismatched',
  )
  if (mismatchedUploading.length > 0) {
    const names = mismatchedUploading.map(f => f.file.name).join('、')
    Message.error(`以下文件校验未通过，请重新上传：${names}`)
    return false
  }

  // 2. 检查已上传文件列表中是否有哈希校验未通过的文件
  const uploadedFiles = fileListData.value?.fileList ?? []
  const mismatchedUploaded = uploadedFiles.filter((f: FileEntity) => {
    const clientHash = f.clientFileHashCode
    const serverHash = f.hashCode
    const validClientHash = clientHash && clientHash !== 'null' && clientHash !== '' && clientHash.length === 64
    const validServerHash = serverHash && serverHash !== 'null' && serverHash !== ''
    // 两端哈希都有效但不一致 → 未通过
    if (validClientHash && validServerHash) {
      return clientHash.toUpperCase() !== serverHash.toUpperCase()
    }
    return false
  })
  if (mismatchedUploaded.length > 0) {
    const names = mismatchedUploaded.map(f => f.fileName).join('、')
    Message.error(`以下文件校验未通过，请删除后重新上传：${names}`)
    return false
  }

  return true
}

defineExpose({ validateBeforeSubmit })
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
        <!-- Task 4: 手动确认提交按钮 -->
        <a-button type="outline" status="success" @click="handleManualConfirmSubmit">
          <template #icon><IconCheck /></template>
          确认提交
        </a-button>
      </div>
      <!-- Task 9: 隐私政策弹窗 -->
      <a-button type="text" class="privacy-link" @click="showPrivacyPolicy">
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

    <!-- Task 5: 哈希不匹配文件弹窗 -->
    <a-modal
      v-model:visible="hashMismatchModalVisible"
      title="哈希校验未通过"
      :mask-closable="false"
      :footer="[
        { text: '删除并继续提交', type: 'primary', status: 'danger', run: handleRemoveMismatchedAndSubmit },
        { text: '取消', run: () => { hashMismatchModalVisible = false } }
      ]"
    >
      <div class="hash-mismatch-modal">
        <p class="hash-mismatch-modal__tip">
          以下文件的哈希校验未通过，请删除后重新上传：
        </p>
        <ul class="hash-mismatch-modal__list">
          <li v-for="file in mismatchedFiles" :key="file.id" class="hash-mismatch-modal__item">
            <IconFile />
            <span class="hash-mismatch-modal__name">{{ file.file.name }}</span>
            <span class="hash-mismatch-modal__hash">
              客户端: {{ file.hashState?.clientHash?.substring(0, 16) }}...
            </span>
            <span class="hash-mismatch-modal__hash hash-mismatch-modal__hash--server">
              服务端: {{ file.hashState?.serverHash?.substring(0, 16) }}...
            </span>
          </li>
        </ul>
      </div>
    </a-modal>
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

// Task 5: 哈希不匹配弹窗样式
.hash-mismatch-modal {
  &__tip {
    color: var(--color-text-2);
    margin-bottom: 12px;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 300px;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgb(var(--danger-1));
    border: 1px solid rgb(var(--danger-3));
    border-radius: 4px;
    margin-bottom: 8px;
    flex-wrap: wrap;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__name {
    font-weight: 500;
    color: var(--color-text-1);
    flex: 1;
  }

  &__hash {
    font-size: 11px;
    color: var(--color-text-3);
    font-family: monospace;
    width: 100%;

    &--server {
      color: rgb(var(--danger-6));
    }
  }
}
</style>
