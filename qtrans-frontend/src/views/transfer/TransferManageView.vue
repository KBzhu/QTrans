<script setup lang="ts">
import type { TransferManageRecord, TransferManageStatus } from '@/composables/useTransferManage'
import type { TransferType } from '@/types'
import { Message } from '@arco-design/web-vue'
import { IconEye, IconPause, IconPlayArrow, IconRefresh, IconSearch } from '@arco-design/web-vue/es/icon'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransferManage } from '@/composables/useTransferManage'
import { formatDateTime, formatFileSize, formatTransferSpeed } from '@/utils/format'
import './transfer-manage.scss'

const router = useRouter()

const {
  activeTab,
  listData,
  loading,
  pagination,
  filters,
  selectedRows,
  canBatchPause,
  canBatchResume,
  fetchList,
  handleTabChange,
  handleSearch,
  handleReset,
  handlePageChange,
  handlePageSizeChange,
  handleSelectionChange,
  handlePause,
  handleResume,
  handleRetry,
  handleBatchPause,
  handleBatchResume,
  getTransferTypeLabel,
  getStatusLabel,
} = useTransferManage()

const transferTypeOptions: { label: string, value: 'all' | TransferType }[] = [
  { label: '全部传输类型', value: 'all' },
  { label: '绿区传到绿区', value: 'green-to-green' },
  { label: '绿区传到黄区', value: 'green-to-yellow' },
  { label: '绿区传到红区', value: 'green-to-red' },
  { label: '黄区传到黄区', value: 'yellow-to-yellow' },
  { label: '黄区传到红区', value: 'yellow-to-red' },
  { label: '红区传到红区', value: 'red-to-red' },
  { label: '跨国传输', value: 'cross-country' },
]

const rowSelection = computed(() => ({
  type: 'checkbox',
  showCheckedAll: true,
  selectedRowKeys: selectedRows.value,
}))

function getProgressStatus(status: TransferManageStatus) {
  if (status === 'error')
    return 'danger'

  if (status === 'completed')
    return 'success'

  return 'normal'
}

function getStatusClass(status: TransferManageStatus) {
  return `transfer-status-tag--${status}`
}

function onViewDetail(record: TransferManageRecord) {
  router.push(`/application/${record.applicationId}`)
}

async function onPause(record: TransferManageRecord) {
  handlePause(record.applicationId)
  Message.success(`已暂停 ${record.applicationNo}`)
}

async function onResume(record: TransferManageRecord) {
  handleResume(record.applicationId)
  Message.success(`已继续 ${record.applicationNo}`)
}

async function onRetry(record: TransferManageRecord) {
  await handleRetry(record.applicationId)
  Message.success(`已重新发起 ${record.applicationNo}`)
}

async function onBatchPause() {
  const count = await handleBatchPause()
  if (count === 0) {
    Message.warning('当前未选中可暂停的传输任务')
    return
  }

  Message.success(`已批量暂停 ${count} 个传输任务`)
}

async function onBatchResume() {
  const count = await handleBatchResume()
  if (count === 0) {
    Message.warning('当前未选中可继续的传输任务')
    return
  }

  Message.success(`已批量继续 ${count} 个传输任务`)
}

onMounted(async () => {
  await fetchList()
})
</script>

