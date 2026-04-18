<script setup lang="ts">
import type { TableColumnData } from '@arco-design/web-vue'
import type { KiaFileItem, KiaKeyFileItem, KiaResultCountResponse } from '@/types/assetDetection'
import {
  IconCheckCircleFill,
  IconExclamationCircleFill,
  IconInfoCircle,
} from '@arco-design/web-vue/es/icon'
import { computed, ref } from 'vue'
import AssetFilterBar from './AssetFilterBar.vue'
import './asset-detection.scss'

const props = defineProps<{
  /** 申请单ID */
  applicationId: number | string
  /** 统计数据 */
  countData?: KiaResultCountResponse | null
  /** 文件列表 */
  fileList?: (KiaFileItem & { fileTypeName: string; secretLevelName: string; confirmed: boolean })[]
  /** 关键资产列表 */
  keyFileList?: (KiaKeyFileItem & { fileTypeName: string; secretLevelName: string; confirmed: boolean })[]
  /** 分类统计 */
  categoryStats?: Array<{ fileType: number; fileTypeName: string; count: number }>
  /** 加载状态 */
  loading?: boolean
  /** 分页信息 */
  pagination?: {
    current: number
    pageSize: number
    total: number
  }
  /** 是否需要确认功能 */
  requireConfirmation?: boolean
  /** 是否所有文件已确认 */
  allFilesConfirmed?: boolean
  /** 是否所有关键资产已确认 */
  allKeyAssetsConfirmed?: boolean
  /** 已确认的文件数量（用于计算未确认总数） */
  confirmedFileCount?: number
  /** 是否有关键资产 */
  hasKeyAssets?: boolean
  /** 是否已完成文件确认阶段 */
  fileConfirmationCompleted?: boolean
}>()

const emit = defineEmits<{
  /** 确认文件 */
  (e: 'confirm-file', fileName: string, confirmed: boolean): void
  /** 确认关键资产 */
  (e: 'confirm-key-asset', fileName: string, confirmed: boolean): void
  /** 批量确认当前页 */
  (e: 'confirm-current-page'): void
  /** 确认全部文件（一次性） */
  (e: 'confirm-all-files'): void
  /** 确认所有关键资产 */
  (e: 'confirm-all-key-assets'): void
  /** 筛选变化 */
  (e: 'filter-change', filters: { fileType?: number; fileName?: string }): void
  /** 分页变化 */
  (e: 'page-change', page: number): void
  /** 每页数量变化 */
  (e: 'page-size-change', size: number): void
}>()

// 当前激活的子Tab（文件列表/关键资产）
const activeSubTab = ref<'files' | 'keyAssets'>('files')

// 筛选条件
const filterFileType = ref<number | undefined>(undefined)
const filterFileName = ref<string | undefined>(undefined)

// 文件列表表格列配置
const fileColumns = computed<TableColumnData[]>(() => {
  const baseColumns: TableColumnData[] = [
    {
      title: '文件名称',
      dataIndex: 'fileName',
      width: 180,
      ellipsis: true,
      tooltip: true,
      resizable: true,
    },
    {
      title: '文件类型',
      dataIndex: 'fileTypeName',
      width: 120,
      resizable: true,
      slotName: 'fileType',
    },
    {
      title: '文件大小',
      dataIndex: 'fileSizeUnit',
      width: 100,
      align: 'right',
      resizable: true,
    },
    {
      title: '密级',
      dataIndex: 'secretLevelName',
      width: 80,
      resizable: true,
    },
    {
      title: '压缩层级',
      dataIndex: 'unzipLevel',
      width: 90,
      align: 'center',
      resizable: true,
      slotName: 'unzipLevel',
    },
    {
      title: '文件路径',
      dataIndex: 'filePath',
      width: 220,
      ellipsis: true,
      tooltip: true,
      resizable: true,
      slotName: 'filePath',
    },
  ]

  // 添加操作列
  if (props.requireConfirmation) {
    baseColumns.push({
      title: '操作',
      dataIndex: 'confirmed',
      width: 100,
      align: 'center',
      fixed: 'right',
      slotName: 'confirmed',
    })
  }

  return baseColumns
})

// 关键资产表格列配置（与文件列表相同，但使用不同的插槽名）
const keyAssetColumns = computed<TableColumnData[]>(() => {
  // 深拷贝避免污染 fileColumns 缓存
  const columns = fileColumns.value.map(col => ({ ...col }))
  
  // 修改文件类型列使用不同的插槽
  const fileTypeCol = columns.find(col => col.slotName === 'fileType')
  if (fileTypeCol) {
    fileTypeCol.slotName = 'keyAssetFileType'
  }
  
  return columns
})

