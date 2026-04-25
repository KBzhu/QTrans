<script setup lang="ts">
/**
 * TransFileTable - 通用文件表格组件
 * 支持三种模式：upload(上传列表)、uploaded(已上传列表)、download(下载列表)
 */
import {
  IconDelete,
  IconPause,
  IconPlayArrow,
  IconRefresh,
  IconCheck,
  IconDownload,
  IconFolder,
  IconLeft,
} from '@arco-design/web-vue/es/icon'
import { computed, ref } from 'vue'
import type { TransUploadFileItem } from '@/composables/useTransUpload'
import type { DirectoryEntity, FileEntity } from '@/api/transWebService'
import { formatFileSize, formatTransferSpeed } from '@/utils/format'
import './trans-file-table.scss'

// ============ Types ============

/** 下载列表项 */
export interface DownloadItem {
  type: 'file' | 'directory'
  name: string
  size?: number
  lastModify?: string
  relativeDir: string
  filePath: string
  // 文件特有
  fileId?: string
  fileSize?: number
  // 选中状态
  selected?: boolean
}

// ============ Props ============

interface Props {
  /** 模式：upload=上传列表，uploaded=已上传列表，download=下载列表 */
  mode?: 'upload' | 'uploaded' | 'download'
  /** 上传列表文件 */
  files?: TransUploadFileItem[]
  /** 已上传文件列表 */
  uploadedFiles?: FileEntity[]
  /** 下载列表：文件夹 */
  directories?: DirectoryEntity[]
  /** 下载列表：文件 */
  downloadFiles?: FileEntity[]
  /** 选中的下载项 */
  selectedDownloadItems?: DownloadItem[]
  /** 是否显示批量操作 */
  showBatchActions?: boolean
  /** 是否显示哈希校验状态 */
  showHashStatus?: boolean
  /** 选中的已上传文件 */
  selectedUploadedFiles?: FileEntity[]
  /** 是否全选（下载模式） */
  isAllSelected?: boolean
  /** 当前路径（下载模式） */
  currentPath?: string
  /** 是否在根目录（下载模式） */
  isRootDirectory?: boolean
  /** 是否正在下载 */
  downloading?: boolean
  /** 下载进度信息 */
  downloadProgress?: { fileName: string; progress: number } | null
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'upload',
  files: () => [],
  uploadedFiles: () => [],
  directories: () => [],
  downloadFiles: () => [],
  selectedDownloadItems: () => [],
  showBatchActions: true,
  showHashStatus: true,
  selectedUploadedFiles: () => [],
  isAllSelected: false,
  currentPath: '',
  isRootDirectory: true,
  downloading: false,
  downloadProgress: null,
})

// ============ Emits ============

const emit = defineEmits<{
  // 上传模式
  (e: 'pause', id: string): void
  (e: 'resume', id: string): void
  (e: 'delete', id: string): void
  (e: 'retry', id: string): void
  (e: 'toggle-select', id: string): void
  (e: 'batch-pause'): void
  (e: 'batch-resume'): void
  (e: 'batch-delete'): void
  (e: 'clear-completed'): void
  (e: 'toggle-select-all', selected: boolean): void
  
  // 已上传模式
  (e: 'toggle-select-uploaded', file: FileEntity): void
  (e: 'toggle-select-all-uploaded', selected: boolean): void
  (e: 'delete-uploaded-file', file: FileEntity): void
  (e: 'refresh'): void

  // 下载模式
  (e: 'enter-directory', dir: DirectoryEntity): void
  (e: 'go-back'): void
  (e: 'download-file', file: FileEntity): void
  (e: 'download-directory', dir: DirectoryEntity): void
  (e: 'download-selected'): void
  (e: 'refresh'): void
  (e: 'toggle-select-download', item: DownloadItem): void
  (e: 'toggle-select-all-download'): void
}>()

// ============ State ============

const searchKeyword = ref('')

// ============ Computed ============

const isUploadMode = computed(() => props.mode === 'upload')
const isDownloadMode = computed(() => props.mode === 'download')

/** 上传列表过滤后的文件 */
const filteredFiles = computed(() => {
  if (!searchKeyword.value) return props.files
  const kw = searchKeyword.value.toLowerCase()
  return props.files.filter((f: TransUploadFileItem) =>
    (f.file?.name || f.fileName || '').toLowerCase().includes(kw)
  )
})

