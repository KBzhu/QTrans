<script setup lang="ts">
import type { KiaFileItem, KiaKeyFileItem, KiaResultCountResponse, SecretLevelItem } from '@/types/assetDetection'
import {
  IconCheckCircleFill,
  IconExclamationCircleFill,
  IconInfoCircle,
} from '@arco-design/web-vue/es/icon'
import { computed, ref, watch } from 'vue'
import { getFileTypeName } from '@/constants/fileType'
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
  /** 完成文件确认阶段 */
  (e: 'complete-file-confirmation'): void
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

// 文件确认提示
const fileConfirmHint = computed(() => {
  if (!props.requireConfirmation)
    return null

  if (!props.allFilesConfirmed) {
    const unconfirmedCount = props.fileList?.filter(f => !f.confirmed).length || 0
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

// 完成文件确认
function handleCompleteFileConfirmation() {
  emit('complete-file-confirmation')
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

// 处理搜索
function handleSearch() {
  emit('filter-change', {
    fileType: filterFileType.value,
    fileName: filterFileName.value,
  })
}

// 处理重置
function handleReset() {
  filterFileType.value = undefined
  filterFileName.value = undefined
  emit('filter-change', {})
}

// 处理分页变化
function handlePageChange(page: number) {
  emit('page-change', page)
}

// 处理每页数量变化
function handlePageSizeChange(size: number) {
  emit('page-size-change', size)
}
</script>

<template>
  <div class="asset-detection-tab">
    <a-spin :loading="loading" style="width: 100%">
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
          @search="handleSearch"
          @reset="handleReset"
        />

        <!-- 文件列表表格 -->
        <div class="asset-detection-tab__table">
          <table class="file-table">
            <thead>
              <tr>
                <th class="col-file-name">文件名称</th>
                <th class="col-file-type">文件类型</th>
                <th class="col-secret-level">密级</th>
                <th v-if="requireConfirmation" class="col-action">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="file in fileList"
                :key="file.fileName"
                :class="{ 'is-confirmed': file.confirmed }"
              >
                <td class="col-file-name" :title="file.fileName">
                  {{ file.fileName.split('/').pop() || file.fileName }}
                </td>
                <td class="col-file-type">
                  <span class="file-type-tag">{{ file.fileTypeName }}</span>
                </td>
                <td class="col-secret-level">{{ file.secretLevelName }}</td>
                <td v-if="requireConfirmation" class="col-action">
                  <a-button
                    size="small"
                    :type="file.confirmed ? 'outline' : 'primary'"
                    :status="file.confirmed ? 'success' : undefined"
                    @click="handleConfirmFile(file)"
                  >
                    <template #icon>
                      <IconCheckCircleFill v-if="file.confirmed" />
                    </template>
                    {{ file.confirmed ? '已确认' : '确认' }}
                  </a-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div v-if="pagination && pagination.total > 0" class="asset-detection-tab__pagination">
          <a-pagination
            :current="pagination.current"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            show-total
            show-jumper
            show-page-size
            :page-size-options="[10, 20, 50, 100]"
            @change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          />
        </div>

        <!-- 文件确认操作栏 -->
        <div v-if="requireConfirmation && !allFilesConfirmed" class="asset-detection-tab__actions">
          <a-button type="outline" @click="handleConfirmCurrentPage">
            确认当前页
          </a-button>
          <a-button
            v-if="allFilesConfirmed"
            type="primary"
            @click="handleCompleteFileConfirmation"
          >
            完成文件确认
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
        <div class="asset-detection-tab__table">
          <table class="file-table">
            <thead>
              <tr>
                <th class="col-file-name">文件名称</th>
                <th class="col-file-type">文件类型</th>
                <th class="col-secret-level">密级</th>
                <th v-if="requireConfirmation" class="col-action">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="file in keyFileList"
                :key="file.fileName"
                :class="{ 'is-confirmed': file.confirmed }"
              >
                <td class="col-file-name" :title="file.fileName">
                  {{ file.fileName.split('/').pop() || file.fileName }}
                </td>
                <td class="col-file-type">
                  <span class="file-type-tag is-key">{{ file.fileTypeName }}</span>
                </td>
                <td class="col-secret-level">{{ file.secretLevelName }}</td>
                <td v-if="requireConfirmation" class="col-action">
                  <a-button
                    size="small"
                    :type="file.confirmed ? 'outline' : 'primary'"
                    :status="file.confirmed ? 'success' : undefined"
                    @click="handleConfirmKeyAsset(file)"
                  >
                    <template #icon>
                      <IconCheckCircleFill v-if="file.confirmed" />
                    </template>
                    {{ file.confirmed ? '已确认' : '确认' }}
                  </a-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 关键资产确认操作栏 -->
        <div v-if="requireConfirmation && !allKeyAssetsConfirmed" class="asset-detection-tab__actions">
          <a-button type="primary" @click="handleConfirmAllKeyAssets">
            确认所有关键资产
          </a-button>
        </div>
      </div>
    </a-spin>
  </div>
</template>
