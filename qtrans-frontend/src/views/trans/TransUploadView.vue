<script setup lang="ts">
/**
 * TransUploadView - 外网独立上传页面
 * 使用 useTransUpload + TransFileTable 组件
 */
import {
  IconDelete,
  IconRefresh,
  IconUpload,
} from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FileEntity } from '@/api/transWebService'
import type { TransUploadFileItem } from '@/composables/useTransUpload'
import { useTransUpload } from '@/composables/useTransUpload'
import TransFileTable from '@/components/business/TransFileTable.vue'
import { formatFileSize } from '@/utils/format'
import './trans-upload.scss'

const route = useRoute()
const router = useRouter()

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

// 获取路由参数
const params = computed(() => route.query.params as string || '')
const lang = computed(() => route.query.lang as string || 'zh_CN')

// 上传区域状态
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 选中的已上传文件
const selectedUploadedFiles = ref<FileEntity[]>([])

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

  // 检查文件数量限制
  const maxCount = initData.value?.maxLength4Name ? 1000 : 20
  if (uploadFileList.value.length + files.length > maxCount) {
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

  // 批量上传
  await uploadFiles(files, params.value, '', updateUploadProgress)
}

/**
 * 更新上传进度
 */
function updateUploadProgress(item: TransUploadFileItem) {
  console.log(`Upload progress: ${item.file?.name} - ${item.progress}%`)

  const idx = uploadFileList.value.findIndex((f: TransUploadFileItem) => f.id === item.id)

  // 上传完成：从上传列表移除，并刷新已上传列表
  if (item.status === 'completed' && params.value) {
    if (idx >= 0) {
      uploadFileList.value.splice(idx, 1)
    }
    loadFileList('', params.value)
    return
  }

  // 其他状态：更新列表项
  if (idx >= 0) {
    uploadFileList.value[idx] = { ...item }
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
 */
async function handleResume(fileId: string) {
  await resumeUpload(fileId, params.value, updateUploadProgress)
}

/**
 * 删除上传项
 */
function handleDelete(fileId: string) {
  cancelUpload(fileId)
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
 * 批量暂停
 */
async function handleBatchPause() {
  await batchPause(params.value)
}

/**
 * 批量继续
 */
async function handleBatchResume() {
  await batchResume(params.value, updateUploadProgress)
}

/**
 * 批量删除
 */
async function handleBatchDelete() {
  await batchCancel()
}

/**
 * 确认上传完成
 */
async function handleConfirm() {
  if (uploadFileList.value.some((f: TransUploadFileItem) => f.status === 'uploading')) {
    Message.warning('还有文件正在上传，请等待完成')
    return
  }

  const result = await confirmUpload(params.value)
  if (result) {
    Message.success('上传确认成功')
  }
}

/**
 * 刷新已上传文件列表
 */
async function handleRefresh() {
  if (params.value) {
    await loadFileList('', params.value)
  }
}

/**
 * 删除选中的已上传文件
 */
async function handleDeleteSelectedUploaded() {
  if (selectedUploadedFiles.value.length === 0) {
    Message.warning('请先选择要删除的文件')
    return
  }

  const files = selectedUploadedFiles.value.map((f: FileEntity) => ({
    fileName: f.fileName,
    relativeDir: f.relativeDir,
  }))

  await removeFiles(files, params.value)
  selectedUploadedFiles.value = []
}

/**
 * 切换已上传文件选择
 */
function handleToggleSelectUploaded(file: FileEntity) {
  const index = selectedUploadedFiles.value.indexOf(file)
  if (index >= 0) {
    selectedUploadedFiles.value.splice(index, 1)
  } else {
    selectedUploadedFiles.value.push(file)
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
      <!-- 上传区域 -->
      <section class="trans-upload-dropzone">
        <div
          class="dropzone-area"
          :class="{ 'is-dragging': isDragging }"
          @drop="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @click="fileInputRef?.click()"
        >
          <IconUpload class="dropzone-icon" />
          <p class="dropzone-text">点击或拖拽文件到此处上传</p>
          <p class="dropzone-hint">
            支持批量上传，单个文件不超过 {{ formatFileSize((initData.applicationSize || 10) * 1024 * 1024 * 1024) }}
          </p>
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
          @batch-pause="handleBatchPause"
          @batch-resume="handleBatchResume"
          @batch-delete="handleBatchDelete"
          @clear-completed="clearCompleted"
        />
      </section>

      <!-- 已上传文件列表 -->
      <section v-if="fileListData && fileListData.fileList.length > 0" class="trans-uploaded-section">
        <header class="uploaded-header">
          <h3>已上传文件 ({{ fileListData.totalFileCount }})</h3>
          <div class="uploaded-actions">
            <a-button size="small" @click="handleRefresh">
              <template #icon><IconRefresh /></template>
              刷新
            </a-button>
            <a-button
              v-if="selectedUploadedFiles.length > 0"
              size="small"
              status="danger"
              @click="handleDeleteSelectedUploaded"
            >
              <template #icon><IconDelete /></template>
              删除选中 ({{ selectedUploadedFiles.length }})
            </a-button>
          </div>
        </header>

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
  </div>
</template>
