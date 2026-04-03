<script setup lang="ts">
import type { DetailFileItem } from '@/types/detail'
import { computed, onMounted, ref, watch } from 'vue'
import DetailFileTable from '@/components/business/detail/DetailFileTable.vue'
import DetailInfoSection from '@/components/business/detail/DetailInfoSection.vue'
import ProcessTimeline from '@/components/business/ProcessTimeline.vue'
import AssetDetectionTab from '@/components/business/AssetDetectionTab.vue'
import { useApplicationDetail } from '@/composables/useApplicationDetail'
import { useAssetDetection } from '@/composables/useAssetDetection'
import './admin-application-detail-modal.scss'

interface Props {
  visible: boolean
  applicationId: string | number | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  loading,
  detailData,
  processDetailData,
  activeTab,
  basicInfoRows,
  applicationInfoRows,
  files,
  fileLoading,
  totalFiles,
  pagination,
  downloading,
  downloadingFile,
  fetchDetail,
  handleDownloadFile,
  handleBatchDownload,
  onFilePageChange,
} = useApplicationDetail()

// 资产检测
const {
  countLoading,
  listLoading,
  countData,
  processedFileList,
  processedKeyFileList,
  categoryStats,
  pagination: assetPagination,
  hasKeyAssets,
  hasDetectionResult,
  allFilesConfirmed,
  allKeyAssetsConfirmed,
  canOperate,
  initAssetDetection,
  confirmFile,
  unconfirmFile,
  confirmKeyAsset,
  unconfirmKeyAsset,
  confirmAllCurrentPageFiles,
  completeFileConfirmation,
  confirmAllKeyAssets,
  updateFilters,
  changePage,
  changePageSize,
} = useAssetDetection()

const currentStatus = computed(() => processDetailData.value?.applicationStatus || '-')

const assetLoading = computed(() => countLoading.value || listLoading.value)

// 是否显示下载功能（管理员视角，默认可以下载）
const showDownload = computed(() => true)

function handleClose() {
  emit('update:visible', false)
}

// 处理确认文件
function handleConfirmFile(fileName: string, confirmed: boolean) {
  if (confirmed) {
    confirmFile(fileName)
  }
  else {
    unconfirmFile(fileName)
  }
}

// 处理确认关键资产
function handleConfirmKeyAsset(fileName: string, confirmed: boolean) {
  if (confirmed) {
    confirmKeyAsset(fileName)
  }
  else {
    unconfirmKeyAsset(fileName)
  }
}

// 处理筛选变化
function handleFilterChange(filters: { fileType?: number; fileName?: string }) {
  if (detailData.value?.appBaseInfo?.applicationId) {
    updateFilters(detailData.value.appBaseInfo.applicationId, filters)
  }
}

// 处理分页变化
function handleAssetPageChange(page: number) {
  if (detailData.value?.appBaseInfo?.applicationId) {
    changePage(detailData.value.appBaseInfo.applicationId, page)
  }
}

// 处理每页数量变化
function handleAssetPageSizeChange(size: number) {
  if (detailData.value?.appBaseInfo?.applicationId) {
    changePageSize(detailData.value.appBaseInfo.applicationId, size)
  }
}

// 监听 applicationId 变化，加载详情
watch(
  () => props.applicationId,
  (newId) => {
    if (newId && props.visible) {
      fetchDetail(String(newId))
    }
  },
  { immediate: true },
)

// 监听详情数据加载完成后初始化资产检测
watch(
  () => detailData.value?.appBaseInfo?.applicationId,
  (applicationId) => {
    if (applicationId && props.visible) {
      initAssetDetection(applicationId)
    }
  },
)
</script>

<template>
  <a-modal
    :visible="visible"
    :footer="false"
    :closable="true"
    :mask-closable="false"
    :width="'90%'"
    :body-style="{ padding: 0 }"
    :modal-style="{ maxWidth: '1400px', height: '85vh', margin: 'auto', top: '5vh' }"
    unmount-on-close
    @cancel="handleClose"
  >
    <template #title>
      <div class="modal-header">
        <div class="modal-header__left">
          <span class="modal-header__title">申请单详情</span>
          <span class="modal-header__no">申请单号：{{ detailData?.appBaseInfo?.applicationId || '-' }}</span>
        </div>
        <div class="modal-header__right">
          <span class="status-tag">当前流程：{{ currentStatus }}</span>
        </div>
      </div>
    </template>

    <div class="admin-application-detail-modal">
      <div class="detail-tabs">
        <button
          class="detail-tabs__btn"
          :class="{ 'is-active': activeTab === 'info' }"
          @click="activeTab = 'info'"
        >
          申请单信息
        </button>
        <button
          class="detail-tabs__btn"
          :class="{ 'is-active': activeTab === 'files' }"
          @click="activeTab = 'files'"
        >
          文件列表（{{ totalFiles }}）
        </button>
        <button
          v-if="hasDetectionResult"
          class="detail-tabs__btn is-warning"
          :class="{ 'is-active': activeTab === 'detection' }"
          @click="activeTab = 'detection'"
        >
          <icon-exclamation-circle-fill />
          资产检测结果
        </button>
      </div>

      <div class="detail-content">
        <a-spin :loading="loading" style="width: 100%">
          <template v-if="activeTab === 'info'">
            <DetailInfoSection title="基本信息" :rows="basicInfoRows" />
            <DetailInfoSection title="申请信息" :rows="applicationInfoRows" />
          </template>

          <DetailFileTable
            v-else-if="activeTab === 'files'"
            :files="files as DetailFileItem[]"
            :loading="fileLoading"
            :show-download="showDownload"
            :pagination="pagination"
            @download="handleDownloadFile"
            @batch-download="handleBatchDownload"
            @page-change="onFilePageChange"
          />

          <!-- 资产检测结果 Tab -->
          <AssetDetectionTab
            v-else-if="activeTab === 'detection'"
            :application-id="detailData?.appBaseInfo?.applicationId || applicationId || ''"
            :count-data="countData"
            :file-list="processedFileList"
            :key-file-list="processedKeyFileList"
            :category-stats="categoryStats"
            :loading="assetLoading"
            :pagination="assetPagination"
            :require-confirmation="false"
            :all-files-confirmed="allFilesConfirmed"
            :all-key-assets-confirmed="allKeyAssetsConfirmed"
            :has-key-assets="hasKeyAssets"
            @confirm-file="handleConfirmFile"
            @confirm-key-asset="handleConfirmKeyAsset"
            @confirm-current-page="confirmAllCurrentPageFiles"
            @complete-file-confirmation="completeFileConfirmation"
            @confirm-all-key-assets="confirmAllKeyAssets"
            @filter-change="handleFilterChange"
            @page-change="handleAssetPageChange"
            @page-size-change="handleAssetPageSizeChange"
          />
        </a-spin>
      </div>

      <!-- 流程进展 -->
      <div class="process-card">
        <h3 class="process-card__title">流程进展</h3>
        <ProcessTimeline :application-id="detailData?.appBaseInfo?.applicationId || applicationId || ''" />
      </div>
    </div>
  </a-modal>
</template>
