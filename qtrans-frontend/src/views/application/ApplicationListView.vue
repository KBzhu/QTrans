<script setup lang="ts">
import type { Application, ApplicationStatus } from '@/types'
import { Message, Modal } from '@arco-design/web-vue'
import { IconDelete, IconEdit, IconEye, IconUndo } from '@arco-design/web-vue/es/icon'
import { computed, onMounted, ref } from 'vue'

import { useRouter } from 'vue-router'
import { formatDateTime } from '@/utils'
import { useApplicationList } from '@/composables/useApplicationList'
import { useFileStore } from '@/stores'
import './application-list.scss'

const router = useRouter()
const fileStore = useFileStore()
const selectedRowKeys = ref<string[]>([])

const {
  loading,
  advancedVisible,
  filters,
  pagination,
  listData,
  filteredList,
  fetchList,
  handleSearch,
  handleReset,
  handlePageChange,
  handlePageSizeChange,
  handleDelete,
  handleWithdraw,
} = useApplicationList()

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '待上传', value: 'pending_upload' },
  { label: '待审批', value: 'pending_approval' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '传输中', value: 'transferring' },
  { label: '已完成', value: 'completed' },
]

const statusLabelMap: Record<ApplicationStatus, string> = {
  draft: '草稿',
  pending_upload: '待上传',
  pending_approval: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  transferring: '传输中',
  completed: '已完成',
}

const transferTypeLabelMap: Record<Application['transferType'], string> = {
  'green-to-green': '绿区传到绿区',
  'green-to-yellow': '绿区传到黄区',
  'green-to-red': '绿区传到红区',
  'yellow-to-yellow': '黄区传到黄区',
  'yellow-to-red': '黄区传到红区',
  'red-to-red': '红区传到红区',
  'cross-country': '跨国传输',
}

const tableRowSelection = computed(() => ({
  type: 'checkbox' as const,
  selectedRowKeys: selectedRowKeys.value,
  showCheckedAll: true,
}))

function getFileCount(record: Application): number {
  if (record.status === 'draft')
    return 0

  const realCount = fileStore.getFilesByApplicationId(record.id).length
  return realCount
}

function getStatusClass(status: ApplicationStatus) {
  return `application-status-tag--${status}`
}

function getStatusLabel(status: ApplicationStatus) {
  return statusLabelMap[status]
}

function toTextArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value.map(item => String(item).trim()).filter(Boolean)

  if (typeof value === 'string') {
    return value
      .split(/[,，、/\s]+/g)
      .map(item => item.trim())
      .filter(Boolean)
  }

  if (typeof value === 'number')
    return [String(value)]

  return []
}

function formatArrayField(value: unknown, separator = ' / ') {
  const list = toTextArray(value)
  return list.length > 0 ? list.join(separator) : '-'
}

function formatApplyReason(value: unknown) {
  const text = String(value || '').trim()
  return text || '-'
}


function onToggleAdvanced() {

  advancedVisible.value = !advancedVisible.value
}

function onCreateApplication() {
  router.push('/application/select-type')
}

function onViewDetail(record: Application) {
  router.push(`/application/${record.id}`)
}


function onContinueEdit(record: Application) {
  router.push({
    path: '/application/create',
    query: {
      draftId: record.id,
      type: record.transferType,
    },
  })
}

function onDeleteDraft(record: Application) {
  Modal.warning({
    title: '确认删除草稿？',
    content: `删除后无法恢复（${record.applicationNo}）`,
    okText: '确认删除',
    cancelText: '取消',
    onOk: async () => {
      await handleDelete(record.id)
      Message.success('草稿已删除')
    },
  })
}

function onWithdraw(record: Application) {
  Modal.confirm({
    title: '确认撤回申请？',
    content: `撤回后将转为草稿（${record.applicationNo}）`,
    okText: '确认撤回',
    cancelText: '取消',
    onOk: async () => {
      await handleWithdraw(record.id)
      Message.success('申请已撤回')
    },
  })
}

