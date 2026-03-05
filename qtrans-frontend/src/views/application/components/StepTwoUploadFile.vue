<script setup lang="ts">
import { computed } from 'vue'
import { formatFileSize } from '@/utils'
import dayjs from 'dayjs'

interface UploadingFileState {
  uid: string
  name: string
  size: number
  progress: number
  status: 'uploading' | 'paused'
  failedCount: number
  usedTime: number
  remainingTime: number
  raw?: File
}

interface UploadedFileState {
  uid: string
  name: string
  size: number
  fileType: string
  lastModified: string
  sha256: string
  raw?: File
}

interface Props {
  uploadingFiles: UploadingFileState[]
  uploadedFiles: UploadedFileState[]
  selectedUploadingUids: string[]
  selectedUploadedUids: string[]
  autoSubmitAfterUpload: boolean
}

const props = defineProps<Props>()

interface Emits {
  (e: 'update:selectedUploadingUids', value: string[]): void
  (e: 'update:selectedUploadedUids', value: string[]): void
  (e: 'update:autoSubmitAfterUpload', value: boolean): void
  (e: 'selectUploadFiles'): void
  (e: 'pauseUploadFile', uid: string): void
  (e: 'resumeUploadFile', uid: string): void
  (e: 'removeUploadingFile', uid: string): void
  (e: 'removeUploadFile', uid: string): void
  (e: 'batchPauseUploading'): void
  (e: 'batchResumeUploading'): void
  (e: 'batchRemoveUploading'): void
  (e: 'batchRemoveUploaded'): void
  (e: 'refreshUploadedList'): void
}

const emit = defineEmits<Emits>()

const allUploadingSelected = computed({
  get: () => props.uploadingFiles.length > 0 && props.selectedUploadingUids.length === props.uploadingFiles.length,
  set: (val) => {
    emit('update:selectedUploadingUids', val ? props.uploadingFiles.map(f => f.uid) : [])
  },
})

const allUploadedSelected = computed({
  get: () => props.uploadedFiles.length > 0 && props.selectedUploadedUids.length === props.uploadedFiles.length,
  set: (val) => {
    emit('update:selectedUploadedUids', val ? props.uploadedFiles.map(f => f.uid) : [])
  },
})

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const iconMap: Record<string, string> = {
    'doc': '34',
    'docx': '34',
    'xls': '31',
    'xlsx': '31',
    'zip': '37',
    'ppt': '40',
    'pptx': '40',
  }
  const iconNum = iconMap[ext] || '34'
  return `/figma/3883_5466/${iconNum}.svg`
}

