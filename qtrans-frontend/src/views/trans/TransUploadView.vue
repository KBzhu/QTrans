<script setup lang="ts">
import {
  IconDelete,
  IconEye,
  IconFile,
  IconFolder,
  IconPause,
  IconPlayArrow,
  IconRefresh,
  IconUpload,
} from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FileEntity, TransUploadFileItem } from '@/composables/useTransUpload'
import { useTransUpload } from '@/composables/useTransUpload'
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
  uploadFile,
  confirmUpload,
  removeFiles,
  pauseUpload,
  cancelUpload,
  retryUpload,
  clearCompleted,
  formatSpeed,
} = useTransUpload()

// 获取路由参数
const params = computed(() => route.query.params as string || '')
const lang = computed(() => route.query.lang as string || 'zh_CN')

// 上传区域状态
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 统计信息
const completedCount = computed(() => uploadFileList.value.filter(f => f.status === 'completed').length)
const uploadingCount = computed(() => uploadFileList.value.filter(f => f.status === 'uploading').length)
const hasUploading = computed(() => uploadingCount.value > 0)

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

  // 逐个上传
  for (const file of files) {
    await uploadFile(file, params.value, '', updateUploadProgress)
  }
}

/**
 * 更新上传进度
 */
function updateUploadProgress(item: TransUploadFileItem) {
  // 进度更新由 composable 内部处理
  console.log(`Upload progress: ${item.file.name} - ${item.progress}%`)
}

/**
 * 暂停/继续上传
 */
function handlePauseResume(item: TransUploadFileItem) {
  if (item.status === 'uploading') {
    pauseUpload(item.id)
  }
  else if (item.status === 'paused') {
    retryUpload(item.id, params.value, updateUploadProgress)
  }
}

/**
 * 删除上传项
 */
function handleDeleteUpload(item: TransUploadFileItem) {
  cancelUpload(item.id)
}

/**
 * 重试上传
 */
async function handleRetry(item: TransUploadFileItem) {
  await retryUpload(item.id, params.value, updateUploadProgress)
}

/**
 * 全部暂停
 */
function handlePauseAll() {
  uploadFileList.value
    .filter(f => f.status === 'uploading')
    .forEach(f => pauseUpload(f.id))
}

/**
 * 全部继续
 */
async function handleResumeAll() {
  for (const item of uploadFileList.value.filter(f => f.status === 'paused')) {
    await retryUpload(item.id, params.value, updateUploadProgress)
  }
}

/**
 * 确认上传完成
 */
