<script setup lang="ts">
import type { DetailFileItem } from '@/types/detail'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CloseApplicationModal from '@/components/business/CloseApplicationModal.vue'
import DetailFileTable from '@/components/business/detail/DetailFileTable.vue'
import DetailInfoSection from '@/components/business/detail/DetailInfoSection.vue'
import ProcessTimeline from '@/components/business/ProcessTimeline.vue'
import { useApplicationDetail } from '@/composables/useApplicationDetail'
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
  isNotUploaded,
  downloading,
  downloadingFile,
  fetchDetail,
  handleContinueUpload,
  handleDownloadFile,
  handleBatchDownload,
  onFilePageChange,
} = useApplicationDetail()

const id = String(route.params.id || '')
const closeModalVisible = ref(false)

// 当前流程状态 - 使用 processDetailData.applicationStatus
const currentStatus = computed(() => processDetailData.value?.applicationStatus || '-')

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
    </div>

    <div class="detail-card" :class="{ 'is-files': activeTab === 'files' }">
      <a-spin :loading="loading" style="width: 100%">
        <template v-if="activeTab === 'info'">
          <DetailInfoSection title="基本信息" :rows="basicInfoRows" />
          <DetailInfoSection title="申请信息" :rows="applicationInfoRows" />
        </template>

        <DetailFileTable
          v-else
          :files="files as DetailFileItem[]"
          :loading="fileLoading"
          :show-download="showDownload"
          :pagination="pagination"
          @download="handleDownloadFile"
          @batch-download="handleBatchDownload"
          @page-change="onFilePageChange"
        />
      </a-spin>
    </div>

    <!-- 流程进展 -->
    <div class="detail-card process-card">
      <h3 class="process-card__title">流程进展</h3>
      <ProcessTimeline :application-id="detailData?.appBaseInfo?.applicationId || id" />
    </div>

    <footer class="application-detail-page__actions">
      <a-button v-if="isNotUploaded" type="primary" @click="handleContinueUpload">继续上传文件</a-button>
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