/** 已上传列表过滤后的文件 */
const filteredUploadedFiles = computed(() => {
  if (!searchKeyword.value) return props.uploadedFiles
  const kw = searchKeyword.value.toLowerCase()
  return props.uploadedFiles.filter((f: FileEntity) =>
    f.fileName.toLowerCase().includes(kw)
  )
})

const selectedCount = computed(() =>
  props.files.filter((f: TransUploadFileItem) => f.selected).length
)

const hasSelection = computed(() => selectedCount.value > 0)

const pendingCount = computed(() =>
  props.files.filter((f: TransUploadFileItem) => f.status === 'pending').length
)

const uploadingCount = computed(() =>
  props.files.filter((f: TransUploadFileItem) => f.status === 'uploading').length
)

const pausedCount = computed(() =>
  props.files.filter((f: TransUploadFileItem) => f.status === 'paused').length
)

const completedCount = computed(() =>
  props.files.filter((f: TransUploadFileItem) => f.status === 'completed').length
)

const selectedUploadedCount = computed(() =>
  props.selectedUploadedFiles.length
)

const totalUploadedSize = computed(() =>
  props.uploadedFiles.reduce((sum: number, f: FileEntity) => sum + f.fileSize, 0)
)

const selectedDownloadCount = computed(() =>
  props.selectedDownloadItems.length
)

const totalDownloadItems = computed(() =>
  props.directories.length + props.downloadFiles.length
)

const totalDownloadSize = computed(() =>
  props.downloadFiles.reduce((sum: number, f: FileEntity) => sum + f.fileSize, 0)
)

// ============ Methods ============

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

function handlePauseResume(item: TransUploadFileItem) {
  if (item.status === 'uploading') {
    emit('pause', item.id)
  } else if (item.status === 'paused' || item.status === 'error') {
    emit('resume', item.id)
  }
}

function isDownloadItemSelected(item: DownloadItem): boolean {
  return props.selectedDownloadItems.some(
    (s: DownloadItem) => s.name === item.name && s.relativeDir === item.relativeDir
  )
}

function handleDownloadSelect(item: DownloadItem) {
  emit('toggle-select-download', item)
}

