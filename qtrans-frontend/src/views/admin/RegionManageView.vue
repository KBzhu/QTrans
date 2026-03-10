<script setup lang="ts">
import type { CityDomainMapping, CreateCityMappingRequest, CreateSecurityDomainRequest, SecurityDomain, UpdateCityMappingRequest, UpdateSecurityDomainRequest } from '@/types'
import { onMounted } from 'vue'
import { useRegionManage } from '@/composables/useRegionManage'
import RegionManageModal from './RegionManageModal.vue'
import './region-manage.scss'

const {
  activeTab,
  loading,
  modalVisible,
  modalMode,
  editingItem,
  allDomains,
  // 城市映射
  cityListData,
  cityPagination,
  cityFilters,
  fetchCityList,
  handleCitySearch,
  handleCityReset,
  handleCityPageChange,
  handleCityPageSizeChange,
  handleCreateCity,
  handleEditCity,
  handleDeleteCity,
  handleSaveCity,
  // 安全域
  domainListData,
  domainPagination,
  domainFilters,
  fetchDomainList,
  handleDomainSearch,
  handleDomainReset,
  handleDomainPageChange,
  handleDomainPageSizeChange,
  handleCreateDomain,
  handleEditDomain,
  handleDeleteDomain,
  handleSaveDomain,
  handleToggleDomainStatus,
  fetchAllDomains,
  handleModalClose,
} = useRegionManage()

// 城市映射表格列
const cityColumns = [
  { title: '城市名称', dataIndex: 'cityName', width: 140 },
  { title: '国家', dataIndex: 'country', width: 120 },
  { title: '安全域', dataIndex: 'domainCode', width: 140, slotName: 'domain' },
  { title: '状态', dataIndex: 'status', width: 100, slotName: 'cityStatus' },
  { title: '创建时间', dataIndex: 'createdAt', width: 180, slotName: 'createdAt' },
  { title: '操作', slotName: 'cityAction', width: 140, fixed: 'right' },
]

// 安全域表格列
const domainColumns = [
  { title: '安全域名称', dataIndex: 'name', width: 140 },
  { title: '安全域代码', dataIndex: 'code', width: 140 },
  { title: '颜色标识', dataIndex: 'color', width: 120, slotName: 'color' },
  { title: '描述', dataIndex: 'description', ellipsis: true },
  { title: '启用状态', dataIndex: 'status', width: 120, slotName: 'domainStatus' },
  { title: '操作', slotName: 'domainAction', width: 140, fixed: 'right' },
]

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', { hour12: false })
}

function handleTabChange(key: string) {
  activeTab.value = key as 'city' | 'domain'
  if (key === 'city') fetchCityList()
  else fetchDomainList()
}

async function onSaveCity(data: CreateCityMappingRequest | UpdateCityMappingRequest) {
  await handleSaveCity(data)
}

async function onSaveDomain(data: CreateSecurityDomainRequest | UpdateSecurityDomainRequest) {
  await handleSaveDomain(data)
}

onMounted(() => {
  fetchCityList()
  fetchAllDomains()
})
</script>

