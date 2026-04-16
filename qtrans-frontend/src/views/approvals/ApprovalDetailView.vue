<script setup lang="ts">
import type { TransferState } from '@/types'
import { Message, Modal } from '@arco-design/web-vue'
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import TransferProgress from '@/components/business/TransferProgress.vue'
import ProcessTimeline from '@/components/business/ProcessTimeline.vue'
import DetailFileTable from '@/components/business/detail/DetailFileTable.vue'
import DetailInfoSection from '@/components/business/detail/DetailInfoSection.vue'
import AssetDetectionTab from '@/components/business/AssetDetectionTab.vue'
import { useApprovalDetail } from '@/composables/useApprovalDetail'
import { useAssetDetection } from '@/composables/useAssetDetection'
import { assetPath } from '@/utils/path'
import './approval-detail.scss'


const route = useRoute()

const {
  loading,
  detailData,
  activeTab,
  approvalOpinion,
  basicInfoRows,
  applicationInfoRows,
  files,
  fileLoading,
  totalFiles,
  pagination,
  currentApprovalLabel,
  canOperateBase,
  fetchDetail,
  handleApprove,
  handleReject,
  handleDownloadFile,
  handleBatchDownload,
  onFilePageChange,
  goBack,
} = useApprovalDetail()

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
  canOperate: canOperateAsset,
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

// 资产检测加载状态
const assetLoading = computed(() => countLoading.value || listLoading.value)

// 审批按钮是否可用：资产确认状态
const canOperate = computed(() => {
  // 基础权限检查
  if (!canOperateBase.value)
    return false
  // 资产检测确认状态
  return canOperateAsset.value
})

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

/** 后端 applicationStatus: 3=已批准, 5=传输中, 6=已完成 */
const showTransferProgress = computed(() => {
  const appStatus = detailData.value?.appBaseInfo.applicationStatus
  return appStatus === 3 || appStatus === 5 || appStatus === 6
})

const transferFileSize = computed(() => {
  const total = files.value.reduce((sum, item) => sum + Math.max(item.fileSize, 0), 0)
  if (total > 0)
    return total

  return Math.max(1024 * 1024, Math.round((detailData.value?.appBaseUploadDownloadInfo?.applicationSize || 0) * 1024 * 1024))
})

const transferStatusHint = computed<TransferState['status']>(() => {
  const appStatus = detailData.value?.appBaseInfo.applicationStatus
  if (appStatus === 6)
    return 'completed'

  if (appStatus === 5)
    return 'transferring'

  return 'pending'
})


function onApprove() {
  Modal.confirm({
    title: '确认通过该申请单？',
    content: `申请单号：${detailData.value?.appBaseInfo?.applicationId || '-'}`,
    okText: '确认通过',
    cancelText: '取消',
    onOk: handleApprove,
  })
}

function onReject() {
  if (!approvalOpinion.value.trim()) {
    Message.error('请先填写驳回原因')
    return
  }

  Modal.warning({
    title: '确认驳回该申请单？',
    content: '驳回后申请人需重新提交',
    okText: '确认驳回',
    cancelText: '取消',
    onOk: handleReject,
  })
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

// 监听资产检测结果：如果有检测结果且未全部确认，自动切换到资产检测 Tab
watch(
  [hasDetectionResult, canOperateAsset],
  ([hasResult, canOperate]) => {
    // 只有在有检测结果且需要确认时才自动切换
    if (hasResult && !canOperate && canOperateBase.value) {
      activeTab.value = 'detection'
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="approval-detail-page">
    <div class="approval-detail-page__crumbs">
      <button class="back-btn" @click="goBack">
        <img :src="assetPath('/figma/3971_1904/1.svg')" alt="返回">

      </button>
      <span class="crumb-text">审批管理 / 详情</span>
    </div>

    <header class="approval-detail-page__header">
      <div>
        <h1 class="approval-detail-page__title">审批详情</h1>
        <p class="approval-detail-page__no">申请单号：{{ detailData?.appBaseInfo?.applicationId || '-' }}</p>
      </div>

      <div class="approval-detail-page__header-right">
        <a-tag color="arcoblue">{{ currentApprovalLabel }}</a-tag>
      </div>
    </header>

    <div v-if="canOperate" class="approval-detail-page__top-actions">
      <a-button type="primary" @click="onApprove">通过</a-button>
      <a-button status="danger" @click="onReject">驳回</a-button>
    </div>

    <div class="detail-tabs">
      <button class="detail-tabs__btn" :class="{ 'is-active': activeTab === 'info' }" @click="activeTab = 'info'">
        申请单信息
      </button>
      <button class="detail-tabs__btn" :class="{ 'is-active': activeTab === 'files' }" @click="activeTab = 'files'">
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

          <section class="approval-timeline-wrap">
            <h3 class="approval-timeline-wrap__title">审批时间线</h3>
            <ProcessTimeline :application-id="detailData?.appBaseInfo?.applicationId || id" />
          </section>
        </template>

        <DetailFileTable
          v-else-if="activeTab === 'files'"
          :files="files"
          :loading="fileLoading"
          :show-download="true"
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
          :require-confirmation="canOperateBase"
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

    <section v-if="showTransferProgress" class="approval-detail-page__transfer">
      <TransferProgress
        :application-id="String(detailData?.appBaseInfo?.applicationId || id)"
        :file-size="transferFileSize"
        :status-hint="transferStatusHint"
      />
    </section>


    <section v-if="canOperate" class="approval-opinion-card">

      <h3 class="approval-opinion-card__title">审批意见</h3>
      <a-textarea
        v-model="approvalOpinion"
        :max-length="500"
        show-word-limit
        placeholder="请输入审批意见（驳回时必填）"
        allow-clear
      />

      <div class="approval-opinion-card__actions">
        <a-button type="primary" @click="onApprove">通过</a-button>
        <a-button status="danger" @click="onReject">驳回</a-button>
      </div>
    </section>
  </section>
</template>