// 文件确认提示
const fileConfirmHint = computed(() => {
  if (!props.requireConfirmation)
    return null

  if (!props.allFilesConfirmed) {
    // 基于 total - 已确认数 计算未确认数量（覆盖全部分页）
    const total = props.pagination?.total || 0
    const confirmed = props.confirmedFileCount || 0
    const unconfirmedCount = Math.max(0, total - confirmed)
    return {
      type: 'warning',
      message: `请逐条确认以下文件，未确认 ${unconfirmedCount} 项`,
    }
  }
  else if (props.hasKeyAssets && !props.allKeyAssetsConfirmed) {
    return {
      type: 'info',
      message: '所有文件已确认，请继续确认关键资产',
    }
  }
  else {
    return {
      type: 'success',
      message: '所有文件和关键资产已确认，可进行操作',
    }
  }
})

// 关键资产确认提示
const keyAssetConfirmHint = computed(() => {
  if (!props.requireConfirmation || !props.hasKeyAssets)
    return null

  if (!props.allKeyAssetsConfirmed) {
    const unconfirmedCount = props.keyFileList?.filter(f => !f.confirmed).length || 0
    return {
      type: 'warning',
      message: `请逐条确认以下关键资产，未确认 ${unconfirmedCount} 项`,
    }
  }
  else {
    return {
      type: 'success',
      message: '所有关键资产已确认，可进行操作',
    }
  }
})

// 处理确认文件
function handleConfirmFile(file: KiaFileItem & { confirmed: boolean }) {
  emit('confirm-file', file.fileName, !file.confirmed)
}

// 处理确认关键资产
function handleConfirmKeyAsset(file: KiaKeyFileItem & { confirmed: boolean }) {
  emit('confirm-key-asset', file.fileName, !file.confirmed)
}

// 批量确认当前页
function handleConfirmCurrentPage() {
  emit('confirm-current-page')
}

// 确认全部文件（一次性确认所有分页文件）
function handleConfirmAllFiles() {
  emit('confirm-all-files')
  // 自动切换到关键资产tab
  if (props.hasKeyAssets) {
    activeSubTab.value = 'keyAssets'
  }
}

// 确认所有关键资产
function handleConfirmAllKeyAssets() {
  emit('confirm-all-key-assets')
}

// 处理筛选
function handleFilterChange(filters: { fileType?: number; fileName?: string }) {
  filterFileType.value = filters.fileType
  filterFileName.value = filters.fileName
  emit('filter-change', filters)
}

// 处理分页变化
function handlePageChange(page: number) {
  emit('page-change', page)
}

// 处理每页数量变化
function handlePageSizeChange(size: number) {
  emit('page-size-change', size)
}

// 自定义行类名
function getRowClassName(record: any) {
  return record.confirmed ? 'is-confirmed' : ''
}
</script>