/** 截断哈希值展示 */
function truncateHash(hash: string | undefined): string {
  if (!hash) return '-'
  if (hash.length <= 16) return hash
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 4)}`
}

/** 判断哈希校验是否通过（对齐老代码 validHashTimer 逻辑） */
function getHashVerifyStatus(file: FileEntity): 'matched' | 'mismatched' | 'pending' {
  const clientHash = file.clientFileHashCode
  const serverHash = file.hashCode

  // 后端 FileListHandler 返回的 hashCode 可能为字符串 "null"，视为无效
  const validClientHash = clientHash && clientHash !== 'null' && clientHash !== '' && clientHash.length === 64
  const validServerHash = serverHash && serverHash !== 'null' && serverHash !== ''

  // 对齐老代码：双端哈希都有效才进行比对
  if (validClientHash && validServerHash) {
    return clientHash.toUpperCase() === serverHash.toUpperCase() ? 'matched' : 'mismatched'
  }
  // 任一端哈希无效，无法确认校验结果
  return 'pending'
}

/** 判断文件是否在已选中列表中 */
function isUploadedFileSelected(file: FileEntity): boolean {
  return props.selectedUploadedFiles.some(f => f.fileId === file.fileId)
}
</script>

<template>
  <div class="trans-file-table">
    <!-- ==================== 上传列表模式 ==================== -->
    <template v-if="isUploadMode">
      <!-- 批量操作工具栏 -->
      <div v-if="showBatchActions && files.length > 0" class="trans-file-table__toolbar">
        <div class="toolbar-left">
          <div class="toolbar-info">
            共 {{ files.length }} 个文件（待上传 {{ pendingCount }} | 上传中 {{ uploadingCount }} | 已完成 {{ completedCount }}）
          </div>
          <a-input-search
            v-model="searchKeyword"
            size="small"
            placeholder="搜索文件名"
            allow-clear
            style="width: 180px"
          />
        </div>
        <div class="toolbar-actions">
          <template v-if="hasSelection">
            <a-button v-if="selectedCount === files.length" size="small" @click="$emit('toggle-select-all', false)">
              取消全选
            </a-button>
            <a-button v-else size="small" @click="$emit('toggle-select-all', true)">
              全选
            </a-button>
            <a-button 
              v-if="files.some(f => f.selected && f.status === 'uploading')" 
              size="small" 
              @click="$emit('batch-pause')"
            >
              <template #icon><IconPause /></template>
              暂停选中
            </a-button>
            <a-button 
              v-if="files.some(f => f.selected && f.status === 'paused')" 
              size="small" 
              @click="$emit('batch-resume')"
            >
              <template #icon><IconPlayArrow /></template>
              继续选中
            </a-button>
            <a-button 
              v-if="files.some(f => f.selected && f.status !== 'uploading')" 
              size="small" 
              status="danger"
              @click="$emit('batch-delete')"
            >
              <template #icon><IconDelete /></template>
              删除选中
            </a-button>
          </template>
          <template v-else>
            <a-button
              v-if="uploadingCount > 0"
              size="small"
              @click="$emit('batch-pause')"
            >
              <template #icon><IconPause /></template>
              全部暂停
            </a-button>
            <a-button
              v-if="pausedCount > 0"
              size="small"
              @click="$emit('batch-resume')"
            >
              <template #icon><IconPlayArrow /></template>
              全部继续
            </a-button>
            <a-button
              v-if="files.length > 0"
              size="small"
              @click="$emit('toggle-select-all', true)"
            >
              全选
            </a-button>
            <a-button
              v-if="completedCount > 0"
              size="small"
              @click="$emit('clear-completed')"
            >
              清空已完成
            </a-button>
          </template>
        </div>
      </div>

      <!-- 文件列表 -->
      <div v-if="filteredFiles.length > 0" class="trans-file-table__list">
        <div
          v-for="item in filteredFiles"
          :key="item.id"
          class="upload-item"
          :class="{ 'is-selected': item.selected }"
          @click="$emit('toggle-select', item.id)"
        >
          <!-- 选择框 -->
          <div v-if="showBatchActions" class="upload-item__select" @click.stop>
            <a-checkbox
              :model-value="item.selected"
              @change="$emit('toggle-select', item.id)"
            />
          </div>

          <!-- 文件图标 -->
          <img :src="getFileIcon(item.file?.name || item.fileName || '')" alt="file" class="upload-item__icon" />

          <!-- 文件信息 -->
          <div class="upload-item__info">
            <div class="upload-item__header">
              <span class="upload-item__name" :title="item.file?.name || item.fileName">{{ item.file?.name || item.fileName }}</span>
              <span class="upload-item__size">{{ formatFileSize(item.file?.size || item.fileSize || 0) }}</span>
            </div>

            <!-- 进度条 -->
            <div class="upload-item__progress">
              <a-progress
                :percent="item.progress / 100"
                :status="item.status === 'error' ? 'danger' : item.status === 'completed' ? 'success' : 'normal'"
                :show-text="false"
              />
              <div class="upload-item__meta">
                <span class="upload-item__speed">{{ formatTransferSpeed(item.speed) }}</span>
                <a-tag :color="getStatusColor(item.status)" size="small">
                  {{ getStatusLabel(item.status) }}
                </a-tag>
              </div>
            </div>

            <!-- 哈希校验状态（上传阶段不展示，仅hashing/verifying/matched/mismatched状态展示） -->
            <div v-if="showHashStatus && item.hashState && item.status !== 'uploading' && item.status !== 'pending'" class="upload-item__hash">
              <span v-if="item.hashState.status === 'calculating'">
                正在计算文件哈希...
              </span>
              <span v-else-if="item.hashState.status === 'verifying'">
                正在校验文件完整性...
                <span v-if="item.hashState.timeLeft" class="hash-time-info">
                  （预计剩余 {{ item.hashState.timeLeft }}s）
                </span>
              </span>
              <span v-else-if="item.hashState.status === 'matched'" class="hash-success">
                ✓ 文件校验通过
                <span v-if="item.hashState.elapsedTime" class="hash-time-info">
                  （耗时 {{ item.hashState.elapsedTime }}s）
                </span>
              </span>
              <span v-else-if="item.hashState.status === 'mismatched'" class="hash-error">
                ✗ 文件校验失败，请重新上传
              </span>
            </div>

            <!-- 错误信息 -->
            <div v-if="item.error" class="upload-item__error">
              {{ item.error }}
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="upload-item__actions" @click.stop>
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
              @click="$emit('retry', item.id)"
            >
              <template #icon><IconRefresh /></template>
            </a-button>

            <a-button
              v-if="item.status !== 'uploading'"
              type="text"
              size="small"
              status="danger"
              @click="$emit('delete', item.id)"
            >
              <template #icon><IconDelete /></template>
            </a-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="trans-file-table__empty">
        <span>{{ searchKeyword ? '未找到匹配的文件' : '暂无上传文件' }}</span>
      </div>
    </template>

    <!-- ==================== 已上传列表模式 ==================== -->
    <template v-else-if="mode === 'uploaded'">
      <!-- 批量操作工具栏 -->
      <div v-if="showBatchActions && uploadedFiles.length > 0" class="trans-file-table__toolbar">
        <div class="toolbar-left">
          <div class="toolbar-info">
            已上传共 {{ uploadedFiles.length }} 个文件（{{ formatFileSize(totalUploadedSize) }}）
          </div>
          <a-input-search
            v-model="searchKeyword"
            size="small"
            placeholder="搜索文件名"
            allow-clear
            style="width: 180px"
          />
        </div>
        <div class="toolbar-actions">
          <a-button
            v-if="selectedUploadedCount === uploadedFiles.length"
            size="small"
            @click="$emit('toggle-select-all-uploaded', false)"
          >
            取消全选
          </a-button>
          <a-button
            v-else
            size="small"
            @click="$emit('toggle-select-all-uploaded', true)"
          >
            全选
          </a-button>
          <a-button
            v-if="selectedUploadedCount > 0"
            size="small"
            status="danger"
            @click="$emit('batch-delete')"
          >
            <template #icon><IconDelete /></template>
            删除选中 ({{ selectedUploadedCount }})
          </a-button>
          <a-button size="small" @click="$emit('refresh')">
            <template #icon><IconRefresh /></template>
            刷新
          </a-button>
        </div>
      </div>

      <!-- 文件列表 -->
      <div v-if="filteredUploadedFiles.length > 0" class="trans-file-table__list">
        <div
          v-for="file in filteredUploadedFiles"
          :key="file.fileId"
          class="uploaded-item"
          :class="{ 'is-selected': isUploadedFileSelected(file) }"
          @click="$emit('toggle-select-uploaded', file)"
        >
          <div class="uploaded-item__select" @click.stop>
            <a-checkbox
              :model-value="isUploadedFileSelected(file)"
              @change="$emit('toggle-select-uploaded', file)"
            />
          </div>
          <img :src="getFileIcon(file.fileName)" alt="file" class="uploaded-item__icon" />
          <div class="uploaded-item__info">
            <div class="uploaded-item__header">
              <span class="uploaded-item__name" :title="file.fileName">{{ file.fileName }}</span>
              <span class="uploaded-item__size">{{ formatFileSize(file.fileSize) }}</span>
            </div>
            <div v-if="showHashStatus" class="uploaded-item__hash">
              <span class="uploaded-item__hash-label">SHA256:</span>
              <span
                class="uploaded-item__hash-value"
                :class="{
                  'hash-matched': getHashVerifyStatus(file) === 'matched',
                  'hash-mismatched': getHashVerifyStatus(file) === 'mismatched',
                  'hash-pending': getHashVerifyStatus(file) === 'pending',
                }"
                :title="file.clientFileHashCode || file.hashCode"
              >
                {{ truncateHash(file.clientFileHashCode || file.hashCode) }}
              </span>
              <span
                v-if="getHashVerifyStatus(file) === 'matched'"
                class="hash-status-tag hash-status--matched"
              >通过</span>
              <span
                v-else-if="getHashVerifyStatus(file) === 'mismatched'"
                class="hash-status-tag hash-status--mismatched"
              >未通过</span>
              <span
                v-else
                class="hash-status-tag hash-status--pending"
              >未校验</span>
            </div>
          </div>
          <div class="uploaded-item__actions" @click.stop>
            <a-button
              type="text"
              size="mini"
              status="danger"
              @click="$emit('delete-uploaded-file', file)"
            >
              删除
            </a-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="trans-file-table__empty">
        <span>暂无已上传文件</span>
      </div>
    </template>

    <!-- ==================== 下载列表模式 ==================== -->
    <template v-else-if="isDownloadMode">
      <!-- 工具栏 -->
      <div class="trans-file-table__toolbar download-toolbar">
        <div class="toolbar-left">
          <a-button
            size="small"
            :disabled="isRootDirectory"
            @click="$emit('go-back')"
          >
            <template #icon><IconLeft /></template>
            返回上级
          </a-button>
          <span class="toolbar-path">
            {{ currentPath || '根目录' }}
          </span>
        </div>
        <div class="toolbar-right">
          <a-button size="small" @click="$emit('refresh')">
            <template #icon><IconRefresh /></template>
            刷新
          </a-button>
          <a-button
            type="primary"
            size="small"
            :loading="downloading"
            :disabled="selectedDownloadCount === 0"
            @click="$emit('download-selected')"
          >
            <template #icon><IconDownload /></template>
            下载选中 ({{ selectedDownloadCount }})
          </a-button>
        </div>
      </div>

      <!-- 列表头部 -->
      <div class="download-list-header">
        <a-checkbox
          :model-value="isAllSelected"
          :indeterminate="selectedDownloadCount > 0 && !isAllSelected"
          @change="$emit('toggle-select-all-download')"
        />
        <span class="header-name">名称</span>
        <span class="header-size">大小</span>
        <span class="header-time">修改时间</span>
        <span class="header-actions">操作</span>
      </div>

      <!-- 列表内容 -->
      <div class="trans-file-table__list download-list">
        <!-- 空状态 -->
        <div v-if="totalDownloadItems === 0" class="trans-file-table__empty">
          <a-empty description="当前目录为空" />
        </div>

        <!-- 文件夹列表 -->
        <div
          v-for="dir in directories"
          :key="dir.relativeDir"
          class="download-item download-item--directory"
          :class="{ 'is-selected': isDownloadItemSelected({ type: 'directory', name: dir.name, relativeDir: dir.relativeDir, filePath: dir.filePath }) }"
        >
          <a-checkbox
            :model-value="isDownloadItemSelected({ type: 'directory', name: dir.name, relativeDir: dir.relativeDir, filePath: dir.filePath })"
            @change="handleDownloadSelect({ type: 'directory', name: dir.name, relativeDir: dir.relativeDir, filePath: dir.filePath, lastModify: dir.lastModify })"
          />
          <div class="download-item__name" @click="$emit('enter-directory', dir)">
            <IconFolder class="download-item__icon download-item__icon--folder" />
            <span class="download-item__text">{{ dir.name }}</span>
          </div>
          <span class="download-item__size">-</span>
          <span class="download-item__time">{{ dir.lastModify || '-' }}</span>
          <div class="download-item__actions">
            <a-button
              type="text"
              size="small"
              :loading="downloading && downloadProgress?.fileName === dir.name"
              @click="$emit('download-directory', dir)"
            >
              <template #icon><IconDownload /></template>
            </a-button>
          </div>
        </div>

        <!-- 文件列表 -->
        <div
          v-for="file in downloadFiles"
          :key="file.fileId"
          class="download-item download-item--file"
          :class="{ 'is-selected': isDownloadItemSelected({ type: 'file', name: file.fileName, relativeDir: file.relativeDir, filePath: file.filePath }) }"
        >
          <a-checkbox
            :model-value="isDownloadItemSelected({ type: 'file', name: file.fileName, relativeDir: file.relativeDir, filePath: file.filePath })"
            @change="handleDownloadSelect({ type: 'file', name: file.fileName, relativeDir: file.relativeDir, filePath: file.filePath, fileSize: file.fileSize, lastModify: file.lastModify })"
          />
          <div class="download-item__name">
            <img :src="getFileIcon(file.fileName)" alt="file" class="download-item__icon" />
            <span class="download-item__text">{{ file.fileName }}</span>
          </div>
          <span class="download-item__size">{{ formatFileSize(file.fileSize) }}</span>
          <span class="download-item__time">{{ file.lastModify || '-' }}</span>
          <div class="download-item__actions">
            <a-button
              type="text"
              size="small"
              :loading="downloading && downloadProgress?.fileName === file.fileName"
              @click="$emit('download-file', file)"
            >
              <template #icon><IconDownload /></template>
            </a-button>
          </div>
        </div>
      </div>

      <!-- 底部统计 -->
      <div class="download-footer">
        <span>
          共 {{ downloadFiles.length }} 个文件，
          总大小: {{ formatFileSize(totalDownloadSize) }}
        </span>
      </div>

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
  </div>
</template>
