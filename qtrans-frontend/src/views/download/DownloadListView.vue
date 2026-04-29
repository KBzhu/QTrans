<script setup lang="ts">
import type { WaitingDownloadItem } from '@/api/application'
import { Message } from '@arco-design/web-vue'
import { IconDownload, IconEye, IconSearch } from '@arco-design/web-vue/es/icon'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDownloadList } from '@/composables/useDownloadList'
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
  getTransferTypeLabel,
  getCurrentStatusLabel,
  handleDownloadApplication,
  getDownloadRoute,
} = useDownloadList()



// currentStatus -> CSS class 后缀（真实字段转为 kebab-case）
function getStatusClass(currentStatus: string) {
  const classMap: Record<string, string> = {
    'Notification Download': 'approved',
    'Pending Approval': 'pending_approval',
    'Approved': 'approved',
    'Rejected': 'rejected',
    'Transferring': 'transferring',
    'Completed': 'completed',
  }
  return `download-status-tag--${classMap[currentStatus] || 'pending_approval'}`
}

function onViewDetail(record: WaitingDownloadItem) {
  router.push({ path: `/application/${record.applicationId}`, query: { showDownload: 'true' } })
}

function onDownload(record: WaitingDownloadItem) {
  const result = handleDownloadApplication(record.applicationId)

  if (result.total === 0) {
    Message.warning('当前申请暂无可下载链接')
    return
  }

  const route = getDownloadRoute(record.applicationId)
  if (route) {
    router.push({ path: route.path, query: route.query })
  }
}

onMounted(async () => {
  await fetchList()
})
</script>

<template>
  <section class="download-list-page">
    <section class="download-filter-card">
      <div class="download-filter-card__main">
        <a-input
          v-model="filters.keyword"
          class="filter-keyword"
          placeholder="搜索申请单号"
          allow-clear
          @press-enter="handleSearch"
        >
          <template #prefix>
            <IconSearch />
          </template>
        </a-input>

        <a-button type="primary" @click="handleSearch">查询</a-button>
        <a-button class="filter-reset-btn" @click="handleReset">重置</a-button>
      </div>
    </section>

    <section class="download-table-card">
      <div class="download-table-card__table-wrap">
        <a-table
          :data="listData"
          :loading="loading"
          :pagination="false"
          row-key="applicationId"
        >
          <template #columns>
            <a-table-column title="序号" :width="72">
              <template #cell="{ rowIndex }">
                {{ (pagination.current - 1) * pagination.pageSize + rowIndex + 1 }}
              </template>
            </a-table-column>

            <a-table-column title="申请单号" data-index="applicationId" :width="180">
              <template #cell="{ record }">
                <button type="button" class="application-no-link" @click="onViewDetail(record)">
                  {{ record.applicationId }}
                </button>
              </template>
            </a-table-column>

            <a-table-column title="申请类型" :width="160" ellipsis tooltip>
              <template #cell="{ record }">{{ getTransferTypeLabel(record.transWay) }}</template>
            </a-table-column>
            <!-- 申请人：真实字段 applicantW3Account，无姓名 -->
            <a-table-column title="申请人账号" :width="140">
              <template #cell="{ record }">{{ record.applicantW3Account || '-' }}</template>
            </a-table-column>

            <!-- 申请原因：真实字段 reason，对应 mock 的 applyReason -->
            <a-table-column title="申请原因" :width="170" ellipsis tooltip>
              <template #cell="{ record }">{{ record.reason || '-' }}</template>
            </a-table-column>

            <!-- 创建时间：真实字段 creationDate，对应 mock 的 createdAt -->
            <a-table-column title="创建时间" :width="170">
              <template #cell="{ record }">{{ record.creationDate ? record.creationDate.replace(/-/g, '/') : '-' }}</template>
            </a-table-column>

            <!-- 结束时间：真实字段 downloadEndDate，对应 mock 的 downloadExpireTime -->
            <a-table-column title="结束时间" :width="170">
              <template #cell="{ record }">{{ record.downloadEndDate ? record.downloadEndDate.replace(/-/g, '/') : '-' }}</template>
            </a-table-column>

            <a-table-column title="申请状态" :width="130">
              <template #cell="{ record }">
                <span class="download-status-tag" :class="getStatusClass(record.currentStatus)">
                  {{ getCurrentStatusLabel(record.currentStatus) }}
                </span>
              </template>
            </a-table-column>

            <a-table-column title="下载状态" :width="110">
              <template #cell="{ record }">
                {{ record.downloadStatus || '-' }}
              </template>
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