async function handleConfirm() {
  if (uploadFileList.value.some(f => f.status === 'uploading')) {
    Message.warning('还有文件正在上传，请等待完成')
    return
  }

  const result = await confirmUpload(params.value)
  if (result) {
    Message.success('上传确认成功')
    // 可以跳转或关闭页面
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
async function handleDeleteSelected() {
  if (selectedUploadedFiles.value.length === 0) {
    Message.warning('请先选择要删除的文件')
    return
  }

  const files = selectedUploadedFiles.value.map(f => ({
    fileName: f.fileName,
    relativeDir: f.relativeDir,
  }))

  await removeFiles(files, params.value)
  selectedUploadedFiles.value = []
}

/**
 * 获取文件图标
 */
function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const iconMap: Record<string, string> = {
    doc: '34',
    docx: '34',
    xls: '31',
    xlsx: '31',
    zip: '37',
    ppt: '40',
    pptx: '40',
    pdf: '34',
    txt: '34',
    jpg: '34',
    jpeg: '34',
    png: '34',
    gif: '34',
  }
  const iconNum = iconMap[ext] || '34'
  return `/figma/3883_5466/${iconNum}.svg`
}

/**
 * 获取状态标签
 */
function getStatusLabel(status: TransUploadFileItem['status']): string {
  const labelMap: Record<string, string> = {
    pending: '待上传',
    uploading: '上传中',
    hashing: '计算哈希',
    verifying: '校验中',
    completed: '已完成',
    error: '失败',
    paused: '已暂停',
  }
  return labelMap[status] || status
}

/**
 * 获取状态颜色
 */
function getStatusColor(status: TransUploadFileItem['status']): string {
  const colorMap: Record<string, string> = {
    pending: 'gray',
    uploading: 'blue',
    hashing: 'purple',
    verifying: 'cyan',
    completed: 'green',
    error: 'red',
    paused: 'orange',
  }
  return colorMap[status] || 'gray'
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

      <!-- 上传列表工具栏 -->
      <section v-if="uploadFileList.length > 0" class="trans-upload-toolbar">
        <div class="toolbar-info">
          共 {{ uploadFileList.length }} 个文件，已完成 {{ completedCount }} 个
        </div>
        <div class="toolbar-actions">
          <a-button v-if="hasUploading" size="small" @click="handlePauseAll">
            <template #icon><IconPause /></template>
            全部暂停
          </a-button>
          <a-button v-if="uploadFileList.some(f => f.status === 'paused')" size="small" @click="handleResumeAll">
            <template #icon><IconPlayArrow /></template>
            全部继续
          </a-button>
          <a-button v-if="completedCount > 0" size="small" @click="clearCompleted">
            清空已完成
          </a-button>
        </div>
      </section>

      <!-- 上传文件列表 -->
      <section v-if="uploadFileList.length > 0" class="trans-upload-list">
        <div v-for="item in uploadFileList" :key="item.id" class="upload-item">
          <img :src="getFileIcon(item.file.name)" alt="file" class="upload-item__icon" />

          <div class="upload-item__info">
            <div class="upload-item__header">
              <span class="upload-item__name" :title="item.file.name">{{ item.file.name }}</span>
              <span class="upload-item__size">{{ formatFileSize(item.file.size) }}</span>
            </div>

            <div class="upload-item__progress">
              <a-progress
                :percent="item.progress"
                :status="item.status === 'error' ? 'danger' : item.status === 'completed' ? 'success' : 'normal'"
                :show-text="false"
              />
              <div class="upload-item__meta">
                <span class="upload-item__speed">{{ formatSpeed(item.speed) }}</span>
                <a-tag :color="getStatusColor(item.status)" size="small">
                  {{ getStatusLabel(item.status) }}
                </a-tag>
              </div>
            </div>

            <!-- 哈希校验状态 -->
            <div v-if="item.hashState" class="upload-item__hash">
              <span v-if="item.hashState.status === 'calculating'">
                正在计算文件哈希...
              </span>
              <span v-else-if="item.hashState.status === 'verifying'">
                正在校验文件完整性...
              </span>
              <span v-else-if="item.hashState.status === 'matched'" class="hash-success">
                ✓ 文件校验通过
              </span>
              <span v-else-if="item.hashState.status === 'mismatched'" class="hash-error">
                ✗ 文件校验失败，请重新上传
              </span>
            </div>

            <div v-if="item.error" class="upload-item__error">
              {{ item.error }}
            </div>
          </div>

          <div class="upload-item__actions">
            <a-button
              v-if="item.status === 'uploading'"
              type="text"
              size="small"
              @click="handlePauseResume(item)"
            >
              <template #icon><IconPause /></template>
            </a-button>

            <a-button
              v-if="item.status === 'paused'"
              type="text"
              size="small"
              @click="handlePauseResume(item)"
            >
              <template #icon><IconPlayArrow /></template>
            </a-button>

            <a-button
              v-if="item.status === 'error'"
              type="text"
              size="small"
              @click="handleRetry(item)"
            >
              <template #icon><IconRefresh /></template>
            </a-button>

            <a-button
              v-if="item.status !== 'uploading'"
              type="text"
              size="small"
              status="danger"
              @click="handleDeleteUpload(item)"
            >
              <template #icon><IconDelete /></template>
            </a-button>
          </div>
        </div>
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
              @click="handleDeleteSelected"
            >
              <template #icon><IconDelete /></template>
              删除选中 ({{ selectedUploadedFiles.length }})
            </a-button>
          </div>
        </header>

        <div class="uploaded-list">
          <div
            v-for="file in fileListData.fileList"
            :key="file.fileId"
            class="uploaded-item"
            :class="{ 'is-selected': selectedUploadedFiles.includes(file) }"
            @click="selectedUploadedFiles.includes(file)
              ? selectedUploadedFiles.splice(selectedUploadedFiles.indexOf(file), 1)
              : selectedUploadedFiles.push(file)"
          >
            <img :src="getFileIcon(file.fileName)" alt="file" class="uploaded-item__icon" />
            <div class="uploaded-item__info">
              <span class="uploaded-item__name">{{ file.fileName }}</span>
              <span class="uploaded-item__size">{{ formatFileSize(file.fileSize) }}</span>
            </div>
            <IconEye v-if="selectedUploadedFiles.includes(file)" class="uploaded-item__check" />
          </div>
        </div>
      </section>

      <!-- 底部确认按钮 -->
      <footer class="trans-upload-footer">
        <a-button @click="goBack">取消</a-button>
        <a-button
          type="primary"
          :loading="uploading"
          :disabled="uploadFileList.some(f => f.status === 'uploading')"
          @click="handleConfirm"
        >
          确认上传完成
        </a-button>
      </footer>
    </template>

    <!-- 错误状态 -->
    <div v-else class="trans-upload-error">
      <IconFile class="error-icon" />
      <p>初始化失败，请检查参数是否正确</p>
      <a-button type="primary" @click="initPage">重新初始化</a-button>
    </div>
  </div>
</template>
