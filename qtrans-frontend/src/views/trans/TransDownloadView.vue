<script setup lang="ts">
import {
  IconDownload,
  IconFile,
  IconFolder,
  IconLeft,
  IconRefresh,
} from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DirectoryEntity, FileEntity } from '@/api/transWebService'
import { useTransDownload } from '@/composables/useTransDownload'
import { formatFileSize } from '@/utils/format'
import './trans-download.scss'

const route = useRoute()
const router = useRouter()

const {
  loading,
  initLoading,
  initData,
  fileListData,
  currentRelativeDir,
  selectedFiles,
  downloadProgress,
  downloading,
  initialize,
  enterDirectory,
  goBack,
  refreshCurrent,
  toggleSelectFile,
  toggleSelectAll,
  downloadFile,
  downloadDirectory,
  downloadSelected,
  getFileIcon,
  isRootDirectory,
  formatFileSize: transFormatFileSize,
} = useTransDownload()

// 获取路由参数
const params = computed(() => route.query.params as string || '')
const lang = computed(() => route.query.lang as string || 'zh_CN')

// 是否全选
const isAllSelected = computed(() => {
  if (!fileListData.value) return false
  const totalItems = fileListData.value.directoryList.length + fileListData.value.fileList.length
  return totalItems > 0 && selectedFiles.value.length === totalItems
})

// 统计信息
const totalSize = computed(() => fileListData.value?.totalFileSize || 0)

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
 * 返回上级
 */
async function handleGoBack() {
  if (isRootDirectory()) {
    router.back()
  }
  else {
    await goBack(params.value)
  }
}

/**
 * 刷新当前目录
 */
async function handleRefresh() {
  await refreshCurrent(params.value)
}

/**
 * 进入目录
 */
async function handleEnterDirectory(directory: DirectoryEntity) {
  await enterDirectory(directory, params.value)
}

/**
 * 下载单个文件
 */
async function handleDownloadFile(file: FileEntity) {
  await downloadFile(file, params.value)
}

/**
 * 下载文件夹
 */
async function handleDownloadDirectory(directory: DirectoryEntity) {
  await downloadDirectory(directory, params.value)
}

/**
 * 批量下载选中的文件
 */
async function handleDownloadSelected() {
  await downloadSelected(params.value)
}

/**
 * 切换全选
 */
function handleToggleSelectAll() {
  toggleSelectAll()
}

/**
 * 检查是否选中
 */
function isSelected(item: { name: string; relativeDir: string }): boolean {
  return selectedFiles.value.some(
    f => f.name === item.name && f.relativeDir === item.relativeDir,
  )
}

/**
 * 返回
 */
function goBackToHome() {
  router.back()
}

onMounted(() => {
  initPage()
})
</script>

