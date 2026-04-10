<script setup lang="ts">
/**
 * TransFileTable 组件演示页面
 * 用于在接口不通时调试和预览组件
 * 
 * 访问路径: /trans/demo
 */
import { ref, computed } from 'vue'
import TransFileTable, { type DownloadItem } from '@/components/business/TransFileTable.vue'
import type { DirectoryEntity, FileEntity } from '@/api/transWebService'
import type { TransUploadFileItem } from '@/composables/useTransUpload'

// ============ 模式切换 ============
const currentMode = ref<'upload' | 'uploaded' | 'download'>('upload')

// ============ Mock 数据 - 上传列表 ============

const mockUploadFiles = ref<TransUploadFileItem[]>([
  {
    id: 'upload-1',
    file: new File(['test content'], '测试文档.docx', { type: 'application/docx' }),
    status: 'uploading',
    progress: 45,
    speed: 1024 * 512, // 512 KB/s
    selected: false,
    totalChunks: 10,
    uploadedChunkCount: 5,
  },
  {
    id: 'upload-2',
    file: new File(['test content'], '数据报表.xlsx', { type: 'application/xlsx' }),
    status: 'paused',
    progress: 30,
    speed: 0,
    selected: true,
    totalChunks: 8,
    uploadedChunkCount: 3,
  },
  {
    id: 'upload-3',
    file: new File(['test content'], '项目资料.zip', { type: 'application/zip' }),
    status: 'completed',
    progress: 100,
    speed: 0,
    selected: false,
    totalChunks: 20,
    uploadedChunkCount: 20,
    hashState: { status: 'matched', localHash: 'abc123', serverHash: 'abc123' },
  },
  {
    id: 'upload-4',
    file: new File(['test content'], '演示文稿.pptx', { type: 'application/pptx' }),
    status: 'error',
    progress: 65,
    speed: 0,
    selected: false,
    error: '网络连接中断，请重试',
    totalChunks: 15,
    uploadedChunkCount: 10,
  },
  {
    id: 'upload-5',
    file: new File(['test content'], '技术文档.pdf', { type: 'application/pdf' }),
    status: 'hashing',
    progress: 0,
    speed: 0,
    selected: false,
    hashState: { status: 'calculating' },
    totalChunks: 5,
    uploadedChunkCount: 5,
  },
])

// ============ Mock 数据 - 已上传列表 ============

const mockUploadedFiles = ref<FileEntity[]>([
  {
    fileId: 'file-001',
    fileName: '合同文档.docx',
    fileSize: 1024 * 1024 * 2.5, // 2.5 MB
    filePath: '/uploads/2024/合同文档.docx',
    relativeDir: '/uploads/2024/',
    lastModify: '2024-03-13 10:30:00',
  },
  {
    fileId: 'file-002',
    fileName: '财务报表.xlsx',
    fileSize: 1024 * 512, // 512 KB
    filePath: '/uploads/2024/财务报表.xlsx',
    relativeDir: '/uploads/2024/',
    lastModify: '2024-03-12 15:45:00',
  },
  {
    fileId: 'file-003',
    fileName: '项目归档.zip',
    fileSize: 1024 * 1024 * 50, // 50 MB
    filePath: '/uploads/2024/项目归档.zip',
    relativeDir: '/uploads/2024/',
    lastModify: '2024-03-11 09:20:00',
  },
])

const selectedUploadedFiles = ref<FileEntity[]>([])

// ============ Mock 数据 - 下载列表 ============

const mockDirectories = ref<DirectoryEntity[]>([
  {
    name: '2024年文档',
    relativeDir: '/downloads/2024年文档/',
    filePath: '/downloads/2024年文档/',
    lastModify: '2024-03-10 14:00:00',
  },
  {
    name: '项目资料',
    relativeDir: '/downloads/项目资料/',
    filePath: '/downloads/项目资料/',
    lastModify: '2024-03-09 11:30:00',
  },
])

const mockDownloadFiles = ref<FileEntity[]>([
  {
    fileId: 'dl-001',
    fileName: '用户手册.pdf',
    fileSize: 1024 * 1024 * 5, // 5 MB
    filePath: '/downloads/用户手册.pdf',
    relativeDir: '/downloads/',
    lastModify: '2024-03-13 09:00:00',
  },
  {
    fileId: 'dl-002',
    fileName: '安装包.exe',
    fileSize: 1024 * 1024 * 128, // 128 MB
    filePath: '/downloads/安装包.exe',
    relativeDir: '/downloads/',
    lastModify: '2024-03-12 16:30:00',
  },
  {
    fileId: 'dl-003',
    fileName: '配置文件.json',
    fileSize: 2048, // 2 KB
    filePath: '/downloads/配置文件.json',
    relativeDir: '/downloads/',
    lastModify: '2024-03-13 11:00:00',
  },
])

