<script setup lang="ts">
import type { TransferState } from '@/types'
import { Message, Modal } from '@arco-design/web-vue'
import { IconCheckCircleFill } from '@arco-design/web-vue/es/icon'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TransferProgress from '@/components/business/TransferProgress.vue'
import ApprovalTimeline from '@/components/business/approval/ApprovalTimeline.vue'
import DetailFileTable from '@/components/business/detail/DetailFileTable.vue'
import DetailInfoSection from '@/components/business/detail/DetailInfoSection.vue'
import { useApprovalDetail } from '@/composables/useApprovalDetail'
import './approval-detail.scss'


const route = useRoute()

const {
  loading,
  detailData,
  activeTab,
  approvalOpinion,
  approvalRecords,
  statusLabel,
  basicInfoRows,
  applicationInfoRows,
  files,
  fileLoading,
  totalFiles,
  pagination,
  currentApprovalLevel,
  totalApprovalLevels,
  currentApprovalLabel,
  canOperate,
  canExempt,
  downloading,
  downloadingFile,
  fetchDetail,
  handleApprove,
  handleReject,
  handleExempt,
  handleDownloadFile,
  handleBatchDownload,
  onFilePageChange,
  goBack,
} = useApprovalDetail()

const id = String(route.params.id || '')

const showTransferProgress = computed(() => {
  const status = detailData.value?.status
  return status === 'approved' || status === 'transferring' || status === 'completed'
})

const transferFileSize = computed(() => {
  const total = files.value.reduce((sum, item) => sum + Math.max(item.fileSize, 0), 0)
  if (total > 0)
    return total

  return Math.max(1024 * 1024, Math.round((detailData.value?.storageSize || 0) * 1024 * 1024))
})

const transferStatusHint = computed<TransferState['status']>(() => {
  if (detailData.value?.status === 'completed')
    return 'completed'

  if (detailData.value?.status === 'transferring')
    return 'transferring'

  return 'pending'
})

function onApprove() {

  Modal.confirm({
    title: '确认通过该申请单？',
    content: `申请单号：${detailData.value?.applicationNo || '-'}`,
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
</script>

<template>
  <section class="approval-detail-page">
    <div class="approval-detail-page__crumbs">
      <button class="back-btn" @click="goBack">
        <img src="/figma/3971_1904/1.svg" alt="返回" />
      </button>
      <span class="crumb-text">审批管理 / 详情</span>
    </div>

    <header class="approval-detail-page__header">
      <div>
        <h1 class="approval-detail-page__title">审批详情</h1>
        <p class="approval-detail-page__no">申请单号：{{ detailData?.applicationNo || '-' }}</p>
      </div>

      <div class="approval-detail-page__header-right">
        <a-tag color="arcoblue">{{ currentApprovalLabel }}</a-tag>
        <div class="status-pill" :class="`status-pill--${detailData?.status || 'draft'}`">
          <IconCheckCircleFill />
          <span>{{ statusLabel }}</span>
        </div>
      </div>
    </header>

    <div v-if="canOperate" class="approval-detail-page__top-actions">
      <a-button type="primary" @click="onApprove">通过</a-button>
      <a-button status="danger" @click="onReject">驳回</a-button>
      <a-button v-if="canExempt" type="outline" @click="onExempt">免审</a-button>
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
            <ApprovalTimeline
              :application-id="detailData?.id || id"
              :applicant-name="detailData?.applicantName || '-'"
              :submitted-at="detailData?.createdAt || new Date().toISOString()"
              :approval-records="approvalRecords"
              :current-level="currentApprovalLevel"
              :total-levels="totalApprovalLevels"
              :status="detailData?.status || 'pending_approval'"
            />
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

    <section v-if="showTransferProgress" class="approval-detail-page__transfer">
      <TransferProgress
        :application-id="detailData?.id || id"
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
        <a-button v-if="canExempt" type="outline" @click="onExempt">免审</a-button>
      </div>
    </section>
  </section>
</template>
