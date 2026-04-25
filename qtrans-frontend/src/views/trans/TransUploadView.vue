<script setup lang="ts">
/**
 * TransUploadView - 外网独立上传页面
 * 使用 useTransUpload + TransFileTable 组件
 */
import {
  IconCheck,
  IconFile,
  IconUpload,
} from '@arco-design/web-vue/es/icon'
import { Message, Modal } from '@arco-design/web-vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useIntervalFn, watchDeep } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import type { FileEntity } from '@/api/transWebService'
import type { TransUploadFileItem } from '@/composables/useTransUpload'
import { useTransUpload } from '@/composables/useTransUpload'
import TransFileTable from '@/components/business/TransFileTable.vue'
import { formatFileSize } from '@/utils/format'
import { detectUploadNameConflicts, validateFileNames } from '@/utils/upload-validator'
import './trans-upload.scss'


const route = useRoute()
const router = useRouter()

const {
  uploading,
  initLoading,
  initData,
  fileListData,
  uploadFileList,
  maxConcurrentUploads,
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
  batchResumeFromFiles,
  batchCancel,
  removeFiles,
  checkStorageSpace,
  toggleSelectAll,
  stopSessionKeepAlive,
  stopTransTokenRefresh,
} = useTransUpload()

// 获取路由参数
const params = computed(() => route.query.params as string || '')
const lang = computed(() => route.query.lang as string || 'zh_CN')

// 上传区域状态
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 选中的已上传文件
const selectedUploadedFiles = ref<FileEntity[]>([])

// 自动提交
const autoSubmitAfterUpload = ref(false)
const autoSubmitTriggered = ref(false)

// 提交完成状态（自动/手动提交后屏蔽操作）
const isSubmitted = ref(false)

// BUG6: 取消上传弹框防抖锁
const cancelUploadModalLock = ref(false)

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
  await debouncedLoadFileList('', params.value)
  console.log('[文件列表轮询] 已刷新文件列表')
}, FILE_LIST_POLL_INTERVAL, { immediate: false })


// 监听上传列表变化，实现自动提交
watchDeep(uploadFileList, (list: TransUploadFileItem[]) => {
  if (!autoSubmitAfterUpload.value || list.length === 0 || autoSubmitTriggered.value) return

  const completedFiles = list.filter((f: TransUploadFileItem) => f.status === 'completed')
  if (completedFiles.length === 0) return

  const hasActive = list.some((f: TransUploadFileItem) =>
    f.status === 'uploading' || f.status === 'hashing' || f.status === 'verifying' || f.status === 'pending',
  )
  if (hasActive) return

  const allHashMatched = completedFiles.every((f: TransUploadFileItem) =>
    !f.hashState || f.hashState.status === 'matched',
  )

  if (allHashMatched) {
    autoSubmitTriggered.value = true
    handleAutoSubmit()
  }
})

async function handleAutoSubmit() {
  const ok = await confirmUpload(params.value)
  if (ok) {
    Message.success('自动提交成功')
    isSubmitted.value = true
    showSubmittedModal()
  } else {
    autoSubmitTriggered.value = false
  }
}

/**
 * Task 4: 手动确认提交
 * 1. 先检查哈希不匹配文件
 * 2. 再弹出二次确认弹窗
 * 3. 确认后调用 confirmUpload
 */
function handleMaxConcurrentChange(val: number) {
  try {
    localStorage.setItem('qtrans_max_concurrent_uploads', String(val))
  }
  catch {
    // ignore
  }
}

function handleManualConfirmSubmit() {
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
      const ok = await confirmUpload(params.value)
      if (ok) {
        Message.success('提交成功')
        isSubmitted.value = true
        showSubmittedModal()
      }
    },
  })
}

