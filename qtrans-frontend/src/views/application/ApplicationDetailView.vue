<script setup lang="ts">
import type { DetailFileItem } from '@/types/detail'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CloseApplicationModal from '@/components/business/CloseApplicationModal.vue'
import DetailFileTable from '@/components/business/detail/DetailFileTable.vue'
import DetailInfoSection from '@/components/business/detail/DetailInfoSection.vue'
import ProcessTimeline from '@/components/business/ProcessTimeline.vue'
import AssetDetectionTab from '@/components/business/AssetDetectionTab.vue'
import { useApplicationDetail } from '@/composables/useApplicationDetail'
import { useAssetDetection } from '@/composables/useAssetDetection'
import { assetPath } from '@/utils/path'
import './application-detail.scss'


const route = useRoute()
const router = useRouter()

// 从 query 参数判断是否显示下载功能（"待我下载"跳入时带 showDownload=true）
const showDownload = computed(() => route.query.showDownload === 'true')

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
  fetchDetail,
  handleContinueUpload,
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
  fileConfirmationCompleted,
  updateFilters,
  changePage,
  changePageSize,
} = useAssetDetection()

const id = String(route.params.id || '')
const closeModalVisible = ref(false)

// 当前流程状态 - 使用 processDetailData.applicationStatus
const currentStatus = computed(() => processDetailData.value?.applicationStatus || '-')

// 是否可以继续上传文件（状态为"创建申请单"或"文件上传"）
const canContinueUpload = computed(() => {
  const status = processDetailData.value?.applicationStatus
  return status === '创建申请单' || status === '文件上传'
})

// 资产检测加载状态
const assetLoading = computed(() => countLoading.value || listLoading.value)

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

function goBack() {
  router.push('/applications')
}

function onCloseApplication() {
  closeModalVisible.value = true
}

function onCloseSuccess() {
  router.push('/applications')
}

onMounted(async () => {
  if (id)
    await fetchDetail(id)
})

// 监听详情数据加载完成后初始化资产检测
watch(
  () => detailData.value?.appBaseInfo?.applicationId,
  (applicationId) => {
    if (applicationId) {
      initAssetDetection(applicationId)
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="application-detail-page">
    <div class="application-detail-page__crumbs">
      <button class="back-btn" @click="goBack">
        <img :src="assetPath('/figma/3971_1904/1.svg')" alt="返回" />
      </button>
      <span class="crumb-text">我的申请 / 详情</span>
    </div>

    <header class="application-detail-page__header">
      <div>
        <p class="application-detail-page__no">申请单号：{{ detailData?.appBaseInfo?.applicationId || '-' }}</p>
      </div>
      <div class="status-info">
        <span class="status-tag">当前流程：{{ currentStatus }}</span>
      </div>
    </header>

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

    <div class="detail-card" :class="{ 'is-files': activeTab === 'files' }">
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
          :application-id="detailData?.appBaseInfo?.applicationId || id"
          :count-data="countData"
          :file-list="processedFileList"
          :key-file-list="processedKeyFileList"
          :category-stats="categoryStats"
          :loading="assetLoading"
          :pagination="assetPagination"
          :require-confirmation="canContinueUpload"
          :all-files-confirmed="allFilesConfirmed"
          :all-key-assets-confirmed="allKeyAssetsConfirmed"
          :has-key-assets="hasKeyAssets"
          :file-confirmation-completed="fileConfirmationCompleted"
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
    <div class="detail-card process-card">
      <h3 class="process-card__title">流程进展</h3>
      <ProcessTimeline :application-id="detailData?.appBaseInfo?.applicationId || id" />
    </div>

    <footer class="application-detail-page__actions">
      <a-button
        v-if="canContinueUpload"
        type="primary"
        @click="handleContinueUpload"
      >
        继续上传文件
      </a-button>
      <a-button type="outline" status="danger" @click="onCloseApplication">关闭申请单</a-button>
    </footer>

    <!-- 关闭申请单确认弹窗 -->
    <CloseApplicationModal
      v-model:visible="closeModalVisible"
      :application-id="detailData?.appBaseInfo?.applicationId || id"
      @success="onCloseSuccess"
    />
  </section>
</template>