<template>
  <section class="transfer-manage-page">
    <header class="transfer-manage-page__header">
      <div>
        <p class="transfer-manage-page__subtitle">仅管理员可见，用于追踪传输任务进度、失败重试与批量控制。</p>
      </div>
    </header>

    <section class="transfer-manage-tabs-card">
      <a-tabs :active-key="activeTab" type="rounded" @change="handleTabChange">
        <a-tab-pane key="transferring" title="传输中 / 异常" />
        <a-tab-pane key="completed" title="已完成" />
        <a-tab-pane key="all" title="全部" />
      </a-tabs>
    </section>

    <section class="transfer-manage-filter-card">
      <a-form layout="inline" class="transfer-manage-filter-form">
        <a-form-item field="applicationNo" label="申请单号">
          <a-input
            v-model="filters.applicationNo"
            allow-clear
            placeholder="请输入申请单号"
            @press-enter="handleSearch"
          >
            <template #prefix>
              <IconSearch />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item field="transferType" label="传输类型">
          <a-select v-model="filters.transferType" :options="transferTypeOptions" allow-clear />
        </a-form-item>

        <a-form-item field="applicantName" label="申请人">
          <a-input v-model="filters.applicantName" allow-clear placeholder="请输入申请人" @press-enter="handleSearch" />
        </a-form-item>

        <a-form-item field="transferRange" label="传输时间">
          <a-range-picker v-model="filters.transferRange" value-format="YYYY-MM-DD" />
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </section>

    <section class="transfer-manage-table-card">
      <div class="transfer-manage-table-card__toolbar">
        <span class="transfer-manage-table-card__selected">已选择 {{ selectedRows.length }} 项</span>
        <a-space>
          <a-button :disabled="!canBatchPause" status="warning" @click="onBatchPause">批量暂停</a-button>
          <a-button :disabled="!canBatchResume" type="primary" @click="onBatchResume">批量继续</a-button>
        </a-space>
      </div>

      <a-table
        row-key="id"
        :data="listData"
        :loading="loading"
        :pagination="false"
        :row-selection="rowSelection"
        @selection-change="handleSelectionChange"
      >
        <template #columns>
          <a-table-column title="申请单号" data-index="applicationNo" :width="220">
            <template #cell="{ record }">
              <button type="button" class="application-no-link" @click="onViewDetail(record)">
                {{ record.applicationNo }}
              </button>
            </template>
          </a-table-column>

          <a-table-column title="传输类型" :width="180" ellipsis tooltip>
            <template #cell="{ record }">
              {{ getTransferTypeLabel(record.transferType) }}
            </template>
          </a-table-column>

          <a-table-column title="申请人" data-index="applicantName" :width="120" />

          <a-table-column title="文件大小" :width="140">
            <template #cell="{ record }">
              {{ formatFileSize(record.totalBytes) }}
            </template>
          </a-table-column>

          <a-table-column title="传输进度" :width="120" align="center">
            <template #cell="{ record }">
              <a-progress
                type="circle"
                size="small"
                :percent="Number(record.progress.toFixed(0))"
                :status="getProgressStatus(record.status)"
              />
            </template>
          </a-table-column>

          <a-table-column title="传输速度" :width="130">
            <template #cell="{ record }">
              {{ formatTransferSpeed(record.speedBytesPerSec) }}
            </template>
          </a-table-column>

          <a-table-column title="状态" :width="120">
            <template #cell="{ record }">
              <a-tag class="transfer-status-tag" :class="getStatusClass(record.status)">
                {{ getStatusLabel(record.status) }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column title="传输时间" :width="180">
            <template #cell="{ record }">
              {{ formatDateTime(record.transferTime).replace(/-/g, '/') }}
            </template>
          </a-table-column>

          <a-table-column title="操作" :width="180" align="center" fixed="right">
            <template #cell="{ record }">
              <div class="table-actions">
                <a-button
                  v-if="record.status === 'transferring'"
                  type="text"
                  size="small"
                  class="table-action-btn"
                  @click="onPause(record)"
                >
                  <IconPause />
                </a-button>
                <a-button
                  v-else-if="record.status === 'paused'"
                  type="text"
                  size="small"
                  class="table-action-btn"
                  @click="onResume(record)"
                >
                  <IconPlayArrow />
                </a-button>
                <a-button
                  v-else-if="record.status === 'error'"
                  type="text"
                  size="small"
                  class="table-action-btn"
                  @click="onRetry(record)"
                >
                  <IconRefresh />
                </a-button>
                <span v-else class="table-action-placeholder">--</span>
                <a-button type="text" size="small" class="table-action-btn" @click="onViewDetail(record)">
                  <IconEye />
                </a-button>
              </div>
            </template>
          </a-table-column>
        </template>

        <template #empty>
          <div class="transfer-manage-empty">
            <a-empty description="暂无传输记录" />
          </div>
        </template>
      </a-table>

      <footer class="transfer-manage-table-card__footer">
        <span class="transfer-manage-table-card__summary">
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