function onExport() {
  const rows = selectedRowKeys.value.length > 0
    ? filteredList.value.filter(item => selectedRowKeys.value.includes(item.id))
    : filteredList.value

  if (rows.length === 0) {
    Message.warning('暂无可导出的数据')
    return
  }

  const headers = ['申请单号', '申请类型', '状态', '申请原因', '下载人', '源城市', '目标城市', '创建时间']
  const body = rows.map((item) => {
    return [
      item.applicationNo,
      transferTypeLabelMap[item.transferType],
      statusLabelMap[item.status],
      formatApplyReason(item.applyReason),
      formatArrayField(item.downloaderAccounts, '、'),
      formatArrayField(item.sourceCity),
      formatArrayField(item.targetCity),

      formatDateTime(item.createdAt),
    ].join(',')
  })

  const csv = `${headers.join(',')}\n${body.join('\n')}`
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `application-list-${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
  Message.success(`已导出 ${rows.length} 条记录`)
}

onMounted(async () => {
  await fetchList()
})
</script>

<template>
  <section class="application-list-page">
    <section class="application-filter-card">
      <div class="application-filter-card__main">
        <a-input
          v-model="filters.keyword"
          class="filter-keyword"
          placeholder="搜索申请单号或申请类型..."
          allow-clear
          @press-enter="handleSearch"
        >
          <template #prefix>
            <img src="/figma/3961_3234/1.svg" alt="搜索" class="filter-icon" />
          </template>
        </a-input>

        <a-select v-model="filters.status" class="filter-status" :options="statusOptions" />

        <a-button class="filter-advanced-btn" @click="onToggleAdvanced">
          <template #icon>
            <img src="/figma/3961_3234/3.svg" alt="高级" class="filter-icon" />
          </template>
          高级搜索
          <img src="/figma/3961_3234/2.svg" alt="展开" class="filter-arrow" :class="{ 'is-expanded': advancedVisible }" />
        </a-button>
      </div>

      <div v-if="advancedVisible" class="application-filter-card__advanced">
        <a-range-picker
          v-model="filters.dateRange"
          value-format="YYYY-MM-DD"
          class="filter-date-range"
          allow-clear
        />
        <a-button type="primary" @click="handleSearch">查询</a-button>
        <a-button @click="handleReset">重置</a-button>
      </div>
    </section>

    <section class="application-table-card">
      <div class="application-table-card__toolbar">
        <a-button type="primary" @click="onExport">
          <template #icon>
            <img src="/figma/3961_3234/4.svg" alt="导出" class="filter-icon" />
          </template>
          导出
        </a-button>
      </div>

      <div class="application-table-card__table-wrap">
        <a-table
          :data="listData"
          :loading="loading"
          :pagination="false"
          row-key="id"
          :row-selection="tableRowSelection"
          @select="(keys: string[]) => selectedRowKeys = keys"
          @select-all="(checked: boolean) => selectedRowKeys = checked ? listData.map(item => item.id) : []"
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

            <a-table-column title="文件数" :width="100" align="center">
              <template #cell="{ record }">{{ getFileCount(record) }}</template>
            </a-table-column>

            <a-table-column title="状态" :width="130">
              <template #cell="{ record }">
                <a-tag class="application-status-tag" :class="getStatusClass(record.status)">
                  {{ getStatusLabel(record.status) }}
                </a-tag>

              </template>
            </a-table-column>

            <a-table-column title="申请原因" :width="180" ellipsis tooltip>
              <template #cell="{ record }">{{ formatApplyReason(record.applyReason) }}</template>
            </a-table-column>

            <a-table-column title="下载人名称" :width="170" ellipsis tooltip>
              <template #cell="{ record }">{{ formatArrayField(record.downloaderAccounts, '、') }}</template>
            </a-table-column>

            <a-table-column title="源城市" :width="120" ellipsis>
              <template #cell="{ record }">{{ formatArrayField(record.sourceCity) }}</template>
            </a-table-column>

            <a-table-column title="目标城市" :width="120" ellipsis>
              <template #cell="{ record }">{{ formatArrayField(record.targetCity) }}</template>
            </a-table-column>


            <a-table-column title="创建时间" :width="170">
              <template #cell="{ record }">{{ formatDateTime(record.createdAt).replace(/-/g, '/') }}</template>
            </a-table-column>

            <a-table-column title="操作" :width="180" align="center" fixed="right">
              <template #cell="{ record }">
                <div class="table-actions">
                  <a-button
                    type="text"
                    size="small"
                    class="table-action-btn"
                    title="查看"
                    @click="onViewDetail(record)"
                  >
                    <IconEye />
                  </a-button>

                  <a-button
                    v-if="record.status === 'draft'"
                    type="text"
                    size="small"
                    class="table-action-btn"
                    title="编辑"
                    @click="onContinueEdit(record)"
                  >
                    <IconEdit />
                  </a-button>

                  <a-button
                    v-if="record.status === 'draft'"
                    type="text"
                    status="danger"
                    size="small"
                    class="table-action-btn"
                    title="删除"
                    @click="onDeleteDraft(record)"
                  >
                    <IconDelete />
                  </a-button>

                  <a-button
                    v-if="record.status === 'pending_approval'"
                    type="text"
                    status="warning"
                    size="small"
                    class="table-action-btn"
                    title="撤回"
                    @click="onWithdraw(record)"
                  >
                    <IconUndo />
                  </a-button>
                </div>
              </template>
            </a-table-column>


          </template>

          <template #empty>
            <div class="application-list-empty">
              <a-empty description="暂无申请单数据" />
              <a-button type="primary" @click="onCreateApplication">去创建申请单</a-button>
            </div>
          </template>
        </a-table>
      </div>

      <footer class="application-table-card__footer">
        <span class="application-table-card__summary">
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