<template>
  <div class="trans-download-page">
    <!-- 页面头部 -->
    <header class="trans-download-header">
      <div class="header-left">
        <h2 class="header-title">文件下载</h2>
        <span v-if="initData" class="header-info">
          申请单号: {{ initData.applicationId }}
        </span>
      </div>
      <div class="header-right">
        <a-button @click="goBackToHome">返回</a-button>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="initLoading" class="trans-download-loading">
      <a-spin size="32" />
      <span>正在初始化...</span>
    </div>

    <!-- 主内容 -->
    <template v-else-if="initData">
      <!-- 工具栏 -->
      <section class="trans-download-toolbar">
        <div class="toolbar-left">
          <a-button
            size="small"
            :disabled="isRootDirectory()"
            @click="handleGoBack"
          >
            <template #icon><IconLeft /></template>
            返回上级
          </a-button>
          <span class="toolbar-path">
            {{ currentRelativeDir || '根目录' }}
          </span>
        </div>
        <div class="toolbar-right">
          <a-button size="small" @click="handleRefresh">
            <template #icon><IconRefresh /></template>
            刷新
          </a-button>
          <a-button
            type="primary"
            size="small"
            :loading="downloading"
            :disabled="selectedFiles.length === 0"
            @click="handleDownloadSelected"
          >
            <template #icon><IconDownload /></template>
            下载选中 ({{ selectedFiles.length }})
          </a-button>
        </div>
      </section>

      <!-- 文件列表 -->
      <section class="trans-download-list">
        <!-- 列表头部 -->
        <header class="list-header">
          <a-checkbox
            :model-value="isAllSelected"
            :indeterminate="selectedFiles.length > 0 && !isAllSelected"
            @change="handleToggleSelectAll"
          />
          <span class="list-header__name">名称</span>
          <span class="list-header__size">大小</span>
          <span class="list-header__time">修改时间</span>
          <span class="list-header__actions">操作</span>
        </header>

        <!-- 加载中 -->
        <div v-if="loading" class="list-loading">
          <a-spin />
        </div>

        <!-- 空状态 -->
        <div v-else-if="!fileListData || (fileListData.directoryList.length === 0 && fileListData.fileList.length === 0)" class="list-empty">
          <a-empty description="当前目录为空" />
        </div>

        <!-- 文件夹列表 -->
        <template v-else>
          <div
            v-for="dir in fileListData?.directoryList || []"
            :key="dir.relativeDir"
            class="list-item list-item--directory"
            :class="{ 'is-selected': isSelected(dir) }"
          >
            <a-checkbox
              :model-value="isSelected(dir)"
              @change="toggleSelectFile({
                type: 'directory',
                name: dir.name,
                relativeDir: dir.relativeDir,
                filePath: dir.filePath,
                lastModify: dir.lastModify,
              })"
            />
            <div class="list-item__name" @click="handleEnterDirectory(dir)">
              <IconFolder class="list-item__icon list-item__icon--folder" />
              <span class="list-item__text">{{ dir.name }}</span>
            </div>
            <span class="list-item__size">-</span>
            <span class="list-item__time">{{ dir.lastModify || '-' }}</span>
            <div class="list-item__actions">
              <a-button
                type="text"
                size="small"
                :loading="downloading && downloadProgress?.fileName === dir.name"
                @click="handleDownloadDirectory(dir)"
              >
                <template #icon><IconDownload /></template>
              </a-button>
            </div>
          </div>

          <!-- 文件列表 -->
          <div
            v-for="file in fileListData?.fileList || []"
            :key="file.fileId"
            class="list-item list-item--file"
            :class="{ 'is-selected': isSelected(file) }"
          >
            <a-checkbox
              :model-value="isSelected(file)"
              @change="toggleSelectFile({
                type: 'file',
                name: file.fileName,
                relativeDir: file.relativeDir,
                filePath: file.filePath,
                fileSize: file.fileSize,
                lastModify: file.lastModify,
              })"
            />
            <div class="list-item__name">
              <img :src="getFileIcon(file.fileName)" alt="file" class="list-item__icon" />
              <span class="list-item__text">{{ file.fileName }}</span>
            </div>
            <span class="list-item__size">{{ transFormatFileSize(file.fileSize) }}</span>
            <span class="list-item__time">{{ file.lastModify || '-' }}</span>
            <div class="list-item__actions">
              <a-button
                type="text"
                size="small"
                :loading="downloading && downloadProgress?.fileName === file.fileName"
                @click="handleDownloadFile(file)"
              >
                <template #icon><IconDownload /></template>
              </a-button>
            </div>
          </div>
        </template>
      </section>

      <!-- 底部信息 -->
      <footer class="trans-download-footer">
        <div class="footer-info">
          <span v-if="fileListData">
            共 {{ fileListData.totalFileCount }} 个文件，
            总大小: {{ transFormatFileSize(totalSize) }}
          </span>
        </div>
      </footer>

      <!-- 下载进度提示 -->
      <div v-if="downloading && downloadProgress" class="download-progress-toast">
        <div class="toast-content">
          <a-spin size="small" />
          <span>正在下载: {{ downloadProgress.fileName }}</span>
          <a-progress
            :percent="downloadProgress.progress"
            :stroke-width="4"
            size="small"
            style="width: 120px"
          />
        </div>
      </div>
    </template>

    <!-- 错误状态 -->
    <div v-else class="trans-download-error">
      <IconFile class="error-icon" />
      <p>初始化失败，请检查参数是否正确</p>
      <a-button type="primary" @click="initPage">重新初始化</a-button>
    </div>
  </div>
</template>
