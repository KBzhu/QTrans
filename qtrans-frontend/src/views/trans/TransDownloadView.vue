<script setup lang="ts">
/**
 * TransDownloadView - 文件下载页面
 * 使用 TransFileTable 组件展示文件列表
 */
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import type { DirectoryEntity, FileEntity } from '@/api/transWebService'
import { useTransDownload } from '@/composables/useTransDownload'
import TransFileTable, { type DownloadItem } from '@/components/business/TransFileTable.vue'
import './trans-download.scss'

const route = useRoute()
const router = useRouter()

const {
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
  isRootDirectory,
} = useTransDownload()

// 获取路由参数
const params = computed(() => route.query.params as string || '')
const lang = computed(() => route.query.lang as string || 'zh_CN')

// 转换选中文件为 DownloadItem 格式
const selectedDownloadItems = computed<DownloadItem[]>(() =>
  selectedFiles.value.map(f => ({
    type: f.type,
    name: f.name,
    relativeDir: f.relativeDir,
    filePath: f.filePath,
    fileSize: f.fileSize,
    lastModify: f.lastModify,
  }))
)

// 是否全选
const isAllSelected = computed(() => {
  if (!fileListData.value) return false
  const totalItems = fileListData.value.directoryList.length + fileListData.value.fileList.length
  return totalItems > 0 && selectedFiles.value.length === totalItems
})

// 初始化页面
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

// 事件处理
function handleGoBack() {
  if (isRootDirectory()) {
    router.back()
  } else {
    goBack(params.value)
  }
}

function handleRefresh() {
  refreshCurrent(params.value)
}

function handleEnterDirectory(dir: DirectoryEntity) {
  enterDirectory(dir, params.value)
}

function handleDownloadFile(file: FileEntity) {
  downloadFile(file, params.value)
}

function handleDownloadDirectory(dir: DirectoryEntity) {
  downloadDirectory(dir, params.value)
}

function handleDownloadSelected() {
  downloadSelected(params.value)
}

function handleToggleSelectAll() {
  toggleSelectAll()
}

function handleToggleSelectDownload(item: DownloadItem) {
  toggleSelectFile({
    type: item.type,
    name: item.name,
    relativeDir: item.relativeDir,
    filePath: item.filePath,
    fileSize: item.fileSize,
    lastModify: item.lastModify,
  })
}

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
      <TransFileTable
        mode="download"
        :directories="fileListData?.directoryList || []"
        :download-files="fileListData?.fileList || []"
        :selected-download-items="selectedDownloadItems"
        :is-all-selected="isAllSelected"
        :current-path="currentRelativeDir"
        :is-root-directory="isRootDirectory()"
        :downloading="downloading"
        :download-progress="downloadProgress"
        @go-back="handleGoBack"
        @refresh="handleRefresh"
        @enter-directory="handleEnterDirectory"
        @download-file="handleDownloadFile"
        @download-directory="handleDownloadDirectory"
        @download-selected="handleDownloadSelected"
        @toggle-select-all-download="handleToggleSelectAll"
        @toggle-select-download="handleToggleSelectDownload"
      />
    </template>

    <!-- 错误状态 -->
    <div v-else class="trans-download-error">
      <span class="error-icon">⚠️</span>
      <p>初始化失败，请检查参数是否正确</p>
      <a-button type="primary" @click="initPage">重新初始化</a-button>
    </div>
  </div>
</template>