const selectedDownloadItems = ref<DownloadItem[]>([])
const isAllSelected = ref(false)
const downloading = ref(false)
const downloadProgress = ref<{ fileName: string; progress: number } | null>(null)

// ============ 上传模式事件处理 ============

function handlePause(id: string) {
  const file = mockUploadFiles.value.find(f => f.id === id)
  if (file) {
    file.status = 'paused'
    file.speed = 0
  }
  console.log('暂停上传:', id)
}

function handleResume(id: string) {
  const file = mockUploadFiles.value.find(f => f.id === id)
  if (file) {
    file.status = 'uploading'
    simulateUpload(id)
  }
  console.log('继续上传:', id)
}

function handleDelete(id: string) {
  mockUploadFiles.value = mockUploadFiles.value.filter(f => f.id !== id)
  console.log('删除文件:', id)
}

function handleRetry(id: string) {
  const file = mockUploadFiles.value.find(f => f.id === id)
  if (file) {
    file.status = 'uploading'
    file.error = undefined
    simulateUpload(id)
  }
  console.log('重试上传:', id)
}

function handleToggleSelect(id: string) {
  const file = mockUploadFiles.value.find(f => f.id === id)
  if (file) {
    file.selected = !file.selected
  }
}

function handleToggleSelectAll(selected: boolean) {
  mockUploadFiles.value.forEach(f => {
    if (f.status !== 'uploading') {
      f.selected = selected
    }
  })
}

function handleBatchPause() {
  mockUploadFiles.value.forEach(f => {
    if (f.selected && f.status === 'uploading') {
      f.status = 'paused'
      f.speed = 0
    }
  })
  console.log('批量暂停')
}

function handleBatchResume() {
  mockUploadFiles.value.forEach(f => {
    if (f.selected && f.status === 'paused') {
      f.status = 'uploading'
      simulateUpload(f.id)
    }
  })
  console.log('批量继续')
}

function handleBatchDelete() {
  mockUploadFiles.value = mockUploadFiles.value.filter(f => !f.selected)
  console.log('批量删除')
}

function handleClearCompleted() {
  mockUploadFiles.value = mockUploadFiles.value.filter(f => f.status !== 'completed')
  console.log('清空已完成')
}

// 模拟上传进度
function simulateUpload(id: string) {
  const interval = setInterval(() => {
    const file = mockUploadFiles.value.find(f => f.id === id)
    if (!file || file.status !== 'uploading') {
      clearInterval(interval)
      return
    }
    
    file.progress = Math.min(100, file.progress + Math.random() * 5)
    file.speed = Math.random() * 1024 * 1024 // 0-1 MB/s
    
    if (file.progress >= 100) {
      file.status = 'completed'
      file.speed = 0
      file.hashState = { status: 'matched', localHash: 'test-hash', serverHash: 'test-hash' }
      clearInterval(interval)
    }
  }, 500)
}

// ============ 已上传模式事件处理 ============

function handleToggleSelectUploaded(file: FileEntity) {
  const index = selectedUploadedFiles.value.findIndex(f => f.fileId === file.fileId)
  if (index >= 0) {
    selectedUploadedFiles.value.splice(index, 1)
  } else {
    selectedUploadedFiles.value.push(file)
  }
}

// ============ 下载模式事件处理 ============

function handleEnterDirectory(dir: DirectoryEntity) {
  console.log('进入目录:', dir.name)
  // 模拟进入目录
  alert(`进入目录: ${dir.name}`)
}

function handleGoBack() {
  console.log('返回上级')
  alert('返回上级目录')
}

function handleRefresh() {
  console.log('刷新列表')
  alert('刷新列表')
}

function handleDownloadFile(file: FileEntity) {
  console.log('下载文件:', file.fileName)
  simulateDownload(file.fileName)
}

function handleDownloadDirectory(dir: DirectoryEntity) {
  console.log('下载文件夹:', dir.name)
  simulateDownload(dir.name)
}

function handleDownloadSelected() {
  console.log('批量下载:', selectedDownloadItems.value)
  simulateDownload('选中文件')
}

function handleToggleSelectDownload(item: DownloadItem) {
  const index = selectedDownloadItems.value.findIndex(
    s => s.name === item.name && s.relativeDir === item.relativeDir
  )
  if (index >= 0) {
    selectedDownloadItems.value.splice(index, 1)
  } else {
    selectedDownloadItems.value.push(item)
  }
  
  // 更新全选状态
  const total = mockDirectories.value.length + mockDownloadFiles.value.length
  isAllSelected.value = selectedDownloadItems.value.length === total
}

