<script setup lang="ts">
import type { Application, ApplicationStatus } from '@/types'
import { Message } from '@arco-design/web-vue'
import { IconDownload, IconEye, IconSearch } from '@arco-design/web-vue/es/icon'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDownloadList } from '@/composables/useDownloadList'
import { formatDateTime } from '@/utils'
import './download-list.scss'

const router = useRouter()

const {
  loading,
  filters,
  pagination,
  listData,
  fetchList,
  handleSearch,
  handleReset,
  handlePageChange,
  handlePageSizeChange,
  getFileCountByApplicationId,
  getDownloadStatusByApplicationId,
  getDownloadStatusLabel,
  getTransferTypeLabel,
  handleDownloadApplication,
} = useDownloadList()

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '待上传', value: 'pending_upload' },
  { label: '待审批', value: 'pending_approval' },
  { label: '已批准', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '传输中', value: 'transferring' },
  { label: '已完成', value: 'completed' },
]

const downloadStatusOptions = [
  { label: '全部下载状态', value: 'all' },
  { label: '未下载', value: 'not_started' },
  { label: '部分下载', value: 'partial' },
  { label: '已下载', value: 'completed' },
]

const statusLabelMap: Record<ApplicationStatus, string> = {
  draft: '草稿',
  pending_upload: '待上传',
  pending_approval: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  transferring: '传输中',
  completed: '已完成',
}

function getStatusClass(status: ApplicationStatus) {
  return `download-status-tag--${status}`
}

function onViewDetail(record: Application) {
  router.push(`/application/${record.id}`)
}

function onDownload(record: Application) {
  const result = handleDownloadApplication(record.id)

  if (result.total === 0) {
    Message.warning('当前申请暂无可下载文件')
    return
  }

  if (result.fallback > 0) {
    Message.warning(`已开始下载 ${result.downloaded} 个文件（其中 ${result.fallback} 个为模拟下载）`)
    return
  }

  Message.success(`已开始下载 ${result.downloaded} 个文件`)
}

onMounted(async () => {
  await fetchList()
})
</script>

<template>
  <section class="download-list-page">
    <h1 class="download-list-page__title">待我下载</h1>

    <section class="download-filter-card">
      <div class="download-filter-card__main">
        <a-input
          v-model="filters.keyword"
          class="filter-keyword"
          placeholder="搜索申请单号或申请类型..."
          allow-clear
          @press-enter="handleSearch"
        >
          <template #prefix>
            <IconSearch />
          </template>
        </a-input>

        <a-select
          v-model="filters.status"
          class="filter-select"
          :options="statusOptions"
          @change="handleSearch"
        />

        <a-select
          v-model="filters.downloadStatus"
          class="filter-select"
          :options="downloadStatusOptions"
          @change="handleSearch"
        />

        <a-button class="filter-reset-btn" @click="handleReset">重置</a-button>
      </div>
    </section>

    <section class="download-table-card">
      <div class="download-table-card__table-wrap">
        <a-table
          :data="listData"
          :loading="loading"
          :pagination="false"
          row-key="id"
        >
          <template #columns>
            <a-table-column title="序号" :width="72">
              <template #cell="{ rowIndex }">
                {{ (pagination.current - 1) * pagination.pageSize + rowIndex + 1 }}
              </template>
            </a-table-column>

            <a-table-column title="申请单号" data-index="applicationNo" :width="220">
              <template #cell="{ record }">
                <button type="button" class="application-no-link" @click="onViewDetail(record)">
                  {{ record.applicationNo }}
                </button>
              </template>
            </a-table-column>

            <a-table-column title="申请类型" :width="160" ellipsis tooltip>
              <template #cell="{ record }">{{ getTransferTypeLabel(record.transferType) }}</template>
            </a-table-column>

            <a-table-column title="文件数" :width="110" align="center">
              <template #cell="{ record }">{{ getFileCountByApplicationId(record.id) }}</template>
            </a-table-column>

            <a-table-column title="状态" :width="120">
              <template #cell="{ record }">
                <a-tag class="download-status-tag" :class="getStatusClass(record.status)">
                  {{ statusLabelMap[record.status] }}
                </a-tag>
              </template>
            </a-table-column>

            <a-table-column title="下载进度" :width="120">
              <template #cell="{ record }">
                {{ getDownloadStatusLabel(getDownloadStatusByApplicationId(record.id)) }}
              </template>
            </a-table-column>

            <a-table-column title="申请人" data-index="applicantName" :width="120" />

            <a-table-column title="申请原因" :width="170" ellipsis tooltip>
              <template #cell="{ record }">{{ record.applyReason || '-' }}</template>
            </a-table-column>

            <a-table-column title="创建时间" :width="170">
              <template #cell="{ record }">{{ formatDateTime(record.createdAt).replace(/-/g, '/') }}</template>
            </a-table-column>

            <a-table-column title="结束时间" :width="170">
              <template #cell="{ record }">{{ formatDateTime(record.downloadExpireTime).replace(/-/g, '/') }}</template>
            </a-table-column>

            <a-table-column title="操作" :width="120" align="center" fixed="right">
              <template #cell="{ record }">
                <div class="table-actions">
                  <a-button
                    type="text"
                    size="small"
                    class="table-action-btn"
                    title="查看详情"
                    @click="onViewDetail(record)"
                  >
                    <IconEye />
                  </a-button>
                  <a-button
                    type="text"
                    size="small"
                    class="table-action-btn"
                    title="下载文件"
                    @click="onDownload(record)"
                  >
                    <IconDownload />
                  </a-button>
                </div>
              </template>
            </a-table-column>
          </template>

          <template #empty>
            <div class="download-list-empty">
              <a-empty description="暂无待下载记录" />
            </div>
          </template>
        </a-table>
      </div>

      <footer class="download-table-card__footer">
        <span class="download-table-card__summary">
          显示 {{ pagination.total === 0 ? 0 : (pagination.current - 1) * pagination.pageSize + 1 }}
          - {{ Math.min(pagination.current * pagination.pageSize, pagination.total) }} 共 {{ pagination.total }} 条记录
        </span>
        <a-pagination
          :total="pagination.total"
          :current="pagination.current"
          :page-size="pagination.pageSize"
          :show-total="false"
          :show-page-size="true"
          :page-size-options="[10, 20, 50]"
          @change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </footer>
    </section>
  </section>
</template>
