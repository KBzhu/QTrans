<script setup lang="ts">
import type { TransferState } from '@/types'
import { Modal } from '@arco-design/web-vue'
import { IconCheckCircleFill } from '@arco-design/web-vue/es/icon'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TransferProgress from '@/components/business/TransferProgress.vue'
import DetailFileTable from '@/components/business/detail/DetailFileTable.vue'
import DetailInfoSection from '@/components/business/detail/DetailInfoSection.vue'
import { useApplicationDetail } from '@/composables/useApplicationDetail'
import './application-detail.scss'


const route = useRoute()
const router = useRouter()

const {
  loading,
  detailData,
  activeTab,
  statusLabel,
  basicInfoRows,
  applicationInfoRows,
  files,
  fetchDetail,
  handleEdit,
  handleDelete,
  handleWithdraw,
  handleUploadFile,
  handleDownloadFile,
  handleBatchDownload,
} = useApplicationDetail()

const id = String(route.params.id || '')
const transferSectionRef = ref<HTMLElement | null>(null)

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

async function handleViewTransferProgress() {
  await nextTick()
  transferSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleDownloadAll() {
  handleBatchDownload(files.value.map(item => item.id))
}

function goBack() {
  router.push('/applications')
}


function onDelete() {
  Modal.warning({
    title: '确认删除申请单？',
    content: `删除后不可恢复（${detailData.value?.applicationNo || ''}）`,
    okText: '确认删除',
    cancelText: '取消',
    onOk: handleDelete,
  })
}

function onWithdraw() {
  Modal.confirm({
    title: '确认关闭申请？',
    content: `关闭后将转为草稿（${detailData.value?.applicationNo || ''}）`,
    okText: '确认关闭',
    cancelText: '取消',
    onOk: handleWithdraw,
  })
}

onMounted(async () => {
  if (id)
    await fetchDetail(id)
})
</script>

<template>
  <section class="application-detail-page">
    <div class="application-detail-page__crumbs">
      <button class="back-btn" @click="goBack">
        <img src="/figma/3971_1904/1.svg" alt="返回" />
      </button>
      <span class="crumb-text">我的申请 / 详情</span>
    </div>

    <header class="application-detail-page__header">
      <div>
        <h1 class="application-detail-page__title">申请详情</h1>
        <p class="application-detail-page__no">申请单号：{{ detailData?.applicationNo || '-' }}</p>
      </div>

      <div class="status-pill" :class="`status-pill--${detailData?.status || 'draft'}`">
        <IconCheckCircleFill />
        <span>{{ statusLabel }}</span>
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
        文件列表（{{ files.length }}）
      </button>
    </div>

    <div class="detail-card" :class="{ 'is-files': activeTab === 'files' }">
      <a-spin :loading="loading" style="width: 100%">
        <template v-if="activeTab === 'info'">
          <DetailInfoSection title="基本信息" :rows="basicInfoRows" />
          <DetailInfoSection title="申请信息" :rows="applicationInfoRows" />
        </template>

        <DetailFileTable
          v-else
          :files="files"
          :loading="loading"
          @download="handleDownloadFile"
          @batch-download="handleBatchDownload"
        />
      </a-spin>
    </div>

    <section v-if="showTransferProgress" ref="transferSectionRef" class="application-detail-page__transfer">
      <TransferProgress
        :application-id="detailData?.id || id"
        :file-size="transferFileSize"
        :status-hint="transferStatusHint"
      />
    </section>

    <footer class="application-detail-page__actions">
      <a-button v-if="detailData?.status === 'draft'" type="outline" @click="handleEdit">继续编辑</a-button>
      <a-button v-if="detailData?.status === 'draft'" status="danger" @click="onDelete">删除</a-button>
      <a-button v-if="detailData?.status === 'pending_upload'" type="primary" @click="handleUploadFile">上传文件</a-button>
      <a-button v-if="detailData?.status === 'pending_approval'" status="danger" @click="onWithdraw">关闭申请</a-button>
      <a-button v-if="detailData && ['approved', 'transferring'].includes(detailData.status)" type="primary" @click="handleViewTransferProgress">查看传输进度</a-button>
      <a-button v-if="detailData?.status === 'completed' && files.length" type="primary" @click="handleDownloadAll">批量下载</a-button>
    </footer>

  </section>
</template>