<template>
  <div class="asset-detection-tab">
    <!-- 统计概览 -->
    <div class="asset-detection-tab__stats">
      <div class="stats-summary">
        <div class="stats-summary__item">
          <span class="stats-summary__label">检测到</span>
          <span class="stats-summary__value highlight">{{ countData?.count || 0 }}</span>
          <span class="stats-summary__label">个文件</span>
        </div>
        <div class="stats-summary__divider" />
        <div class="stats-summary__item">
          <span class="stats-summary__label">总大小</span>
          <span class="stats-summary__value">{{ countData?.fileSizeSum || '0' }}</span>
        </div>
      </div>
      
      <!-- 分类统计 -->
      <div v-if="categoryStats && categoryStats.length > 0" class="stats-category">
        <div class="stats-category__title">分类统计</div>
        <div class="stats-category__list">
          <div
            v-for="item in categoryStats"
            :key="item.fileType"
            class="stats-category__item"
          >
            <span class="stats-category__name">{{ item.fileTypeName }}</span>
            <span class="stats-category__count">{{ item.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认提示 -->
    <div v-if="fileConfirmHint" class="asset-detection-tab__hint" :class="`is-${fileConfirmHint.type}`">
      <IconExclamationCircleFill v-if="fileConfirmHint.type === 'warning'" />
      <IconCheckCircleFill v-else-if="fileConfirmHint.type === 'success'" />
      <IconInfoCircle v-else />
      <span>{{ fileConfirmHint.message }}</span>
    </div>

    <!-- 子Tab切换（文件列表/关键资产） -->
    <div v-if="hasKeyAssets" class="asset-detection-tab__sub-tabs">
      <button
        class="sub-tab-btn"
        :class="{ 'is-active': activeSubTab === 'files' }"
        @click="activeSubTab = 'files'"
      >
        文件列表
      </button>
      <button
        class="sub-tab-btn is-warning"
        :class="{ 'is-active': activeSubTab === 'keyAssets' }"
        @click="activeSubTab = 'keyAssets'"
      >
        <IconExclamationCircleFill />
        关键资产
      </button>
    </div>

    <!-- 文件列表 -->
    <div v-show="activeSubTab === 'files'" class="asset-detection-tab__content">
      <!-- 筛选栏 -->
      <AssetFilterBar
        v-model="filterFileType"
        v-model:search-keyword="filterFileName"
        @filter-change="handleFilterChange"
      />

      <!-- 文件列表表格 -->
      <a-table
        :data="fileList"
        :columns="fileColumns"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
        :stripe="true"
        :row-class="getRowClassName"
        column-resizable
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #fileType="{ record }">
          <span class="file-type-tag">{{ record.fileTypeName }}</span>
        </template>
        
        <template #unzipLevel="{ record }">
          {{ record.unzipLevel ?? '-' }}
        </template>
        
        <template #filePath="{ record }">
          {{ record.filePath || record.fileName }}
        </template>
        
        <template #confirmed="{ record }">
          <a-button
            size="small"
            :type="record.confirmed ? 'outline' : 'primary'"
            :status="record.confirmed ? 'success' : undefined"
            @click="handleConfirmFile(record)"
          >
            <template #icon>
              <IconCheckCircleFill v-if="record.confirmed" />
            </template>
            {{ record.confirmed ? '已确认' : '确认' }}
          </a-button>
        </template>
      </a-table>

      <!-- 文件确认操作栏 -->
      <div v-if="requireConfirmation && !allFilesConfirmed" class="asset-detection-tab__actions">
        <a-button type="outline" @click="handleConfirmCurrentPage">
          确认当前页
        </a-button>
        <a-button
          type="primary"
          @click="handleConfirmAllFiles"
        >
          确认全部文件
        </a-button>
      </div>
    </div>

    <!-- 关键资产列表 -->
    <div v-show="activeSubTab === 'keyAssets' && hasKeyAssets" class="asset-detection-tab__content">
      <!-- 关键资产确认提示 -->
      <div v-if="keyAssetConfirmHint" class="asset-detection-tab__hint" :class="`is-${keyAssetConfirmHint.type}`">
        <IconExclamationCircleFill v-if="keyAssetConfirmHint.type === 'warning'" />
        <IconCheckCircleFill v-else-if="keyAssetConfirmHint.type === 'success'" />
        <IconInfoCircle v-else />
        <span>{{ keyAssetConfirmHint.message }}</span>
      </div>

      <!-- 关键资产表格 -->
      <a-table
        :data="keyFileList"
        :columns="keyAssetColumns"
        :loading="loading"
        :pagination="false"
        :bordered="false"
        :stripe="true"
        :row-class="getRowClassName"
        column-resizable
      >
        <template #keyAssetFileType="{ record }">
          <span class="file-type-tag is-key">{{ record.fileTypeName }}</span>
        </template>
        
        <template #unzipLevel="{ record }">
          {{ record.unzipLevel ?? '-' }}
        </template>
        
        <template #filePath="{ record }">
          {{ record.filePath || record.fileName }}
        </template>
        
        <template #confirmed="{ record }">
          <a-button
            size="small"
            :type="record.confirmed ? 'outline' : 'primary'"
            :status="record.confirmed ? 'success' : undefined"
            @click="handleConfirmKeyAsset(record)"
          >
            <template #icon>
              <IconCheckCircleFill v-if="record.confirmed" />
            </template>
            {{ record.confirmed ? '已确认' : '确认' }}
          </a-button>
        </template>
      </a-table>

      <!-- 关键资产确认操作栏 -->
      <div v-if="requireConfirmation && !allKeyAssetsConfirmed" class="asset-detection-tab__actions">
        <a-button type="primary" @click="handleConfirmAllKeyAssets">
          确认所有关键资产
        </a-button>
      </div>
    </div>
  </div>
</template>