function formatTime(seconds: number): string {
  if (seconds < 60)
    return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m${secs}s`
}
</script>

<template>
  <div class="upload-step">
    <div class="upload-step__header">
      <div class="upload-step__actions">
        <a-button type="primary" @click="emit('selectUploadFiles')">
          <template #icon>
            <icon-upload />
          </template>
          上传
        </a-button>
        <a-checkbox
          :model-value="autoSubmitAfterUpload"
          @change="(val: boolean) => emit('update:autoSubmitAfterUpload', val)"
        >
          上传完毕后自动提交
        </a-checkbox>
      </div>
      <a-button type="text" class="privacy-link">
        <template #icon>
          <icon-file />
        </template>
        隐私政策
      </a-button>
    </div>

    <!-- 传输任务表格 -->
    <section class="upload-section">
      <div class="upload-section__header">
        <h3 class="upload-section__title">传输任务</h3>
        <div class="upload-section__toolbar">
          <a-button
            type="text"
            size="small"
            :disabled="selectedUploadingUids.length === 0"
            @click="emit('batchPauseUploading')"
          >
            <template #icon>
              <icon-pause-circle />
            </template>
            批量暂停
          </a-button>
          <a-button
            type="text"
            size="small"
            status="success"
            :disabled="selectedUploadingUids.length === 0"
            @click="emit('batchResumeUploading')"
          >
            <template #icon>
              <icon-play-circle />
            </template>
            批量继续
          </a-button>
          <a-button
            type="text"
            size="small"
            status="danger"
            :disabled="selectedUploadingUids.length === 0"
            @click="emit('batchRemoveUploading')"
          >
            <template #icon>
              <icon-delete />
            </template>
            批量删除
          </a-button>
        </div>
      </div>

      <div class="upload-table-wrapper">
        <a-table
          :data="uploadingFiles"
          :pagination="false"
          row-key="uid"
          :row-selection="{
            type: 'checkbox',
            selectedRowKeys: selectedUploadingUids,
            onlyCurrent: false,
          }"
          @select="(rowKeys: string[]) => emit('update:selectedUploadingUids', rowKeys)"
          @select-all="(checked: boolean) => allUploadingSelected = checked"
        >
          <template #columns>
            <a-table-column title="文件名称" data-index="name" :width="500">
              <template #cell="{ record }">
                <div class="file-name-cell">
                  <img :src="getFileIcon(record.name)" alt="file" class="file-icon" />
                  <span class="file-name-text">{{ record.name }}</span>
                </div>
                <a-progress
                  :percent="record.progress / 100"
                  :show-text="false"
                  class="file-progress"
                  :status="record.status === 'uploading' ? 'normal' : 'warning'"
                />
              </template>
            </a-table-column>
            <a-table-column title="文件大小" :width="200">
              <template #cell="{ record }">{{ formatFileSize(record.size) }}</template>
            </a-table-column>
            <a-table-column title="失败次数" data-index="failedCount" :width="200" />
            <a-table-column title="使用时间" :width="200">
              <template #cell="{ record }">{{ formatTime(record.usedTime) }}</template>
            </a-table-column>
            <a-table-column title="剩余时间" :width="200">
              <template #cell="{ record }">{{ formatTime(record.remainingTime) }}</template>
            </a-table-column>
            <a-table-column title="操作" :width="220" align="center">
              <template #cell="{ record }">
                <div class="table-actions">
                  <a-button
                    v-if="record.status === 'uploading'"
                    type="text"
                    size="small"
                    @click="emit('pauseUploadFile', record.uid)"
                  >
                    <template #icon>
                      <icon-pause-circle />
                    </template>
                  </a-button>
                  <a-button
                    v-else
                    type="text"
                    size="small"
                    status="success"
                    @click="emit('resumeUploadFile', record.uid)"
                  >
                    <template #icon>
                      <icon-play-circle />
                    </template>
                  </a-button>
                  <a-button
                    type="text"
                    size="small"
                    status="danger"
                    @click="emit('removeUploadingFile', record.uid)"
                  >
                    <template #icon>
                      <icon-delete />
                    </template>
                  </a-button>
                </div>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </div>
    </section>

    <!-- 已上传文件列表 -->
    <section class="upload-section">
      <div class="upload-section__header">
        <h3 class="upload-section__title">已上传文件列表</h3>
        <div class="upload-section__toolbar">
          <a-button type="text" size="small" status="success" @click="emit('refreshUploadedList')">
            <template #icon>
              <icon-refresh />
            </template>
            刷新
          </a-button>
          <a-button type="text" size="small">
            <template #icon>
              <icon-folder />
            </template>
            上层目录
          </a-button>
          <a-button
            type="text"
            size="small"
            status="danger"
            :disabled="selectedUploadedUids.length === 0"
            @click="emit('batchRemoveUploaded')"
          >
            <template #icon>
              <icon-delete />
            </template>
            删除文件
          </a-button>
        </div>
      </div>

      <div class="upload-table-wrapper">
        <a-table
          :data="uploadedFiles"
          :pagination="false"
          row-key="uid"
          :row-selection="{
            type: 'checkbox',
            selectedRowKeys: selectedUploadedUids,
            onlyCurrent: false,
          }"
          @select="(rowKeys: string[]) => emit('update:selectedUploadedUids', rowKeys)"
          @select-all="(checked: boolean) => allUploadedSelected = checked"
        >
          <template #columns>
            <a-table-column title="文件名称" data-index="name" :width="450">
              <template #cell="{ record }">
                <div class="file-name-cell">
                  <img :src="getFileIcon(record.name)" alt="file" class="file-icon" />
                  <span class="file-name-text file-name-link">{{ record.name }}</span>
                </div>
              </template>
            </a-table-column>
            <a-table-column title="文件大小" :width="150">
              <template #cell="{ record }">{{ formatFileSize(record.size) }}</template>
            </a-table-column>
            <a-table-column title="文件类型" data-index="fileType" :width="150" />
            <a-table-column title="最后修改时间" :width="300">
              <template #cell="{ record }">{{ dayjs(record.lastModified).format('YYYY-MM-DD HH:mm:ss') }}</template>
            </a-table-column>
            <a-table-column title="服务器sha256" :width="360">
              <template #cell="{ record }">
                <span class="sha256-text">{{ record.sha256 }}</span>
              </template>
            </a-table-column>
            <a-table-column title="操作" :width="110" align="center">
              <template #cell="{ record }">
                <a-button
                  type="text"
                  size="small"
                  status="danger"
                  @click="emit('removeUploadFile', record.uid)"
                >
                  <template #icon>
                    <icon-delete />
                  </template>
                </a-button>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
// 样式继承自父组件的 create-application.scss
</style>