function handleToggleSelectAllDownload() {
  if (isAllSelected.value) {
    selectedDownloadItems.value = []
    isAllSelected.value = false
  } else {
    selectedDownloadItems.value = [
      ...mockDirectories.value.map(d => ({
        type: 'directory' as const,
        name: d.name,
        relativeDir: d.relativeDir,
        filePath: d.filePath,
        lastModify: d.lastModify,
      })),
      ...mockDownloadFiles.value.map(f => ({
        type: 'file' as const,
        name: f.fileName,
        relativeDir: f.relativeDir,
        filePath: f.filePath,
        fileSize: f.fileSize,
        lastModify: f.lastModify,
      })),
    ]
    isAllSelected.value = true
  }
}

// 模拟下载进度
function simulateDownload(fileName: string) {
  downloading.value = true
  downloadProgress.value = { fileName, progress: 0 }
  
  const interval = setInterval(() => {
    if (!downloadProgress.value) {
      clearInterval(interval)
      return
    }
    
    downloadProgress.value.progress = Math.min(100, downloadProgress.value.progress + Math.random() * 10)
    
    if (downloadProgress.value.progress >= 100) {
      clearInterval(interval)
      setTimeout(() => {
        downloading.value = false
        downloadProgress.value = null
      }, 500)
    }
  }, 300)
}

// ============ 添加测试文件 ============

function addTestFile() {
  const id = `upload-${Date.now()}`
  const names = ['新文档.docx', '测试文件.xlsx', '压缩包.zip', '图片.png', '代码文件.ts']
  const name = names[Math.floor(Math.random() * names.length)]
  
  mockUploadFiles.value.push({
    id,
    file: new File(['test'], name, { type: 'application/octet-stream' }),
    status: 'uploading',
    progress: 0,
    speed: 1024 * 100,
    selected: false,
    totalChunks: 10,
    uploadedChunkCount: 0,
  })
  
  simulateUpload(id)
}
</script>

<template>
  <div class="demo-page">
    <!-- 模式切换 -->
    <header class="demo-header">
      <h1>TransFileTable 组件演示</h1>
      <div class="mode-switcher">
        <a-radio-group v-model="currentMode" type="button">
          <a-radio value="upload">上传列表模式</a-radio>
          <a-radio value="uploaded">已上传模式</a-radio>
          <a-radio value="download">下载模式</a-radio>
        </a-radio-group>
      </div>
    </header>

    <!-- 操作说明 -->
    <div class="demo-info">
      <a-alert type="info" banner>
        <template #message>
          <strong>调试说明：</strong>
          <span v-if="currentMode === 'upload'">点击"添加测试文件"按钮模拟上传，或操作现有文件测试暂停/继续/删除功能</span>
          <span v-else-if="currentMode === 'uploaded'">点击文件进行选择，测试批量删除功能</span>
          <span v-else>模拟文件下载场景，支持进入目录、批量下载</span>
        </template>
      </a-alert>
    </div>

    <!-- 上传模式 -->
    <template v-if="currentMode === 'upload'">
      <div class="demo-actions">
        <a-button type="primary" @click="addTestFile">添加测试文件</a-button>
      </div>
      <TransFileTable
        mode="upload"
        :files="mockUploadFiles"
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
        @clear-completed="handleClearCompleted"
      />
    </template>

    <!-- 已上传模式 -->
    <template v-else-if="currentMode === 'uploaded'">
      <TransFileTable
        mode="uploaded"
        :uploaded-files="mockUploadedFiles"
        :selected-uploaded-files="selectedUploadedFiles"
        :show-batch-actions="true"
        @toggle-select-uploaded="handleToggleSelectUploaded"
        @batch-delete="() => { selectedUploadedFiles.forEach(f => console.log('删除:', f.fileName)); selectedUploadedFiles = [] }"
      />
    </template>

    <!-- 下载模式 -->
    <template v-else>
      <TransFileTable
        mode="download"
        :directories="mockDirectories"
        :download-files="mockDownloadFiles"
        :selected-download-items="selectedDownloadItems"
        :is-all-selected="isAllSelected"
        current-path="/downloads/"
        :is-root-directory="false"
        :downloading="downloading"
        :download-progress="downloadProgress"
        @go-back="handleGoBack"
        @refresh="handleRefresh"
        @enter-directory="handleEnterDirectory"
        @download-file="handleDownloadFile"
        @download-directory="handleDownloadDirectory"
        @download-selected="handleDownloadSelected"
        @toggle-select-all-download="handleToggleSelectAllDownload"
        @toggle-select-download="handleToggleSelectDownload"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.demo-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h1 {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }
}

.demo-info {
  margin-bottom: 16px;
}

.demo-actions {
  margin-bottom: 16px;
}
</style>
