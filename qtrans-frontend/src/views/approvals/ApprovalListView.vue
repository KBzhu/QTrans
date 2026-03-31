<script setup lang="ts">
import type { ApprovalListItem } from '@/composables/useApprovalList'
import type { TransferType } from '@/constants'
import { IconEye, IconRight } from '@arco-design/web-vue/es/icon'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { TRANSFER_TYPE_LABEL_MAP, TRANSFER_TYPE_OPTIONS_WITH_ALL } from '@/constants'
import { formatDateTime } from '@/utils'
import type { ApprovalTabType } from '@/composables/useApprovalList'
import { useApprovalList } from '@/composables/useApprovalList'
import './approval-list.scss'

const router = useRouter()

const {
  loading,
  activeTab,
  filters,
  pagination,
  listData,
  fetchList,
  handleTabChange,
  handleSearch,
  handleReset,
  handlePageChange,
  handlePageSizeChange,
} = useApprovalList()

// 使用统一常量
const transferTypeOptions = TRANSFER_TYPE_OPTIONS_WITH_ALL
const transferTypeLabelMap = TRANSFER_TYPE_LABEL_MAP

function onViewDetail(record: ApprovalListItem) {
  router.push({
    path: `/approvals/${record.id}`,
    query: {
      currentHandler: record.currentHandler,
      currentStatus: record.currentApprovalStatus,
      applicationStatus: record.applicationStatus != null ? String(record.applicationStatus) : undefined,
    },
  })
}

function onApprove(record: ApprovalListItem) {
  router.push({
    path: `/approvals/${record.id}`,
    query: {
      currentHandler: record.currentHandler,
      currentStatus: record.currentApprovalStatus,
      applicationStatus: record.applicationStatus != null ? String(record.applicationStatus) : undefined,
    },
  })
}

function onTabChange(tab: string) {
  handleTabChange(tab as ApprovalTabType)
}

onMounted(async () => {
  await fetchList()
})
</script>

<template>
  <section class="approval-list-page">
    <div class="approval-list-page__tabs">
      <a-tabs :active-key="activeTab" @change="onTabChange">
        <a-tab-pane key="pending" title="待我审批" />
        <a-tab-pane key="approved" title="我已审批" />
        <a-tab-pane key="all" title="全部审批" />
      </a-tabs>
    </div>

    <section class="approval-filter-card">
      <a-form :model="filters" layout="inline" class="approval-filter-form">
        <a-form-item label="申请单号" field="keyword">
          <a-input
            v-model="filters.keyword"
            placeholder="搜索申请单号"
            allow-clear
            style="width: 200px"
            @press-enter="handleSearch"
          />
        </a-form-item>

        <a-form-item label="传输类型" field="transferType">
          <a-select
            v-model="filters.transferType"
            :options="transferTypeOptions"
            style="width: 160px"
          />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>
    </section>

    <section class="approval-table-card">
      <div class="approval-table-card__table-wrap">
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
                <button type="button" class="approval-no-link" @click="onViewDetail(record)">
                  {{ record.applicationNo }}
                </button>
              </template>
            </a-table-column>

            <a-table-column title="传输类型" :width="150">
              <template #cell="{ record }">
                {{ transferTypeLabelMap[record.transferType as TransferType] }}
              </template>
            </a-table-column>

            <a-table-column title="申请人" data-index="applicantName" :width="120" />

            <a-table-column title="申请时间" :width="170">
              <template #cell="{ record }">
                {{ formatDateTime(record.createdAt).replace(/-/g, '/') }}
              </template>
            </a-table-column>

            <a-table-column title="当前审批状态" :width="140" align="center">
              <template #cell="{ record }">
                <a-tag color="arcoblue">
                  {{ record.currentApprovalStatus || '-' }}
                </a-tag>
              </template>
            </a-table-column>

            <a-table-column title="操作" :width="120" align="center" fixed="right">
              <template #cell="{ record }">
                <div class="table-actions">
                  <a-button
                    v-if="activeTab === 'pending'"
                    type="primary"
                    size="small"
                    @click="onApprove(record)"
                  >
                    <template #icon>
                      <IconRight />
                    </template>
                    审批
                  </a-button>

                  <a-button
                    v-else
                    type="text"
                    size="small"
                    class="table-action-btn"
                    title="查看详情"
                    @click="onViewDetail(record)"
                  >
                    <IconEye />
                  </a-button>
                </div>
              </template>
            </a-table-column>
          </template>

          <template #empty>
            <div class="approval-list-empty">
              <a-empty :description="activeTab === 'pending' ? '暂无待审批申请单' : '暂无审批记录'" />
            </div>
          </template>
        </a-table>
      </div>

      <footer class="approval-table-card__footer">
        <span class="approval-table-card__summary">
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