<template>
  <div class="region-manage">
    <div class="region-manage__header">
      <h2 class="region-manage__title">
        区域管理
      </h2>
    </div>

    <a-tabs :active-key="activeTab" @change="handleTabChange">
      <!-- ========== Tab1: 城市与安全域映射 ========== -->
      <a-tab-pane key="city" title="城市与安全域映射">
        <!-- 筛选区 -->
        <div class="region-manage__filter">
          <div class="filter-row">
            <div class="filter-item">
              <a-input
                v-model="cityFilters.keyword"
                placeholder="搜索城市/国家"
                allow-clear
                @press-enter="handleCitySearch"
              />
            </div>
            <div class="filter-item">
              <a-select
                v-model="cityFilters.domainCode"
                placeholder="安全域"
                allow-clear
              >
                <a-option
                  v-for="domain in allDomains"
                  :key="domain.code"
                  :value="domain.code"
                  :label="domain.name"
                />
              </a-select>
            </div>
            <div class="filter-item">
              <a-select v-model="cityFilters.status" placeholder="状态" allow-clear>
                <a-option value="enabled" label="启用" />
                <a-option value="disabled" label="禁用" />
              </a-select>
            </div>
            <a-space>
              <a-button type="primary" @click="handleCitySearch">
                查询
              </a-button>
              <a-button @click="handleCityReset">
                重置
              </a-button>
            </a-space>
          </div>
        </div>

        <!-- 工具栏 -->
        <div class="region-manage__toolbar">
          <span class="toolbar-info">共 {{ cityPagination.total }} 条映射记录</span>
          <a-button type="primary" @click="handleCreateCity">
            <template #icon>
              <icon-plus />
            </template>
            新增映射
          </a-button>
        </div>

        <!-- 表格 -->
        <div class="region-manage__table">
          <a-table
            :data="cityListData"
            :columns="cityColumns"
            :loading="loading"
            :pagination="false"
            row-key="id"
            scroll="{ x: 800 }"
          >
            <template #domain="{ record }">
              <span
                class="domain-tag"
                :style="{ background: record.domainColor }"
              >
                {{ record.domainName }}
              </span>
            </template>

            <template #cityStatus="{ record }">
              <a-tag :color="record.status === 'enabled' ? 'green' : 'gray'">
                {{ record.status === 'enabled' ? '启用' : '禁用' }}
              </a-tag>
            </template>

            <template #createdAt="{ record }">
              {{ formatDate(record.createdAt) }}
            </template>

            <template #cityAction="{ record }">
              <a-space>
                <a-button size="small" type="text" @click="handleEditCity(record as CityDomainMapping)">
                  <template #icon><icon-edit /></template>
                  编辑
                </a-button>
                <a-button size="small" type="text" status="danger" @click="handleDeleteCity(record as CityDomainMapping)">
                  <template #icon><icon-delete /></template>
                  删除
                </a-button>
              </a-space>
            </template>
          </a-table>

          <div style="display:flex;justify-content:flex-end;padding:16px 0 0;">
            <a-pagination
              :total="cityPagination.total"
              :current="cityPagination.pageNum"
              :page-size="cityPagination.pageSize"
              show-total
              show-page-size
              @change="handleCityPageChange"
              @page-size-change="handleCityPageSizeChange"
            />
          </div>
        </div>
      </a-tab-pane>

      <!-- ========== Tab2: 可选安全域配置 ========== -->
      <a-tab-pane key="domain" title="可选安全域配置">
        <!-- 筛选区 -->
        <div class="region-manage__filter">
          <div class="filter-row">
            <div class="filter-item">
              <a-input
                v-model="domainFilters.keyword"
                placeholder="搜索安全域名称/代码"
                allow-clear
                @press-enter="handleDomainSearch"
              />
            </div>
            <div class="filter-item">
              <a-select v-model="domainFilters.status" placeholder="状态" allow-clear>
                <a-option value="enabled" label="启用" />
                <a-option value="disabled" label="禁用" />
              </a-select>
            </div>
            <a-space>
              <a-button type="primary" @click="handleDomainSearch">
                查询
              </a-button>
              <a-button @click="handleDomainReset">
                重置
              </a-button>
            </a-space>
          </div>
        </div>

        <!-- 工具栏 -->
        <div class="region-manage__toolbar">
          <span class="toolbar-info">共 {{ domainPagination.total }} 个安全域</span>
          <a-button type="primary" @click="handleCreateDomain">
            <template #icon>
              <icon-plus />
            </template>
            新增安全域
          </a-button>
        </div>

        <!-- 表格 -->
        <div class="region-manage__table">
          <a-table
            :data="domainListData"
            :columns="domainColumns"
            :loading="loading"
            :pagination="false"
            row-key="id"
          >
            <template #color="{ record }">
              <div class="color-badge">
                <span class="badge-block" :style="{ background: record.color }" />
                <span>{{ record.color }}</span>
              </div>
            </template>

            <template #domainStatus="{ record }">
              <a-switch
                :model-value="record.status === 'enabled'"
                checked-text="启用"
                unchecked-text="禁用"
                @change="() => handleToggleDomainStatus(record as SecurityDomain)"
              />
            </template>

            <template #domainAction="{ record }">
              <a-space>
                <a-button size="small" type="text" @click="handleEditDomain(record as SecurityDomain)">
                  <template #icon><icon-edit /></template>
                  编辑
                </a-button>
                <a-button size="small" type="text" status="danger" @click="handleDeleteDomain(record as SecurityDomain)">
                  <template #icon><icon-delete /></template>
                  删除
                </a-button>
              </a-space>
            </template>
          </a-table>

          <div style="display:flex;justify-content:flex-end;padding:16px 0 0;">
            <a-pagination
              :total="domainPagination.total"
              :current="domainPagination.pageNum"
              :page-size="domainPagination.pageSize"
              show-total
              show-page-size
              @change="handleDomainPageChange"
              @page-size-change="handleDomainPageSizeChange"
            />
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 弹窗 -->
    <RegionManageModal
      v-model:visible="modalVisible"
      :mode="modalMode"
      :item="editingItem"
      :domain-options="allDomains"
      @save-city="onSaveCity"
      @save-domain="onSaveDomain"
      @update:visible="handleModalClose"
    />
  </div>
</template>