function showSubmittedModal() {
  Modal.info({
    title: '提交完成',
    content: '文件已提交，请关闭页面',
    okText: '我知道了',
    closable: false,
    maskClosable: false,
    escToClose: false,
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
  for (const file of mismatchedFiles.value) {
    await cancelUpload(file.id, params.value)
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

/**
 * 初始化页面
 */
async function initPage() {
  if (!params.value) {
    Message.error('缺少必要参数 params')
    return
  }

  const result = await initialize(params.value, lang.value)
  if (!result) {
    Message.error('初始化失败，请检查参数是否正确')
  }
  // Task 10: 启动文件列表轮询（增量刷新）
  startFileListPolling()
}

onUnmounted(() => {
  stopFileListPolling()
  stopSessionKeepAlive()
  stopTransTokenRefresh()
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


/**
 * 处理文件选择
 */
async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  await handleFiles(Array.from(input.files))
  input.value = '' // 清空以便重复选择同一文件
}

/**
 * 处理拖拽文件
 */
async function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false

  if (!event.dataTransfer?.files?.length) return
  await handleFiles(Array.from(event.dataTransfer.files))
}

/**
 * 处理文件上传
 */
async function handleFiles(files: File[]) {
  if (!params.value) {
    Message.error('缺少必要参数 params')
    return
  }

  // 先尝试批量断点续传匹配
  files = await batchResumeFromFiles(files, params.value, updateUploadProgress)
  if (files.length === 0) return

  // 检查文件数量限制（BUG5: 优先使用 maxFileCount，需累加已上传数量）
  const maxCount = initData.value?.maxFileCount ?? (initData.value?.maxLength4Name ? 1000 : 20)
  const uploadedCount = fileListData.value?.fileList.length ?? 0
  if (uploadedCount + uploadFileList.value.length + files.length > maxCount) {
    Message.error(`最多只能上传 ${maxCount} 个文件`)
    return
  }

  // 检查文件大小
  const maxSize = (initData.value?.applicationSize || 1024) * 1024 * 1024
  for (const file of files) {
    if (file.size > maxSize) {
      Message.error(`文件 ${file.name} 超过最大限制 ${formatFileSize(maxSize)}`)
      return
    }
  }

  // P0-3: 对齐老代码 onSubmit，校验文件名/路径合法性
  const blackList = initData.value?.blackList || ''
  const maxLength4Name = initData.value?.maxLength4Name || 256
  const maxLength4Path = initData.value?.maxLength4Path || 512
  const invalidFiles = validateFileNames(files, blackList, maxLength4Name, maxLength4Path, '')
  if (invalidFiles.length > 0) {
    const errorMessages = invalidFiles.map(f => `${f.file.name}: ${f.error}`).join('\n')
    Message.error(`文件名校验不通过：${errorMessages}`)
    const invalidFileNames = new Set(invalidFiles.map(f => f.file.name))
    files = files.filter(f => !invalidFileNames.has(f.name))
    if (files.length === 0) return
  }

  // P1-5: 对齐老代码 onValidate，检查存储空间
  const totalFileSize = files.reduce((sum, f) => sum + f.size, 0)
  const hasSpace = await checkStorageSpace(params.value, totalFileSize)
  if (!hasSpace) return

  const uploadedFiles = fileListData.value?.fileList ?? []
  const {
    readyFiles,
    serverDuplicates,
    queueDuplicates,
    selectionDuplicates,
    queueUploadingDuplicates,
  } = detectUploadNameConflicts(files, uploadedFiles, uploadFileList.value, '')

  if (selectionDuplicates.length > 0) {
    Message.warning(`本次选择的 ${selectionDuplicates.length} 个文件存在重名，已自动忽略重复项。`)
  }

  if (queueUploadingDuplicates.length > 0) {
    Message.error(`您选择的 ${queueUploadingDuplicates.length} 个文件正在上传中，请勿重复添加。`)
  }

  if (queueDuplicates.length > 0) {
    Message.error(`您选择的 ${queueDuplicates.length} 个文件已在上传队列中，请勿重复添加。`)
  }

  let filesToUpload = [...readyFiles]

  if (serverDuplicates.length > 0) {
    const confirmed = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '文件已存在',
        content: `您选择的 ${serverDuplicates.length} 个文件在服务器上已存在，是否覆盖上传？`,
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
  await uploadFiles(filesToUpload, params.value, '', updateUploadProgress)

}

/**
 * 刷新已上传文件列表（带重试 + Task 6 防抖）
 * 上传完成后后端 hashCode 可能还没算完，FileListHandler 返回 null
 * 对齐老代码逻辑：如果 hashCode 为 null，延迟再刷新一次
 */
async function refreshFileListWithRetry(relativeDir: string, paramsStr: string, maxRetries = 3) {
  // Task 6: 先防抖延迟，等 uploadFile 完成状态稳定后再刷新
  const doRefresh = async (attempt = 0) => {
    if (attempt > 0) {
      // 重试时给后端计算哈希的时间
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
    await loadFileList(relativeDir, paramsStr)
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
  const idx = uploadFileList.value.findIndex((f: TransUploadFileItem) => f.id === item.id)
  if (idx < 0) return

  // 上传完成：从上传列表移除，并刷新已上传列表
  if (item.status === 'completed' && params.value) {
    uploadFileList.value.splice(idx, 1)
    refreshFileListWithRetry('', params.value)
  }
}

/**
 * 暂停上传
 */
async function handlePause(fileId: string) {
  await pauseUpload(fileId, params.value)
}

/**
 * 继续上传
 * 断点续传恢复的任务没有 File 对象，需用户重新选择文件
 */
async function handleResume(fileId: string) {
  const item = uploadFileList.value.find((f: TransUploadFileItem) => f.id === fileId)
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
        await resumeUpload(fileId, params.value, updateUploadProgress, restoredFile)
      }
    }
    input.click()
    return
  }
  await resumeUpload(fileId, params.value, updateUploadProgress)
}

/**
 * 删除上传项（BUG6: 带防抖，避免批量操作时弹框过多）
 */
function handleDelete(fileId: string) {
  if (cancelUploadModalLock.value) return
  cancelUploadModalLock.value = true
  setTimeout(() => { cancelUploadModalLock.value = false }, 300)
  cancelUpload(fileId, params.value)
}

/**
 * 重试上传
 */
async function handleRetry(fileId: string) {
  await retryUpload(fileId, params.value, updateUploadProgress)
}

/**
 * 切换选择
 */
function handleToggleSelect(fileId: string) {
  const item = uploadFileList.value.find((f: TransUploadFileItem) => f.id === fileId)
  if (item) {
    item.selected = !item.selected
  }
}

/**
 * 全选/取消全选上传中文件
 */
function handleToggleSelectAll(selected: boolean) {
  toggleSelectAll(selected)
}

/**
 * 批量暂停
 */
async function handleBatchPause() {
  await batchPause(params.value)
}

/**
 * 批量继续
 */
function handleBatchResume() {
  batchResume(params.value, updateUploadProgress)
}

/**
 * 批量删除
 */
async function handleBatchDelete() {
  await batchCancel(params.value)
}

/**
 * 确认上传完成（Task 4+5 改造：先检查哈希不匹配 → 再二次确认）
 */
async function handleConfirm() {
  if (uploadFileList.value.some((f: TransUploadFileItem) => f.status === 'uploading')) {
    Message.warning('还有文件正在上传，请等待完成')
    return
  }

  // 走二次确认流程（含哈希不匹配检查）
  handleManualConfirmSubmit()
}

// Task 6: 刷新按钮防抖（500ms 避免频繁请求）
async function handleRefresh() {
  // 已有防抖的 debouncedLoadFileList，避免与 refreshFileListWithRetry 重复调用
  if (params.value) {
    await debouncedLoadFileList('', params.value)
  }
}

/**
 * 删除选中的已上传文件（BUG6: 带防抖）
 */
async function handleDeleteSelectedUploaded() {
  if (selectedUploadedFiles.value.length === 0) {
    Message.warning('请先选择要删除的文件')
    return
  }
  if (cancelUploadModalLock.value) return
  cancelUploadModalLock.value = true
  try {
    const files = selectedUploadedFiles.value.map((f: FileEntity) => ({
      fileName: f.fileName,
      relativeDir: f.relativeDir,
    }))

    await removeFiles(files, params.value)
    selectedUploadedFiles.value = []
  } finally {
    setTimeout(() => { cancelUploadModalLock.value = false }, 300)
  }
}

/**
 * 切换已上传文件选择（BUG1: 使用 findIndex 替代 indexOf 避免对象引用比较问题）
 */
function handleToggleSelectUploaded(file: FileEntity) {
  const index = selectedUploadedFiles.value.findIndex((f: FileEntity) => f.fileId === file.fileId)
  if (index >= 0) {
    selectedUploadedFiles.value.splice(index, 1)
  } else {
    selectedUploadedFiles.value.push(file)
  }
}

/**
 * 全选/取消全选已上传文件
 */
function handleToggleSelectAllUploaded(selected: boolean) {
  if (selected) {
    const currentList = fileListData.value?.fileList ?? []
    const existingIds = new Set(selectedUploadedFiles.value.map((f: FileEntity) => f.fileId))
    currentList.forEach((file: FileEntity) => {
      if (!existingIds.has(file.fileId)) {
        selectedUploadedFiles.value.push(file)
      }
    })
  } else {
    selectedUploadedFiles.value = []
  }
}

/**
 * 删除单个已上传文件（BUG6: 带防抖）
 */
async function handleDeleteUploadedFile(file: FileEntity) {
  if (cancelUploadModalLock.value) return
  cancelUploadModalLock.value = true
  try {
    await removeFiles([{ fileName: file.fileName, relativeDir: file.relativeDir }], params.value)
    const idx = selectedUploadedFiles.value.findIndex((f: FileEntity) => f.fileId === file.fileId)
    if (idx >= 0) selectedUploadedFiles.value.splice(idx, 1)
  } finally {
    setTimeout(() => { cancelUploadModalLock.value = false }, 300)
  }
}

/**
 * 返回
 */
function goBack() {
  router.back()
}

onMounted(() => {
  initPage()
})
</script>

<template>
  <div class="trans-upload-page">
    <!-- 页面头部 -->
    <header class="trans-upload-header">
      <div class="header-left">
        <h2 class="header-title">文件上传</h2>
        <span v-if="initData" class="header-info">
          申请单号: {{ initData.applicationId }}
        </span>
      </div>
      <div class="header-right">
        <!-- Task 9: 隐私政策弹窗 -->
        <a-button type="text" class="privacy-link" @click="showPrivacyPolicy">
          <template #icon><IconFile /></template>
          隐私政策
        </a-button>
        <a-button @click="goBack">返回</a-button>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="initLoading" class="trans-upload-loading">
      <a-spin size="32" />
      <span>正在初始化...</span>
    </div>

    <!-- 主内容 -->
    <template v-else-if="initData">
      <!-- 提交后遮罩 -->
      <div v-if="isSubmitted" class="submitted-overlay">
        <div class="submitted-mask" />
        <div class="submitted-content">
          <p class="submitted-title">文件已提交</p>
          <p class="submitted-hint">请关闭页面</p>
        </div>
      </div>

      <!-- 上传区域 -->
      <section class="trans-upload-dropzone" :class="{ 'is-disabled': isSubmitted }">
        <div class="dropzone-area"
          :class="{ 'is-dragging': isDragging, 'is-disabled': isSubmitted }"
          @drop="!isSubmitted && handleDrop($event)"
          @dragover.prevent="!isSubmitted && (isDragging = true)"
          @dragleave="isDragging = false"
          @click="!isSubmitted && fileInputRef?.click()"
        >
          <IconUpload class="dropzone-icon" />
          <p class="dropzone-text">点击或拖拽文件到此处上传</p>
          <p class="dropzone-hint">
            支持批量上传，单个文件不超过 {{ formatFileSize((initData.applicationSize || 10) * 1024 * 1024 * 1024) }}
          </p>
        </div>
        <div class="dropzone-toolbar">
          <a-checkbox v-model="autoSubmitAfterUpload" :disabled="isSubmitted">上传完毕后自动提交</a-checkbox>
          <span class="concurrent-label">并发数：</span>
          <a-select
            v-model="maxConcurrentUploads"
            size="small"
            style="width: 70px"
            :disabled="isSubmitted"
            @change="handleMaxConcurrentChange"
          >
            <a-option v-for="n in 10" :key="n" :value="n">{{ n }}</a-option>
          </a-select>
          <!-- Task 4: 手动确认提交按钮 -->
          <a-button type="outline" status="success" :disabled="isSubmitted" @click="handleManualConfirmSubmit">
            <template #icon><IconCheck /></template>
            确认提交
          </a-button>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          multiple
          hidden
          @change="handleFileSelect"
        />
      </section>

      <!-- 上传文件列表 -->
      <section v-if="uploadFileList.length > 0" class="trans-upload-section">
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
          @toggle-select-all="handleToggleSelectAll"
          @batch-pause="handleBatchPause"
          @batch-resume="handleBatchResume"
          @batch-delete="handleBatchDelete"
          @clear-completed="clearCompleted"
        />
      </section>

      <!-- 已上传文件列表 -->
      <section v-if="fileListData && fileListData.fileList.length > 0" class="trans-uploaded-section">
        <TransFileTable
          :files="[]"
          mode="uploaded"
          :show-batch-actions="true"
          :show-hash-status="true"
          :uploaded-files="fileListData.fileList"
          :selected-uploaded-files="selectedUploadedFiles"
          @toggle-select-uploaded="handleToggleSelectUploaded"
          @toggle-select-all-uploaded="handleToggleSelectAllUploaded"
          @batch-delete="handleDeleteSelectedUploaded"
          @delete-uploaded-file="handleDeleteUploadedFile"
          @refresh="handleRefresh"
        />
      </section>

      <!-- 底部确认按钮 -->
      <footer class="trans-upload-footer">
        <a-button @click="goBack">取消</a-button>
        <a-button
          type="primary"
          :loading="uploading"
          :disabled="uploadFileList.some((f: TransUploadFileItem) => f.status === 'uploading')"
          @click="handleConfirm"
        >
          确认上传完成
        </a-button>
      </footer>
    </template>

    <!-- 错误状态 -->
    <div v-else class="trans-upload-error">
      <span class="error-icon">⚠️</span>
      <p>初始化失败，请检查参数是否正确</p>
      <a-button type="primary" @click="initPage">重新初始化</a-button>
    </div>

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
            <span class="hash-mismatch-modal__name">{{ file.file?.name || file.fileName }}</span>
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
