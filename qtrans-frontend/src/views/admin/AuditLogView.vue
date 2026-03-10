<script setup lang="ts">
import type { AuditActionType, AuditLogRecord } from '@/types'
import { IconDownload, IconRefresh, IconSearch } from '@arco-design/web-vue/es/icon'
import { onMounted } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import { useAuditLog } from '@/composables/useAuditLog'
import './audit-log.scss'

const {
  listData,
  loading,
  pagination,
  filters,
  actionTypeOptions,
  fetchList,
  handleSearch,
  handleReset,
  handlePageChange,
  handlePageSizeChange,
  handleExport,
  getActionTypeLabel,
  getActionTypeColor,
  getResultLabel,
  getResultColor,
} = useAuditLog()

const columns = [
  { title: '操作时间', dataIndex: 'operationTime', slotName: 'operationTime', width: 180 },
  { title: '操作类型', dataIndex: 'actionType', slotName: 'actionType', width: 120 },
  { title: '操作用户', dataIndex: 'operator', width: 120 },
  { title: 'IP地址', dataIndex: 'ip', width: 140 },
  { title: '操作详情', dataIndex: 'detail', slotName: 'detail', width: 260 },
  { title: '关联资源', dataIndex: 'resource', slotName: 'resource', width: 220 },
  { title: '操作结果', dataIndex: 'result', slotName: 'result', width: 100, align: 'center' },
]

function formatDateTime(dateTime: string) {
  const date = new Date(dateTime)
  if (Number.isNaN(date.getTime()))
    return '-'

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

onMounted(async () => {
  await fetchList()
})
</script>

<template>
  <PageContainer title="日志审计">
    <div class="audit-log-view">
      <div class="audit-log-filters">
        <a-form layout="inline" :model="filters">
          <a-form-item label="操作类型">
            <a-select v-model="filters.actionType" :options="actionTypeOptions" style="width: 170px" allow-clear />
          </a-form-item>

          <a-form-item label="操作用户">
            <a-input
              v-model="filters.operator"
              placeholder="请输入操作用户"
              allow-clear
              style="width: 180px"
              @press-enter="handleSearch"
            />
          </a-form-item>

          <a-form-item label="操作时间范围">
            <a-range-picker v-model="filters.operationRange" value-format="YYYY-MM-DD" style="width: 260px" allow-clear />
          </a-form-item>

          <a-form-item label="IP地址">
            <a-input
              v-model="filters.ip"
              placeholder="请输入IP地址"
              allow-clear
              style="width: 180px"
              @press-enter="handleSearch"
            />
          </a-form-item>

          <a-form-item>
            <a-space>
              <a-button type="primary" @click="handleSearch">
                <template #icon>
                  <IconSearch />
                </template>
                查询
              </a-button>
              <a-button @click="handleReset">
                <template #icon>
                  <IconRefresh />
                </template>
                重置
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </div>

      <div class="audit-log-table-wrapper">
        <div class="audit-log-toolbar">
          <div class="audit-log-toolbar__summary">
            共 {{ pagination.total }} 条日志
          </div>
          <a-button type="outline" @click="handleExport">
            <template #icon>
              <IconDownload />
            </template>
            导出 CSV
          </a-button>
        </div>

        <a-table
          :data="listData"
          :columns="columns"
          :loading="loading"
          :pagination="false"
          :bordered="{ cell: true }"
          :scroll="{ x: 1180 }"
          row-key="id"
        >
          <template #operationTime="{ record }">
            {{ formatDateTime((record as AuditLogRecord).operationTime) }}
          </template>

          <template #actionType="{ record }">
            <a-tag :color="getActionTypeColor((record as AuditLogRecord).actionType as AuditActionType)">
              {{ getActionTypeLabel((record as AuditLogRecord).actionType as AuditActionType) }}
            </a-tag>
          </template>

          <template #detail="{ record }">
            <div class="cell-ellipsis" :title="(record as AuditLogRecord).detail">
              {{ (record as AuditLogRecord).detail }}
            </div>
          </template>

          <template #resource="{ record }">
            <div class="cell-ellipsis" :title="(record as AuditLogRecord).resource">
              {{ (record as AuditLogRecord).resource }}
            </div>
          </template>

          <template #result="{ record }">
            <a-tag :color="getResultColor((record as AuditLogRecord).result)">
              {{ getResultLabel((record as AuditLogRecord).result) }}
            </a-tag>
          </template>
        </a-table>

        <div class="audit-log-pagination">
          <a-pagination
            :total="pagination.total"
            :current="pagination.current"
            :page-size="pagination.pageSize"
            :page-size-options="[10, 20, 50]"
            show-total
            show-page-size
            show-jumper
            @change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          />
        </div>
      </div>
    </div>
  </PageContainer>
</template>
