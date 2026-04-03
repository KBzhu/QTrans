<script setup lang="ts">
import type { AdminApplicationRecord } from '@/types'
import { 
  IconRefresh, 
  IconSearch,
  IconFilter,
  IconFile,
  IconUser,
  IconDownload,
  IconLock,
  IconLocation,
  IconEye,
} from '@arco-design/web-vue/es/icon'
import { onMounted, ref } from 'vue'
import AdminApplicationDetailModal from './AdminApplicationDetailModal.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import { useAdminApplication } from '@/composables/useAdminApplication'
import './admin-application.scss'

const {
  listData,
  loading,
  pagination,
  filters,
  securityLevelOptions,
  areaOptions,
  fetchList,
  handleSearch,
  handleReset,
  handlePageChange,
  handlePageSizeChange,
  getStatusColor,
  formatDateTime,
  formatBoolean,
} = useAdminApplication()

const columns = [
  { title: '申请单号', dataIndex: 'applicationId', width: 120, fixed: 'left' },
  { title: '当前状态', dataIndex: 'currentStatus', slotName: 'currentStatus', width: 110 },
  { title: '申请人', dataIndex: 'applicantW3Account', width: 120 },
  { title: '下载人', dataIndex: 'downloadW3Account', width: 120 },
  { title: '安全等级', dataIndex: 'securityLevelName', width: 100 },
  { title: '传输方式', dataIndex: 'transWay', width: 120 },
  { title: '源城市', dataIndex: 'fromCityName', width: 100 },
  { title: '目标城市', dataIndex: 'toCityName', width: 100 },
  { title: '申请原因', dataIndex: 'reason', slotName: 'reason', width: 180 },
  { title: '部门路径', dataIndex: 'userDepartmentNamePath', slotName: 'deptPath', width: 200 },
  { title: '客户数据', dataIndex: 'isCustomerData', slotName: 'isCustomerData', width: 90, align: 'center' },
  { title: '创建时间', dataIndex: 'creationDate', slotName: 'creationDate', width: 160 },
  { title: '操作', slotName: 'actions', width: 100, fixed: 'right', align: 'center' },
]

// 详情对话框
const detailModalVisible = ref(false)
const currentApplicationId = ref<string | number | null>(null)

function handleViewDetail(record: AdminApplicationRecord) {
  currentApplicationId.value = record.applicationId
  detailModalVisible.value = true
}

onMounted(async () => {
  await fetchList()
})
</script>

<template>
  <PageContainer title="申请单管理（管理员）">
    <div class="admin-application-view">
      <!-- 筛选区域 -->
      <div class="admin-application-filters">
        <div class="filters-header">
          <div class="filters-header__title">
            <icon-filter class="filters-header__icon" />
            <span>筛选条件</span>
          </div>
          <div class="filters-header__tip">
            支持多条件组合筛选
          </div>
        </div>

        <a-form layout="inline" :model="filters" class="filters-form">
          <div class="filters-grid">
            <a-form-item label="申请单号">
              <a-input
                v-model="filters.applicationId"
                placeholder="请输入申请单号"
                allow-clear
                @press-enter="handleSearch"
              >
                <template #prefix>
                  <icon-file />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item label="申请人账号">
              <a-input
                v-model="filters.applicantW3Account"
                placeholder="请输入申请人账号"
                allow-clear
                @press-enter="handleSearch"
              >
                <template #prefix>
                  <icon-user />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item label="下载人账号">
              <a-input
                v-model="filters.downloadW3Account"
                placeholder="请输入下载人账号"
                allow-clear
                @press-enter="handleSearch"
              >
                <template #prefix>
                  <icon-download />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item label="安全等级">
              <a-select
                v-model="filters.securityLevelId"
                :options="securityLevelOptions"
                placeholder="请选择安全等级"
                allow-clear
              >
                <template #prefix>
                  <icon-lock />
                </template>
              </a-select>
            </a-form-item>

            <a-form-item label="源区域">
              <a-select
                v-model="filters.formAreaId"
                :options="areaOptions"
                placeholder="请选择源区域"
                allow-clear
              >
                <template #prefix>
                  <icon-location />
                </template>
              </a-select>
            </a-form-item>

            <a-form-item label="目标区域">
              <a-select
                v-model="filters.toAreaId"
                :options="areaOptions"
                placeholder="请选择目标区域"
                allow-clear
              >
                <template #prefix>
                  <icon-location />
                </template>
              </a-select>
            </a-form-item>

            <a-form-item label="申请时间" class="filters-time">
              <a-range-picker
                v-model="filters.applicationStartTime"
                v-model:end-time="filters.applicationEndTime"
                value-format="YYYY-MM-DD HH:mm:ss"
                allow-clear
              />
            </a-form-item>
          </div>

          <div class="filters-actions">
            <a-button type="primary" size="large" @click="handleSearch">
              <template #icon>
                <IconSearch />
              </template>
              查询数据
            </a-button>
            <a-button size="large" @click="handleReset">
              <template #icon>
                <IconRefresh />
              </template>
              重置条件
            </a-button>
          </div>
        </a-form>
      </div>

      <!-- 表格区域 -->
      <div class="admin-application-table-wrapper">
        <div class="admin-application-toolbar">
          <div class="admin-application-toolbar__summary">
            共 {{ pagination.total }} 条记录
          </div>
        </div>

        <a-table
          :data="listData"
          :columns="columns"
          :loading="loading"
          :pagination="false"
          :bordered="{ cell: true }"
          :scroll="{ x: 1800 }"
          row-key="applicationId"
        >
          <template #currentStatus="{ record }">
            <a-tag :color="getStatusColor((record as AdminApplicationRecord).currentStatus)">
              {{ (record as AdminApplicationRecord).currentStatus }}
            </a-tag>
          </template>

          <template #reason="{ record }">
            <div class="cell-ellipsis" :title="(record as AdminApplicationRecord).reason">
              {{ (record as AdminApplicationRecord).reason }}
            </div>
          </template>

          <template #deptPath="{ record }">
            <div class="cell-ellipsis" :title="(record as AdminApplicationRecord).userDepartmentNamePath">
              {{ (record as AdminApplicationRecord).userDepartmentNamePath }}
            </div>
          </template>

          <template #isCustomerData="{ record }">
            {{ formatBoolean((record as AdminApplicationRecord).isCustomerData) }}
          </template>

          <template #creationDate="{ record }">
            {{ formatDateTime((record as AdminApplicationRecord).creationDate) }}
          </template>

          <template #actions="{ record }">
            <a-button
              type="text"
              size="small"
              @click="handleViewDetail(record as AdminApplicationRecord)"
            >
              <template #icon>
                <IconEye />
              </template>
              查看详情
            </a-button>
          </template>
        </a-table>

        <!-- 分页 -->
        <div class="admin-application-pagination">
          <a-pagination
            :total="pagination.total"
            :current="pagination.current"
            :page-size="pagination.pageSize"
            :page-size-options="[15, 30, 50, 100]"
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

  <!-- 详情弹窗 -->
  <AdminApplicationDetailModal
    v-model:visible="detailModalVisible"
    :application-id="currentApplicationId"
  />
</template>
