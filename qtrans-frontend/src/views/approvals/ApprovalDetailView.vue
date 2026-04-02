<script setup lang="ts">
import type { TransferState } from '@/types'
import { Message, Modal } from '@arco-design/web-vue'
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import TransferProgress from '@/components/business/TransferProgress.vue'
import ProcessTimeline from '@/components/business/ProcessTimeline.vue'
import DetailFileTable from '@/components/business/detail/DetailFileTable.vue'
import DetailInfoSection from '@/components/business/detail/DetailInfoSection.vue'
import AssetDetectionResult from '@/components/business/AssetDetectionResult.vue'
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
  handleExempt,
  handleDownloadFile,
  handleBatchDownload,
  onFilePageChange,
  goBack,
} = useApprovalDetail()

// 资产检测
const {
  countLoading,
  countData,
  processedFileList,
  hasKeyAssets,
  allFilesConfirmed,
  initAssetDetection,
  confirmFile,
  unconfirmFile,
} = useAssetDetection()

const id = String(route.params.id || '')

// 资产检测加载状态
const assetLoading = computed(() => countLoading.value)

// 审批按钮是否可用：有关键资产时需要全部确认
const canOperate = computed(() => {
  // 基础权限检查
  if (!canOperateBase.value)
    return false
  // 有关键资产时，需要全部确认
  if (hasKeyAssets.value)
    return allFilesConfirmed.value
  return true
})

// 处理确认操作
function handleAssetConfirm(fileName: string, confirmed: boolean) {
  if (confirmed) {
    confirmFile(fileName)
  }
  else {
    unconfirmFile(fileName)
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

/** 状态样式 class */
const statusClass = computed(() => {
  const appStatus = detailData.value?.appBaseInfo.applicationStatus
  if (appStatus === 6) return 'completed'
  if (appStatus === 5) return 'transferring'
  if (appStatus === 3) return 'approved'
  if (appStatus === 4) return 'rejected'
  if (appStatus === 2) return 'pending_approval'
  return 'draft'
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

function onExempt() {
  Modal.confirm({
    title: '确认免审该申请单？',
    content: '将跳过所有审批流程并直接通过',
    okText: '确认免审',
    cancelText: '取消',
    onOk: handleExempt,
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
          v-else
          :files="files"
          :loading="fileLoading"
          :show-download="true"
          :pagination="pagination"
          @download="handleDownloadFile"
          @batch-download="handleBatchDownload"
          @page-change="onFilePageChange"
        />
      </a-spin>
    </div>

    <!-- 资产检测结果 -->
    <AssetDetectionResult
      v-if="detailData?.appBaseInfo?.applicationId"
      :application-id="detailData.appBaseInfo.applicationId"
      :require-confirmation="canOperateBase"
      :count-data="countData"
      :file-list="processedFileList"
      :loading="assetLoading"
      :on-confirm="handleAssetConfirm"
    />

    <section v-if="showTransferProgress" class="approval-detail-page__transfer">
      <TransferProgress
        :application-id="detailData?.appBaseInfo?.applicationId || id"
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
