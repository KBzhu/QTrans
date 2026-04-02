<script setup lang="ts">
import type { MyApplicationItem } from '@/api/application'
import { Message, Modal } from '@arco-design/web-vue'
import { IconCopy, IconEye, IconFile, IconStop } from '@arco-design/web-vue/es/icon'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CloseApplicationModal from '@/components/business/CloseApplicationModal.vue'
import { formatDateTime } from '@/utils'
import { useApplicationList } from '@/composables/useApplicationList'
import './application-list.scss'

const router = useRouter()
const selectedRowKeys = ref<string[]>([])

// 关闭申请单弹窗状态
const closeModalVisible = ref(false)
const closeApplicationId = ref<number | string>('')

const {
  loading,
  advancedVisible,
  filters,
  pagination,
  listData,
  fetchList,
  handleSearch,
  handleReset,
  handlePageChange,
  handlePageSizeChange,
  getTransferTypeLabel,
} = useApplicationList()

const tableRowSelection = computed(() => ({
  type: 'checkbox' as const,
  selectedRowKeys: selectedRowKeys.value,
  showCheckedAll: true,
}))

function onToggleAdvanced() {
  advancedVisible.value = !advancedVisible.value
}

function onCreateApplication() {
  router.push('/application/select-type')
}

function onViewDetail(record: MyApplicationItem) {
  router.push(`/application/${record.applicationId}`)
}

function onFileList(record: MyApplicationItem) {
  // TODO: 跳转到文件列表页
  router.push(`/application/${record.applicationId}/files`)
}

function onCopyApplication(record: MyApplicationItem) {
  // TODO: 对接复制申请接口
  Modal.confirm({
    title: '确认复制申请？',
    content: `将复制申请单 ${record.applicationId} 的信息`,
    okText: '确认复制',
    cancelText: '取消',
    onOk: async () => {
      Message.success('复制成功')
    },
  })
}

function onCloseApplication(record: MyApplicationItem) {
  closeApplicationId.value = record.applicationId
  closeModalVisible.value = true
}

function onCloseSuccess() {
  fetchList()
}

function onExport() {
  const rows = selectedRowKeys.value.length > 0
    ? listData.value.filter(item => selectedRowKeys.value.includes(String(item.applicationId)))
    : listData.value

  if (rows.length === 0) {
    Message.warning('暂无可导出的数据')
    return
  }

  const headers = ['申请单号', '传输路由', '当前流程', '申请单状态', '申请原因', '对方名称', '创建时间']
  const body = rows.map((item) => {
    return [
      item.applicationId,
      getTransferTypeLabel(item.transWay),
      item.currentStatus || '-',
      item.taskStatus || '-',
      item.reason || '-',
      item.targetName || '-',
      formatDateTime(item.creationDate),
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
          placeholder="搜索申请单号..."
          allow-clear
          @press-enter="handleSearch"
        >
          <template #prefix>
            <img src="/figma/3961_3234/1.svg" alt="搜索" class="filter-icon" />
          </template>
        </a-input>

        <a-button class="filter-advanced-btn" @click="onToggleAdvanced">
          <template #icon>
            <img :src="assetPath('/figma/3961_3234/3.svg')" alt="高级" class="filter-icon" />
          </template>
          高级搜索
          <img src="/figma/3961_3234/2.svg" alt="展开" class="filter-arrow" :class="{ 'is-expanded': advancedVisible }" />
        </a-button>
      </div>

      <div v-if="advancedVisible" class="application-filter-card__advanced">
        <a-button type="primary" @click="handleSearch">查询</a-button>
        <a-button @click="handleReset">重置</a-button>
      </div>
    </section>

    <section class="application-table-card">
      <div class="application-table-card__toolbar">
        <a-button type="primary" @click="onExport">
          <template #icon>
            <img :src="assetPath('/figma/3961_3234/4.svg')" alt="导出" class="filter-icon" />
          </template>
          导出
        </a-button>
      </div>

      <div class="application-table-card__table-wrap">
        <a-table
          :data="listData"
          :loading="loading"
          :pagination="false"
          row-key="applicationId"
          :row-selection="tableRowSelection"
          @select="(keys: string[]) => selectedRowKeys = keys"
          @select-all="(checked: boolean) => selectedRowKeys = checked ? listData.map(item => String(item.applicationId)) : []"
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

            <a-table-column title="传输路由" :width="180" ellipsis tooltip>
              <template #cell="{ record }">{{ getTransferTypeLabel(record.transWay) }}</template>
            </a-table-column>

            <a-table-column title="当前流程" :width="120" ellipsis tooltip>
              <template #cell="{ record }">{{ record.currentStatus || '-' }}</template>
            </a-table-column>

            <a-table-column title="申请单状态" :width="120" ellipsis tooltip>
              <template #cell="{ record }">{{ record.taskStatus || '-' }}</template>
            </a-table-column>

            <a-table-column title="申请原因" :width="180" ellipsis tooltip>
              <template #cell="{ record }">{{ record.reason || '-' }}</template>
            </a-table-column>

            <a-table-column title="对方名称" :width="120" ellipsis tooltip>
              <template #cell="{ record }">{{ record.targetName || '-' }}</template>
            </a-table-column>

            <a-table-column title="创建时间" :width="170">
              <template #cell="{ record }">{{ formatDateTime(record.creationDate).replace(/-/g, '/') }}</template>
            </a-table-column>

            <a-table-column title="操作" :width="200" align="center" fixed="right">
              <template #cell="{ record }">
                <div class="table-actions">
                  <a-button
                    type="text"
                    size="small"
                    class="table-action-btn"
                    title="文件列表"
                    @click="onFileList(record)"
                  >
                    <IconFile />
                  </a-button>

                  <a-button
                    type="text"
                    size="small"
                    class="table-action-btn"
                    title="复制申请"
                    @click="onCopyApplication(record)"
                  >
                    <IconCopy />
                  </a-button>

                  <a-button
                    type="text"
                    size="small"
                    class="table-action-btn"
                    title="关闭申请单"
                    @click="onCloseApplication(record)"
                  >
                    <IconStop />
                  </a-button>

                  <a-button
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

    <!-- 关闭申请单确认弹窗 -->
    <CloseApplicationModal
      v-model:visible="closeModalVisible"
      :application-id="closeApplicationId"
      @success="onCloseSuccess"
    />
  </section>
</template>
